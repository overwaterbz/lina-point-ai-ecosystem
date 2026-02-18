# 🚀 Lina Point - Complete Deployment Walkthrough

**Last Updated**: February 17, 2026  
**Estimated Time**: 60-90 minutes  
**Difficulty**: Intermediate

This guide walks you through every step needed to deploy your Next.js app to Vercel with all integrations configured.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:
- [ ] GitHub account with repository access
- [ ] Vercel account (free tier works) - https://vercel.com/signup
- [ ] Supabase project created - https://supabase.com
- [ ] n8n account at https://overwater.app.n8n.cloud/
- [ ] Twilio account (if using WhatsApp) - https://www.twilio.com
- [ ] Stripe account (if using payments) - https://stripe.com
- [ ] Password manager for storing secrets (recommended)

---

## 🎯 Deployment Overview

We'll complete these tasks in order:
1. ✅ Gather all credentials (30 min)
2. ✅ Rotate n8n secret (10 min)
3. ✅ Deploy to Vercel (15 min)
4. ✅ Configure environment variables (20 min)
5. ✅ Set up webhooks (15 min)
6. ✅ Test everything (10 min)

---

## Step 1: Gather Required Credentials

### 1.1 Supabase Credentials

**Navigate to**: https://supabase.com/dashboard/project/[your-project]/settings/api

