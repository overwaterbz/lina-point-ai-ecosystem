# Usage Patterns & Examples

This document provides practical examples for using the Supabase integration in your application.

## Pattern 1: Using useAuth in Client Components

### Display User Information
```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';

export function UserCard() {
  const { user, profile, loading, error } = useAuth();

  if (loading) return <div>Loading user info...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>Not signed in</div>;

  return (
    <div className="border rounded p-4">
      <h3>{profile?.full_name || user.email}</h3>
      <p className="text-sm text-gray-600">{user.email}</p>
      {profile?.bio && <p>{profile.bio}</p>}
    </div>
  );
}
```

### Sign Out Button
```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export function SignOutButton() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      router.push('/');
    }
  };

  return (
    <button 
      onClick={handleSignOut}
      className="bg-red-600 text-white px-4 py-2 rounded"
    >
      Sign Out
    </button>
  );
}
```

### Conditional Rendering Based on Auth State
```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export function AuthStatus() {
  const { user, loading } = useAuth();

  if (loading) return <span>Loading...</span>;

  return (
    <>
      {user ? (
        <>
          <span>Welcome, {user.email}</span>
          <SignOutButton />
        </>
      ) : (
        <>
          <Link href="/auth/login">Sign In</Link>
          <Link href="/auth/signup">Sign Up</Link>
        </>
      )}
    </>
  );
}
```

## Pattern 2: Server-Side Operations with Server Actions

### Fetch User's Own Data
```tsx
// app/actions.ts
'use server';

import { createServerSupabaseClient } from '@/lib/supabase';

export async function getUserReservations() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('user_id', user.id)
    .order('start_date');

  if (error) throw error;
  return data;
}
```

### Use Server Action in Client Component
```tsx
'use client';

import { useEffect, useState } from 'react';
import { getUserReservations } from '@/app/actions';
import { Reservation } from '@/types/supabase';

export function ReservationsList() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserReservations()
      .then(setReservations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading reservations...</div>;
  if (!reservations.length) return <div>No reservations</div>;

  return (
    <ul>
      {reservations.map(res => (
        <li key={res.id}>
          <h4>{res.title}</h4>
          <p>{new Date(res.start_date).toLocaleDateString()}</p>
        </li>
      ))}
    </ul>
  );
}
```

## Pattern 3: Protected Routes

### Using Middleware (Automatic)
The middleware automatically protects:
- `/dashboard` - redirects to `/auth/login`
- Any route outside auth except home

Requests without valid session are redirected to `/auth/login`.

### Add More Protected Routes
```typescript
// middleware.ts
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/verify-email',
  '/about', // Make public
  '/contact', // Make public
];
```

