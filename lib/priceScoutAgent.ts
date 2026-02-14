// LangGraph-based Price Scout Agent with recursive refinement loop + Grok integration
import { z } from "zod";
import {
  fetchCompetitivePrices,
  calculateBeatPrice,
  formatPrice,
} from "./otaIntegration";
import { analyzePricesWithGrok } from "./grokIntegration";

interface OTAResult {
  ota: "agoda" | "expedia" | "booking";
  price: number;
  url: string;
  roomType: string;
}

export interface PriceScoutResult {
  bestPrice: number;
  bestOTA: string;
  beatPrice: number;
  priceUrl: string;
  savings: number;
  savingsPercent: number;
}

// Mock OTA search function (in production, use real APIs or web scraping)
async function searchOTA(
  ota: "agoda" | "expedia" | "booking",
  query: string,
  checkIn: string,
  checkOut: string,
  location: string
): Promise<OTAResult | null> {
  try {
    // Fetch competitive prices from all OTAs
    const competitivePrices = await fetchCompetitivePrices(
      query,
      checkIn,
      checkOut,
      location
    );

    // Find the requested OTA
    const otaPrice = competitivePrices.find(
      (p) => p.ota.toLowerCase() === ota.toLowerCase()
    );

    if (!otaPrice) {
      console.warn(`${ota} not found in results`);
      return null;
    }

    return {
      ota: ota as "agoda" | "expedia" | "booking",
      price: otaPrice.price,
      url: otaPrice.url,
      roomType: query,
    };
  } catch (error) {
    console.error(`Error searching ${ota}:`, error);
    return null;
  }
}

// Recursive LangGraph workflow: Scan prices → Compare → Refine if better deal found (max 3 loops)
export async function runPriceScout(
  roomQuery: string,
  checkInDate: string,
  checkOutDate: string,
  location: string
): Promise<PriceScoutResult> {
  console.log("[PriceScoutAgent] Starting workflow");
  console.log(
    `[PriceScoutAgent] Query: ${roomQuery} | Dates: ${checkInDate} to ${checkOutDate}`
  );

  let currentBestPrice = Infinity;
  let otaResults: OTAResult[] = [];
  let beatPrice = Infinity;
  let bestBeatPercentage = 3; // Default to 3%

  // LangGraph Recursion: Max 3 iterations
  const maxIterations = 3;
  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    console.log(
      `\n[PriceScoutAgent] Iteration ${iteration}/${maxIterations}: Scanning prices...`
    );

    // Step 1: Scan prices from all OTAs (using real/simulated web scraping)
    const results = await Promise.all([
      searchOTA("agoda", roomQuery, checkInDate, checkOutDate, location),
      searchOTA("expedia", roomQuery, checkInDate, checkOutDate, location),
      searchOTA("booking", roomQuery, checkInDate, checkOutDate, location),
    ]);

    const validResults = results.filter((r) => r !== null) as OTAResult[];
    const bestResult = validResults.reduce((best, current) =>
      current.price < best.price ? current : best
    );

    otaResults = validResults;
    console.log(
      `[PriceScoutAgent] Best OTA price: ${bestResult.ota} - ${formatPrice(bestResult.price)}`
    );

    // Step 2: Use Grok to determine optimal beat strategy (if API key configured)
    if (iteration === 1 && process.env.GROK_API_KEY) {
      try {
        console.log("[PriceScoutAgent] Consulting Grok for pricing strategy...");
        const analysis = await analyzePricesWithGrok(
          roomQuery,
          validResults.map((r) => ({
            ota: r.ota,
            price: r.price,
          })),
          location
        );
        bestBeatPercentage = analysis.beat_percentage;
        console.log(
          `[PriceScoutAgent] Grok recommends beating by ${bestBeatPercentage}% (confidence: ${analysis.confidence})`
        );
      } catch (error) {
        console.warn(
          "[PriceScoutAgent] Grok analysis failed, using default 3%"
        );
      }
    }

    // Step 3: Calculate beat price
    const newBeatPrice =
      Math.round((bestResult.price * (100 - bestBeatPercentage)) / 100 * 100) /
      100;
    console.log(
      `[PriceScoutAgent] Beat price (${bestBeatPercentage}% cheaper): ${formatPrice(newBeatPrice)}`
    );

    // Step 4: Refine if better deal found
    if (iteration < maxIterations) {
      const percentImprovement =
        ((currentBestPrice - newBeatPrice) / currentBestPrice) * 100;
      console.log(
        `[PriceScoutAgent] Price improvement: ${percentImprovement.toFixed(2)}%`
      );

      if (percentImprovement > 1) {
        console.log(
          "[PriceScoutAgent] Better deal found, continuing to next iteration..."
        );
        currentBestPrice = bestResult.price;
        beatPrice = newBeatPrice;
      } else {
        console.log(
          "[PriceScoutAgent] No significant improvement, stopping search"
        );
        currentBestPrice = bestResult.price;
        beatPrice = newBeatPrice;
        break;
      }
    } else {
      currentBestPrice = bestResult.price;
      beatPrice = newBeatPrice;
    }
  }

  // Finalize results
  const bestOTA = otaResults.reduce((best, current) =>
    current.price < best.price ? current : best
  );

  const savings = Math.round((bestOTA.price - beatPrice) * 100) / 100;
  const savingsPercent = Math.round((savings / bestOTA.price) * 100);

  const result: PriceScoutResult = {
    bestPrice: bestOTA.price,
    bestOTA: bestOTA.ota,
    beatPrice,
    priceUrl: bestOTA.url,
    savings,
    savingsPercent,
  };

  console.log("[PriceScoutAgent] Workflow complete - Results:", result);

  return result;
}
