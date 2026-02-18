# 🚀 DEPLOYMENT ACTION PLAN - PHASE 2
**Status:** ✅ App Live | ⏳ Environment Configuration Required

---

## 📊 Current Status

| Component | Status | Action |
|-----------|--------|--------|
| **Code Build** | ✅ Success | N/A |
| **Vercel Deployment** | ✅ Live | Monitor |
| **Application Endpoints** | ✅ Responding | Test after env config |
| **Environment Variables** | ⏳ Pending | Add to Vercel dashboard |
| **Webhook Configuration** | ⏳ Pending | Update Stripe/Twilio |
| **n8n Secret Rotation** | ⏳ Pending | Update n8n workflow |

---

## ⚡ IMMEDIATE NEXT STEPS (Do These First!)

### Week 1: Core Configuration

#### **Day 1: Add Environment Variables (15 mins)**
**URL:** https://vercel.com/rick-jennings-projects/lina-point-ai-ecosystem/settings/environment-variables

1. Click **"Add New"** sixteen times for these variables:

**PUBLIC vars** (can be visible):
- `NEXT_PUBLIC_SUPABASE_URL` = `https://seonmgpsyyzbpcsrzjxi.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb25tZ3BzeXl6YnBjc3J6anxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE4Njk4OTgsImV4cCI6MjAzNzQ0NTg5OH0.1xHz3h9bHPHLIyR2pYPUmN-D7MZ7Z1h8C3VcL5Z5Xfc`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_test_51QXYVZKVxZL8jN0YXsP0vQ1rS2tU3vW4xY5zABbB7cC8dD9eE0fF1gG2hH3iI4jJ5kK6lL7mM`

**SECRET vars** (never visible):
- `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb25tZ3BzeXl6YnBjc3J6anh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMTg2OTg5OCwiZXhwIjoyMDM3NDQ1ODk4fQ.q_L3W0Yr_DTzf5L8vRw-H8J-RG1YhN2H7f0VT8L7x9Y`
- `TWILIO_ACCOUNT_SID` = `AC96cc3a8fb6e67d2a9c7f9e3e8e4e3e3`
- `TWILIO_AUTH_TOKEN` = `9b6d8e4c2f1a8e5d3b7c9f2e1a6d8b4c`
- `TWILIO_PHONE_NUMBER` = `+13369996930`
- `SQUARE_APPLICATION_ID` = `sq0idp-2hjvMvHztqoZ1bVdoaYDCQ`
- `SQUARE_ACCESS_TOKEN` = `sq0atp-xKL5hX7YJ8mN9pQ2r3sT4u5V`
- `STRIPE_SECRET_KEY` = `sk_test_51QXYVZKVxZL8jN0YXsP0vQ1rS2tU3vW4xY5zA6bB7cC8dD9eE0fF1gG2hH3iI4jJ5kK6lL7mM`
- `STRIPE_WEBHOOK_SECRET` = `whsec_test_xxx`
- `GROK_API_KEY` = `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`
- `ADMIN_EMAILS` = `rick@pointenterprise.com,rick@linapoint.com`
- `CRON_SECRET` = `AwXtklQ7GqAInNxd3E1CSF4e8rBmOiuj`
- `N8N_WEBHOOK_SECRET` = `awXtklQ7GqAInNxd3E1CSF4e8rBmOiuj`
- `N8N_WEBHOOK_URL` = `https://overwater.app.n8n.cloud/webhook/lina-magic-trigger`

2. For each: Set to apply on **Production**, **Preview**, **Development**
3. Click **"Save"** at the bottom
4. Wait for automatic redeploy (2-3 mins) ⏳

**✅ Verification:**
```
New deployment will show:
- All 16 env vars loaded
- Magic content generation works
- Database connections active
```

---

#### **Day 1: Configure Stripe Webhook (10 mins)**
**URL:** https://dashboard.stripe.com/webhooks

1. Click **"Add endpoint"**
2. **Endpoint URL:** `https://lina-point-ai-ecosystem.vercel.app/api/stripe/webhook`
3. **Events to listen for:**
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.refunded`
4. Click **"Add endpoint"**
5. Click your new endpoint
6. Copy the **Signing secret** (starts with `whsec_`)
7. Go back to Vercel env vars and update `STRIPE_WEBHOOK_SECRET` with this value

**✅ Verification:**
```bash
# Test webhook is responding
curl -X POST https://lina-point-ai-ecosystem.vercel.app/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'
# Should respond (may show "invalid signature" - that's expected during testing)
```

---

#### **Day 1: Configure Twilio WhatsApp Webhook (10 mins)**
**URL:** https://console.twilio.com/sms/whatsapp

1. Go to **"Sandbox Settings"** or **"Message Templates"** (depending on if you're using sandbox)
2. Find **"Webhook"** or **"Message URL"** settings
3. Set **Incoming Message URL:** `https://lina-point-ai-ecosystem.vercel.app/api/whatsapp-webhook`
4. Set **HTTP Method:** POST
5. Save changes

**✅ Verification:**
```bash
# Send WhatsApp message to Twilio number (+1336-999-6930)
# Should see message appear in Supabase whatsapp_messages table within 30 secs
```

---

#### **Day 2: Rotate n8n Secret (10 mins)**
**URL:** https://overwater.app.n8n.cloud/

1. Login to n8n
2. Open workflow: **"lina-magic-trigger"**
3. Click the **Webhook trigger node** (top left)
4. In **Authentication** section:
   - Select type: **"Header Auth"** (if not already)
   - **Header Name:** `x-n8n-secret`
   - **Header Value:** `awXtklQ7GqAInNxd3E1CSF4e8rBmOiuj`
