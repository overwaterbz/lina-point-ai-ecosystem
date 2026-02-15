# Render Deployment Guide for Lina Point Next.js 15

## **Quick Summary**

✅ **Recommended**: Use **Node.js Runtime** (not Docker)  
✅ **Fixed**: Downgraded `zod@^3.22.4` for LangChain compatibility  
✅ **Ready**: Dockerfile provided for future use (not needed now)

---

## **Step 1: Local Testing (DO THIS FIRST)**

Before deploying to Render, verify everything builds locally:

```powershell
# Delete node_modules and package-lock to get clean dependencies
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# Reinstall dependencies
npm install

# Build Next.js
npm run build

# Start production server locally
npm run start
```

Expected output at the end:
```
> ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

Test the app:
- Open http://localhost:3000 in your browser
- Check `/admin/dashboard` and `/dashboard/magic` pages load
- Verify no runtime errors in terminal

If build fails with dependency errors:
```powershell
npm install --legacy-peer-deps
```

---

## **Step 2: Update Render Service Configuration**

### **In Render Dashboard:**

1. Go to your service settings
2. Under **Settings** tab, scroll to **Build & Deploy**

### **A. Change Runtime (if still on Docker)**

- Look for **Runtime**: Change from "Docker" to **"Node.js"**
- Click Save

### **B. Update Build & Start Commands**

**Build Command:**
```
npm ci --legacy-peer-deps && npm run build
```

**Start Command:**
```
npm run start
```

### **C. Add/Update Environment Variables**

Under **Environment** tab, add these:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `NEXT_TELEMETRY_DISABLED` | `1` |

Then add all your existing secrets (Supabase, Stripe, Grok API key, WhatsApp tokens, etc.)

### **D. Instance Type**

- Recommended: **Standard** ($7/month) for this project
- If heavy agent processing: **Pro** ($12/month)

---

## **Step 3: Push Code to GitHub**

```powershell
cd c:\Users\rick\Documents\GitHub\lina-point-nextjs

git add .
git commit -m "fix: downgrade zod and update render config for node.js runtime"
git push origin main
```

Render will auto-detect the push and start deployment.

---

## **Step 4: Monitor Deployment Logs**

1. In Render Dashboard, go to your service
2. Click **Logs** tab
3. Watch for:

**✅ Success indicators:**
```
> Installing dependencies
> npm ci --legacy-peer-deps (in package.json scripts section)
> npm run build
> Built in XX.XXs
> Starting production server
```

**❌ Common error patterns & fixes:**

| Error | Cause | Fix |
|-------|-------|-----|
| `ERESOLVE unable to resolve dependency tree` | Peer dep conflict | Already fixed (zod@^3.22.4) |
| `OOM (out of memory)` | Build process too large | Upgrade to Pro instance |
| `Module not found` | Missing env var | Add all required env vars |
| `Cannot find property X of undefined` | Supabase connection | Check SUPABASE_URL + ANON_KEY |
| `Port already in use` | Configuration issue | Render auto-assigns PORT, don't hardcode |

---

## **Step 5: Post-Deployment Verification**

Once deployment shows "Live" ✓:

1. **Visit your app**: `https://your-service-name.onrender.com`
2. **Check logs**: Still watching for runtime errors
3. **Test key endpoints**:
   - Home page loads: `/`
   - Dashboard works: `/dashboard/magic`
   - Admin dashboard: `/admin/dashboard` (with admin auth)
   - API health: `/api/trigger-n8n` (should exist, POST returns 200)

4. **Monitor for 5 minutes**: Watch logs for any 500 errors

---

## **Step 6: Troubleshooting Common Issues**

### **Issue: Still getting Docker errors after changing runtime**

**Fix:**
1. Delete the Dockerfile from your repo (it was causing Render to use Docker runtime)
2. OR explicitly set Render to Node.js runtime in dashboard
3. Redeploy

```powershell
git rm Dockerfile .dockerignore
git commit -m "remove: docker config, using node.js runtime"
git push
```

**Note**: The Dockerfile is still in your repo for reference/future Docker deployments. Don't remove it unless you're certain.

---

### **Issue: Build succeeds but app crashes at startup**

Check logs for:
- Missing environment variables → Add to Render dashboard
- Supabase connection timeout → Check SUPABASE_URL + ANON_KEY are correct
- LangChain model load error → Check GROK_API_KEY is set

---

### **Issue: npm ci fails with conflicts**

**Temporary workaround** (if zod downgrade didn't work):
- In Render dashboard, change **Build Command** to:
```
npm install --legacy-peer-deps && npm run build
```
- This is less reliable than npm ci, so prefer npm ci after fixing package.json

---

## **Step 7: Enable Auto-Deployments (Optional)**

1. In Render, go to **Settings** → **Git**
2. Connect GitHub repo
3. Enable **Auto-deploy on push** (recommended)
4. Select branch: `main`

Now every push to main triggers automatic deployment.

---

## **Reference: Environment Variables You Need**

Copy your `.env.local` local dev vars to Render dashboard:

```
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Grok LLM
GROK_API_KEY=your-grok-key
GROK_MODEL=grok-vision-beta

# Stripe
NEXT_PUBLIC_STRIPE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# WhatsApp / Twilio
TWILIO_ACCOUNT_SID=ACxxx...
TWILIO_AUTH_TOKEN=xxx...
TWILIO_PHONE_NUMBER=+1xxx...

# n8n (if using webhook)
N8N_WEBHOOK_URL=https://your-n8n.com/webhook/...
N8N_WEBHOOK_SECRET=your-secret

# General
NODE_ENV=production
PORT=3000
NEXT_TELEMETRY_DISABLED=1
```

---

## **Next Steps**

1. ✅ Run local build test (`npm run build && npm run start`)
2. ✅ Update Render runtime to Node.js
3. ✅ Update Build/Start commands
4. ✅ Add environment variables
5. ✅ Push code to GitHub
6. ✅ Monitor logs during deployment
7. ✅ Test live endpoints after deployment

---

## **Questions?**

- **Render Docs**: https://render.com/docs/deploy-nextjs
- **Next.js-Render Integration**: https://render.com/docs/native-runtimes#next-js-support
- **LangChain Zod Issue**: zod@^3.22.4 compatible, don't upgrade without checking LangChain releases
