# n8n Secret Rotation Guide

## 🔐 Security Update Required

After removing hardcoded n8n credentials from the codebase, you must rotate the secret and update deployment configuration.

---

## Step 1: Rotate n8n Secret

### Access n8n Dashboard
1. Go to: https://overwater.app.n8n.cloud/
2. Log in with your credentials

### Update Webhook Security
3. Navigate to your workflow: **"lina-magic-trigger"**
4. Find the Webhook node in the workflow
5. Update the authentication settings:
   - Generate a new secret/authentication token
   - **Important**: Use a strong, unique value (min 32 characters)
   - Recommended: Use a password manager to generate

### Example Strong Secret Generation
```bash
# PowerShell (Windows)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Or use: https://www.random.org/passwords/?num=1&len=32&format=plain
```

6. **Save the workflow** in n8n

---

## Step 2: Update Local Environment

### Edit Local .env.local
```bash
# Open in VS Code
code .env.local
```

### Add/Update These Variables
```env
# n8n Integration
N8N_WEBHOOK_URL=https://overwater.app.n8n.cloud/webhook/lina-magic-trigger
N8N_SECRET=your-new-secret-here-32-chars-minimum
```

**Note**: `.env.local` is gitignored and never committed.

---

## Step 3: Update Vercel Environment Variables

### Via Vercel Dashboard
1. Go to: https://vercel.com/your-team/lina-point-nextjs/settings/environment-variables
2. Add or update these variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `N8N_WEBHOOK_URL` | `https://overwater.app.n8n.cloud/webhook/lina-magic-trigger` | Production, Preview, Development |
| `N8N_SECRET` | `<your-new-secret>` | Production, Preview, Development |

### Via Vercel CLI (Alternative)
```bash
# Install if needed
npm i -g vercel

# Set production variable
vercel env add N8N_SECRET production

# Set preview variable
vercel env add N8N_SECRET preview

# Set development variable  
vercel env add N8N_SECRET development
```

3. **Redeploy** your application for changes to take effect

---

## Step 4: Test the Integration

### Test n8n Webhook Locally
```bash
# Run dev server
npm run dev

# In another terminal, test with dotenv
node -r dotenv/config test-autonomy.ts
```

### Test on Vercel
```bash
# Trigger a test workflow via your deployed API
curl -X POST https://your-app.vercel.app/api/trigger-n8n \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Verify in n8n
1. Check workflow execution history in n8n dashboard
2. Confirm webhook is receiving authenticated requests
3. Verify unauthorized requests are rejected

---

## Step 5: Update Dependent Services

### If using n8n webhook in other places:
- [ ] Update any external systems calling this webhook
- [ ] Update documentation with new security requirements
- [ ] Verify all API consumers have updated credentials

---

## Security Checklist

After rotation, verify:
- [x] Old secret removed from codebase (completed in commit 231b8b6)
- [ ] New secret is strong and unique (min 32 characters)
- [ ] n8n workflow updated and saved
- [ ] Local `.env.local` has new secret
- [ ] Vercel env vars updated (all environments)
- [ ] Application redeployed on Vercel
- [ ] Test successful with new credentials
- [ ] Old secret confirmed non-functional
- [ ] Secret stored in password manager (recommended)

---

## Troubleshooting

### "Webhook authentication failed"
- Verify `N8N_SECRET` matches exactly in:
  - n8n workflow webhook node
  - Vercel environment variables
  - Local `.env.local`

### "Cannot find N8N_SECRET"
- Check API route at [src/app/api/trigger-n8n/route.ts](src/app/api/trigger-n8n/route.ts)
- Supports both `N8N_SECRET` and `N8N_WEBHOOK_SECRET` (legacy)

### Vercel deployment not using new variables
- Redeploy after updating env vars: `vercel --prod`
- Or trigger redeploy from Vercel dashboard

---

## Related Files

- [test-autonomy.ts](test-autonomy.ts) - Test script (now uses env vars)
- [.env.example](.env.example) - Template with all required vars
- [src/app/api/trigger-n8n/route.ts](src/app/api/trigger-n8n/route.ts) - API endpoint
- [SECRET_SCANNING.md](SECRET_SCANNING.md) - Prevents future hardcoded secrets

---

**Last Updated**: February 17, 2026  
**Security Status**: 🟡 Pending rotation (old secret exposed in git history)
