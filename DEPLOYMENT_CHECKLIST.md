# ✅ Deployment Progress Tracker

**Use this to track your deployment progress step-by-step**

---

## Phase 1: Preparation (30 min)

### Gather Credentials
- [ ] Supabase URL copied
- [ ] Supabase Anon Key copied
- [ ] Supabase Service Role Key copied
- [ ] Generated CRON_SECRET (32 chars)
- [ ] Generated new N8N_SECRET (32 chars)
- [ ] Twilio Account SID copied
- [ ] Twilio Auth Token copied
- [ ] Twilio WhatsApp number copied
- [ ] Stripe Secret Key copied
- [ ] Stripe Publishable Key copied
- [ ] Grok/OpenAI API Key copied (optional)
- [ ] Admin emails listed
- [ ] All credentials saved in password manager

---

## Phase 2: n8n Secret Rotation (10 min)

- [ ] Logged into n8n dashboard (https://overwater.app.n8n.cloud/)
- [ ] Found "lina-magic-trigger" workflow
- [ ] Updated webhook authentication with new N8N_SECRET
- [ ] Saved n8n workflow
- [ ] Copied n8n webhook URL
- [ ] Tested n8n webhook with curl (optional)
- [ ] Verified old secret no longer works

---

## Phase 3: Vercel Setup (15 min)

### Install & Login
- [ ] Installed Vercel CLI: `npm install -g vercel`
- [ ] Logged in: `vercel login`
- [ ] Verified login successful

### Deploy Project
- [ ] Navigated to project directory
- [ ] Linked project: `vercel link`
- [ ] Initial deployment: `vercel`
- [ ] Copied preview URL
- [ ] Verified site loads (expected: API errors due to missing env vars)

---

## Phase 4: Configure Environment Variables (20 min)

### Core Variables (Required)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `N8N_WEBHOOK_URL`
- [ ] `N8N_SECRET`
- [ ] `CRON_SECRET`
- [ ] `ADMIN_EMAILS`

### Twilio Variables (If using WhatsApp)
- [ ] `TWILIO_ACCOUNT_SID`
- [ ] `TWILIO_AUTH_TOKEN`
- [ ] `TWILIO_WHATSAPP_NUMBER`

### Stripe Variables (If using payments)
- [ ] `STRIPE_SECRET_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### AI Variables (Recommended)
- [ ] `GROK_API_KEY` or `OPENAI_API_KEY`

### Redeploy
- [ ] Redeployed to production: `vercel --prod`
- [ ] Copied production URL
- [ ] Verified deployment successful

---

## Phase 5: Configure Webhooks (15 min)

### Stripe Webhook
- [ ] Logged into Stripe dashboard
- [ ] Navigated to Webhooks section
- [ ] Added new endpoint: `https://[your-app].vercel.app/api/stripe/webhook`
- [ ] Selected required events (payment_intent.succeeded, etc.)
- [ ] Copied webhook signing secret (whsec_...)
- [ ] Added `STRIPE_WEBHOOK_SECRET` to Vercel
- [ ] Redeployed: `vercel --prod`
- [ ] Tested webhook (optional)

### Twilio Webhook
- [ ] Logged into Twilio console
- [ ] Navigated to WhatsApp settings
- [ ] Set webhook URL: `https://[your-app].vercel.app/api/whatsapp-webhook`
- [ ] Set method to POST
- [ ] Saved configuration
- [ ] Sent test WhatsApp message
- [ ] Verified message received in logs

### Vercel Cron Job
- [ ] Verified cron job visible in Vercel dashboard
- [ ] Checked schedule: `0 18 * * *` (6 PM UTC)
- [ ] Status shows "Active"
- [ ] Tested cron endpoint manually with CRON_SECRET

---

## Phase 6: Testing & Verification (10 min)

### Authentication
- [ ] Visited signup page
- [ ] Created test account
- [ ] Received verification email
- [ ] Verified email
- [ ] Logged in successfully
- [ ] Protected routes work correctly

### API Endpoints
- [ ] Tested `/api/check-events` - Returns JSON
- [ ] Tested `/api/trigger-n8n` - Success response
- [ ] Tested `/api/magic/list` - Returns data or empty array

### Booking Flow (If applicable)
- [ ] Submitted test booking
- [ ] Price comparison appeared
- [ ] Tour recommendations generated
- [ ] Magic content generated (if opted in)
- [ ] Payment flow initiated (if Stripe configured)

### WhatsApp (If applicable)
- [ ] Sent WhatsApp message
- [ ] Message logged in Vercel
- [ ] Response sent back (if configured)

### Monitoring
- [ ] Opened Vercel logs: `vercel logs --prod --follow`
- [ ] No 500 errors appearing
- [ ] Database connections successful
- [ ] API responses completing

---

## Phase 7: Post-Deployment (Ongoing)

### Day 1
- [ ] Monitor logs for first 24 hours
- [ ] Test all critical user flows
- [ ] Verify no authentication errors
- [ ] Check database for test data

### Week 1
- [ ] Monitor daily for errors
- [ ] Verify cron job runs at 6 PM UTC
- [ ] Check Vercel Analytics
- [ ] Review performance metrics
- [ ] Test Stripe payments end-to-end (if applicable)

### Week 2
- [ ] Set up custom domain (optional)
- [ ] Configure error monitoring (Sentry)
- [ ] Set up uptime monitoring
- [ ] Review and optimize slow endpoints
- [ ] Plan performance improvements

### Ongoing Maintenance
- [ ] Check npm audit monthly
- [ ] Update dependencies quarterly
- [ ] Review security logs weekly
- [ ] Rotate secrets every 90 days
- [ ] Backup Supabase database weekly

---

## 🆘 Issue Tracker

**Track any issues you encounter**:

### Issue #1
- **Problem**: _____________________________
- **When**: _____________________________
- **Error**: _____________________________
- **Solution**: _____________________________
- **Status**: ⬜ Open | ☑️ Resolved

### Issue #2
- **Problem**: _____________________________
- **When**: _____________________________
- **Error**: _____________________________
- **Solution**: _____________________________
- **Status**: ⬜ Open | ☑️ Resolved

### Issue #3
- **Problem**: _____________________________
- **When**: _____________________________
- **Error**: _____________________________
- **Solution**: _____________________________
- **Status**: ⬜ Open | ☑️ Resolved

---

## 📊 Deployment Timeline

- **Started**: _____________________________
- **Phase 1 Complete**: _____________________________
- **Phase 2 Complete**: _____________________________
- **Phase 3 Complete**: _____________________________
- **Phase 4 Complete**: _____________________________
- **Phase 5 Complete**: _____________________________
- **Phase 6 Complete**: _____________________________
- **Deployment Live**: _____________________________

**Total Time**: __________ minutes

---

## 🎉 Success Criteria

- ☑️ All environment variables configured
- ☑️ n8n secret rotated and working
- ☑️ Stripe webhook configured and tested
- ☑️ Twilio webhook configured and tested
- ☑️ Authentication flow working
- ☑️ Booking flow completing end-to-end
- ☑️ Cron job scheduled and active
- ☑️ No errors in production logs
- ☑️ All tests passing

---

## 📞 Quick Help

| Issue | Solution |
|-------|----------|
| Env var not found | `vercel env add VAR_NAME` then `vercel --prod` |
| Webhook fails | Check URL, check secret, check logs |
| Build fails | Run `npm run build` locally, check logs |
| Auth not working | Verify Supabase keys, check middleware |
| Cron not running | Check CRON_SECRET, verify in dashboard |

**Full docs**: [DEPLOYMENT_WALKTHROUGH.md](DEPLOYMENT_WALKTHROUGH.md)

---

**Last Updated**: _____________________________  
**Deployed By**: _____________________________  
**Production URL**: _____________________________
