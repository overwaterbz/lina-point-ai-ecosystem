'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  useEffect(() => {
    supabase
      .from('users')  // test table – can be empty
      .select('*')
      .limit(1)
      .then(({ data, error }) => {
        console.log('Supabase Test:');
        console.log('Data:', data);
        console.log('Error:', error);
      });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Lina Point AI – Supabase Test</h1>
      <p className="text-lg">Open console (F12 → Console) to see result</p>
      <p className="text-sm text-gray-600 mt-4">
        Success: Data: [] (or rows), Error: null
      </p>
    </main>
  );
}