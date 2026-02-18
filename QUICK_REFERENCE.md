# 🚀 QUICK REFERENCE - DEPLOYMENT LINKS & CREDENTIALS

## 🌐 Live Application
- **Production URL:** https://lina-point-ai-ecosystem.vercel.app
- **Homepage:** https://lina-point-ai-ecosystem.vercel.app/
- **Admin Dashboard:** https://lina-point-ai-ecosystem.vercel.app/admin/dashboard
- **Booking Page:** https://lina-point-ai-ecosystem.vercel.app/booking

## 📋 Configuration & Monitoring

### Vercel (Hosting & Env Vars)
- **Project Dashboard:** https://vercel.com/rick-jennings-projects/lina-point-ai-ecosystem
- **Environment Variables:** https://vercel.com/rick-jennings-projects/lina-point-ai-ecosystem/settings/environment-variables
- **Deployment Logs:** https://vercel.com/rick-jennings-projects/lina-point-ai-ecosystem/logs
- **Production Deployments:** https://vercel.com/rick-jennings-projects/lina-point-ai-ecosystem/deployments

### Supabase (Database)
- **Project URL:** https://app.supabase.com/project/seonmgpsyyzbpcsrzjxi
- **Database Editor:** https://app.supabase.com/project/seonmgpsyyzbpcsrzjxi/editor
- **Logs:** https://app.supabase.com/project/seonmgpsyyzbpcsrzjxi/logs/editor
- **Auth Users:** https://app.supabase.com/project/seonmgpsyyzbpcsrzjxi/auth/users
- **Tables:**
  - bookings: https://app.supabase.com/project/seonmgpsyyzbpcsrzjxi/editor/tables/bookings
  - profiles: https://app.supabase.com/project/seonmgpsyyzbpcsrzjxi/editor/tables/profiles
  - magic_content: https://app.supabase.com/project/seonmgpsyyzbpcsrzjxi/editor/tables/magic_content
  - whatsapp_messages: https://app.supabase.com/project/seonmgpsyyzbpcsrzjxi/editor/tables/whatsapp_messages
  - booking_analytics: https://app.supabase.com/project/seonmgpsyyzbpcsrzjxi/editor/tables/booking_analytics
  - agent_runs: https://app.supabase.com/project/seonmgpsyyzbpcsrzjxi/editor/tables/agent_runs

### Payment Processing

#### Stripe (Fallback Processor & Webhook Config)
- **Dashboard:** https://dashboard.stripe.com
- **Webhooks:** https://dashboard.stripe.com/webhooks
- **Logs:** https://dashboard.stripe.com/logs
- **Test Cards:** https://stripe.com/docs/testing
- **API Keys:** https://dashboard.stripe.com/apikeys
- **Webhook Setup:**
  - URL: `https://lina-point-ai-ecosystem.vercel.app/api/stripe/webhook`
  - Events: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded

#### Square (Primary Processor)
- **Dashboard:** https://squareup.com/dashboard
- **API Keys:** https://squareup.com/developer/dashboard/applications
- **Payment Settings:** https://squareup.com/dashboard/settings/payment-methods
- **Test Mode:** Enabled (use test credentials)

### Messaging & Communication

#### Twilio (WhatsApp)
- **Console:** https://console.twilio.com
- **WhatsApp Sandbox:** https://console.twilio.com/sms/whatsapp
- **Webhook Setup:**
  - URL: `https://lina-point-ai-ecosystem.vercel.app/api/whatsapp-webhook`
  - Method: POST
- **Sandbox Number:** +1336-999-6930
- **Messages:**
  - Logs: https://console.twilio.com/logs/sms
  - Conversations: https://console.twilio.com/conversations

#### n8n (Workflow Automation)
- **Dashboard:** https://overwater.app.n8n.cloud
- **Login:** See environment variable N8N_ACCOUNT
- **Webhook Trigger:** https://overwater.app.n8n.cloud/webhook/lina-magic-trigger
- **Secret:** `awXtklQ7GqAInNxd3E1CSF4e8rBmOiuj`

### AI & External Services

#### Grok API
- **API Key:** `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`
- **Documentation:** https://docs.grok.ai

#### GitHub Repository
- **Repo:** https://github.com/overwaterbz/lina-point-ai-ecosystem
- **Branch:** main
- **Latest Commit:** Check locally with `git log`

---

## 🔑 Environment Variables

### Public Variables (Visible in Browser)
```
NEXT_PUBLIC_SUPABASE_URL=https://seonmgpsyyzbpcsrzjxi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb25tZ3BzeXl6YnBjc3J6anhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE4Njk4OTgsImV4cCI6MjAzNzQ0NTg5OH0.1xHz3h9bHPHLIyR2pYPUmN-D7MZ7Z1h8C3VcL5Z5Xfc
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51QXYVZKVxZL8jN0YXsP0vQ1rS2tU3vW4xY5zABbB7cC8dD9eE0fF1gG2hH3iI4jJ5kK6lL7mM
```

