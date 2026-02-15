# Render Dashboard Configuration Checklist

## Before You Deploy - Complete This Checklist

### ✅ Code Changes (Already Done)
- [x] Updated `package.json` (zod@^3.22.4, dotenv@^16.4.5)
- [x] Created `.npmrc` with `legacy-peer-deps=true`
- [x] Created Dockerfile (reference only)
- [x] Created deployment guides

### ⏭️ What You Do Next in Render Dashboard

#### **Step 1: Access Your Service**
1. Go to https://dashboard.render.com
2. Find your Lina Point service
3. Click on it to open settings

#### **Step 2: Change Runtime**
- [ ] Click **Settings** tab
- [ ] Find **Runtime** dropdown (currently "Docker")
- [ ] Change to **Node.js**
- [ ] Click **Save**

#### **Step 3: Update Build & Deploy Settings**
Under **Settings** → **Build & Deploy**:

- [ ] **Build Command**: Replace with:
  ```
  npm ci --legacy-peer-deps && npm run build
  ```
  
- [ ] **Start Command**: Replace with:
  ```
  npm run start
  ```

- [ ] Click **Save**

#### **Step 4: Environment Variables**
- [ ] Click **Environment** tab
- [ ] Verify these variables exist (add if missing):
  ```
  NODE_ENV = production
  PORT = 3000
  NEXT_TELEMETRY_DISABLED = 1
  ```

- [ ] Your existing secrets should already be there:
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
  - GROK_API_KEY (or GROK_MODEL)
  - STRIPE_SECRET_KEY
  - TWILIO_ACCOUNT_SID
  - TWILIO_AUTH_TOKEN
  - TWILIO_PHONE_NUMBER
  - etc.

- [ ] If any are missing, add them

#### **Step 5: Deploy**
- [ ] Commit and push code:
  ```powershell
  git add .
  git commit -m "fix: resolve render deployment issues"
  git push origin main
  ```

- [ ] If auto-deploy is OFF, click **Deploy** button on Render dashboard
- [ ] Watch the **Logs** tab for deployment progress

---

## Monitoring Deployment

### Expected Timeline
- **0-5 sec**: Starting deployment
- **5-30 sec**: `npm ci --legacy-peer-deps` (installing dependencies)
- **30-60 sec**: `npm run build` (Next.js compilation)
- **60-90 sec**: Starting production server
- **90+ sec**: Should show "Live" ✓

### Success Indicators
Look for these in logs:
```
> npm ci --legacy-peer-deps
added XXX packages

> npm run build
> next build
> Creating an optimized production build...
> Compiled successfully

> npm run start
> ready - started server on 0.0.0.0:3000
```

### If Deployment Fails
1. Check **Logs** tab for error messages
2. Common issues:
   - Missing environment variables → Add to Environment tab
   - Build errors → Check for TypeScript/syntax errors
   - Module not found → Check dependencies installed correctly

---

## Testing After Deployment

Once "Live" ✓ appears:

1. Open your app URL (e.g., `https://your-app.onrender.com`)
2. Test key pages:
   - [ ] Home page loads
   - [ ] Dashboard works
   - [ ] Admin panel accessible
3. Check logs for any 500 errors or warnings
4. Test an API endpoint (if applicable)

---

## Rollback Plan

If deployment breaks production:

1. In Render dashboard, find **Previous Deployments**
2. Click on the working version
3. Click **Redeploy**

This reverts to the last stable version while you fix issues.

---

## Support

- **Issue?** Check `RENDER_DEPLOYMENT.md` for troubleshooting
- **Questions?** Review `RENDER_FIX_SUMMARY.md` for full context
- **Render Docs**: https://render.com/docs/deploy-nextjs
