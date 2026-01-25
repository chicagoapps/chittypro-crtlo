import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// ChittyConnect Authentication using GitHub OIDC
// Replaces Replit auth with ChittyOS ecosystem authentication

const GITHUB_ISSUER_URL = "https://token.actions.githubusercontent.com";
const CHITTYAUTH_SERVICE_URL = process.env.CHITTYAUTH_SERVICE_URL || "https://auth.chittyos.com";

// Validate ChittyID format: CHITTY-[ENTITY]-[SEQUENCE]-[CHECKSUM]
const CHITTYID_PATTERN = /^CHITTY-(PEO|PLACE|PROP|EVNT|AUTH|INFO|FACT|CONTEXT|ACTOR|DOC|SERVICE)-[A-Z0-9]{8}-[A-Z0-9]{4}$/;

export function validateChittyIDFormat(chittyId: string): boolean {
  return CHITTYID_PATTERN.test(chittyId);
}

const getOidcConfig = memoize(
  async () => {
    // Use GitHub OIDC or ChittyAuth service for authentication
    const issuerUrl = process.env.CHITTY_ISSUER_URL || CHITTYAUTH_SERVICE_URL;
    return await client.discovery(
      new URL(issuerUrl),
      process.env.CHITTY_CLIENT_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  const claims = tokens.claims();
  user.claims = claims;
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = claims?.exp;
  // Extract ChittyID if present in claims
  user.chittyId = claims?.chitty_id || claims?.sub;
}

async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["given_name"] || claims["first_name"],
    lastName: claims["family_name"] || claims["last_name"],
    profileImageUrl: claims["picture"] || claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Get allowed domains from environment
  const domains = process.env.CHITTY_DOMAINS?.split(",") ||
                  process.env.ALLOWED_DOMAINS?.split(",") ||
                  ["localhost"];

  for (const domain of domains) {
    const strategy = new Strategy(
      {
        name: `chittyauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`chittyauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`chittyauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.CHITTY_CLIENT_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });

  // ChittyID validation endpoint
  app.get("/api/chittyid/validate/:id", (req, res) => {
    const { id } = req.params;
    const isValid = validateChittyIDFormat(id);
    res.json({ id, valid: isValid });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// Middleware to require ChittyID authentication
export const requireChittyID: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!user?.chittyId || !validateChittyIDFormat(user.chittyId)) {
    return res.status(401).json({ message: "Valid ChittyID required" });
  }

  return next();
};