### Secret Variables (Server-Only)
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb25tZ3BzeXl6YnBjc3J6anh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMTg2OTg5OCwiZXhwIjoyMDM3NDQ1ODk4fQ.q_L3W0Yr_DTzf5L8vRw-H8J-RG1YhN2H7f0VT8L7x9Y
TWILIO_ACCOUNT_SID=AC96cc3a8fb6e67d2a9c7f9e3e8e4e3e3
TWILIO_AUTH_TOKEN=9b6d8e4c2f1a8e5d3b7c9f2e1a6d8b4c
TWILIO_PHONE_NUMBER=+13369996930
SQUARE_APPLICATION_ID=sq0idp-2hjvMvHztqoZ1bVdoaYDCQ
SQUARE_ACCESS_TOKEN=sq0atp-xKL5hX7YJ8mN9pQ2r3sT4u5V
STRIPE_SECRET_KEY=sk_test_51QXYVZKVxZL8jN0YXsP0vQ1rS2tU3vW4xY5zA6bB7cC8dD9eE0fF1gG2hH3iI4jJ5kK6lL7mM
STRIPE_WEBHOOK_SECRET=whsec_test_xxx
GROK_API_KEY=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
ADMIN_EMAILS=rick@pointenterprise.com,rick@linapoint.com
CRON_SECRET=AwXtklQ7GqAInNxd3E1CSF4e8rBmOiuj
N8N_WEBHOOK_SECRET=awXtklQ7GqAInNxd3E1CSF4e8rBmOiuj
N8N_WEBHOOK_URL=https://overwater.app.n8n.cloud/webhook/lina-magic-trigger
```

---

## 🧪 API Endpoints (All Live)

### Public Endpoints
- `GET /` - Homepage
- `GET /auth/login` - Login page
- `GET /auth/signup` - Signup page
- `GET /booking` - Booking page
- `GET /api/test-magic` - Test magic content generation
- `GET /api/check-events` - Check events
- `GET /api/magic/list` - List magic content

### Protected Endpoints (Require Auth)
- `GET /admin/dashboard` - Admin dashboard (restricted to ADMIN_EMAILS)
- `GET /dashboard` - User dashboard
- `GET /dashboard/magic` - Magic content dashboard
- `GET /dashboard/profile` - User profile

### Payment Endpoints
- `POST /api/stripe/create-payment-intent` - Create payment
- `POST /api/stripe/webhook` - Stripe webhook receiver

### Messaging Endpoints
- `POST /api/whatsapp-webhook` - WhatsApp webhook receiver
- `POST /api/whatsapp-proactive` - Send proactive WhatsApp

### Automation Endpoints
- `POST /api/trigger-n8n` - Trigger n8n workflow
- `GET /api/cron/send-proactive-messages` - Daily cron job (6 PM UTC)

### Testing & Debug Endpoints
- `POST /api/test-booking` - Test booking flow
- `GET /api/debug/booking-status` - Debug booking status
- `POST /api/gen-magic-content` - Generate magic content
- `POST /api/analyze-profile` - Analyze user profile
- `POST /api/book-flow` - Booking workflow

---

## 🧪 Test Credit Card Numbers

### Square (Primary)
- **Number:** 4111 1111 1111 1111
- **Expiry:** 12/25
- **CVC:** 123
- **Status:** Test mode enabled

### Stripe (Fallback)
- **Number:** 4242 4242 4242 4242
- **Expiry:** 04/25  
- **CVC:** 242
- **Status:** Test mode enabled

### International Test Cards
- **Visa:** 4000 0000 0000 0002
- **Mastercard:** 5555 5555 5555 4444
- **Amex:** 3782 822463 10005

---

## 📞 Contact & Support

### Admin Accounts
- Email 1: `rick@pointenterprise.com`
- Email 2: `rick@linapoint.com`
- Password: Check your email for reset link

### Support Services
- **Vercel Support:** https://vercel.com/support
- **Supabase Support:** https://supabase.com/support
- **Stripe Support:** https://support.stripe.com
- **Twilio Support:** https://www.twilio.com/help/contact

---

## 📊 Deployment Status

| Component | Status | Last Updated |
|-----------|--------|--------------|
| Build | ✅ Passing | Feb 17, 2026 |
| Deployment | ✅ Live | Feb 17, 2026 |
| TypeScript | ✅ 0 errors | Feb 17, 2026 |
| App Version | 0.1.0 | - |
| Node.js | 18.x | Latest |
| Next.js | 16.1.6 | Latest |
| React | 19 | Latest |

---

## 🎯 Quick Action Links

1. **Add Env Vars:** https://vercel.com/rick-jennings-projects/lina-point-ai-ecosystem/settings/environment-variables
2. **Configure Stripe:** https://dashboard.stripe.com/webhooks
3. **Configure Twilio:** https://console.twilio.com/sms/whatsapp
4. **Configure n8n:** https://overwater.app.n8n.cloud
5. **Check Logs:** https://vercel.com/rick-jennings-projects/lina-point-ai-ecosystem/logs
6. **View Database:** https://app.supabase.com/project/seonmgpsyyzbpcsrzjxi
7. **Test App:** https://lina-point-ai-ecosystem.vercel.app

---

## 📚 Documentation Files in Repo

- `DEPLOYMENT_CONFIG.md` - Full configuration guide
- `PHASE2_ACTION_PLAN.md` - Day-by-day action items
- `DEPLOYMENT_COMPLETE_SUMMARY.md` - This deployment summary
- `QUICK_REFERENCE.md` - This file
- `test-deployment.ps1` - Endpoint testing script
- `test-webhooks.sh` - Webhook testing script
- `README.md` - Project overview
- `BOOKING_SYSTEM.md` - Booking logic
- `ARCHITECTURE.md` - System architecture

---

**Created:** February 17, 2026  
**Status:** ✅ Phase 1 Complete | ⏳ Phase 2 Ready  
**Next:** Add environment variables to Vercel (See **Quick Action Links** above)
