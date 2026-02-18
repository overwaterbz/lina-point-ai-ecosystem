# Marketing Agent Crew - Complete Documentation

## 🚀 Overview

The **MarketingAgentCrew** is an autonomous, recursive marketing system for Lina Point Resort. It features 5 specialized AI agents that work together to research, create, schedule, engage, and self-improve marketing campaigns.

### Core Philosophy
- **"The Magic is You"** - Every campaign emphasizes guest transformation and empowerment
- **Maya/Kundalini Themes** - Mystical, wellness-focused messaging aligned with resort branding
- **Direct Bookings First** - All campaigns prioritize direct bookings to maximize revenue

---

## 🤖 The 5 Marketing Agents

### 1. **ResearchAgent**
**Purpose:** Scans trends, identifies opportunities, analyzes competitors

**What it does:**
- Daily scans of travel industry trends (last 30 days)
- Competitor analysis (Turneffe Island, South Water Caye, etc.)
- Influencer identification in luxury/wellness travel space
- Market opportunity detection

**Tech Stack:** LangGraph + Grok-4 AI

**Recursion:** Max 3 iterations to refine research quality

---

### 2. **ContentAgent**
**Purpose:** Generates social posts, Reels/TikTok scripts, emails, blog articles

**What it does:**
- Creates Instagram carousel posts with "Magic is You" messaging
- Writes TikTok scripts (9-15 seconds) with trending sounds
- Generates email campaigns with mystical themes
- Produces blog articles about transformation & wellness

**Inputs:**
- Campaign brief (objective, target audience, key messages)
- Research data from ResearchAgent
- Brand voice guidelines ("The Magic is You", kundalini themes)

**Outputs:**
- 3+ pieces of content per campaign
- Platform-specific formatting (hashtags, CTAs, media URLs)
- SEO-optimized copy

**Tech Stack:** LangGraph + Grok-4-1-fast-reasoning

**Recursion:** Evaluates content quality, refines based on feedback

---

### 3. **PostingAgent**
**Purpose:** Schedules & posts to Instagram, TikTok, X, Facebook

**What it does:**
- Schedules posts at optimal times (staggered by 1 hour)
- Generates mock URLs for testing (production: real social API integration)
- Tracks scheduling status per platform
- Handles posting failures gracefully

**Integrations (Production):**
- Instagram Graph API
- TikTok API for Business
- Twitter/X API v2
- Facebook Graph API
- Email: SendGrid/Resend/Mailgun

**Tech Stack:** LangGraph orchestration

**Status:** Current implementation uses mock scheduling. Production requires social platform API keys.

---

### 4. **EngagementAgent**
**Purpose:** Replies to comments/DMs, runs engagement campaigns, builds email list

**What it does:**
- Automated comment replies (personalized, 2-3 sentences, soft CTA)
- Proactive DM campaigns to engaged followers
- Email drip sequences for new subscribers
- Email list building from booking flow

**Campaigns:**
1. **Smart Comment Replies:** Monitors top posts, replies with "Magic is You" theme
2. **Welcome Email Sequence:** 3-email drip for new bookings
3. **Proactive DMs:** Reaches out to travelers showing interest

**Tech Stack:** LangGraph + Grok-4 for natural language replies

**Recursion:** Refines reply quality based on engagement metrics

---

### 5. **SelfImprovementAgent**
**Purpose:** Analyzes performance metrics, refines prompts, suggests improvements

**What it does:**
- Tracks campaign metrics (impressions, clicks, CTR, conversions)
- Uses ML (scikit-learn) for trend analysis
- Generates insights: "Magic is You" messaging → 34% higher engagement
- Updates agent prompts based on performance
- Suggests code improvements

**ML Analysis:**
- CTR optimization
- Conversion rate tracking
- A/B test recommendations
- Audience segmentation insights

**Tech Stack:** Python ML scripts + Grok-4 analysis

**Recursion:** Daily learning loop, updates strategies autonomously

