import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { analyzeRTLOQuestion, analyzeLeaseCompliance, generateRTLODocument } from "./openai";
import { insertPropertySchema, insertRTLOQuestionSchema, insertDocumentSchema } from "@shared/schema";

// Stripe setup - optional for development
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
  });
} else if (process.env.NODE_ENV === "production") {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Property verification routes
  app.post("/api/properties", async (req: any, res) => {
    try {
      const propertyData = insertPropertySchema.parse({ ...req.body, userId: "anonymous" });
      
      // Determine RTLO coverage based on property details
      let isRtloCovered = true;
      
      // RTLO exclusions
      if (propertyData.isOwnerOccupied && (propertyData.units || 1) <= 6) {
        isRtloCovered = false; // Owner-occupied buildings with 6 units or less
      }
      
      const property = await storage.createProperty({
        ...propertyData,
        isRtloCovered,
        verificationDate: new Date(),
      });
      
      res.json(property);
    } catch (error) {
      console.error("Error creating property:", error);
      res.status(400).json({ message: "Failed to create property: " + (error as Error).message });
    }
  });

  app.get("/api/properties", async (req: any, res) => {
    try {
      const properties = await storage.getPropertiesByUser("anonymous");
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  // RTLO Q&A routes
  app.post("/api/rtlo-questions", async (req: any, res) => {
    try {
      const { question } = req.body;
      
      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }

      // Analyze question with OpenAI
      const analysis = await analyzeRTLOQuestion(question);
      
      const rtloQuestion = await storage.createRTLOQuestion({
        userId: "anonymous",
        question,
        answer: analysis.answer,
        rtloSection: analysis.rtloSection,
        confidence: analysis.confidence,
      });
      
      res.json(rtloQuestion);
    } catch (error) {
      console.error("Error processing RTLO question:", error);
      res.status(500).json({ message: "Failed to process question: " + (error as Error).message });
    }
  });

  app.get("/api/rtlo-questions", async (req: any, res) => {
    try {
      const questions = await storage.getRTLOQuestionsByUser("anonymous");
      res.json(questions);
    } catch (error) {
      console.error("Error fetching RTLO questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Document generation routes
  app.post("/api/documents", async (req: any, res) => {
    try {
      const { documentType, title, propertyId, data } = req.body;
      
      if (!documentType || !title) {
        return res.status(400).json({ message: "Document type and title are required" });
      }

      // Generate document content with OpenAI
      const content = await generateRTLODocument(documentType, data || {});
      
      const document = await storage.createDocument({
        userId: "anonymous",
        propertyId,
        documentType,
        title,
        content,
        metadata: data || {},
      });
      
      res.json(document);
    } catch (error) {
      console.error("Error generating document:", error);
      res.status(500).json({ message: "Failed to generate document: " + (error as Error).message });
    }
  });

  app.get("/api/documents", async (req: any, res) => {
    try {
      const documents = await storage.getDocumentsByUser("anonymous");
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // AI lease analysis routes
  app.post("/api/ai-analysis", async (req: any, res) => {
    try {
      const { leaseText, documentId } = req.body;
      
      if (!leaseText) {
        return res.status(400).json({ message: "Lease text is required" });
      }

      // Analyze lease with OpenAI
      const analysis = await analyzeLeaseCompliance(leaseText);
      
      const aiAnalysis = await storage.createAIAnalysis({
        userId: "anonymous",
        documentId,
        analysisType: "lease-review",
        originalText: leaseText,
        analysis: JSON.stringify(analysis),
        recommendations: analysis.recommendations,
        complianceScore: analysis.complianceScore,
      });
      
      res.json({
        ...aiAnalysis,
        analysis: analysis, // Return parsed analysis
      });
    } catch (error) {
      console.error("Error performing AI analysis:", error);
      res.status(500).json({ message: "Failed to perform AI analysis: " + (error as Error).message });
    }
  });

  app.get("/api/ai-analyses", async (req: any, res) => {
    try {
      const analyses = await storage.getAIAnalysesByUser("anonymous");
      
      // Parse analysis JSON for each record
      const parsedAnalyses = analyses.map(analysis => ({
        ...analysis,
        analysis: analysis.analysis ? JSON.parse(analysis.analysis) : null,
      }));
      
      res.json(parsedAnalyses);
    } catch (error) {
      console.error("Error fetching AI analyses:", error);
      res.status(500).json({ message: "Failed to fetch analyses" });
    }
  });

  // Stripe subscription routes
  app.post('/api/get-or-create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Payment processing is currently unavailable. Please check back later." });
      }

      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        const paymentIntent = subscription.latest_invoice as any;
        
        res.send({
          subscriptionId: subscription.id,
          clientSecret: paymentIntent?.payment_intent?.client_secret,
        });
        return;
      }
      
      if (!user.email) {
        return res.status(400).json({ message: 'No user email on file' });
      }

      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      });

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: process.env.STRIPE_PRICE_ID || "price_1234567890", // Set your actual price ID
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(userId, customer.id, subscription.id);
  
      const paymentIntent = (subscription.latest_invoice as any)?.payment_intent;
      
      res.send({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
      });
    } catch (error: any) {
      console.error("Subscription error:", error);
      return res.status(400).send({ error: { message: error.message } });
    }
  });

  // Legal aid directory endpoint
  app.get("/api/legal-aid", async (req, res) => {
    try {
      // Static legal aid directory for Cook County
      const legalAidResources = [
        {
          id: "erp",
          name: "Early Resolution Program (ERP)",
          description: "Free mediation and legal aid for unrepresented tenants and landlords in eviction court.",
          phone: "855-956-5763",
          website: "https://cookcountylegalaid.org",
          services: ["eviction_assistance", "mediation", "rental_assistance"],
          eligibility: "All Cook County residents"
        },
        {
          id: "cvls",
          name: "Chicago Volunteer Legal Services",
          description: "Comprehensive legal assistance for low-income Chicago residents facing housing issues.",
          website: "https://cvls.org",
          services: ["housing_law", "eviction_defense", "landlord_tenant"],
          eligibility: "Low-income residents"
        },
        {
          id: "legal-aid-chicago",
          name: "Legal Aid Chicago",
          description: "Free civil legal services for residents facing eviction, foreclosure, and housing discrimination.",
          services: ["eviction_defense", "foreclosure_prevention", "discrimination"],
          eligibility: "Income-qualified residents"
        },
        {
          id: "lcbh",
          name: "Lawyers' Committee for Better Housing",
          description: "Legal representation and advocacy for tenants facing habitability issues and evictions.",
          services: ["habitability", "eviction_defense", "housing_advocacy"],
          eligibility: "Tenants with housing issues"
        },
        {
          id: "cdel",
          name: "Center for Disability & Elder Law",
          description: "Specialized legal services for seniors and individuals with disabilities in housing matters.",
          services: ["disability_rights", "elder_law", "housing"],
          eligibility: "Seniors and disabled individuals"
        },
        {
          id: "carpls",
          name: "CARPLS Legal Aid",
          description: "Free legal assistance for housing, family, immigration, and consumer law issues.",
          services: ["housing", "family_law", "immigration", "consumer_protection"],
          eligibility: "Income-qualified residents"
        }
      ];
      
      res.json(legalAidResources);
    } catch (error) {
      console.error("Error fetching legal aid resources:", error);
      res.status(500).json({ message: "Failed to fetch legal aid resources" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
