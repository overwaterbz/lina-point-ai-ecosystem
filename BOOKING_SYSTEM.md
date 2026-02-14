# Lina Point Belize Booking System

Complete AI-powered booking system for Belize accommodations and experiences using LangGraph agents, Grok-4 (OpenAI), and Supabase.

## System Architecture

### Overview

```
User Request (/booking page)
    ↓
POST /api/book-flow (Protected Route)
    ├─ PriceScoutAgent (LangGraph)
    │  ├─ Scan OTAs (Agoda, Expedia, Booking.com)
    │  ├─ Compare Prices (recursive loop, max 3 iterations)
    │  ├─ Calculate Beat Price (3% cheaper)
    │  └─ Return: {bestPrice, beatPrice, otatailored, savings%}
    │
    ├─ ExperienceCuratorAgent (LangGraph)
    │  ├─ Analyze User Preferences
    │  ├─ Search Available Tours
    │  ├─ Select Optimal Package
    │  ├─ Generate Affiliate Links
    │  └─ Return: {tours, totalPrice, affiliateLinks, recommendations}
    │
    ├─ Save to Supabase
    │  ├─ prices table
    │  └─ tour_bookings table
    │
    └─ Return Combined JSON Response
         {beat_price, savings_percent, curated_package{room, tours, dinner, total, affiliate_links}}
```

### Components

#### 1. **PriceScoutAgent** (`src/lib/agents/priceScoutAgent.ts`)

**Purpose:** Scan OTAs for room prices and find the best deal, then beat it by 3%

**Workflow (LangGraph Recursion - Max 3 Iterations):**
```
Scan Prices from All OTAs
    ↓
Compare & Calculate Beat Price (3% cheaper)
    ↓
Check if Better Deal Exists?
    ├─ Yes → Continue to next iteration (up to 3 total)
    └─ No/Max Reached → Finalize & Return Results
```

**Features:**
- Scans Agoda, Expedia, and Booking.com
- Mock OTA prices (ready for real API integration)
- 3-iteration recursive loop with improvement detection
- Returns best OTA, original price, beat price, and savings percentage

**Mock Output:**
```json
{
  "bestPrice": 175.50,
  "bestOTA": "expedia",
  "beatPrice": 170.24,
  "priceUrl": "https://expedia.com/search?...",
  "savings": 5.26,
  "savingsPercent": 3
}
```

#### 2. **ExperienceCuratorAgent** (`src/lib/agents/experienceCuratorAgent.ts`)

**Purpose:** Customize Belize tour packages based on user preferences and generate affiliate commissions

**Workflow (LangGraph Sequential):**
```
Analyze User Preferences
    ↓
Search Available Tours (Fishing, Snorkeling, Mainland, Dining)
    ↓
Select Optimal Package (2-3 tours + dinner within budget)
    ↓
Generate Affiliate Links (10% commission per tour)
    ↓
Finalize & Return Recommendations
```

**Tour Types:**
- **Fishing:** Half-day ($280) / Full-day ($450) saltwater adventures
- **Snorkeling:** Coral garden ($105) / Lighthouse reef ($210)
- **Mainland:** Mayan ruins ($185) / Cultural experiences ($125)
- **Dining:** Beachfront ($95) / Garifuna cooking ($75)

**Affiliate Structure:**
- All tours generate 10% commission
- Affiliate links tracked in `affiliate_links` array
- Commissions saved to database for analytics

**Mock Output:**
```json
{
  "tours": [
    {"name": "Lighthouse Reef Atoll", "type": "snorkeling", "price": 210, "duration": "6 hours"},
    {"name": "Mayan Ruins Trek", "type": "mainland", "price": 185, "duration": "8 hours"},
    {"name": "Garifuna Culinary Tour", "type": "dining", "price": 75, "duration": "4 hours"}
  ],
  "totalPrice": 470,
  "affiliateLinks": [
    {"provider": "Lighthouse Reef", "url": "...", "commission": 21},
    {"provider": "Mayan Ruins", "url": "...", "commission": 18.50},
    {"provider": "Garifuna Culinary", "url": "...", "commission": 7.50}
  ],
  "recommendations": ["Book 3 experiences...", "Total tour cost: $470", "Book in advance...", "Best Dec-April"]
}
```

### API Routes

#### `/api/book-flow` (POST - Protected)

**Authentication:** Requires Supabase auth session