---

## 📊 Database Schema

### `marketing_campaigns`
```sql
id UUID PRIMARY KEY
name VARCHAR(255)
objective VARCHAR(100) -- 'direct_bookings', 'brand_awareness', 'engagement', 'email_growth'
target_audience TEXT
key_messages TEXT[]
platforms TEXT[] -- 'instagram', 'tiktok', 'facebook', 'x', 'email'
status VARCHAR(50) -- 'draft', 'running', 'completed', 'failed'
research_data JSONB
generated_content JSONB[]
scheduled_posts JSONB[]
engagement_campaigns JSONB[]
metrics JSONB
ml_insights TEXT[]
prompt_updates TEXT[]
created_by UUID REFERENCES auth.users
created_at TIMESTAMP
updated_at TIMESTAMP
```

### `marketing_content`
```sql
id UUID
campaign_id UUID REFERENCES marketing_campaigns
type VARCHAR(100) -- 'social_post', 'reel_script', 'tiktok_script', 'email', 'blog'
platform VARCHAR(100)
title VARCHAR(255)
content TEXT
hashtags TEXT[]
call_to_action VARCHAR(255)
media_url VARCHAR(1024)
status VARCHAR(50) -- 'draft', 'scheduled', 'published', 'failed'
scheduled_time TIMESTAMP
published_time TIMESTAMP
impressions INTEGER
clicks INTEGER
engagements INTEGER
conversions INTEGER
```

### `marketing_email_list`
```sql
id UUID
campaign_id UUID
email VARCHAR(255) UNIQUE
first_name VARCHAR(100)
interests TEXT[]
engagement_level VARCHAR(50) -- 'new', 'engaged', 'converted'
email_sent_count INTEGER
last_email_sent TIMESTAMP
last_engagement TIMESTAMP
```

### `marketing_engagement_log`
```sql
id UUID
campaign_id UUID
content_id UUID
engagement_type VARCHAR(100) -- 'click', 'comment', 'share', 'like', 'dm', 'email_open'
user_identifier VARCHAR(500)
user_info JSONB
created_at TIMESTAMP
```

### `marketing_agent_logs`
```sql
id UUID
campaign_id UUID
agent_name VARCHAR(100) -- 'ResearchAgent', 'ContentAgent', etc.
action VARCHAR(255)
status VARCHAR(50) -- 'started', 'completed', 'failed'
input_data JSONB
output_data JSONB
error_message TEXT
iteration_number INTEGER
processing_time_ms INTEGER
created_at TIMESTAMP
```

---

## 🔧 API Endpoints

### POST `/api/marketing/run-campaign`
Triggers MarketingAgentCrew for specified campaign.

**Request:**
```json
{
  "campaignName": "Valentine's Day Campaign",
  "objective": "direct_bookings",
  "targetAudience": "couples aged 30-50",
  "keyMessages": ["The magic is YOU", "Overwater luxury"],
  "platforms": ["instagram", "tiktok", "email"],
  "startDate": "2026-02-10T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "campaignId": "uuid",
  "message": "Marketing campaign executed successfully",
  "results": {
    "contentGenerated": 3,
    "postsScheduled": 3,
    "engagementCampaigns": 3,
    "metrics": { "impressions": 3247, "clicks": 167 },
    "insights": ["Magic is YOU messaging shows 34% higher engagement"]
  }
}
```

**Auth:** Requires Bearer token

---

### GET `/api/marketing/campaigns`
Fetches campaign history and metrics.

**Query Params:**
- `limit` (default: 50)
- `status` (optional: 'draft', 'running', 'completed', 'failed')

**Response:**
```json
{
  "success": true,
  "total": 25,
  "campaigns": [
    {
      "id": "uuid",
      "name": "Valentine's Day Campaign",
      "objective": "direct_bookings",
      "status": "completed",
      "metrics": { "impressions": 3247, "clicks": 167, "ctr": 5.14 },
      "created_at": "2026-02-01T10:00:00Z"
    }
  ]
}
```

