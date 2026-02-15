/**
 * PriceScoutAgent: Multi-iteration price comparison for Lina Point Overwater Resort
 * Uses LangGraph to scan OTAs and beat competitors by 3%
 */

import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

// OTA mock data for Lina Point Overwater Room prices
const OTA_DATA = {
  expedia: { price: 450, url: "https://www.expedia.com/hotels/lina-point" },
  booking: { price: 435, url: "https://www.booking.com/hotel/bz/lina-point" },
  agoda: { price: 455, url: "https://www.agoda.com/hotels/lina-point" },
  hotels: { price: 440, url: "https://www.hotels.com/hotel/bz/lina-point" },
  tripadvisor: { price: 460, url: "https://www.tripadvisor.com/Hotel_Review-g154381-d123456-Reviews-Lina_Point.html" },
  airbnb: { price: 425, url: "https://www.airbnb.com/rooms/lina-point" },
  booking_last: { price: 432, url: "https://www.booking.com/deals/lina-point" },
};

export interface PriceScoutResult {
  bestPrice: number;
  bestOTA: string;
  beatPrice: number;
  savingsPercent: number;
  savings: number;
  iterations: number;
  priceUrl: string;
  allPrices: Record<string, number>;
}

// State for LangGraph recursion
interface PriceScoutState {
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  location: string;
  iteration: number;
  bestPrice: number;
  bestOTA: string;
  beatPrice: number;
  allPrices: Record<string, number>;
  refinementNotes: string;
}

const PriceScoutAnnotation = Annotation.Root({
  roomType: Annotation<string>,
  checkInDate: Annotation<string>,
  checkOutDate: Annotation<string>,
  location: Annotation<string>,
  iteration: Annotation<number>,
  bestPrice: Annotation<number>,
  bestOTA: Annotation<string>,
  beatPrice: Annotation<number>,
  allPrices: Annotation<Record<string, number>>,
  refinementNotes: Annotation<string>,
});

/**
 * Step 1: Scan OTAs (mock - in production, use real scraping/APIs)
 */
async function scanOTAs(state: typeof PriceScoutAnnotation.State) {
  console.log(`[PriceScout] Iteration ${state.iteration}: Scanning OTAs for "${state.roomType}"...`);

  // Simulate web scraping with some variance per iteration
  const variance = state.iteration > 1 ? Math.random() * 0.02 : 0; // ±2% price variance per iteration
  const scannedPrices: Record<string, number> = {};

  Object.entries(OTA_DATA).forEach(([ota, data]) => {
    const variedPrice = data.price * (1 + (Math.random() - 0.5) * variance);
    scannedPrices[ota] = Math.round(variedPrice * 100) / 100;
  });

  // Find lowest
  const lowestEntry = Object.entries(scannedPrices).reduce((prev, curr) =>
    prev[1] < curr[1] ? prev : curr
  );

  return {
    ...state,
    bestPrice: lowestEntry[1],
    bestOTA: lowestEntry[0],
    allPrices: scannedPrices,
    refinementNotes: `Scanned ${Object.keys(scannedPrices).length} OTAs. Best price: $${lowestEntry[1]} on ${lowestEntry[0]}`,
  };
}

/**
 * Step 2: Calculate beat price (3% lower)
 */
async function calculateBeatPrice(state: typeof PriceScoutAnnotation.State) {
  const beatPrice = Math.round(state.bestPrice * 0.97 * 100) / 100; // 3% discount
  const savings = Math.round((state.bestPrice - beatPrice) * 100) / 100;
  const savingsPercent = 3;

  console.log(
    `[PriceScout] Beat price: $${beatPrice} (save $${savings}, ${savingsPercent}% off $${state.bestPrice})`
  );

  return {
    ...state,
    beatPrice,
  };
}

/**
 * Step 3: Refine search (try additional iterations if not optimal)
 */
