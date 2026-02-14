// Grok-4 Integration Layer for Agent Reasoning
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, BaseMessage } from "@langchain/core/messages";
import { z } from "zod";

/**
 * Initialize Grok LLM (OpenAI API compatible)
 * Uses GROK_API_KEY for authentication
 */
export const grokLLM = new ChatOpenAI({
  openAIApiKey: process.env.GROK_API_KEY || "",
  modelName: "grok-4",
  temperature: 0.7,
  maxTokens: 1024,
  configuration: {
    baseURL: process.env.GROK_BASE_URL || "https://api.x.ai/v1",
  } as any,
});

/**
 * Price Analysis Schema for Grok reasoning
 */
export const PriceAnalysisSchema = z.object({
  analysis: z.string().describe("Analysis of current pricing"),
  recommendation: z.string().describe("Recommendation for beating the price"),
  beat_percentage: z
    .number()
    .describe("Suggested percentage to beat (e.g., 3 for 3%)"),
  confidence: z.number().min(0).max(1).describe("Confidence level of recommendation"),
});

export type PriceAnalysis = z.infer<typeof PriceAnalysisSchema>;

/**
 * Use Grok to analyze OTA prices and recommend beating strategy
 */
export async function analyzePricesWithGrok(
  roomType: string,
  prices: { ota: string; price: number }[],
  location: string
): Promise<PriceAnalysis> {
  try {
    if (!process.env.GROK_API_KEY) {
      console.warn(
        "⚠️ GROK_API_KEY not set, using default 3% beat strategy"
      );
      return {
        analysis: "Mock analysis (Grok API not configured)",
        recommendation: "Beat lowest price by 3%",
        beat_percentage: 3,
        confidence: 0.5,
      };
    }

    const pricesList = prices
      .map((p) => `${p.ota}: $${p.price}`)
      .join(", ");

    const prompt = `
You are an expert travel booking analyst. Analyze these OTA prices for "${roomType}" in ${location}:
${pricesList}

Provide:
1. Brief analysis of the pricing market
2. A competitive recommendation to beat the lowest price
3. Suggested percentage discount (be realistic: 2-5%)
4. Confidence level (0-1) that this strategy will be competitive

Return as JSON with keys: analysis, recommendation, beat_percentage, confidence
`;

    const response = await grokLLM.invoke([new HumanMessage(prompt)]);
    const text =
      response.content && typeof response.content === "string"
        ? response.content
        : "";

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const validated = PriceAnalysisSchema.parse(parsed);
      console.log("✅ Grok Price Analysis:", validated);
      return validated;
    }

    return {
      analysis: "Analysis complete",
      recommendation: "Beat lowest price by 3%",
      beat_percentage: 3,
      confidence: 0.7,
    };
  } catch (error) {
    console.error("❌ Grok price analysis error:", error);
    return {
      analysis:
        "Fallback to default strategy",
      recommendation: "Beat lowest price by 3%",
      beat_percentage: 3,
      confidence: 0.5,
    };
  }
}

/**
 * Tour Curation Schema for Grok reasoning
 */
export const TourCurationSchema = z.object({
  tour_selection: z.array(z.string()).describe("Recommended tour names"),
  customization_reason: z.string().describe("Why these tours match user preferences"),
  add_ons: z
    .array(z.string())
    .describe("Suggested add-ons (dining, activities, etc)"),
  estimated_cost: z.number().describe("Estimated total tour cost"),
  confidence: z.number().min(0).max(1).describe("Confidence of recommendation"),
});

export type TourCuration = z.infer<typeof TourCurationSchema>;

/**
 * Use Grok to curate personalized tour bundles
 */
export async function curatToursWithGrok(
  userPreferences: {
    music_style?: string;
    interests?: string[];
    birthday?: string;
    family_friendly?: boolean;
  },
  groupSize: number,
  budget: number
): Promise<TourCuration> {
  try {
    if (!process.env.GROK_API_KEY) {
      console.warn(
        "⚠️ GROK_API_KEY not set, using basic tour recommendations"
      );
      return {
        tour_selection: [
          "Snorkeling Adventure",
          "Maya Ruins Tour",
          "Local Cuisine Experience",
        ],
        customization_reason: "Standard package (Grok not configured)",
        add_ons: ["Sunset Dinner"],
        estimated_cost: 450,
        confidence: 0.5,
      };
    }

    const prefsStr = JSON.stringify(userPreferences);
    const prompt = `
You are a Belize tourism expert. Based on these user preferences:
${prefsStr}

Group size: ${groupSize} people
Budget: $${budget} per person

Recommend 2-3 curated tour experiences that match their interests. Consider:
- Music style preferences (suggest related atmosphere/music at venues)
- Special interests (ruins, cuisine, water sports, etc)
- Group composition (family-friendly if needed)
- Budget constraints

Return as JSON with keys: tour_selection (array of tour names), customization_reason (string), add_ons (array), estimated_cost (number), confidence (0-1)
`;

    const response = await grokLLM.invoke([new HumanMessage(prompt)]);
    const text =
      response.content && typeof response.content === "string"
        ? response.content
        : "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const validated = TourCurationSchema.parse(parsed);
      console.log("✅ Grok Tour Curation:", validated);
      return validated;
    }

    return {
      tour_selection: ["Snorkeling", "Maya Ruins"],
      customization_reason: "Default recommendation",
      add_ons: ["Dinner"],
      estimated_cost: 400,
      confidence: 0.6,
    };
  } catch (error) {
    console.error("❌ Grok tour curation error:", error);
    return {
      tour_selection: ["Snorkeling", "Dining Experience"],
      customization_reason: "Fallback to default tours",
      add_ons: ["Sunset Dinner"],
      estimated_cost: 350,
      confidence: 0.4,
    };
  }
}

/**
 * Generic Grok reasoning for any agent task
 */
export async function askGrok(prompt: string): Promise<string> {
  try {
    if (!process.env.GROK_API_KEY) {
      return "API key not configured";
    }

    const response = await grokLLM.invoke([new HumanMessage(prompt)]);
    return response.content && typeof response.content === "string"
      ? response.content
      : "No response";
  } catch (error) {
    console.error("❌ Grok error:", error);
    return "Error calling Grok API";
  }
}