**Request Body:**
```typescript
{
  roomType: string;           // e.g., "overwater room", "beach suite"
  checkInDate: string;        // YYYY-MM-DD
  checkOutDate: string;       // YYYY-MM-DD
  location: string;           // e.g., "Belize"
  groupSize: number;          // 1-10
  tourBudget: number;         // USD
  interests?: string[];       // ["snorkeling", "fishing", "mainland", "dining"]
  activityLevel?: string;     // "low" | "medium" | "high"
}
```

**Response (Success):**
```typescript
{
  success: true;
  beat_price: number;
  savings_percent: number;
  curated_package: {
    room: {
      price: number;
      ota: string;
      url: string;
    };
    tours: Array<{name, type, price, duration}>;
    dinner: {name, price};
    total: number;
    affiliate_links: Array<{provider, url, commission}>;
  };
  recommendations: string[];
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Unauthorized" or error message
}
```

### UI Routes

#### `/booking` (Protected Page)

**Features:**
- Protected route (requires authentication via Supabase)
- Room search form with date picker
- Tour preferences (interests, activity level, budget)
- Real-time results display with:
  - Price comparison cards (original vs beat price vs total)
  - Tour package breakdown
  - Affiliate links display
  - Booking CTA: "Book Direct & Save X%"

**Form Fields:**
- Room Type (text input)
- Check-in/Check-out Dates (date picker)
- Group Size (1-10)
- Tour Budget ($)
- Activity Level (Low/Medium/High)
- Tour Interests (checkboxes: snorkeling, fishing, mainland, dining)

### Database Schema

#### `prices` Table
```sql
CREATE TABLE prices (
  id UUID PRIMARY KEY,
  room_type TEXT,
  check_in_date DATE,
  check_out_date DATE,
  location TEXT,
  ota_name TEXT,              -- 'agoda', 'expedia', 'booking'
  price DECIMAL(10, 2),       -- Original OTA price
  beat_price DECIMAL(10, 2),  -- 3% cheaper price
  url TEXT,                    -- OTA booking link
  user_id UUID FOREIGN KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `tour_bookings` Table
```sql
CREATE TABLE tour_bookings (
  id UUID PRIMARY KEY,
  user_id UUID FOREIGN KEY,
  tour_name TEXT,
  tour_type TEXT,            -- 'fishing', 'snorkeling', 'mainland', 'dining'
  price DECIMAL(10, 2),
  affiliate_link TEXT,
  commission_earned DECIMAL(10, 2),  -- 10% of tour price
  booking_date DATE,
  status TEXT,               -- 'pending', 'booked', 'completed'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**RLS Policies:**
- Users can only view their own prices and bookings
- Users can insert and update their own records

## Example Usage

### Mock Query: Overwater Room + Family Tour Bundle

**Request:**
```bash
POST /api/book-flow
Authorization: Bearer {user_session_token}
Content-Type: application/json

{
  "roomType": "overwater room",
  "checkInDate": "2024-03-15",
  "checkOutDate": "2024-03-22",
  "location": "Belize",
  "groupSize": 2,
  "tourBudget": 600,
  "interests": ["snorkeling", "fishing"],
  "activityLevel": "medium"
}
```

**Response (Example):**
```json
{
  "success": true,
  "beat_price": 170.24,
  "savings_percent": 3,
  "curated_package": {
    "room": {
      "price": 175.50,
      "ota": "expedia",
      "url": "https://expedia.com/search?..."
    },
    "tours": [
      {"name": "Lighthouse Reef Atoll", "type": "snorkeling", "price": 210, "duration": "6 hours"},
      {"name": "Half-Day Saltwater Fishing", "type": "fishing", "price": 280, "duration": "4 hours"}
    ],
    "dinner": {
      "name": "Sunset Beachfront Dinner",
      "price": 95
    },
    "total": 660.24,
    "affiliate_links": [
      {"provider": "Lighthouse Reef", "url": "...", "commission": 21},
      {"provider": "Half-Day Fishing", "url": "...", "commission": 28}
    ]
  },
  "recommendations": [
    "Book 2 experiences for optimal Belize experience",
    "Total tour cost: $490",
    "Book in advance for better rates",
    "Best travel period: December to April"
  ]
}
```

## Technology Stack

| Component | Technology |
|-----------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **AI Agents** | LangChain + LangGraph |
| **LLM** | Grok-4 (OpenAI) |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **UI Framework** | React 19 |
| **Styling** | Tailwind CSS 4 |
| **Notifications** | React Hot Toast |

## Installation & Setup

### 1. Install Dependencies
```bash
npm install langchain @langchain/langgraph @langchain/openai @langchain/core @langchain/community zod axios dotenv
```

### 2. Set Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_grok4_api_key
```

### 3. Run Migrations
```bash
# Push the migration to Supabase
supabase migration push
```

### 4. Start Development Server
```bash
npm run dev
```

Visit `/booking` to test the system (requires login)

## Testing

### Test the Endpoint Manually
```bash
curl -X POST http://localhost:3000/api/book-flow \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_session_token" \
  -d '{
    "roomType": "overwater room",
    "checkInDate": "2024-03-15",
    "checkOutDate": "2024-03-22",
    "location": "Belize",
    "groupSize": 2,
    "tourBudget": 600,
    "interests": ["snorkeling", "fishing"],
    "activityLevel": "medium"
  }'
