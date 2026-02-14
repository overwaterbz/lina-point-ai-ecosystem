// LangGraph-based Experience Curator Agent with tour curation workflow
import { curatToursWithGrok } from "./grokIntegration";

export interface UserPreferences {
  interests: string[];
  activityLevel: "low" | "medium" | "high";
  budget: "budget" | "mid" | "luxury";
}

interface TourOption {
  name: string;
  type: "fishing" | "snorkeling" | "mainland" | "dining" | "kayaking" | "adventure" | "cultural";
  price: number;
  description: string;
  duration: string;
  affiliate: boolean;
  url: string;
}

interface AffiliateLink {
  provider: string;
  url: string;
  commission: number;
}

export interface CuratedExperience {
  tours: TourOption[];
  totalPrice: number;
  affiliateLinks: AffiliateLink[];
  recommendations: string[];
}

// Mock tour database
const mockTours: Record<string, TourOption[]> = {
  fishing: [
    {
      name: "Half-Day Saltwater Fishing Adventure",
      type: "fishing",
      price: 280,
      description: "Expert guides, tackle provided, photo opportunities",
      duration: "4 hours",
      affiliate: true,
      url: "https://belize-tours.com/fishing?aff=lina-point",
    },
    {
      name: "Full-Day Deep Sea Fishing",
      type: "fishing",
      price: 450,
      description: "Multiple locations, lunch included",
      duration: "8 hours",
      affiliate: true,
      url: "https://belize-tours.com/deep-sea?aff=lina-point",
    },
  ],
  snorkeling: [
    {
      name: "Coral Garden Snorkeling",
      type: "snorkeling",
      price: 105,
      description: "Pristine coral reefs, tropical fish, small group",
      duration: "3 hours",
      affiliate: true,
      url: "https://belize-tours.com/snorkel?aff=lina-point",
    },
    {
      name: "Lighthouse Reef Atoll",
      type: "snorkeling",
      price: 210,
      description: "Three distinct reef sites, lunch, drinks included",
      duration: "6 hours",
      affiliate: true,
      url: "https://belize-tours.com/lighthouse?aff=lina-point",
    },
  ],
  mainland: [
    {
      name: "Mayan Ruins Deep Jungle Trek",
      type: "mainland",
      price: 185,
      description: "Caracol or Xunantunich ruins with experienced guides",
      duration: "8 hours",
      affiliate: true,
      url: "https://belize-tours.com/mayan?aff=lina-point",
    },
    {
      name: "Belizean Village Cultural Experience",
      type: "mainland",
      price: 125,
      description: "Meet local artisans, traditional cooking, crafts",
      duration: "5 hours",
      affiliate: true,
      url: "https://belize-tours.com/cultural?aff=lina-point",
    },
  ],
  dining: [
    {
      name: "Sunset Beachfront Dinner",
      type: "dining",
      price: 95,
      description: "Fresh seafood, wine pairing, live music",
      duration: "3 hours",
      affiliate: false,
      url: "https://belize-restaurants.com/sunset?aff=lina-point",
    },
    {
      name: "Garifuna Culinary Tour",
      type: "dining",
      price: 75,
      description: "Authentic Garifuna cooking class and dinner",
      duration: "4 hours",
      affiliate: true,
      url: "https://belize-tours.com/culinary?aff=lina-point",
    },
  ],
  kayaking: [
    {
      name: "Mangrove Kayak Adventure",
      type: "kayaking",
      price: 95,
      description: "Paddle through pristine mangrove channels, spot wildlife and manatees",
      duration: "3 hours",
      affiliate: true,
      url: "https://belize-tours.com/kayak?aff=lina-point",
    },
    {
      name: "Half-Day Sea Kayak & Snorkel",
      type: "kayaking",
      price: 145,
      description: "Explore coastal caves, secluded islands, and shallow reefs",
      duration: "4 hours",
      affiliate: true,
      url: "https://belize-tours.com/sea-kayak?aff=lina-point",
    },
    {
      name: "Full-Day Kayak Expedition",
      type: "kayaking",
      price: 220,
      description: "Expert-guided paddle through multiple ecosystems with lunch",
      duration: "8 hours",
      affiliate: true,
      url: "https://belize-tours.com/kayak-expedition?aff=lina-point",
    },
  ],
  adventure: [
    {
      name: "Zip Line Canopy Tour",
      type: "adventure",
      price: 125,
      description: "Thrilling zip line course through rainforest canopy",
      duration: "3 hours",
      affiliate: true,
      url: "https://belize-tours.com/zipline?aff=lina-point",
    },
    {
      name: "Caving & Underground River",
      type: "adventure",
      price: 155,
      description: "Explore crystal caves with underground rivers and Mayan artifacts",
      duration: "5 hours",
      affiliate: true,
      url: "https://belize-tours.com/cave-tubing?aff=lina-point",
    },
    {
      name: "Rock Climbing & Rappelling",
      type: "adventure",
      price: 140,
      description: "Guided rock climbing on natural formations with safety equipment",
      duration: "4 hours",
      affiliate: true,
      url: "https://belize-tours.com/climbing?aff=lina-point",
    },
  ],
  cultural: [
    {
      name: "Garinagu Settlement Day Tour",
      type: "cultural",
      price: 110,
      description: "Experience Garinagu culture, reenactments, music, and traditional food",
      duration: "6 hours",
      affiliate: true,
      url: "https://belize-tours.com/garinagu?aff=lina-point",
    },
    {
      name: "Live Music & Dance Experience",
      type: "cultural",
      price: 75,
      description: "Enjoy traditional Creole, Punta, and Paranda music with local performers",
      duration: "3 hours",
      affiliate: false,
      url: "https://belize-restaurants.com/music?aff=lina-point",
    },
    {
      name: "Indigenous Village Visit",
      type: "cultural",
      price: 130,
      description: "Meet Mayan families, learn traditional crafts, share authentic meals",
      duration: "7 hours",
      affiliate: true,
      url: "https://belize-tours.com/village?aff=lina-point",
    },
  ],
};

