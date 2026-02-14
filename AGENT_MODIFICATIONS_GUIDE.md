<!-- OPTION C: Agent Code Modification Guide -->

# Agent Code Modification Guide

## 🎯 PriceScoutAgent Enhancements

### 1. Add More OTAs (Currently: Agoda, Expedia, Booking.com)

**File:** `lib/otaIntegration.ts`

Add new fetch functions:
```typescript
export async function fetchTravelocityPrice(...) { ... }
export async function fetchKayakPrice(...) { ... }
export async function fetchHotelsComPrice(...) { ... }
```

Then update `fetchCompetitivePrices()` to include them in the Promise.all()

**Impact:** More competitive pricing data → better beat prices

### 2. Modify Recursion Strategy

**File:** `lib/priceScoutAgent.ts` (Line ~105-110)

Current: Stops if improvement < 1%
```typescript
if (percentImprovement > 1) {  // Current threshold
  // Continue to next iteration
}
```

Can modify to:
- **More aggressive:** `> 0.5` (continue longer)
- **More conservative:** `> 2` (stop sooner)
- **Dynamic:** Use Grok to determine threshold

### 3. Adjust Beat Percentage

**File:** `lib/priceScoutAgent.ts` (Line ~91)

Current: Default 3%
```typescript
let bestBeatPercentage = 3; // Change this value
```

Options:
- **Aggressive:** 5-7% (higher margins, less competitive)
- **Moderate:** 2-3% (current, balanced)
- **Undercut:** 0.5-1% (very competitive, lower margins)

### 4. Add Real OTA APIs

Replace simulated pricing with real integrations:

```typescript
// Option A: Use direct OTA APIs
// - Agoda API
// - Expedia API  
// - Booking.com API

// Option B: Use web scraping library
// - Puppeteer for browser automation
// - Cheerio/jsdom for parsing HTML
// - Playwright for headless browsing

// Option C: Use third-party aggregators
// - RapidAPI marketplace (many hotel APIs)
// - Custom web scraping service
```

---

## 🎯 ExperienceCuratorAgent Enhancements

### 1. Add More Tour Types

**File:** `lib/experienceCuratorAgent.ts` (Line ~28-100+)

Currently: fishing, snorkeling, mainland, dining

Add new categories:
```typescript
kayaking: [
  { name: "Mangrove Kayak Tour", type: "kayaking", price: 95, ... },
  { name: "Sea Kayak Expedition", type: "kayaking", price: 180, ... },
],
adventure: [
  { name: "Zip Line Canopy Tour", type: "adventure", price: 125, ... },
  { name: "Rock Climbing", type: "adventure", price: 150, ... },
],
cultural: [
  { name: "Garinagu Culture Tour", type: "cultural", price: 110, ... },
  { name: "Live Music Experience", type: "cultural", price: 75, ... },
],
```

### 2. Integrate Grok for Tour Selection

Already partially implemented. To enhance:

```typescript
// In runExperienceCurator(), after selecting tours
const grokCuration = await curatToursWithGrok(userPreferences, groupSize, budget);

// Merge AI recommendations with rule-based selection
const finalTours = smartMergeTours(selectedTours, grokCuration.tour_selection);
```

### 3. Personalization by User Preferences

**File:** `lib/experienceCuratorAgent.ts` (Line ~130+)

Currently: Uses basic interest matching

Enhance to:
```typescript
// Weight by multiple factors
const score = 
  (interestMatch * 0.4) +           // User interests
  (budgetFit * 0.3) +                // Budget alignment
  (activityLevelMatch * 0.2) +       // Energy level
  (musicStyleRelevance * 0.1);       // Music preference
```

### 4. Dynamic Pricing & Discounts

Add group discounts:
```typescript
function applyGroupDiscounts(tours, groupSize) {
  return tours.map(tour => ({
    ...tour,
    originalPrice: tour.price,
    discountedPrice: tour.price * (1 - getGroupDiscount(groupSize)),
  }));
}

function getGroupDiscount(groupSize) {
  if (groupSize >= 8) return 0.15;  // 15% off
  if (groupSize >= 5) return 0.10;  // 10% off
  if (groupSize >= 3) return 0.05;  // 5% off
  return 0;
}
```

