import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { Profile } from '@/types/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (pErr || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Build prompt from profile preferences
    const prefs = profile as Profile;
    const promptParts: string[] = [];

    if (prefs.full_name) promptParts.push(`Name: ${prefs.full_name}`);
    if (prefs.birthday) promptParts.push(`Birthday: ${prefs.birthday}`);
    if (prefs.anniversary) promptParts.push(`Anniversary: ${prefs.anniversary}`);
    if (prefs.music_style) promptParts.push(`Music style: ${prefs.music_style}`);
    if (prefs.maya_interests && prefs.maya_interests.length) promptParts.push(`Maya interests: ${prefs.maya_interests.join(', ')}`);
    if (prefs.special_events && prefs.special_events.length) {
      promptParts.push(
        `Special events: ${prefs.special_events.map((e) => `${e.name} on ${e.date}`).join('; ')}`
      );
    }
    promptParts.push(`Opt-in magic: ${prefs.opt_in_magic ? 'yes' : 'no'}`);

    const prompt = `Create a short "Magic is You" profile summary that reflects the user's preferences and highlights Maya and kundalini themes when relevant. Then suggest personalized experiences that could be monetized (songs, videos, guided tours, dinner packages, or curated events) and explain how commissions or upsells could be offered in a tasteful way. Use the following user data:\n\n${promptParts.join('\n')}
  \n
  Output as a concise, engaging paragraph (80-180 words) followed by 3 short bullet suggestions (one-line each).`;

    // Call OpenAI Grok-4 model
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const resp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model: 'grok-4', input: prompt, max_tokens: 500 }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: 'LLM error', detail: text }, { status: 502 });
    }

    const data = await resp.json();
    // Response shape: data.output[0].content etc - be defensive
    let summary = '';
    try {
      // New responses API may provide output[0].content[0].text
      if (data.output && Array.isArray(data.output) && data.output.length) {
        const out = data.output[0];
        if (typeof out === 'string') summary = out;
        else if (out.content && Array.isArray(out.content)) {
          summary = out.content.map((c: any) => c.text || c).join('');
        } else if (out.text) summary = out.text;
      } else if (data.output_text) {
        summary = data.output_text;
      }
    } catch (e) {
      summary = '';
    }

    // Optionally save magic_profile if user opted in
    if (prefs.opt_in_magic) {
      await supabase.from('profiles').update({ magic_profile: summary }).eq('user_id', user.id);
    }

    return NextResponse.json({ summary });
  } catch (err) {
    console.error('analyze-profile error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
