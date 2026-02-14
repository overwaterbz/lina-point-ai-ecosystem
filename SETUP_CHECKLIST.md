# Setup Checklist ✓

Complete checklist for setting up your Supabase integration. Follow these steps to get your authentication system running.

## Phase 1: Prerequisites

- [ ] Node.js 18+ installed
- [ ] npm or yarn package manager
- [ ] Supabase account created at https://supabase.com
- [ ] A Supabase project created and initialized

## Phase 2: Project Setup

- [ ] Run `npm install` to install all dependencies (including @supabase/ssr)
- [ ] Verify `lib/supabase.ts` exists with browser/server clients
- [ ] Verify `types/supabase.ts` exists with TypeScript types
- [ ] Verify all hook and component files are created in `src/`

## Phase 3: Environment Configuration

### Get Credentials from Supabase

1. [ ] Log in to your Supabase project
2. [ ] Go to **Settings → API** in the sidebar
3. [ ] Copy **Project URL** → paste to `NEXT_PUBLIC_SUPABASE_URL`
4. [ ] Copy **Anon (public)** key → paste to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. [ ] (Optional) Copy **Service Role Secret** → `SUPABASE_SERVICE_ROLE_KEY`

### Create Environment File

```bash
# From project root:
cp .env.example .env.local
```

Update `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] `.env.local` file created and filled with credentials
- [ ] Environment variables are NOT committed to git (check .gitignore)

## Phase 4: Database Setup

### Create Tables in Supabase

1. [ ] Go to your Supabase project dashboard
2. [ ] Click **SQL Editor** in the sidebar
3. [ ] Click **+ New Query**
4. [ ] Copy SQL from `SUPABASE_INTEGRATION.md` section "Create Database Tables"

#### Profiles Table
- [ ] Run SQL to create `profiles` table
- [ ] Verify table appears in **Tables** view
- [ ] Check columns: id, user_id, full_name, avatar_url, bio, created_at, updated_at

#### Reservations Table
- [ ] Run SQL to create `reservations` table
- [ ] Verify table appears in **Tables** view
- [ ] Check columns: id, user_id, title, description, start_date, end_date, status, created_at, updated_at

### Enable Row Level Security (RLS)

1. [ ] For `profiles` table:
   - [ ] Click the table in **Tables** view
   - [ ] Go to **RLS** tab
   - [ ] Click **Enable RLS**
   - [ ] Run the provided RLS policies from `SUPABASE_INTEGRATION.md`

2. [ ] For `reservations` table:
   - [ ] Repeat RLS setup with provided policies

- [ ] RLS policies created and verified for `profiles`
- [ ] RLS policies created and verified for `reservations`

## Phase 5: Authentication Configuration

### Update Auth Settings (Optional but Recommended)

1. [ ] Go to **Authentication** → **Providers** in sidebar
2. [ ] Verify **Email** is enabled
3. [ ] (Optional) Set up **Email Confirmations**:
   - [ ] Go to **Settings** → **Auth**
   - [ ] Enable "Confirm email" if you want email verification

### Configure Email Templates (Optional)

- [ ] Go to **Emailing** in auth settings
- [ ] Customize **Confirmation**, **Recovery**, and **Invite** email templates
- [ ] Add your app name and branding to emails

## Phase 6: Local Testing

1. [ ] Start development server:
   ```bash
   npm run dev
   ```

2. [ ] Access application:
   - [ ] Home page: http://localhost:3000
   - [ ] All links and navigation working

3. [ ] Test Authentication Flow:
   - [ ] Sign Up: Navigate to `/auth/signup`
   - [ ] Create test account with email/password
   - [ ] Verify success message
   - [ ] Check email for confirmation (if enabled)
   - [ ] Navigate to `/auth/verify-email` page
   
4. [ ] Test Sign In:
   - [ ] Navigate to `/auth/login`
   - [ ] Sign in with test account
   - [ ] Verify redirected to `/dashboard`
   - [ ] Verify user email displayed on dashboard
   - [ ] Check browser DevTools → Application → Cookies
     - [ ] `sb-*` cookies present for session

5. [ ] Test Protected Routes:
   - [ ] Try accessing `/dashboard` while signed in ✓
   - [ ] Sign out and try accessing `/dashboard` - should redirect to `/auth/login` ✓

6. [ ] Check Supabase Dashboard:
   - [ ] Go to **Table Editor**
   - [ ] Verify new user in `auth.users` table
   - [ ] Verify profile created in `profiles` table
   - [ ] Verify correct relationship between tables

- [ ] Sign up flow works
- [ ] Sign in flow works
- [ ] Protected routes redirect correctly
- [ ] Email verification page displays
- [ ] Dashboard shows user information
- [ ] Sign out clears session

## Phase 7: Database Verification

1. [ ] Create a test reservation:
   - [ ] From dashboard, create a sample reservation
   - [ ] Go to Supabase **Table Editor**
   - [ ] View `reservations` table
   - [ ] Verify new record with correct user_id

- [ ] Databases populated correctly with auth process
- [ ] user_id Foreign keys working correctly
- [ ] RLS policies allowing/denying access as expected

## Phase 8: Code Quality & Best Practices

- [ ] All`.ts` and `.tsx` files have proper TypeScript types
- [ ] No `any` types without justification
- [ ] All `useAuth()` hooks used in `'use client'` components
- [ ] All server operations in `'use server'` functions
- [ ] Error handling implemented for auth operations
- [ ] Loading states shown to user
- [ ] Sensitive operations use server actions
- [ ] Middleware protecting intended routes

## Phase 9: Documentation Review

- [ ] Read `INTEGRATION_SUMMARY.md` - understand what was created
- [ ] Read `SUPABASE_INTEGRATION.md` - complete setup guide
- [ ] Read `ARCHITECTURE.md` - understand data flows
- [ ] Read `USAGE_PATTERNS.md` - learn how to use system
- [ ] Read `SUPABASE_SETUP.md` - quick reference

## Phase 10: Production Preparation

- [ ] Update `metadata` in `src/app/layout.tsx` with your app name
- [ ] Update home page styling and copy
- [ ] Add your logo and branding
- [ ] Test on mobile devices
- [ ] Run TypeScript compiler: `npx tsc --noEmit`
- [ ] Run linter: `npm run lint`
- [ ] Run build: `npm run build`
- [ ] Verify no build errors or warnings

## Phase 11: Deployment Configuration

### For Vercel (Recommended for Next.js)

1. [ ] Push code to GitHub repository
2. [ ] Connect Vercel to GitHub
3. [ ] Set environment variables in Vercel:
   - [ ] `NEXT_PUBLIC_SUPABASE_URL`
   - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - [ ] `SUPABASE_SERVICE_ROLE_KEY` (if using server operations)
4. [ ] Deploy!

### Additional Deployment Steps

- [ ] Configure CORS in Supabase (if needed)
- [ ] Update email sender in Supabase
- [ ] Use production Supabase URL/keys in `.env.local`
- [ ] Set up monitoring/logging
- [ ] Test full auth flow on deployed site

## Phase 12: Advanced Features (Optional)

- [ ] Implement OAuth providers (Google, GitHub, etc.)
- [ ] Add database backups
- [ ] Set up automated tests
- [ ] Add analytics
- [ ] Implement password reset flow
- [ ] Add multi-factor authentication
- [ ] Create admin panel
- [ ] Add user profile editing
- [ ] Implement notifications

## Phase 13: Maintenance & Monitoring

- [ ] Set up Supabase monitoring
- [ ] Configure error logging
- [ ] Monitor authentication metrics
- [ ] Review RLS policies regularly
- [ ] Keep dependencies updated
- [ ] Regular security audits
- [ ] Test disaster recovery procedures

## Troubleshooting Checklist

If something isn't working, check:

- [ ] Environment variables correct and loaded
- [ ] No typos in `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Tables created and RLS enabled
- [ ] Email verification settings correct (in Supabase)
- [ ] Browser cookies enabled
- [ ] Clear browser cache and try again
- [ ] Check browser console for errors (F12)
- [ ] Check Supabase logs for backend errors
- [ ] Verify user exists in Supabase auth dashboard
- [ ] Verify profile exists in profiles table
- [ ] Middleware not blocking auth pages

