import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Setup Instructions for Supabase Integration
 *
 * 1. Create a .env.local file in your project root with:
 *    NEXT_PUBLIC_SUPABASE_URL=your-project-url
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
 *
 * 2. Install dependencies (if not already installed):
 *    npm install @supabase/supabase-js @supabase/ssr
 *
 * 3. Create the following database tables in Supabase:
 *
 *    -- Profiles table
 *    CREATE TABLE profiles (
 *      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *      full_name TEXT,
 *      avatar_url TEXT,
 *      bio TEXT,
 *      created_at TIMESTAMP DEFAULT NOW(),
 *      updated_at TIMESTAMP DEFAULT NOW(),
 *      UNIQUE(user_id)
 *    );
 *
 *    -- Reservations table
 *    CREATE TABLE reservations (
 *      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *      title TEXT NOT NULL,
 *      description TEXT,
 *      start_date TIMESTAMP NOT NULL,
 *      end_date TIMESTAMP NOT NULL,
 *      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
 *      created_at TIMESTAMP DEFAULT NOW(),
 *      updated_at TIMESTAMP DEFAULT NOW()
 *    );
 *
 * 4. Set up Row Level Security (RLS) policies in Supabase (optional but recommended)
 *
 * 5. Project structure:
 *    src/
 *    ├── lib/
 *    │   └── supabase.ts          # Supabase client initialization
 *    ├── types/
 *    │   └── supabase.ts          # TypeScript types
 *    ├── hooks/
 *    │   └── useAuth.ts           # Authentication hooks
 *    ├── components/
 *    │   ├── AuthForm.tsx         # Reusable auth form
 *    │   └── ProtectedRoute.tsx   # Protected route wrapper
 *    ├── app/
 *    │   ├── auth/
 *    │   │   ├── login/
 *    │   │   │   └── page.tsx
 *    │   │   ├── signup/
 *    │   │   │   └── page.tsx
 *    │   │   └── verify-email/
 *    │   │       └── page.tsx
 *    │   ├── dashboard/
 *    │   │   └── page.tsx
 *    │   ├── layout.tsx
 *    │   └── page.tsx
 *    └── middleware.ts            # Route protection middleware
 *
 * 6. Usage examples:
 *
 *    // Use in client components
 *    'use client';
 *    import { useAuth } from '@/hooks/useAuth';
 *
 *    function MyComponent() {
 *      const { user, signIn, signOut } = useAuth();
 *      return <div>...</div>;
 *    }
 *
 *    // Protected routes
 *    import { ProtectedRoute } from '@/components/ProtectedRoute';
 *
 *    function Dashboard() {
 *      return (
 *        <ProtectedRoute>
 *          <DashboardContent />
 *        </ProtectedRoute>
 *      );
 *    }
 */

export const SETUP_DOCS = true;