---

### GET `/api/cron/run-daily-marketing`
Scheduled via Vercel Cron (daily at 10:00 AM UTC).

**Purpose:** Runs autonomous daily marketing campaigns.

**Auth:** Requires `CRON_SECRET` in Authorization header

**What it does:**
1. Fetches scheduled campaigns
2. Runs MarketingAgentCrew for each
3. Updates campaigns with results
4. Runs daily self-improvement analysis

---

## 🎯 Admin Dashboard

**Route:** `/admin/marketing-dashboard`

**Features:**
- View all campaigns
- Real-time metrics display
- Manual campaign triggers
- Agent status monitoring
- Performance analytics

**Access:** Protected route (requires Supabase authentication)

**UI Components:**
- Campaign creation form
- Campaign cards with metrics
- Agent status indicators
- Performance graphs (future enhancement)

---

## 🔗 Booking Integration

**File:** `src/lib/agents/bookingMarketingIntegration.ts`

### Post-Booking Campaign
Triggered automatically when guest completes booking.

**What happens:**
1. Guest books overwater villa
2. `triggerPostBookingCampaign()` called
3. ContentAgent generates personalized welcome email
4. Email sent immediately with "Magic is You" theme
5. Guest added to email list
6. 3-email drip sequence scheduled

**Email Sequence:**
- **Day 1:** Welcome + magic experience preview
- **Day 7:** Testimonials + exclusive add-on offer
- **Day 14 (pre-arrival):** Packing list + arrival details

### Re-Engagement Campaign
Targets past guests for repeat bookings.

**Trigger:** Manual or scheduled monthly
**Target:** Guests who visited 6-12 months ago
**Message:** "We miss your magic" + returning guest discount

---

## 🧪 Testing

### Test Script
**File:** `test-marketing-crew.js`

**Usage:**
```bash
node test-marketing-crew.js
```

**What it tests:**
1. ResearchAgent: Trend scanning
2. ContentAgent: 3 social posts generation
3. PostingAgent: Scheduling logic
4. EngagementAgent: Campaign setup
5. SelfImprovementAgent: Metrics analysis

**Output:** Saves results to `test-marketing-results.json`

### Test Campaign Example
```javascript
const testCampaign = {
  campaignName: "Valentine's Day 2026 - The Magic Is You",
  objective: "direct_bookings",
  targetAudience: "Couples aged 30-50",
  platforms: ["instagram", "tiktok", "email"],
  keyMessages: [
    "The magic is YOU",
    "Overwater luxury meets mystical Maya energy",
    "Book direct and save"
  ]
};
```

---

## 🚀 Deployment Checklist

### 1. Database Setup
```bash
# Run migration
psql -U postgres -d lina_point -f migrations/004_add_marketing_tables.sql
```

### 2. Environment Variables
Add to `.env.production.local`:
```env
# Marketing APIs (future)
INSTAGRAM_ACCESS_TOKEN=your_token
TIKTOK_API_KEY=your_key
TWITTER_API_KEY=your_key
FACEBOOK_ACCESS_TOKEN=your_token

# Email Service
RESEND_API_KEY=your_key  # or SendGrid, Mailgun

# Machine Learning
ENABLE_ML_INSIGHTS=true

# Cron Secret
CRON_SECRET=your_secure_random_string
```

### 3. Vercel Configuration
```bash
# Deploy with cron job
vercel --prod

# Verify cron job registered (should show 2 crons)
vercel crons ls
```

### 4. Test Campaign
```bash
# Run test script locally
node test-marketing-crew.js

# Or trigger via API
curl -X POST https://your-domain.vercel.app/api/marketing/run-campaign \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"campaignName":"Test Campaign","objective":"direct_bookings",...}'
```

### 5. Monitor Dashboard
Visit: `https://your-domain.vercel.app/admin/marketing-dashboard`

---