async function refineSearch(state: typeof PriceScoutAnnotation.State) {
  state.iteration++;

  if (state.iteration >= 3) {
    console.log(`[PriceScout] Max iterations (3) reached. Stopping refinement.`);
    return {
      ...state,
      refinementNotes: `${state.refinementNotes} → Completed after ${state.iteration} iterations.`,
    };
  }

  // Simulate checking if a better deal appeared
  const potentialBetterDeal = state.bestPrice * 0.99; // Could find 1% cheaper
  if (Math.random() > 0.7) {
    // 30% chance of finding better deal each iteration
    console.log(
      `[PriceScout] Potential better deal detected. Refining... (Iteration ${state.iteration})`
    );
    return {
      ...state,
      bestPrice: potentialBetterDeal,
      refinementNotes: `${state.refinementNotes} → Found better deal in iteration ${state.iteration}. Re-scanning...`,
    };
  } else {
    console.log(`[PriceScout] No better deals found. Continuing to next iteration.`);
    return state;
  }
}

/**
 * Conditional: Should refine further?
 */
function shouldRefine(state: typeof PriceScoutAnnotation.State): string {
  return state.iteration < 3 ? "refine" : "done";
}

/**
 * Build the LangGraph for price scout recursion
 */
async function buildPriceScoutGraph() {
  const workflow = new StateGraph(PriceScoutAnnotation)
    .addNode("scan", scanOTAs)
    .addNode("calculate", calculateBeatPrice)
    .addNode("refine", refineSearch)
    .addEdge(START, "scan")
    .addEdge("scan", "calculate")
    .addConditionalEdges("calculate", shouldRefine, {
      refine: "refine",
      done: END,
    })
    .addEdge("refine", "scan");

  return workflow.compile();
}

/**
 * Main export: Run price scout agent
 */
export async function runPriceScout(
  roomType: string,
  checkInDate: string,
  checkOutDate: string,
  location: string
): Promise<PriceScoutResult> {
  console.log(`\n🔍 [PriceScout] Starting for ${roomType} in ${location}`);

  const graph = await buildPriceScoutGraph();

  const initialState = {
    roomType,
    checkInDate,
    checkOutDate,
    location,
    iteration: 1,
    bestPrice: 9999,
    bestOTA: "unknown",
    beatPrice: 0,
    allPrices: {},
    refinementNotes: "Starting price scout search...",
  };

  // Execute graph with recursion
  const finalState = await graph.invoke(initialState);

  console.log(`✅ [PriceScout] Complete. Best OTA: ${finalState.bestOTA} @ $${finalState.bestPrice}`);
  console.log(`💰 [PriceScout] Direct booking price: $${finalState.beatPrice} (Save 3%!)`);

  return {
    bestPrice: finalState.bestPrice,
    bestOTA: finalState.bestOTA,
    beatPrice: finalState.beatPrice,
    savingsPercent: 3,
    savings: Math.round((finalState.bestPrice - finalState.beatPrice) * 100) / 100,
    iterations: finalState.iteration,
    priceUrl: `https://linapoint.com/book?check_in=${checkInDate}&check_out=${checkOutDate}&guests=2&room_type=${roomType}`,
    allPrices: finalState.allPrices,
  };
}

/**
 * Insert price record into Supabase for tracking
 */
export async function logPriceToSupabase(
  supabase: any,
  userId: string,
  result: PriceScoutResult,
  roomType: string,
  checkInDate: string,
  checkOutDate: string,
  location: string
) {
  try {
    await supabase.from("prices").insert({
      user_id: userId,
      room_type: roomType,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      location,
      ota_name: result.bestOTA,
      price: result.bestPrice,
      beat_price: result.beatPrice,
      savings_percent: result.savingsPercent,
      url: result.priceUrl,
    });
    console.log("[PriceScout] Price logged to Supabase");
  } catch (error) {
    console.error("[PriceScout] Failed to log price:", error);
  }
}
