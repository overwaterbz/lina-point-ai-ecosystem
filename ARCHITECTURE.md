# Architecture & Data Flow

## Authentication Flow Diagram

```
User Sign Up Flow:
┌─────────────┐
│  Signup     │
│  Page       │──┐
└─────────────┘  │
                 ▼
         ┌──────────────────┐
         │   AuthForm.tsx   │
         │  (Client-side)   │
         └────────┬─────────┘
                  │
    useAuth().signUp(email, password)
                  │
                  ▼
         ┌──────────────────┐
         │ Supabase Auth    │
         │ (Sign Up User)   │
         └────────┬─────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
    Success            Error Shown
        │               to User
        ▼
  ┌──────────────────┐
  │ Create Profile   │
  │ in DB (Insert)   │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Send Confirm     │
  │ Email            │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Verify Email     │
  │ Page             │
  └──────────────────┘
```

## Sign In Flow

```
User Sign In:
┌─────────────┐
│  Login      │
│  Page       │──┐
└─────────────┘  │
                 ▼
         ┌──────────────────┐
         │   AuthForm.tsx   │
         │  (Client-side)   │
         └────────┬─────────┘
                  │
    useAuth().signIn(email, password)
                  │
                  ▼
         ┌──────────────────┐
         │ Supabase Auth    │
         │ Verify Password  │
         └────────┬─────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
    Success            Error
        │              (Shown to User)
        ▼
  ┌──────────────────┐
  │ Store Session    │
  │ in Cookie        │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Fetch Profile    │
  │ from DB          │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Redirect to      │
  │ Dashboard        │
  └──────────────────┘
```

## Protected Route Access

```
Request to Protected Route (/dashboard):
┌──────────────────┐
│  Client Request  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────┐
│  middleware.ts       │
│  (Runs on Every      │
│   Request)           │
└────────┬─────────────┘
         │
   Check PUBLIC_ROUTES?
         │
    ┌────┴────┐
    ▼         ▼
   YES        NO (Protected)
    │         │
    │         ▼
    │    ┌─────────────────────┐
    │    │ Get User from       │
    │    │ Supabase Auth       │
    │    │ (via Cookie)        │
    │    └────────┬────────────┘
    │             │
    │        ┌────┴────┐
    │        ▼         ▼
    │     Found      Not Found
    │        │         │
    │        │         ▼
    │        │    Redirect to
    │        │    /auth/login
    │        │
    └────┬───┘
         │
    ┌────┴────────┐
    ▼             ▼
Request      Response
Allowed      Returned
```

## Component Architecture

```
RootLayout
├── metadata setup
└── Body
    ├── Home Page (/)
    │   ├── Public - navigation
    │   └── Show sign in/up links or dashboard link
    │
    ├── Auth Routes (/auth/*)
    │   ├── AuthLayout
    │   ├── /login - AuthForm (mode: 'login')
    │   ├── /signup - AuthForm (mode: 'signup')
    │   └── /verify-email - Confirmation page
    │
    └── Protected Routes (middleware enforced)
        └── /dashboard
            ├── useAuth hook
            ├── Show user profile
            └── Sign out button
```

## Data Flow: useAuth Hook

```
useAuth() Hook (Client-side):
┌────────────────────────┐
│  Initialize on mount   │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ Get Current User from  │
│ Supabase Auth          │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ If user found:         │
│ Fetch profile from DB  │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ Subscribe to Auth      │
│ State Changes          │
└────────┬───────────────┘
         │
    ┌────▼─────────────────────────────┐
    │ When auth changes:                │
    │ - Update user state               │
    │ - Fetch/clear profile             │
    │ - Trigger re-renders              │
    └───────────────────────────────────┘

Returned Values:
├── user: User | null
├── profile: Profile | null
├── loading: boolean
├── error: AuthError | null
├── signIn(email, password)
├── signUp(email, password, fullName?)
└── signOut()
```

## Server-Side Auth Flow (Middleware & Server Actions)

```
Server Actions / API Routes:
┌──────────────────────┐
│ 'use server'         │
│ Function with Auth   │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────────────┐
│ createServerSupabaseClient() │
│ (Gets cookies from request)  │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────┐
│ supabase.auth.       │
│ getUser()            │
│ (Uses session cookie)│
└────────┬─────────────┘
         │
    ┌────┴─────┐
    ▼          ▼
 User       No User
 Found      (Unauthorized)
    │          │
    ▼          ▼
Execute    Return Error
Query      Response
```

## Database Tables & Relationships

```
Supabase Auth System
└── auth.users (provided by Supabase)
    ├── id (Primary Key)
    ├── email
    ├── encrypted_password
    ├── email_confirmed_at
    └── ...

Application Tables
├── profiles (Custom)
│   ├── id (Primary Key)
│   ├── user_id (Foreign Key → auth.users.id)
│   ├── full_name
│   ├── avatar_url
│   ├── bio
│   ├── created_at
│   └── updated_at
│
└── reservations (Custom)
    ├── id (Primary Key)
    ├── user_id (Foreign Key → auth.users.id)
    ├── title
    ├── description
    ├── start_date
    ├── end_date
    ├── status (pending|confirmed|cancelled)
    ├── created_at
    └── updated_at

Row Level Security (RLS):
- If user.id matches user_id → can read/write
- Otherwise → access denied
```

## Client vs Server Boundaries

```
'use client' Boundary (Client Components):
├── useAuth hook
├── useSession hook
├── AuthForm component
├── ProtectedRoute wrapper
└── Dashboard page (fetches relative data)
    └── Uses useAuth to get current user

'use server' Boundary (Server Components/Actions):
├── Middleware
├── Server Actions in app/actions.ts
├── Root layout metadata
└── Auth pages (server-side rendered)
    └── But use AuthForm (client) for interaction

Browser ←→ Server Communication:
├── Client Components use useAuth()
│   └── Triggers re-renders on user change
│
└── Server Actions use
    createServerSupabaseClient()
    └── Handles database operations
```

## Environment Variables & Security

```
Public (Frontend Accessible):
├── NEXT_PUBLIC_SUPABASE_URL
└── NEXT_PUBLIC_SUPABASE_ANON_KEY
    (These are intentionally public)

Private (Backend Only - .env.local):
├── SUPABASE_SERVICE_ROLE_KEY
│   (Never expose to frontend)
└── Database connection secrets

Session Management:
├── Stored in secure HTTP-only cookies
├── Automatically refreshed by Supabase
└── Cleared on sign out
```

---

This architecture ensures:
✅ Security - Proper use of public/private keys  
✅ Performance - Minimal re-renders, efficient queries  
✅ Type Safety - Full TypeScript throughout  
✅ Scalability - Clean separation of concerns  
✅ Best Practices - Next.js 15 App Router patterns
