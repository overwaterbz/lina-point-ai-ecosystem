/**
 * OTA Integration Module (stub for future real API integrations)
 * Currently uses mock data, can be extended to real APIs
 */

export interface OTAPrice {
  ota: string;
  price: number;
  currency: string;
  url: string;
  lastUpdated: Date;
}

const isProd = process.env.NODE_ENV === "production";
const debugLog = (...args: unknown[]) => {
  if (!isProd) {
    console.log(...args);
  }
};

/**
 * Fetch prices from external OTA APIs
 * Currently mocked, can integrate real APIs like:
 * - Agoda Partner API
 * - Booking.com API
 * - Expedia API
 * TODO: Replace with actual implementations
 */
export async function fetchCompetitivePrices(
  roomType: string,
  checkInDate: string,
  checkOutDate: string,
  location: string
): Promise<OTAPrice[]> {
  debugLog(`[OTA] Fetching prices for ${roomType} from OTAs...`);

  // Mock data - replace with real API calls
  const mockPrices: OTAPrice[] = [
    {
      ota: "expedia",
      price: 450,
      currency: "USD",
      url: "https://www.expedia.com/hotels",
      lastUpdated: new Date(),
    },
    {
      ota: "booking",
      price: 435,
      currency: "USD",
      url: "https://www.booking.com/hotels",
      lastUpdated: new Date(),
    },
    {
      ota: "agoda",
      price: 455,
      currency: "USD",
      url: "https://www.agoda.com/hotels",
      lastUpdated: new Date(),
    },
  ];

  return mockPrices;
}

/**
 * Get OTA affiliate program URLs
 */
export const OTA_AFFILIATES = {
  expedia: {
    baseUrl: "https://www.expedia.com",
    affiliateId: "lina-point-resort",
    commission: 5,
  },
  booking: {
    baseUrl: "https://www.booking.com",
    affiliateId: "lina-point-resort",
    commission: 5,
  },
  agoda: {
    baseUrl: "https://www.agoda.com",
    affiliateId: "lina-point-resort",
    commission: 5,
  },
  hotels: {
    baseUrl: "https://www.hotels.com",
    affiliateId: "lina-point-resort",
    commission: 3,
  },
  tripadvisor: {
    baseUrl: "https://www.tripadvisor.com",
    affiliateId: "lina-point-resort",
    commission: 4,
  },
};
