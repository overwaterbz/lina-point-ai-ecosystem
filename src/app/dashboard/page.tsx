'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      router.push('/auth/login');
    }
  };

  const handleCheckEvents = async () => {
    try {
      toast('Checking events...', { icon: '🔎' });
      const res = await fetch('/api/check-events');
      const data = await res.json();
      if (process.env.NODE_ENV !== 'production') {
        console.log('check-events result', data);
      }
      toast.success(`Check complete: ${data.triggers?.length || 0} triggers`);
    } catch (err: any) {
      console.error('check-events error', err);
      toast.error(`Error: ${err?.message || String(err)}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCheckEvents}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Test check-events
              </button>
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">Welcome!</h2>

          {!profile?.opt_in_magic && (
            <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h3 className="text-lg font-semibold text-amber-800">Complete onboarding</h3>
              <p className="text-sm text-amber-700">
                Enable agent permissions and preferences to unlock personalized experiences.
              </p>
              <button
                onClick={() => router.push('/onboarding')}
                className="mt-3 inline-flex items-center rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
              >
                Finish onboarding
              </button>
            </div>
          )}

          {/* User info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Profile Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="text-lg font-medium text-gray-900">{user?.email || 'N/A'}</p>
              </div>
              {profile?.full_name && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Full Name</p>
                  <p className="text-lg font-medium text-gray-900">{profile.full_name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 mb-1">User ID</p>
                <p className="text-sm text-gray-700 break-all">{user?.id}</p>
              </div>
              {profile?.created_at && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Member Since</p>
                  <p className="text-lg font-medium text-gray-900">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick start guide */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Next Steps</h3>
            <ul className="space-y-2 text-gray-700">
              <li>✓ Authentication is working!</li>
              <li>✓ User profile is loaded from the database</li>
              <li>→ Create reservations and manage your data</li>
              <li>→ Update your profile information</li>
              <li>→ Connect with other users</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