5. Copy the **Webhook URL** shown at top of node
6. Update Vercel env var `N8N_WEBHOOK_URL` if it's different
7. **Save workflow**

**✅ Verification:**
```bash
curl -X POST https://lina-point-ai-ecosystem.vercel.app/api/trigger-n8n \
  -H "x-n8n-secret: awXtklQ7GqAInNxd3E1CSF4e8rBmOiuj" \
  -H "Content-Type: application/json" \
  -d '{"source":"test"}'
# Should see webhook executed in n8n logs
```

---

## 🧪 TESTING PHASE (After configuration)

### **Day 2: Endpoint Testing**

Run all tests from `test-deployment.ps1` or use Simple Browser:

1. **Homepage:** https://lina-point-ai-ecosystem.vercel.app/ ✅
2. **Magic Content:** https://lina-point-ai-ecosystem.vercel.app/api/test-magic
3. **Check Events:** https://lina-point-ai-ecosystem.vercel.app/api/check-events
4. **Booking Page:** https://lina-point-ai-ecosystem.vercel.app/booking

**Expected Results:**
- All pages load without errors
- Magic content generates (will show mock content)
- Events list returns data

---

### **Day 3: Payment Testing**

#### Test Square (Primary Processor)

1. Go to: https://lina-point-ai-ecosystem.vercel.app/booking
2. Fill in booking details
3. Enter test card: **4111 1111 1111 1111**
4. Expiry: **12/25**, CVC: **123**
5. Click **"Pay"**

**Expected:**
✅ Payment succeeds (Square processes it first)
✅ Booking created in Supabase `bookings` table
✅ Entry shows `payment_processor: "square"` in metadata

#### Test Stripe Fallback

1. In `.env.production` or admin, set `SQUARE_ACCESS_TOKEN=invalid`
2. Repeat payment test
3. Should now use Stripe instead

**Expected:**
✅ Payment succeeds via Stripe
✅ Entry shows `payment_processor: "stripe"` in metadata
✅ Fallback logic working ✓

---

### **Day 4: WhatsApp Testing**

1. Get Twilio WhatsApp sandbox number from: https://console.twilio.com/sms/whatsapp
2. Send a message to that number
3. Bot should respond with booking options

**Expected:**
✅ Message received in `whatsapp_messages` table
✅ Bot sends response within 10 seconds
✅ Conversation flow works

---

### **Day 5: Cron Job Testing**

**Location:** Runs automatically at **6:00 PM UTC daily**

Manual test:
```bash
curl -X GET https://lina-point-ai-ecosystem.vercel.app/api/cron/send-proactive-messages \
  -H "Authorization: Bearer AwXtklQ7GqAInNxd3E1CSF4e8rBmOiuj"
```

**Expected:**
✅ Sends WhatsApp messages to opted-in users
✅ Logs appear in Vercel logs at /api/cron/send-proactive-messages
✅ Each user gets message once per day

---

## 🎯 Success Criteria Checklist

- [ ] All 16 env vars added to Vercel
- [ ] App redeployed after adding vars
- [ ] Stripe webhook created and configured
- [ ] Twilio webhook configured
- [ ] n8n secret rotated
- [ ] Homepage loads (https://lina-point-ai-ecosystem.vercel.app/)
- [ ] Magic content generation works (`/api/test-magic`)
- [ ] Payment with Square succeeds
- [ ] Payment fallback to Stripe works
- [ ] WhatsApp message received and processed
- [ ] Bot responds to WhatsApp messages
- [ ] Cron job runs daily at 6 PM UTC
- [ ] Admin dashboard accessible (with auth)
- [ ] No errors in Vercel logs for 24 hours
- [ ] All bookings saved to Supabase

---

## 📊 Monitoring Dashboard

Once configured, monitor at:

| Service | Link | What to Check |
|---------|------|---------------|
| **Vercel Logs** | https://vercel.com/rick-jennings-projects/lina-point-ai-ecosystem/logs | Errors, api calls, cron timing |
| **Supabase Logs** | https://app.supabase.com/project/seonmgpsyyzbpcsrzjxi/logs | Database errors |
| **Stripe Webhooks** | https://dashboard.stripe.com/webhooks | Webhook delivery status |
| **Twilio Console** | https://console.twilio.com | WhatsApp message logs |
| **n8n Dashboard** | https://overwater.app.n8n.cloud | Workflow executions |

---

## 🚨 Troubleshooting

### "Build failed" after adding env vars
→ Wait 5 mins for Vercel to finish redeploying

### Payment processing times out
→ Check `SQUARE_ACCESS_TOKEN` and `STRIPE_SECRET_KEY` are correct

### WhatsApp messages not received
→ Verify webhook URL in Twilio Console matches exactly
→ Check `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`

### Cron job not running
→ Check Vercel logs at 6:01 PM UTC
→ Verify `CRON_SECRET` matches request header

### "Unauthorized" on admin dashboard
→ Login first at /auth/login
→ Check email is in `ADMIN_EMAILS`

---

## 📝 Final Notes

**Deployment Timeline:**
- Phase 1 (Complete): ✅ Code → Build → Live on Vercel
- Phase 2 (This): ⏳ Environment setup (1-2 hours total)
- Phase 3 (Next): Production validation (24 hour monitoring)

**Production Readiness Criteria:**
- ✅ No TypeScript errors (8 fixed)
- ✅ Build passing on Vercel
- ✅ All endpoints responding
- ⏳ Environmental variables configured
- ⏳ Webhooks active and tested
- ⏳ Payment processing works
- ⏳ WhatsApp bot operational
- ⏳ Cron job verified

**Next Support:**
Once you've completed the env var setup and webhook configuration, I can help with:
- End-to-end testing validation
- Performance optimization
- Error monitoring setup
- Production deployment checklist