// LangGraph Workflow: Analyze Prefs → Search Tours → Select Best → Generate Affiliate Links → Finalize
export async function runExperienceCurator(
  userPreferences: UserPreferences,
  groupSize: number,
  budget: number
): Promise<CuratedExperience> {
  console.log("[ExperienceCuratorAgent] Starting workflow");
  console.log(
    `[ExperienceCuratorAgent] Preferences: ${JSON.stringify(userPreferences)}`
  );
  console.log(
    `[ExperienceCuratorAgent] Group Size: ${groupSize}, Budget: $${budget}`
  );

  // Node 0: Consult Grok for AI-powered recommendations (if API key configured)
  let grokRecommendations: string[] = [];
  if (process.env.GROK_API_KEY) {
    try {
      console.log("[ExperienceCuratorAgent] Consulting Grok for tour recommendations...");
      const grokResult = await curatToursWithGrok(userPreferences, groupSize, budget);
      grokRecommendations = grokResult.tour_selection;
      console.log(
        `[ExperienceCuratorAgent] Grok suggests: ${grokRecommendations.join(", ")}`
      );
    } catch (error) {
      console.warn("[ExperienceCuratorAgent] Grok consultation failed, using default selection");
    }
  }

  // Node 1: Search for available tours based on preferences
  console.log("[ExperienceCuratorAgent] Searching available tours...");

  const recommendedTypes = userPreferences.interests.length > 0
    ? (userPreferences.interests as Array<
        | "fishing"
        | "snorkeling"
        | "mainland"
        | "dining"
        | "kayaking"
        | "adventure"
        | "cultural"
      >)
    : (["snorkeling", "dining", "kayaking"] as const);

  const tourOptions: TourOption[] = [];

  for (const type of recommendedTypes) {
    if (mockTours[type as keyof typeof mockTours]) {
      const filtered = mockTours[type as keyof typeof mockTours].filter((tour) =>
        userPreferences.budget === "budget"
          ? tour.price < 150
          : userPreferences.budget === "mid"
            ? tour.price >= 150 && tour.price < 350
            : true
      );
      tourOptions.push(...filtered);
    }
  }

  console.log(`[ExperienceCuratorAgent] Found ${tourOptions.length} matching tours`);

  // Node 2: Select best tours for package
  console.log("[ExperienceCuratorAgent] Selecting optimal tour package...");

  const selectedTours: TourOption[] = [];
  let totalPrice = 0;

  // Prioritize Grok recommendations
  for (const grokTourName of grokRecommendations) {
    const grokTour = tourOptions.find((t) =>
      t.name.toLowerCase().includes(grokTourName.toLowerCase())
    );
    if (
      grokTour &&
      !selectedTours.includes(grokTour) &&
      totalPrice + grokTour.price <= budget * 0.7
    ) {
      selectedTours.push(grokTour);
      totalPrice += grokTour.price;
      console.log(
        `[ExperienceCuratorAgent] Selected (Grok): ${grokTour.name} ($${grokTour.price})`
      );
    }
  }

  // Fallback: Always include one diverse experience if budget allows
  if (selectedTours.length === 0) {
    // Try to get one snorkeling
    const snorkeling = tourOptions.find((t) => t.type === "snorkeling");
    if (snorkeling && totalPrice + snorkeling.price <= budget * 0.6) {
      selectedTours.push(snorkeling);
      totalPrice += snorkeling.price;
      console.log(
        `[ExperienceCuratorAgent] Selected: ${snorkeling.name} ($${snorkeling.price})`
      );
    }

    // Add one more tour based on interests
    for (const tour of tourOptions) {
      if (!selectedTours.includes(tour) && totalPrice + tour.price <= budget * 0.8) {
        selectedTours.push(tour);
        totalPrice += tour.price;
        console.log(`[ExperienceCuratorAgent] Selected: ${tour.name} ($${tour.price})`);
        break;
      }
    }
  }

  // If still no selections, pick something
  if (selectedTours.length === 0 && tourOptions.length > 0) {
    selectedTours.push(tourOptions[0]);
    totalPrice = tourOptions[0].price;
    console.log(
      `[ExperienceCuratorAgent] Selected (default): ${tourOptions[0].name} ($${tourOptions[0].price})`
    );
  }

  // Always add a dining experience
  const dining = tourOptions.find((t) => t.type === "dining");
  if (dining && totalPrice + dining.price <= budget) {
    selectedTours.push(dining);
    totalPrice += dining.price;
    console.log(`[ExperienceCuratorAgent] Selected: ${dining.name} ($${dining.price})`);
  }

  // Node 3: Generate affiliate links
  console.log("[ExperienceCuratorAgent] Generating affiliate links...");

  const affiliateLinks: AffiliateLink[] = selectedTours
    .filter((tour) => tour.affiliate)
    .map((tour) => ({
      provider: tour.name.split(" ").slice(0, 2).join(" "),
      url: tour.url,
      commission: Math.round(tour.price * 0.1 * 100) / 100, // 10% commission
    }));

  console.log(`[ExperienceCuratorAgent] Generated ${affiliateLinks.length} affiliate opportunities`);

  // Node 4: Finalize experience package
  const recommendations = [
    `Book ${selectedTours.length} experiences for optimal Belize experience`,
    `Total tour cost: $${totalPrice}`,
    "Book in advance for better rates",
    "Best travel period: December to April",
  ];

  const result: CuratedExperience = {
    tours: selectedTours,
    totalPrice,
    affiliateLinks,
    recommendations,
  };

  console.log("[ExperienceCuratorAgent] Workflow complete - Results:", result);

  return result;
}
