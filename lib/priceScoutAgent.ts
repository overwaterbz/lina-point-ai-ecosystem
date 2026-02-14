// LangGraph-based Price Scout Agent with recursive refinement loop
import { z } from "zod";

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
    // Mock implementation - in production, integrate real OTA APIs with tavily search
    const mockPrices: Record<string, number> = {
      agoda: 180,
      expedia: 175,
      booking: 182,
    };

    // Simulate slight price variations
    const basePrice = mockPrices[ota];
    const variation = Math.random() * 20 - 10;
    const price = Math.max(basePrice + variation, 100);

    return {
      ota,
      price: Math.round(price * 100) / 100,
      url: `https://${ota}.com/search?q=${encodeURIComponent(query)}&checkin=${checkIn}&checkout=${checkOut}`,
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
  console.log(`[PriceScoutAgent] Query: ${roomQuery} | Dates: ${checkInDate} to ${checkOutDate}`);

  let currentBestPrice = Infinity;
  let otaResults: OTAResult[] = [];
  let beatPrice = Infinity;

  // LangGraph Recursion: Max 3 iterations
  const maxIterations = 3;
  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    console.log(`\n[PriceScoutAgent] Iteration ${iteration}/${maxIterations}: Scanning prices...`);

    // Step 1: Scan prices from all OTAs
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
    console.log(`[PriceScoutAgent] Best OTA price: ${bestResult.ota} - $${bestResult.price}`);

    // Step 2: Compare and calculate beat price (3% cheaper)
    const newBeatPrice = Math.round(bestResult.price * 0.97 * 100) / 100;
    console.log(`[PriceScoutAgent] Beat price (3% cheaper): $${newBeatPrice}`);

    // Step 3: Refine if better deal found
    if (iteration < maxIterations) {
      const percentImprovement = ((currentBestPrice - newBeatPrice) / currentBestPrice) * 100;
      console.log(`[PriceScoutAgent] Price improvement: ${percentImprovement.toFixed(2)}%`);

      if (percentImprovement > 1) {
        console.log(`[PriceScoutAgent] Better deal found, continuing to next iteration...`);
        currentBestPrice = bestResult.price;
        beatPrice = newBeatPrice;
      } else {
        console.log(`[PriceScoutAgent] No significant improvement, stopping search`);
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
