# Secret Scanning Setup

This project uses [detect-secrets](https://github.com/Yelp/detect-secrets) to prevent accidental commits of sensitive information.

## How It Works

- **Pre-commit Hook**: Automatically scans staged files before each commit
- **Baseline**: `.secrets.baseline` contains known/approved secrets (hashed)
- **Blocking**: Commits are rejected if new secrets are detected

## Installation

The pre-commit hook is already configured in `.git/hooks/pre-commit`. If you need to reinstall detect-secrets:

```bash
pip install detect-secrets
```

## Usage

### Normal Commits
Just commit as usual. The hook runs automatically:
```bash
git add .
git commit -m "your message"
```

### If Secrets Are Detected

**Option 1: Remove the secret**
- Replace hardcoded secrets with environment variables
- Use `.env.local` (already ignored by `.gitignore`)

**Option 2: False positive - Add inline comment**
```typescript
const apiKey = "test-key-12345"; // pragma: allowlist secret
```

**Option 3: Update baseline (if legitimate)**
```bash
python -m detect_secrets scan --baseline .secrets.baseline
git add .secrets.baseline
```

## Manual Scan

Scan the entire repository:
```bash
python -m detect_secrets scan
```

Scan specific files:
```bash
python -m detect_secrets scan src/my-file.ts
```

## Audit Baseline

Review all detected secrets in the baseline:
```bash
python -m detect_secrets audit .secrets.baseline
```

## Best Practices

1. **Never commit real secrets** - Use environment variables
2. **Use `.env.local`** for local secrets (already gitignored)
3. **Add Vercel env vars** in dashboard for production
4. **Rotate secrets** if accidentally committed
5. **Review baseline** periodically with `audit` command

## Bypass (Emergency Only)

If you must bypass the hook (not recommended):
```bash
git commit --no-verify -m "emergency fix"
```

## Environment Variables

Required env vars (add to `.env.local` and Vercel):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GROK_API_KEY`
- `N8N_WEBHOOK_URL`
- `N8N_SECRET`
- `STRIPE_SECRET_KEY`
- `TWILIO_AUTH_TOKEN`
- And others in `.env.example`

## Troubleshooting

**Hook not running**
```bash
# Check hook exists and is executable
ls -la .git/hooks/pre-commit
```

**detect-secrets not found**
```bash
pip install detect-secrets
# Or add Python Scripts to PATH
```

**Too many false positives**
Edit `.secrets.baseline` and exclude specific patterns, or use inline comments.
