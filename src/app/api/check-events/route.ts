import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const isProd = process.env.NODE_ENV === 'production';
const debugLog = (...args: unknown[]) => {
  if (!isProd) {
    console.log(...args);
  }
};

export async function GET() {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ error: 'Supabase service key not configured' }, { status: 500 });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: profiles, error } = await admin.from('profiles').select('id,user_id,birthday,anniversary,opt_in_magic');
    if (error) {
      console.error('Error fetching profiles for events', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const today = new Date();
    const todayMonth = today.getUTCMonth() + 1; // 1-12
    const todayDay = today.getUTCDate();

    const triggers: Array<{ user_id: string; reason: string }> = [];

    (profiles || []).forEach((p: any) => {
      try {
        if (p.birthday) {
          const d = new Date(p.birthday);
          if (d.getUTCMonth() + 1 === todayMonth && d.getUTCDate() === todayDay) {
            debugLog(`Trigger magic gen for user ${p.user_id} (birthday)`);
            triggers.push({ user_id: p.user_id, reason: 'birthday' });
          }
        }
        if (p.anniversary) {
          const d2 = new Date(p.anniversary);
          if (d2.getUTCMonth() + 1 === todayMonth && d2.getUTCDate() === todayDay) {
            debugLog(`Trigger magic gen for user ${p.user_id} (anniversary)`);
            triggers.push({ user_id: p.user_id, reason: 'anniversary' });
          }
        }
      } catch (e) {
        // Ignore parse errors per profile
      }
    });

    // Stubbed: in production you would enqueue jobs or call /api/analyze-profile for each user

    return NextResponse.json({ triggers });
  } catch (err) {
    console.error('check-events error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
