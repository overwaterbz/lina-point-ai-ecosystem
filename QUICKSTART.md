# Quick Start Guide

Get your Supabase-powered Next.js app running in 5 minutes.

## 🚀 What's Included

✅ **Complete Authentication System** - Sign up, sign in, sign out  
✅ **Protected Routes** - Middleware-based access control  
✅ **Database Integration** - Profiles & Reservations tables with RLS  
✅ **TypeScript Support** - Full type safety throughout  
✅ **Beautiful UI** - Tailwind CSS pre-styled components  
✅ **Best Practices** - Server/Client Component separation  
✅ **Documentation** - Multiple detailed guides included  

## ⚡ 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

Installs @supabase/ssr for Next.js integration.

### 2. Get Supabase Credentials

1. Create account at https://supabase.com (free tier available)
2. Create a new project
3. Go to **Settings → API**
4. Copy your credentials:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `Anon Public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Configure Environment
```bash
# Create and edit .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here" > .env.local
```

### 4. Create Database Tables

Copy and run this SQL in Supabase **SQL Editor**:

```sql
-- Profiles Table
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  unique(user_id)
);

-- Reservations Table
create table reservations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  start_date timestamp not null,
  end_date timestamp not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Enable RLS
alter table profiles enable row level security;
alter table reservations enable row level security;

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on profiles for select using (auth.uid() = user_id);
create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = user_id);
create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = user_id);

-- RLS Policies for reservations
create policy "Users can view their own reservations"
  on reservations for select using (auth.uid() = user_id);
create policy "Users can insert their own reservations"
  on reservations for insert with check (auth.uid() = user_id);
create policy "Users can update their own reservations"
  on reservations for update using (auth.uid() = user_id);
create policy "Users can delete their own reservations"
  on reservations for delete using (auth.uid() = user_id);
```

### 5. Run Your App
```bash
npm run dev
```

Open http://localhost:3000 in your browser. ✅ Done!

---

## 📍 Key URLs

- **Home:** http://localhost:3000
- **Sign Up:** http://localhost:3000/auth/signup
- **Sign In:** http://localhost:3000/auth/login
- **Dashboard:** http://localhost:3000/dashboard (protected)

## 🎯 Test the System

1. **Sign Up** → Enter email, password, full name
2. **Verify** → Check email for confirmation link (or skip if not enabled)
3. **Sign In** → Use your credentials to log in
4. **Dashboard** → See your profile information
5. **Sign Out** → Logged out and redirected

---

## 📁 Project Structure

```
src/
├── lib/supabase.ts            ← Client initialization
├── types/supabase.ts          ← TypeScript types
├── hooks/useAuth.ts           ← Auth hook
├── components/
│   ├── AuthForm.tsx           ← Login/Signup form
│   └── ProtectedRoute.tsx     ← Protected wrapper
└── app/
    ├── auth/
    │   ├── login/page.tsx     ← Sign in page
    │   ├── signup/page.tsx    ← Sign up page
    │   └── verify-email/page.tsx
    ├── dashboard/page.tsx     ← Protected dashboard
    ├── layout.tsx             ← Root layout
    └── page.tsx               ← Home page
```

---

## 💻 Common Usage

### Use Auth in Your Component
```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';

export function MyComponent() {
  const { user, profile, signOut } = useAuth();

  return (
    <div>
      <p>Welcome, {user?.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Protect a Route with Middleware
Routes are automatically protected! Any route outside `/auth` requires login.

To make a route public, add it to `PUBLIC_ROUTES` in `middleware.ts`

### Create Data (Server Action)
```tsx
'use server';

import { createServerSupabaseClient } from '@/lib/supabase';

export async function createReservation(data: any) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  return supabase
    .from('reservations')
    .insert({ ...data, user_id: user.id });
}
```

---

## 📚 Documentation Files

Start here based on your needs:

1. **SETUP_CHECKLIST.md** - Detailed step-by-step setup (start here!)
2. **SUPABASE_INTEGRATION.md** - Complete integration guide
3. **ARCHITECTURE.md** - How everything works (data flows, diagrams)
4. **USAGE_PATTERNS.md** - Code examples & patterns
5. **INTEGRATION_SUMMARY.md** - What was created

---

## 🆘 Troubleshooting

### "Can't sign up"
- Check environment variables in `.env.local`
- Verify tables created in Supabase
- Check Supabase → Authentication → Settings

### "Middleware keeps redirecting to login"
- Make sure you're signed in (no valid session)
- Check cookies in browser DevTools
- Clear browser cache and try again

### "Profile not showing on dashboard"
- Check if profile was created in `profiles` table
- Verify RLS policies are correct
- Check Supabase logs

### "Database queries failing"
- Verify table names and column names
- Check RLS policies allow the operation
- Ensure user_id matches authenticated user

See **SETUP_CHECKLIST.md** troubleshooting section for more help.

---

## 🔐 Security Notes

✅ Public keys (`NEXT_PUBLIC_*`) can be exposed  
✅ Session stored in secure HTTP-only cookies  
✅ RLS policies protect database from unauthorized access  
✅ Never expose `SUPABASE_SERVICE_ROLE_KEY` to frontend  
✅ Always validate input on server-side  

---

## 🚀 Next Steps

1. ✅ Setup complete!
2. Customize styling and branding
3. Add more database tables as needed
4. Build your features using `useAuth()` hook
5. Deploy to Vercel or your hosting
6. Set up OAuth providers (optional)

---

## 📞 Support

- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **TypeScript Docs:** https://www.typescriptlang.org/docs
- **Tailwind Docs:** https://tailwindcss.com/docs

---

## 📋 Minimum Requirements

- Node.js 18+
- npm or yarn
- Supabase account (free)
- Modern web browser
- 5 minutes of your time ⏱️

---

## ✨ You're Ready!

Your application is now ready with:
- Secure authentication
- Protected routes
- Database for users & reservations
- Beautiful UI components
- Production-ready code

**Happy building!** 🎉

---

**Questions?** Check the other documentation files or visit Supabase support.
