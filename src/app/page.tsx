'use client';

import { useSession } from '@/hooks/useAuth';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Home() {
  const { session, loading } = useSession();

  useEffect(() => {
    const runSupabaseTest = async () => {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from('magic_content')
        .select('*')
        .limit(1);

      console.log('Supabase Test: Data:', data ?? [], 'Error:', error ?? null);
    };

    runSupabaseTest();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Lina Point</h1>
            <div className="space-x-4">
              {session ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-blue-600 hover:text-blue-700 font-semibold transition"
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-blue-600 hover:text-blue-700 font-semibold transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-bold mb-6 text-gray-900">Welcome to Lina Point</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A modern platform built with Next.js 15, TypeScript, and Supabase. Secure, scalable, and ready for your application.
          </p>

          {!loading && !session && (
            <div className="space-x-4">
              <Link
                href="/auth/signup"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition"
              >
                Get Started
              </Link>
              <Link
                href="/auth/login"
                className="inline-block bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 px-8 rounded-lg border-2 border-blue-600 transition"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-3xl mb-4">🔐</div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Secure Authentication</h3>
            <p className="text-gray-600">
              Enterprise-grade authentication with Supabase. Secure sign up, login, and password recovery.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Next.js 15</h3>
            <p className="text-gray-600">
              Built with the latest Next.js App Router, Server Components, and full TypeScript support.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-3xl mb-4">🎨</div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Tailwind CSS</h3>
            <p className="text-gray-600">
              Beautiful, responsive UI components styled with Tailwind CSS for a modern look and feel.
            </p>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-20 bg-white rounded-lg shadow-md p-8">
          <h3 className="text-2xl font-bold mb-6 text-gray-900">Tech Stack</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="font-semibold text-gray-900">Next.js 15</p>
              <p className="text-sm text-gray-600">App Router</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900">React 19</p>
              <p className="text-sm text-gray-600">UI Framework</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900">TypeScript</p>
              <p className="text-sm text-gray-600">Type Safety</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900">Supabase</p>
              <p className="text-sm text-gray-600">Backend & Auth</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900">Tailwind CSS</p>
              <p className="text-sm text-gray-600">Styling</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900">PostgreSQL</p>
              <p className="text-sm text-gray-600">Database</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}