```

### Use the Test Script
```bash
npx ts-node test-booking-endpoints.ts
```

## Key Features

✅ **Multi-Agent Orchestration**
- PriceScoutAgent with LangGraph recursion (max 3 loops)
- ExperienceCuratorAgent for tour curation
- Both agents work in parallel via Promise.all()

✅ **Price Beating**
- Scans 3 major OTAs (Agoda, Expedia, Booking.com)
- Finds best price, then beats it by 3%
- Tracks savings percentage for user benefit

✅ **AI-Powered Recommendations**
- User preference analysis (interests, activity level, budget)
- Smart tour selection (2-3 curated tours)
- Budget-aware package building ($500-$1000 range)

✅ **Affiliate Integration**
- 10% commission on each tour booking
- Affiliate links tracked and saved to database
- Commission earnings calculated and displayed

✅ **Protected Routes**
- Supabase auth integration
- Row-level security (RLS) on database tables
- Session-based user isolation

✅ **Error Handling**
- Auth validation (401 errors)
- Try-catch blocks with meaningful error messages
- Toast notifications for user feedback
- Loading states during agent execution

✅ **UI/UX**
- Tailwind CSS responsive design
- Form validation
- Price comparison cards
- Affiliate opportunity display
- "Book Direct & Save X%" CTAssembly

## Future Enhancements

1. **Real OTA APIs**
   - Integrate actual Expedia, Booking.com, Agoda APIs
   - Web scraping with Tavily search tool

2. **Advanced Pricing**
   - Dynamic pricing based on season/demand
   - Multi-day package discounts
   - Group rate negotiation

3. **More Destinations**
   - Expand beyond Belize
   - Multi-country trip planning

4. **Payment Integration**
   - Stripe/Paypal checkout
   - Direct booking completion

5. **Analytics Dashboard**
   - Price trends tracking
   - Commission earnings dashboard
   - User preferences insights

6. **Mobile Optimization**
   - Progressive Web App (PWA) support
   - Mobile-specific UI

## Troubleshooting

### Module Resolution Errors
If you see "Cannot find module" errors after setup:
```bash
npm run build
# Then restart dev server
npm run dev
```

### Supabase Connection Issues
- Verify `.env.local` has correct Supabase credentials
- Check Supabase project is active
- Ensure migrations were applied: `supabase migration push`

### Agent Errors
- Check OpenAI/Grok-4 API key is set
- Verify API limits not exceeded
- Check logs in terminal for detailed errors

## File Structure

```
src/
  ├── app/
  │   ├── api/
  │   │   └── book-flow/
  │   │       └── route.ts          # Main API endpoint
  │   ├── booking/
  │   │   └── page.tsx              # Booking UI page
  │   └── ...
  ├── lib/
  │   ├── agents/
  │   │   ├── priceScoutAgent.ts    # Price comparison agent
  │   │   └── experienceCuratorAgent.ts  # Tour curation agent
  │   ├── supabase.ts
  │   └── ...
  ├── components/
  │   ├── ProtectedRoute.tsx        # Auth wrapper
  │   └── ...
  └── ...

supabase/
  └── migrations/
      └── 20250214101500_add_prices_and_tours_tables.sql
```

---

**Created:** February 14, 2026
**Version:** 1.0.0
**Status:** Ready for Development
