// ChittyGateway - Cloudflare AI Gateway for intelligent model routing
// Provider-agnostic AI client using Cloudflare Workers AI

const CHITTYGATEWAY_URL = `https://gateway.ai.cloudflare.com/v1/${process.env.CLOUDFLARE_ACCOUNT_ID}/chittygateway`;
const WORKERS_AI_URL = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run`;

// Default to Cloudflare Workers AI model - gateway handles routing
const getModel = () => process.env.CHITTY_AI_MODEL || "@cf/meta/llama-3.1-70b-instruct";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionResponse {
  result: {
    response: string;
  };
  success: boolean;
  errors: any[];
}

async function chatCompletion(messages: ChatMessage[], jsonMode: boolean = false): Promise<string> {
  const model = getModel();
  const apiKey = process.env.CHITTY_API_KEY || process.env.CLOUDFLARE_API_TOKEN;

  if (!apiKey) {
    throw new Error("CHITTY_API_KEY or CLOUDFLARE_API_TOKEN is required");
  }

  // Use Workers AI REST API through ChittyGateway
  const url = `${CHITTYGATEWAY_URL}/workers-ai/${model}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ChittyGateway request failed: ${response.status} - ${error}`);
  }

  const data = await response.json() as ChatCompletionResponse;

  if (!data.success) {
    throw new Error(`ChittyGateway error: ${JSON.stringify(data.errors)}`);
  }

  return data.result.response;
}

export async function analyzeRTLOQuestion(question: string): Promise<{
  answer: string;
  rtloSection: string | null;
  confidence: 'high' | 'medium' | 'low';
}> {
  try {
    const response = await chatCompletion([
      {
        role: "system",
        content: `You are an expert on Chicago's Residential Landlord and Tenant Ordinance (RTLO), Chapter 5-12 of the Chicago Municipal Code.

        Provide accurate, specific answers about Chicago RTLO requirements, citing exact sections when possible.

        Key RTLO sections include:
        - 5-12-080: Security deposits (max 1.5x monthly rent for unfurnished, 2x for furnished)
        - 5-12-090: Return of security deposits (within 45 days)
        - 5-12-110: Landlord's right of access
        - 5-12-120: Tenant's general responsibilities
        - 5-12-130: Landlord's general duties
        - 5-12-140: Notice of conditions affecting habitability
        - 5-12-150: Remedies

        Always indicate your confidence level and cite specific RTLO sections when applicable.

        Respond in JSON format only: {
          "answer": "detailed answer with specific RTLO requirements",
          "rtloSection": "5-12-XXX or null if not section-specific",
          "confidence": "high|medium|low"
        }`
      },
      {
        role: "user",
        content: question,
      },
    ], true);

    const result = JSON.parse(response);

    return {
      answer: result.answer || "Unable to provide specific guidance. Please consult the full Chicago RTLO text or legal counsel.",
      rtloSection: result.rtloSection || null,
      confidence: ['high', 'medium', 'low'].includes(result.confidence) ? result.confidence : 'low',
    };
  } catch (error) {
    console.error("Error analyzing RTLO question:", error);
    throw new Error("Failed to analyze RTLO question: " + (error as Error).message);
  }
}

export async function analyzeLeaseCompliance(leaseText: string): Promise<{
  complianceScore: number;
  issues: Array<{
    section: string;
    issue: string;
    severity: 'high' | 'medium' | 'low';
    recommendation: string;
  }>;
  recommendations: string[];
}> {
  try {
    const response = await chatCompletion([
      {
        role: "system",
        content: `You are an expert lease reviewer specializing in Chicago RTLO compliance.

        Analyze the provided lease text for compliance with Chicago's Residential Landlord and Tenant Ordinance (Chapter 5-12).

        Key areas to check:
        - Security deposit limits and terms (5-12-080, 5-12-090)
        - Required RTLO summary attachment
        - Prohibited lease clauses
        - Landlord and tenant responsibilities
        - Access rights and notice requirements
        - Habitability standards

        Provide a compliance score (0-100) and identify specific issues with RTLO section references.

        Respond in JSON format only: {
          "complianceScore": number,
          "issues": [{
            "section": "5-12-XXX",
            "issue": "description of issue",
            "severity": "high|medium|low",
            "recommendation": "specific recommendation"
          }],
          "recommendations": ["list of general recommendations"]
        }`
      },
      {
        role: "user",
        content: `Please analyze this lease for Chicago RTLO compliance:\n\n${leaseText}`,
      },
    ], true);

    const result = JSON.parse(response);

    return {
      complianceScore: Math.max(0, Math.min(100, result.complianceScore || 0)),
      issues: Array.isArray(result.issues) ? result.issues : [],
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
    };
  } catch (error) {
    console.error("Error analyzing lease compliance:", error);
    throw new Error("Failed to analyze lease compliance: " + (error as Error).message);
  }
}

export async function generateRTLODocument(type: string, data: any): Promise<string> {
  try {
    const response = await chatCompletion([
      {
        role: "system",
        content: `You are a legal document generator specializing in Chicago RTLO-compliant documents.

        Generate accurate, legally compliant documents based on Chicago's Residential Landlord and Tenant Ordinance.

        Available document types:
        - "security-deposit-notice": Notice regarding security deposit return
        - "access-notice": 48-hour access notice (5-12-110)
        - "lease-addendum": RTLO compliance addendum
        - "habitability-notice": Notice of habitability issues

        Ensure all documents include proper legal language and RTLO section references where applicable.`
      },
      {
        role: "user",
        content: `Generate a ${type} document with the following information: ${JSON.stringify(data)}`,
      },
    ]);

    return response || "Unable to generate document.";
  } catch (error) {
    console.error("Error generating RTLO document:", error);
    throw new Error("Failed to generate document: " + (error as Error).message);
  }
}