### Using ProtectedRoute Component (Client-side)
```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardContent } from '@/components/DashboardContent';

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

## Pattern 4: Form Handling with useAuth

### Sign Up Form with Validation
```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export function AdvancedSignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signUp } = useAuth();
  const router = useRouter();

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email.includes('@')) {
      newErrors.email = 'Invalid email address';
    }

    if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const { error } = await signUp(email, password, fullName);

    if (error) {
      setErrors({ form: error.message });
      return;
    }

    router.push('/auth/verify-email');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Full Name Input */}
      <div>
        <label htmlFor="fullName" className="block font-medium mb-1">
          Full Name
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          className={`w-full border rounded px-3 py-2 ${
            errors.fullName ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.fullName && <p className="text-red-600 text-sm">{errors.fullName}</p>}
      </div>

      {/* Email Input */}
      <div>
        <label htmlFor="email" className="block font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={`w-full border rounded px-3 py-2 ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
      </div>

      {/* Password Input */}
      <div>
        <label htmlFor="password" className="block font-medium mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className={`w-full border rounded px-3 py-2 ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.password && <p className="text-red-600 text-sm">{errors.password}</p>}
      </div>

      {/* Confirm Password Input */}
      <div>
        <label htmlFor="confirmPassword" className="block font-medium mb-1">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          className={`w-full border rounded px-3 py-2 ${
            errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.confirmPassword && (
          <p className="text-red-600 text-sm">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Form Error */}
      {errors.form && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-red-700">{errors.form}</p>
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-semibold py-2 rounded"
      >
        Create Account
      </button>
    </form>
  );
}
```

## Pattern 5: Database Queries After Auth

### Create a Record
```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createBrowserSupabaseClient } from '@/lib/supabase';

export function CreateReservation() {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const supabase = createBrowserSupabaseClient();

    const { error } = await supabase
      .from('reservations')
      .insert({
        user_id: user.id,
        title,
        start_date: startDate,
        end_date: endDate,
        status: 'pending',
      });

    setLoading(false);

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    // Clear form
    setTitle('');
    setStartDate('');
    setEndDate('');
    alert('Reservation created!');
  };

  return (
    <form onSubmit={handleCreate} className="space-y-4">
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full border rounded px-3 py-2"
        required
      />

      <input
        type="datetime-local"
        value={startDate}
        onChange={e => setStartDate(e.target.value)}
        className="w-full border rounded px-3 py-2"
        required
      />

      <input
        type="datetime-local"
        value={endDate}
        onChange={e => setEndDate(e.target.value)}
        className="w-full border rounded px-3 py-2"
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
```

## Pattern 6: Error Handling

### Global Error Handler
```tsx
'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function ErrorBoundary({ children }: { children: ReactNode }) {
  const { error: authError } = useAuth();

  if (authError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 m-4">
        <h3 className="font-bold text-red-900">An Error Occurred</h3>
        <p className="text-red-700">{authError.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return children;
}
```

## Pattern 7: Optimistic UI Updates

### Reservation Management with Optimistic Updates
```tsx
'use client';

import { useState, useOptimistic } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Reservation } from '@/types/supabase';
import { createBrowserSupabaseClient } from '@/lib/supabase';

export function ReservationManager({
  initialReservations,
}: {
  initialReservations: Reservation[];
}) {
  const [reservations, setOptimisticReservations] = useOptimistic(initialReservations);
  const { user } = useAuth();

  const handleCancel = async (id: string) => {
    // Optimistic update
    setOptimisticReservations(
      reservations.map(r => (r.id === id ? { ...r, status: 'cancelled' } : r))
    );

    const supabase = createBrowserSupabaseClient();

    const { error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('user_id', user?.id);

    if (error) {
      // Revert on error
      setOptimisticReservations(initialReservations);
      alert('Failed to cancel');
    }
  };

  return (
    <div>
      {reservations.map(res => (
        <div key={res.id} className="border rounded p-4 mb-2">
          <h4>{res.title}</h4>
          <p>{res.status}</p>
          {res.status !== 'cancelled' && (
            <button
              onClick={() => handleCancel(res.id)}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Common Tasks

### Check if User is Authenticated
```tsx
const { user, loading } = useAuth();
if (!loading && user) {
  // User is authenticated
}
```

### Get Current User Email
```tsx
const { user } = useAuth();
const email = user?.email;
```

### Update User Profile
```tsx
const { profile } = useAuth();
// Use server action to update

import { updateUserProfile } from '@/app/actions';

await updateUserProfile('New Name', null, 'New bio');
```

### Redirect After Sign In
```tsx
const router = useRouter();
const { signIn } = useAuth();

const { user, error } = await signIn(email, password);
if (!error && user) {
  router.push('/dashboard');
}
```

---

## Best Practices

✅ **Always handle loading states** - Don't assume instant responses  
✅ **Show meaningful errors** - Help users understand what went wrong  
✅ **Use server actions** for sensitive operations  
✅ **Protect sensitive routes** with middleware  
✅ **Validate input** before sending to server  
✅ **Use optimistic updates** for better UX  
✅ **Handle errors gracefully** with try/catch  
✅ **Clear sensitive data** on sign out  

---

For more examples, see the `SUPABASE_INTEGRATION.md` file.