## 📈 Performance Metrics

### Expected Results (Based on Test Data)
- **CTR:** 4-6% (industry average: 1-2%)
- **Conversion Rate:** 2-4% (direct bookings from clicks)
- **Email Open Rate:** 35-45%
- **Engagement Rate:** 5-8%

### Self-Improvement Loop
Every 24 hours, the system:
1. Analyzes previous day's performance
2. Identifies winning strategies
3. Updates agent prompts automatically
4. Suggests A/B tests
5. Optimizes posting times

---

## 🔮 Future Enhancements

### Phase 2 (Next 30 Days)
- [ ] Real social media API integration
- [ ] Sentiment analysis on comments/replies
- [ ] A/B testing framework
- [ ] Advanced ML models (random forest for CTR prediction)

### Phase 3 (Next 90 Days)
- [ ] Influencer outreach automation
- [ ] User-generated content (UGC) campaigns
- [ ] Dynamic pricing integration with marketing campaigns
- [ ] Guest lifecycle marketing (pre-arrival, during stay, post-stay)

### Phase 4 (Future)
- [ ] Voice-based marketing content (podcasts, audio ads)
- [ ] Video generation (LTX Studio integration for auto-generated Reels)
- [ ] Predictive analytics: "Best time to reach guest X"
- [ ] Cross-selling: Tours, experiences, spa packages

---

## 🛠️ Troubleshooting

### Campaign Not Running
**Check:**
1. Supabase auth token valid?
2. `marketing_campaigns` table exists?
3. Agent logs for errors: `SELECT * FROM marketing_agent_logs WHERE status='failed'`

### No Content Generated
**Check:**
1. Grok API key configured?
2. Check ContentAgent logs in database
3. Verify campaign brief has keyMessages

### Cron Job Not Triggering
**Check:**
1. Vercel cron registered: `vercel crons ls`
2. `CRON_SECRET` environment variable set
3. Cron logs: Vercel Dashboard → Functions → Logs

### Email Not Sending
**Current:** Emails are logged to `marketing_email_list` but not sent (mock)
**Fix:** Integrate Resend/SendGrid in `bookingMarketingIntegration.ts`

---

## 📚 Code Files Reference

| File | Purpose |
|------|---------|
| `src/lib/agents/marketingAgentCrew.ts` | Main crew orchestrator with 5 agents |
| `src/app/api/marketing/run-campaign/route.ts` | API to trigger campaigns |
| `src/app/api/marketing/campaigns/route.ts` | API to fetch campaign history |
| `src/app/api/cron/run-daily-marketing/route.ts` | Daily cron job |
| `src/app/admin/marketing-dashboard/page.tsx` | Admin UI dashboard |
| `src/lib/agents/bookingMarketingIntegration.ts` | Booking flow integration |
| `test-marketing-crew.js` | Test script |
| `migrations/004_add_marketing_tables.sql` | Database schema |
| `vercel.json` | Cron job configuration |

---

## 💡 Best Practices

1. **Always use "The Magic is You" theme** in content
2. **Emphasize direct booking savings** (3-15% vs OTAs)
3. **Include mystical/Maya themes** in all copy
4. **Track everything** - Log to database for ML learning
5. **Test before scaling** - Run test-marketing-crew.js first
6. **Monitor daily** - Check dashboard for failed campaigns
7. **Optimize based on insights** - SelfImprovementAgent provides actionable recommendations

---

## 🎉 Success Metrics

Your marketing system is working when:
- ✅ 3+ campaigns running concurrently
- ✅ CTR above 4%
- ✅ Conversion rate above 2%
- ✅ Direct bookings increasing 15%+ month-over-month
- ✅ Email list growing 50+ subscribers/week
- ✅ Agent system self-improving (prompt updates logged)

---

**Built with:** Next.js 15, Supabase, LangGraph, Grok-4, CrewAI principles
**Maintained by:** Lina Point Resort Team
**Last Updated:** February 2026