### 5. Add Seasonal Tours

```typescript
const seasonalTours = {
  'dec-apr': ['whale-shark', 'manatee-viewing'],
  'may-nov': ['hurricane-season-deals', 'local-festivals'],
};
```

---

## 🎯 API Route Enhancements

### File: `src/app/api/book-flow/route.ts`

### 1. Add Caching

Store recent searches to avoid repeated OTA calls:
```typescript
const cache = new Map();

function getCacheKey(roomType, dates) {
  return `${roomType}_${dates}`;
}

// Check cache first
const cached = cache.get(getCacheKey(roomType, checkInDate));
if (cached && !isTooOld(cached.timestamp)) {
  return cached.result;
}
```

### 2. Add Analytics Tracking

Track what beats users accept:
```typescript
// After successful booking
await supabase.from('booking_analytics').insert({
  user_id: user.id,
  beat_percentage: result.savingsPercent,
  ota_undercut: result.bestOTA,
  tour_selected: result.tours[0].name,
  timestamp: new Date().toISOString(),
});
```

### 3. Add A/B Testing

Test different beat percentages:
```typescript
const beatPercentages = [3, 3.5, 4, 4.5];
const selectedPercentage = beatPercentages[user.id % beatPercentages.length];
```

---

## 🎯 Database Enhancements

### New Tables to Consider:

```sql
-- Affiliate commission tracking
CREATE TABLE affiliate_commissions (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES tour_bookings,
  tour_provider TEXT,
  commission_amount DECIMAL,
  payment_date DATE,
  status TEXT,
);

-- Price history for trend analysis
CREATE TABLE price_history (
  id UUID PRIMARY KEY,
  room_type TEXT,
  ota TEXT,
  price DECIMAL,
  check_in DATE,
  recorded_at TIMESTAMP,
);

-- A/B test results
CREATE TABLE experiment_results (
  id UUID PRIMARY KEY,
  variant TEXT,
  conversion_rate DECIMAL,
  avg_booking_value DECIMAL,
  timestamp TIMESTAMP,
);
```

---

## 🎯 Quick Wins (Easy Modifications)

1. **Change affiliate commission:** Line 193 in experienceCuratorAgent.ts
   - Currently: `Math.round(tour.price * 0.1 * 100) / 100` (10%)
   - Could be: `Math.round(tour.price * 0.15 * 100) / 100` (15%)

2. **Add more tour descriptions:** Expand mockTours object with detailed descriptions

3. **Adjust price ranges:** Modify `getPriceByRoomType()` in otaIntegration.ts

4. **Change beat calculation:** Line 61 in priceScoutAgent.ts
   - Current: `bestBeatPercentage = 3`
   - More aggressive: `bestBeatPercentage = 5`

5. **Add required tours:** Force inclusion of specific tours in curator

---

## 🎯 Integration With Supabase

All modifications can write results back to Supabase:

```typescript
// Save pricing analysis
await supabase.from('prices').insert({
  room_type: roomQuery,
  original_price: priceResult.bestPrice,
  beat_price: priceResult.beatPrice,
  savings_percent: priceResult.savingsPercent,
  best_ota: priceResult.bestOTA,
  user_id: user.id,
  created_at: new Date(),
});

// Save tour selections
await supabase.from('tour_bookings').insert({
  user_id: user.id,
  selected_tours: JSON.stringify(tours),
  total_cost: totalPrice,
  affiliate_commission: affiliateTotal,
});
```

---

## 📊 Testing Modifications

Use the test endpoint to verify changes:
```bash
curl http://localhost:3001/api/test-booking \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "roomType": "Luxury Villa",
    "checkInDate": "2026-12-24",
    "checkOutDate": "2026-12-27",
    "interests": ["fishing", "dining"],
    "musicStyle": "Ambient"
  }'
```