## Quick Reference Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run TypeScript check
npx tsc --noEmit

# Run ESLint
npm run lint

# Build for production
npm run build

# Start production server
npm start

# View Supabase user data
# Dashboard → Table Editor → auth.users
```

## Files Created/Modified

### Created:
- `lib/supabase.ts` - Client initialization
- `types/supabase.ts` - TypeScript types
- `hooks/useAuth.ts` - Auth hook
- `components/AuthForm.tsx` - Auth form
- `components/ProtectedRoute.tsx` - Protected route wrapper
- `app/auth/*/page.tsx` - Auth pages
- `app/dashboard/page.tsx` - Dashboard
- `app/actions.ts` - Server actions
- `middleware.ts` - Route protection
- Documentation files

### Modified:
- `package.json` - Added @supabase/ssr
- `app/layout.tsx` - Updated metadata
- `app/page.tsx` - Updated home page

## Getting Help

- 📚 [Supabase Docs](https://supabase.com/docs)
- 📚 [Next.js Docs](https://nextjs.org/docs)
- 💬 [Supabase Community](https://discord.supabase.com)
- 🐛 [Supabase Issues](https://github.com/supabase/supabase/issues)

---

## Status

When all items are checked, your Supabase integration is complete! 🎉

**Date Completed:** ________________  
**Notes:** _________________________________________________________________

---

**Next Steps After Setup:**
1. Start building your app features
2. Expand database schema as needed
3. Add more authentication methods
4. Deploy to production
5. Monitor and maintain
