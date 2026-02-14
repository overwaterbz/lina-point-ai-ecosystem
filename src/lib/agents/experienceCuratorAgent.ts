// LangGraph-based Experience Curator Agent with tour curation workflow

export interface UserPreferences {
  interests: string[];
  activityLevel: "low" | "medium" | "high";
  budget: "budget" | "mid" | "luxury";
}

interface TourOption {
  name: string;
  type: "fishing" | "snorkeling" | "mainland" | "dining";
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
};

// LangGraph Workflow: Analyze Prefs → Search Tours → Select Best → Generate Affiliate Links → Finalize
export async function runExperienceCurator(
  userPreferences: UserPreferences,
  groupSize: number,
  budget: number
): Promise<CuratedExperience> {
  console.log("[ExperienceCuratorAgent] Starting workflow");
  console.log(`[ExperienceCuratorAgent] Preferences: ${JSON.stringify(userPreferences)}`);
  console.log(`[ExperienceCuratorAgent] Group Size: ${groupSize}, Budget: $${budget}`);

  // Node 1: Search for available tours based on preferences
  console.log("[ExperienceCuratorAgent] Searching available tours...");

  const recommendedTypes = userPreferences.interests.length > 0
    ? (userPreferences.interests as Array<"fishing" | "snorkeling" | "mainland" | "dining">)
    : (["snorkeling", "dining"] as const);

  const tourOptions: TourOption[] = [];

  for (const type of recommendedTypes) {
    if (mockTours[type]) {
      const filtered = mockTours[type].filter((tour) =>
        userPreferences.budget === "budget"
          ? tour.price < 200
          : userPreferences.budget === "mid"
            ? tour.price >= 200 && tour.price < 400
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

  // Always include one snorkeling tour if available
  const snorkeling = tourOptions.find((t) => t.type === "snorkeling");
  if (snorkeling && totalPrice + snorkeling.price <= budget * 0.6) {
    selectedTours.push(snorkeling);
    totalPrice += snorkeling.price;
    console.log(`[ExperienceCuratorAgent] Selected: ${snorkeling.name} ($${snorkeling.price})`);
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
