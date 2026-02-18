# 🚀 Quick Deployment Commands

**Copy-paste reference for deploying Lina Point to Vercel**

---

## 1️⃣ Generate Secrets

```powershell
# Generate CRON_SECRET (32 chars)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Generate N8N_SECRET (32 chars)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

---

## 2️⃣ Install Vercel CLI

```powershell
npm install -g vercel
vercel login
```

---

## 3️⃣ Deploy to Vercel

```powershell
cd C:\Users\rick\Documents\GitHub\lina-point-nextjs
vercel link
vercel --prod
```

---

## 4️⃣ Add Environment Variables

### Core (Required)
```powershell
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add N8N_WEBHOOK_URL
vercel env add N8N_SECRET
vercel env add CRON_SECRET
```

### Twilio (WhatsApp)
```powershell
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_AUTH_TOKEN
vercel env add TWILIO_WHATSAPP_NUMBER
```

### Stripe (Payments)
```powershell
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET
```

### AI & Admin
```powershell
vercel env add GROK_API_KEY
vercel env add ADMIN_EMAILS
```

---

## 5️⃣ Redeploy After Adding Env Vars

```powershell
vercel --prod
```

---

## 6️⃣ View Logs

```powershell
# Follow production logs
vercel logs --prod --follow

# View last hour
vercel logs --prod --since=1h

# Specific function
vercel logs --prod src/app/api/book-flow/route.ts
```

---

## 7️⃣ Test Endpoints

### Health Check
```powershell
curl https://lina-point-nextjs.vercel.app/api/check-events
```

### n8n Integration
```powershell
curl -X POST "https://lina-point-nextjs.vercel.app/api/trigger-n8n" `
  -H "Content-Type: application/json" `
  -d '{"test": true}'
```

### Cron Endpoint
```powershell
curl -X GET "https://lina-point-nextjs.vercel.app/api/whatsapp-proactive" `
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 🔗 Quick Links

| Service | URL |
|---------|-----|
| **Vercel Dashboard** | https://vercel.com/[your-team]/lina-point-nextjs |
| **Vercel Logs** | https://vercel.com/[your-team]/lina-point-nextjs/logs |
| **Vercel Env Vars** | https://vercel.com/[your-team]/lina-point-nextjs/settings/environment-variables |
| **Vercel Cron Jobs** | https://vercel.com/[your-team]/lina-point-nextjs/settings/cron-jobs |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/[your-project] |
| **Supabase API Settings** | https://supabase.com/dashboard/project/[your-project]/settings/api |
| **n8n Workflows** | https://overwater.app.n8n.cloud/ |
| **Stripe Dashboard** | https://dashboard.stripe.com/ |
| **Stripe Webhooks** | https://dashboard.stripe.com/webhooks |
| **Twilio Console** | https://console.twilio.com/ |
| **Twilio WhatsApp** | https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn |

---

## 📋 Environment Variables Checklist

### ✅ Core (8 variables)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `N8N_WEBHOOK_URL`
- [ ] `N8N_SECRET`
- [ ] `CRON_SECRET`
- [ ] `ADMIN_EMAILS`

### ✅ Twilio WhatsApp (3 variables)
- [ ] `TWILIO_ACCOUNT_SID`
- [ ] `TWILIO_AUTH_TOKEN`
- [ ] `TWILIO_WHATSAPP_NUMBER`

### ✅ Stripe Payments (3 variables)
- [ ] `STRIPE_SECRET_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

### ✅ AI Enhancement (1-2 variables)
- [ ] `GROK_API_KEY` (recommended)
- [ ] `OPENAI_API_KEY` (alternative)

**Total Required**: 13 minimum, 16 recommended

---

## 🔧 Webhook URLs to Configure

### Stripe Webhook
```
URL: https://lina-point-nextjs.vercel.app/api/stripe/webhook
Method: POST
Events: payment_intent.succeeded, checkout.session.completed
```

### Twilio Webhook
```
URL: https://lina-point-nextjs.vercel.app/api/whatsapp-webhook
Method: POST
```

---

## 🎯 Post-Deployment Checklist

- [ ] All env vars added to Vercel (13-16 total)
- [ ] Redeployed after adding env vars
- [ ] Stripe webhook configured
- [ ] Twilio webhook configured
- [ ] n8n secret rotated
- [ ] Tested authentication flow
- [ ] Tested API endpoints
- [ ] Verified cron job scheduled
- [ ] Checked Vercel logs for errors

---

## 🆘 Quick Troubleshooting

### Env var not found
```powershell
vercel env ls               # List all vars
vercel env add VAR_NAME     # Add missing var
vercel --prod               # Redeploy
```

### Check deployment status
```powershell
vercel ls                   # List deployments
vercel inspect URL          # Inspect specific deployment
```

### View function logs
```powershell
vercel logs --prod --follow
```

### Redeploy
```powershell
vercel --prod --force       # Force new deployment
```

---

**Full Guide**: [DEPLOYMENT_WALKTHROUGH.md](DEPLOYMENT_WALKTHROUGH.md)  
**Audit Report**: [VERCEL_DEPLOYMENT_AUDIT.md](VERCEL_DEPLOYMENT_AUDIT.md)  
**n8n Rotation**: [N8N_ROTATION_GUIDE.md](N8N_ROTATION_GUIDE.md)