**Copy these values**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Security Note**: 
- `ANON_KEY` is safe to expose publicly (it's in your frontend)
- `SERVICE_ROLE_KEY` must stay private (server-side only)

**Save these in your password manager** ✅

---

### 1.2 Generate New Secrets

#### A. Generate CRON_SECRET (for Vercel cron jobs)
Open PowerShell and run:
```powershell
# Generate 32-character random secret
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Copy output**:
```env
CRON_SECRET=xYz123AbC456DeF789GhI012JkL345Mn
```

**Save in password manager** ✅

#### B. Generate New N8N_SECRET
```powershell
# Generate 32-character random secret for n8n
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Copy output**:
```env
N8N_SECRET=AbC123XyZ456PqR789StU012VwX345Yz
```

**Save in password manager** ✅

---

### 1.3 Twilio Credentials (WhatsApp Integration)

**Navigate to**: https://console.twilio.com/

**Find these values**:
1. **Account SID**: Console Homepage → Account Info → Account SID
2. **Auth Token**: Console Homepage → Account Info → Auth Token (click "View")
3. **WhatsApp Number**: Messaging → Try it out → Send a WhatsApp message

**Copy these values**:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**⚠️ Note**: 
- If using Twilio Sandbox, use their sandbox number
- For production, you need an approved WhatsApp Business number

**Save in password manager** ✅

---

### 1.4 Stripe Credentials (Payment Integration)

**Navigate to**: https://dashboard.stripe.com/

**Find these values**:
1. **Secret Key**: Developers → API keys → Secret key (starts with `sk_`)
2. **Publishable Key**: Developers → API keys → Publishable key (starts with `pk_`)

**⚠️ Testing vs Production**:
- Use **Test Mode** keys initially (starts with `sk_test_` or `pk_test_`)
- Switch to **Live Mode** keys when ready for production

**Copy these values**:
```env
STRIPE_SECRET_KEY=sk_test_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
```

**Webhook Secret**: We'll get this in Step 5

**Save in password manager** ✅

---

### 1.5 Optional: AI API Keys

#### Grok API (for enhanced AI features)
**Navigate to**: https://x.ai/ or your AI provider

```env
GROK_API_KEY=your_grok_api_key_here
GROK_BASE_URL=https://api.x.ai/v1
```

#### OpenAI API (fallback option)
**Navigate to**: https://platform.openai.com/api-keys

```env
OPENAI_API_KEY=sk-proj-...
```

**Note**: At least one AI API key is recommended for full functionality

**Save in password manager** ✅

---

### 1.6 Admin Email Configuration

**Set your admin email(s)**:
```env
ADMIN_EMAILS=your-email@example.com,admin@yourdomain.com
```

**Save in password manager** ✅

---

## Step 2: Rotate n8n Secret

### 2.1 Access n8n Dashboard

1. Go to: https://overwater.app.n8n.cloud/
2. Log in with your credentials
3. Find your workflow: **"lina-magic-trigger"**

### 2.2 Update Webhook Node

1. Click on the **Webhook** node in your workflow
2. Find the **Authentication** section
3. Select authentication method (likely "Header Auth" or "Basic Auth")
4. Update with your new `N8N_SECRET` generated in Step 1.2.B:
   ```
   N8N_SECRET: AbC123XyZ456PqR789StU012VwX345Yz
   ```
5. **Click "Save"** at the top right

### 2.3 Copy Webhook URL

1. In the Webhook node, find the **Webhook URL**
2. It should look like: `https://overwater.app.n8n.cloud/webhook/lina-magic-trigger`
3. Copy this URL:
   ```env
   N8N_WEBHOOK_URL=https://overwater.app.n8n.cloud/webhook/lina-magic-trigger
   ```

### 2.4 Test Webhook (Optional)

Test that your webhook is accessible:
```powershell
# Test n8n webhook
curl -X POST "https://overwater.app.n8n.cloud/webhook/lina-magic-trigger" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer AbC123XyZ456PqR789StU012VwX345Yz" `
  -d '{"test": true}'
```

**Expected**: Should return a response (not a 401/403 error)

**Save URL in password manager** ✅

---

## Step 3: Deploy to Vercel

### 3.1 Install Vercel CLI

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Verify installation
vercel --version
```

### 3.2 Login to Vercel

```powershell
# Login (will open browser)
vercel login
```

Follow the browser prompts to authenticate.

### 3.3 Link Your Project

```powershell
# Navigate to project directory
cd C:\Users\rick\Documents\GitHub\lina-point-nextjs

# Link to Vercel
vercel link
```

**You'll be asked**:
1. Set up and deploy? → **Y**
2. Which scope? → Select your account/team
3. Link to existing project? → **N** (first time) or **Y** (if exists)
4. What's your project's name? → `lina-point-nextjs`
5. In which directory is your code located? → `./` (current directory)

**Output**: Project linked successfully! ✅

### 3.4 Initial Deployment (Without Env Vars)

```powershell
# Deploy to preview first
vercel

# This will deploy but some features won't work yet (env vars needed)
```

**Copy the preview URL** (e.g., `https://lina-point-nextjs-abc123.vercel.app`)

**⚠️ Expected**: Site loads but API routes fail (env vars not set yet)

---

## Step 4: Configure Vercel Environment Variables

Now we'll add all the credentials you gathered in Step 1.

### 4.1 Set Environment Variables via CLI

**Option A: Interactive Mode (Recommended for sensitive data)**

```powershell
# Add Supabase credentials
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste: https://[your-project].supabase.co
# Select: Production, Preview, Development

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste: Your anon key
# Select: Production, Preview, Development

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste: Your service role key
# Select: Production, Preview, Development

# Add n8n credentials
vercel env add N8N_WEBHOOK_URL
# Paste: https://overwater.app.n8n.cloud/webhook/lina-magic-trigger
# Select: Production, Preview, Development

vercel env add N8N_SECRET
# Paste: Your new n8n secret from Step 2
# Select: Production, Preview, Development

# Add CRON_SECRET
vercel env add CRON_SECRET
# Paste: Your generated CRON_SECRET from Step 1.2.A
# Select: Production, Preview, Development

# Add Twilio credentials (if using WhatsApp)
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_AUTH_TOKEN
vercel env add TWILIO_WHATSAPP_NUMBER
# For each: Select Production, Preview, Development

# Add Stripe credentials (if using payments)
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
# For each: Select Production, Preview, Development

# Add AI API keys (optional but recommended)
vercel env add GROK_API_KEY
# OR
vercel env add OPENAI_API_KEY

# Add admin emails
vercel env add ADMIN_EMAILS
# Paste: your-email@example.com,admin@yourdomain.com
```

---

**Option B: Vercel Dashboard (Visual Interface)**

1. Go to: https://vercel.com/[your-team]/lina-point-nextjs/settings/environment-variables

2. Click **"Add New"** for each variable:

| Variable Name | Value | Environments |
|--------------|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | ☑️ Production ☑️ Preview ☑️ Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | ☑️ Production ☑️ Preview ☑️ Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service key | ☑️ Production ☑️ Preview ☑️ Development |
| `N8N_WEBHOOK_URL` | n8n webhook URL | ☑️ Production ☑️ Preview ☑️ Development |
| `N8N_SECRET` | New n8n secret | ☑️ Production ☑️ Preview ☑️ Development |
| `CRON_SECRET` | Generated cron secret | ☑️ Production ☑️ Preview ☑️ Development |
| `TWILIO_ACCOUNT_SID` | Twilio SID | ☑️ Production ☑️ Preview ☑️ Development |
| `TWILIO_AUTH_TOKEN` | Twilio token | ☑️ Production ☑️ Preview ☑️ Development |
| `TWILIO_WHATSAPP_NUMBER` | WhatsApp number | ☑️ Production ☑️ Preview ☑️ Development |
| `STRIPE_SECRET_KEY` | Stripe secret key | ☑️ Production ☑️ Preview ☑️ Development |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe pub key | ☑️ Production ☑️ Preview ☑️ Development |
| `GROK_API_KEY` | Grok API key | ☑️ Production ☑️ Preview ☑️ Development |
| `ADMIN_EMAILS` | Comma-separated emails | ☑️ Production ☑️ Preview ☑️ Development |

3. Click **"Save"** for each

---

### 4.2 Verify Environment Variables

```powershell
# List all environment variables
vercel env ls

# Should show all variables you just added
```

**✅ Checkpoint**: All variables should be listed

---

### 4.3 Redeploy with Environment Variables

```powershell
# Redeploy to production with all env vars
vercel --prod

# Wait for deployment to complete...
```

**Copy your production URL**: `https://lina-point-nextjs.vercel.app`

---

## Step 5: Configure Webhooks

### 5.1 Configure Stripe Webhook

#### A. Create Webhook Endpoint

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. **Endpoint URL**: `https://lina-point-nextjs.vercel.app/api/stripe/webhook`
4. **Description**: "Lina Point Payment Webhook"
5. **Events to send**: Select these events:
   - ☑️ `payment_intent.succeeded`
   - ☑️ `payment_intent.payment_failed`
   - ☑️ `checkout.session.completed`
   - ☑️ `customer.subscription.created`
   - ☑️ `customer.subscription.updated`
   - ☑️ `customer.subscription.deleted`
6. Click **"Add endpoint"**

#### B. Get Webhook Signing Secret

1. Click on your newly created webhook
2. Find **"Signing secret"**
3. Click **"Reveal"**
4. Copy the value (starts with `whsec_`)

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### C. Add to Vercel

```powershell
# Add webhook secret to Vercel
vercel env add STRIPE_WEBHOOK_SECRET
# Paste the whsec_... value
# Select: Production, Preview, Development
```

#### D. Redeploy

```powershell
vercel --prod
```

**✅ Checkpoint**: Stripe webhook configured

---

### 5.2 Configure Twilio Webhook (WhatsApp)

#### A. Set Webhook URL in Twilio

1. Go to: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Or: Messaging → Settings → WhatsApp Sandbox Settings
3. Find **"When a message comes in"**
4. Set to: `https://lina-point-nextjs.vercel.app/api/whatsapp-webhook`
5. Method: **POST**
6. Click **"Save"**

#### B. Test WhatsApp Integration

1. Send a WhatsApp message to your Twilio number
2. Check Vercel logs:
   ```powershell
   vercel logs --follow
   ```
3. You should see incoming webhook requests

**✅ Checkpoint**: WhatsApp receiving messages

---

### 5.3 Configure Vercel Cron Job

**Note**: Cron jobs are automatic in Vercel based on `vercel.json`

#### Verify Cron Configuration

1. Go to: https://vercel.com/[your-team]/lina-point-nextjs/settings/cron-jobs
2. You should see:
   - **Path**: `/api/whatsapp-proactive`
   - **Schedule**: `0 18 * * *` (6 PM UTC daily)
   - **Status**: Active ✅

#### Test Cron Endpoint Manually

```powershell
# Test cron endpoint (requires CRON_SECRET)
curl -X GET "https://lina-point-nextjs.vercel.app/api/whatsapp-proactive" `
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE"

# Should return success if users have opt_in_magic enabled
```

**✅ Checkpoint**: Cron job configured and tested

---

## Step 6: Verify Everything Works

### 6.1 Test Authentication

1. Visit: `https://lina-point-nextjs.vercel.app/auth/signup`
2. Create a test account
3. Check email for verification link
4. Verify you can log in

**✅ Expected**: Auth flow works completely

---

### 6.2 Test API Endpoints

#### Test Health Check
```powershell
curl https://lina-point-nextjs.vercel.app/api/check-events
```
**Expected**: JSON response (not error)

#### Test n8n Integration
```powershell
# This tests your rotated n8n secret
curl -X POST "https://lina-point-nextjs.vercel.app/api/trigger-n8n" `
  -H "Content-Type: application/json" `
  -d '{"test": true}'
```
**Expected**: Success response from n8n

#### Test Magic Content
```powershell
curl https://lina-point-nextjs.vercel.app/api/magic/list
```
**Expected**: Empty array or list of magic content

---

### 6.3 Test Booking Flow (End-to-End)

1. Log in to your app
2. Navigate to booking page
3. Fill out booking form:
   - Room type: Deluxe
   - Check-in/out dates
   - Group size: 2
   - Budget: $500
4. Submit booking
5. Verify:
   - Price comparison appears
   - Tour recommendations generated
   - Payment intent created (if Stripe configured)

**✅ Expected**: Full booking flow completes

---

### 6.4 Test WhatsApp (Optional)

1. Send WhatsApp message to your Twilio number
2. Message should contain: "join [sandbox-code]" (if using sandbox)
3. Then send: "Hello"
4. Check Vercel logs:
   ```powershell
   vercel logs --production --follow
   ```
5. Should see webhook received and processed

**✅ Expected**: Messages logged and processed

---

### 6.5 Monitor Logs

```powershell
# Watch production logs in real-time
vercel logs --prod --follow

# Filter by function
vercel logs --prod --follow src/app/api/book-flow/route.ts
```

**Look for**:
- ✅ No 500 errors
- ✅ Successful database connections
- ✅ API calls completing
- ✅ No authentication failures

---

## Step 7: Post-Deployment Checklist

### 7.1 Security Review

- [ ] All environment variables set in Vercel (21 total)
- [ ] n8n secret rotated and verified working
- [ ] Old n8n secret confirmed non-functional
- [ ] CRON_SECRET set and cron job protected
- [ ] Stripe webhook secret configured
- [ ] Twilio webhook HTTPS only
- [ ] Admin emails configured
- [ ] Service role keys not exposed in client code

### 7.2 Functionality Review

- [ ] User signup/login works
- [ ] Protected routes redirect to login
- [ ] Booking flow completes end-to-end
- [ ] Magic content generation works
- [ ] WhatsApp messages received
- [ ] Cron job scheduled (check at 6 PM UTC)
- [ ] Stripe payments process (if applicable)
- [ ] n8n workflows trigger successfully

### 7.3 Performance Review

1. Check Vercel Analytics:
   - Go to: https://vercel.com/[your-team]/lina-point-nextjs/analytics
   - Review response times
   - Check error rates

2. Test Core Web Vitals:
   - Use: https://pagespeed.web.dev/
   - Enter your Vercel URL
   - Target scores: 90+ on all metrics

### 7.4 Database Review

1. Check Supabase Dashboard:
   - Go to: https://supabase.com/dashboard/project/[your-project]
   - Verify tables populated
   - Check RLS policies active
   - Review database logs

---

## 🎉 Deployment Complete!

### Your Live URLs

- **Production**: `https://lina-point-nextjs.vercel.app`
- **Vercel Dashboard**: `https://vercel.com/[your-team]/lina-point-nextjs`
- **Supabase Dashboard**: `https://supabase.com/dashboard/project/[your-project]`
- **n8n Dashboard**: `https://overwater.app.n8n.cloud/`

---

## 🔧 Troubleshooting

### Issue: "Environment variable not found"

**Fix**:
```powershell
# Check which env vars are set
vercel env ls

# Add missing variable
vercel env add VARIABLE_NAME

# Redeploy
vercel --prod
```

---

### Issue: "Webhook authentication failed"

**n8n webhook**:
1. Verify `N8N_SECRET` in Vercel matches n8n workflow
2. Check n8n workflow is saved
3. Test with curl command from Step 6.2

**Stripe webhook**:
1. Verify `STRIPE_WEBHOOK_SECRET` is set in Vercel
2. Check webhook URL is correct in Stripe dashboard
3. Use Stripe CLI to test:
   ```powershell
   stripe listen --forward-to https://lina-point-nextjs.vercel.app/api/stripe/webhook
   ```

**Twilio webhook**:
1. Verify webhook URL in Twilio console
2. Check Twilio signature validation in API route
3. Ensure `TWILIO_AUTH_TOKEN` is correct

---

### Issue: "Cannot connect to Supabase"

**Fix**:
1. Verify Supabase URL and keys in Vercel
2. Check Supabase project is not paused
3. Verify migrations are applied:
   ```powershell
   # If using Supabase CLI
   supabase migration list
   ```
4. Check network policies in Supabase dashboard

---

### Issue: "Cron job not running"

**Fix**:
1. Check cron job exists: https://vercel.com/[your-team]/lina-point-nextjs/settings/cron-jobs
2. Verify `CRON_SECRET` is set in Vercel
3. Check logs at scheduled time (6 PM UTC):
   ```powershell
   vercel logs --prod --since=1h
   ```
4. Manually test endpoint:
   ```powershell
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://lina-point-nextjs.vercel.app/api/whatsapp-proactive
   ```

---

### Issue: "Build failed on Vercel"

**Fix**:
1. Check build logs in Vercel dashboard
2. Verify all dependencies in `package.json`
3. Run build locally (if possible) to reproduce:
   ```powershell
   npm run build
   ```
4. Check for TypeScript errors:
   ```powershell
   npm run lint
   ```

---

## 📞 Getting Help

### Official Documentation
- **Next.js**: https://nextjs.org/docs
- **Vercel**: https://vercel.com/docs
- **Supabase**: https://supabase.com/docs
- **Stripe**: https://stripe.com/docs/webhooks
- **Twilio**: https://www.twilio.com/docs/usage/webhooks

### Project Documentation
- [VERCEL_DEPLOYMENT_AUDIT.md](VERCEL_DEPLOYMENT_AUDIT.md) - Complete audit report
- [N8N_ROTATION_GUIDE.md](N8N_ROTATION_GUIDE.md) - n8n security rotation
- [SECRET_SCANNING.md](SECRET_SCANNING.md) - Secret scanning workflow
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [.env.example](.env.example) - Environment variable reference

---

## 🎯 Next Steps

### Week 1: Monitor & Optimize
- [ ] Check Vercel logs daily
- [ ] Monitor error rates
- [ ] Verify cron job executes successfully
- [ ] Test all user flows

### Week 2: Enhancements
- [ ] Set up custom domain
- [ ] Configure Vercel Analytics
- [ ] Set up error monitoring (Sentry)
- [ ] Configure uptime monitoring

### Ongoing: Maintenance
- [ ] Review security logs weekly
- [ ] Update dependencies monthly
- [ ] Rotate secrets quarterly
- [ ] Backup database weekly
- [ ] Review performance metrics

---

**You're all set! 🚀 Your Lina Point application is now live on Vercel.**

**Questions?** Review the troubleshooting section or refer to the official documentation.

**Last Updated**: February 17, 2026
