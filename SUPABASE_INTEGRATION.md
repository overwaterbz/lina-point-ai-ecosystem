# Supabase Integration Guide

This Next.js 15 project includes a complete Supabase authentication and database integration with TypeScript support.

## Features

✅ **Authentication**: Sign up, sign in, and sign out with Supabase Auth  
✅ **Protected Routes**: Middleware-based route protection  
✅ **TypeScript**: Fully typed authentication hooks and components  
✅ **Tailwind CSS**: Pre-styled auth forms and components  
✅ **Server/Client**: Proper use of server and client components  
✅ **Database**: User profiles and reservations tables  

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 2. Environment Configuration

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these values in your Supabase project settings under **API**.

### 3. Create Database Tables

In your Supabase dashboard, run the following SQL queries:

#### Profiles Table
```sql
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

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select using (auth.uid() = user_id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = user_id);
```

#### Reservations Table
```sql
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

alter table reservations enable row level security;

create policy "Users can view their own reservations"
  on reservations for select using (auth.uid() = user_id);

create policy "Users can insert their own reservations"
  on reservations for insert with check (auth.uid() = user_id);

create policy "Users can update their own reservations"
  on reservations for update using (auth.uid() = user_id);

create policy "Users can delete their own reservations"
  on reservations for delete using (auth.uid() = user_id);
```

### 4. Update Email Templates (Optional)

In Supabase, customize your email templates for:
- Confirmation emails
- Password reset emails
- Magic link emails

## Project Structure

```
src/
├── lib/
│   └── supabase.ts              # Supabase client (browser & server)
├── types/
│   └── supabase.ts              # TypeScript interfaces
├── hooks/
│   └── useAuth.ts               # useAuth, useSession hooks
├── components/
│   ├── AuthForm.tsx             # Reusable auth form component
│   └── ProtectedRoute.tsx        # Protected route wrapper
├── app/
│   ├── auth/
│   │   ├── login/page.tsx       # Sign in page
│   │   ├── signup/page.tsx      # Sign up page
│   │   ├── verify-email/page.tsx # Email verification page
│   │   └── layout.tsx           # Auth layout
│   ├── dashboard/page.tsx       # Protected dashboard page
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
└── middleware.ts                 # Route protection middleware
```

## Usage Examples

### Using the Auth Hook

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function MyComponent() {
  const { user, profile, loading, signIn, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <>
      {user ? (
        <div>
          <p>Welcome, {profile?.full_name || user.email}</p>
          <button onClick={signOut}>Sign Out</button>
        </div>
      ) : (
        <a href="/auth/login">Sign In</a>
      )}
    </>
  );
}
```

### Using the Auth Form Component

```tsx
import { AuthForm } from '@/components/AuthForm';

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
```

### Protecting Routes with Middleware

The `middleware.ts` file automatically protects all routes except:
- `/` (home)
- `/auth/*` (auth pages)

To add more public routes, update the `PUBLIC_ROUTES` array in `middleware.ts`.

### Protecting Components

```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

## Authentication Flow

### Sign Up Flow
1. User enters email, password, and full name
2. Account created in Supabase Auth
3. User profile automatically created in `profiles` table
4. Confirmation email sent to user
5. Redirect to email verification page
6. User clicks confirmation link in email
7. User can now sign in

### Sign In Flow
1. User enters email and password
2. Supabase verifies credentials
3. Session created (stored in cookies)
4. User profile loaded from `profiles` table
5. Redirect to dashboard
6. Middleware protects routes based on session

### Sign Out Flow
1. User profile cleared from state
2. Session removed from cookies
3. Redirect to login page

## TypeScript Types

All available types are defined in `src/types/supabase.ts`:

```tsx
import { User, Profile, Reservation, AuthContextType } from '@/types/supabase';
```

## Security Features

✅ **Row Level Security (RLS)**: Database policies restrict user access  
✅ **Server & Client Separation**: Proper use of server/client boundaries  
✅ **Session Management**: Secure cookie-based sessions  
✅ **Middleware Protection**: Route-level authentication  

## Best Practices

1. **Use 'use client' directive**: Only where needed (hooks, interactive components)
2. **Type everything**: Use the provided types from `src/types/supabase.ts`
3. **Handle errors**: Check error responses from auth functions
4. **Never expose secrets**: Keep `SUPABASE_SERVICE_ROLE_KEY` server-only
5. **Validate input**: Always validate form input before sending to server

## Troubleshooting

### "NEXT_PUBLIC_SUPABASE_URL is not defined"
- Check your `.env.local` file exists and has the correct environment variables

### "User is not authenticated"
- Check that middleware allows access to the route
- Verify the session cookie is being set correctly
- Clear browser cookies and sign in again

### "Email confirmation not working"
- Check spam folder for confirmation email
- Verify email templates in Supabase settings
- Ensure your Supabase project allows new signups

### "Profile not created after signup"
- Check the `profiles` table RLS policies
- Verify the `signUp` function ran without errors
- Check Supabase logs for database errors

## Next Steps

1. ✅ Implement the Supabase integration
2. Create additional protected pages for your app
3. Add database operations (CRUD for reservations)
4. Customize the styling to match your brand
5. Add more authentication methods (OAuth providers)
6. Set up automated tests for auth flows

## Related Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs/)
