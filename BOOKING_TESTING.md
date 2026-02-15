# Booking System Testing Guide

## Overview

The booking system consists of two coordinated agents:
1. **PriceScoutAgent** - Scans OTA prices and beats them by 3%
2. **ExperienceCuratorAgent** - Customizes tour packages based on preferences

## Testing Without Auth
Quick test without login required:

```bash
# Start dev server
npm run dev

# Test in another terminal
curl http://localhost:3000/api/test-booking
```

This returns a complete package with:
- Lowest OTA price found
- Direct booking price (3% cheaper)
- Custom tour bundle
- Affiliate links
- Savings amount

## Testing With Auth
To test the full booking flow:

### 1. Create an Account
```
Go to http://localhost:3000/auth/signup
Fill in email and password
Verify email (check console or Supabase logs)
```

### 2. Fill Profile (Optional)
```
Go to http://localhost:3000/dashboard/profile
Set preferences (interests, activity level)
Save
```

### 3. Make Booking Request
```
POST http://localhost:3000/api/book-flow
Content-Type: application/json
Authorization: Bearer <session_token>

{
  "roomType": "overwater room",
  "checkInDate": "2026-03-01",
  "checkOutDate": "2026-03-05",
  "location": "Belize",
  "groupSize": 2,
  "tourBudget": 500,
  "interests": ["snorkeling", "diving"],
  "activityLevel": "high"
}
```

## Database Queries to Verify

After running a booking request, check these tables in Supabase:

```sql
-- Check price history
SELECT * FROM prices ORDER BY created_at DESC LIMIT 5;

-- Check tour bookings
SELECT * FROM tour_bookings WHERE user_id = '<user_id>' ORDER BY created_at DESC LIMIT 5;

-- Check agent runs
SELECT * FROM agent_runs WHERE agent_name IN ('price_scout', 'experience_curator') ORDER BY started_at DESC LIMIT 10;

-- See analytics
SELECT * FROM booking_analytics WHERE user_id = '<user_id>' ORDER BY created_at DESC LIMIT 5;
```

## Expected Results

### PriceScoutAgent Output
```json
{
  "bestPrice": 432,
  "bestOTA": "booking_last",
  "beatPrice": 419,
  "savingsPercent": 3,
  "savings": 13,
  "iterations": 3,
  "priceUrl": "https://linapoint.com/book?...",
  "allPrices": {
    "expedia": 450,
    "booking": 435,
    "agoda": 455,
    ...
  }
}
```

### ExperienceCuratorAgent Output
```json
{
  "tours": [
    {
      "name": "Half-Day Snorkeling & Coral Reef",
      "type": "snorkeling",
      "price": 95,
      "duration": "4 hours",
      "affiliateUrl": "https://viator.com/..."
    }
  ],
  "dinner": {
    "name": "Candlelit Overwater Dining",
    "price": 120,
    "affiliateUrl": "https://linapoint.com/dining/romantic"
  },
  "addons": [
    { "name": "Spa Massage", "price": 80 }
  ],
  "totalPrice": 295,
  "affiliateLinks": [
    { "provider": "Viator Tours", "url": "...", "commission": 5 }
  ],
  "recommendations": [...]
}
```

## Agent Architecture

### PriceScout (LangGraph with Recursion)
- **Step 1**: ScanOTAs - Mock-simulate OTA price findings
- **Step 2**: CalculateBeatPrice - 3% discount calculation
- **Step 3**: RefineSearch - Conditional loop for better deals (max 3 iterations)
- **Output**: Best OTA price + Direct booking price (cheaper)

### ExperienceCurator (Preference-based)
- Matches interests to tours (snorkeling, diving, cultural, etc.)
- Filters by activity level (low/medium/high)
- Budget-aware pricing (budget/mid/luxury)
- Family preferences (kids, pets, dietary)
- Grok-4 integration for personalized recommendations
- Generates affiliate links for monetization

## Extending the System

### Add Real OTA Integration
Replace mock data in `src/lib/priceScoutAgent.ts` with real API calls:

```typescript
// src/lib/otaIntegration.ts
export async function fetchAgodaPrices(...) {
  // Call Agoda Partner API
}

export async function fetchBookingPrices(...) {
  // Call Booking.com API  
}
```

### Add More Tour Types
Add to `BELIZE_TOURS` in `src/lib/experienceCuratorAgent.ts`:

```typescript
cave_tubing: {
  name: "Cave Tubing Adventure",
  duration: "5 hours",
  budget_price: 85,
  ...
}
```

### Customize Pricing Logic
Modify price calculation in PriceScout:

```typescript
const beatPrice = state.bestPrice * 0.97; // Currently 3%
// Change to 0.95 for 5% discount, 0.98 for 2%, etc.
```

## Price Scout Recursion Logic

The 3-iteration loop refines prices by:
1. **Scan**: Fetch fresh prices from all OTAs
2. **Compare**: Find lowest price
3. **Refine**: 30% chance of finding better deal → repeat
4. **Max 3 iterations**: Prevents infinite loops

Example flow:
```
Iteration 1: Best = $435 (Booking.com)
  → No better deal found in refinement
Iteration 2: Best = $432 (Updated price)
  → Better deal detected! Re-scanning...
Iteration 3: Best = $428 (Refined)
  → Max iterations reached, final price $415.36 (3% off)
```

## Error Handling

All agents have try/catch blocks:
- Agent failures don't block the response
- Partial results still returned (e.g., prices without tours)
- Errors logged with "[PriceScout]" or "[Curator]" prefixes
- Supabase RLS failures silently skip analytics

## Performance Considerations

- PriceScout: ~2-5s (3 iterations × APIs)
- ExperienceCurator: ~1-2s (Grok call for recommendations)
- Total request: ~5-10s with Grok enabled
- Can parallelize: RunBoth agents concurrently

## Next Steps

1. ✅ Apply migrations in Supabase
2. ✅ Test with `/api/test-booking` endpoint
3. ☐ Add Grok API key to `.env.local`
4. ☐ Connect Stripe for payments
5. ☐ Integrate real OTA APIs
6. ☐ Add booking confirmation emails

