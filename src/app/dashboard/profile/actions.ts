import { createServerSupabaseClient } from '@/lib/supabase-server';
import { normalizePhoneNumber } from '@/lib/whatsapp';

export async function updateProfileAction(formData: FormData) {
  'use server';
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const birthday = formData.get('birthday') as string | null;
    const anniversary = formData.get('anniversary') as string | null;
    const music_style = (formData.get('music_style') as string) || null;
    const opt_in_magic = formData.get('opt_in_magic') === 'on' || formData.get('opt_in_magic') === 'true';
    const phoneRaw = (formData.get('phone_number') as string) || null;
    const phone_number = phoneRaw ? normalizePhoneNumber(phoneRaw) : null;

    const specialEventsJson = formData.get('special_events_json') as string | null;
    let special_events = null;
    try {
      special_events = specialEventsJson ? JSON.parse(specialEventsJson) : null;
    } catch {
      special_events = null;
    }

    const mayaInterestsJson = formData.get('maya_interests_json') as string | null;
    let maya_interests = null;
    try {
      maya_interests = mayaInterestsJson ? JSON.parse(mayaInterestsJson) : null;
    } catch {
      maya_interests = null;
    }

    const updates: Record<string, any> = {
      user_id: user.id,
      phone_number: phone_number || null,
      birthday: birthday || null,
      anniversary: anniversary || null,
      music_style: music_style || null,
      opt_in_magic: !!opt_in_magic,
    };

    if (special_events) updates.special_events = special_events;
    if (maya_interests) updates.maya_interests = maya_interests;

    const { data, error } = await supabase
      .from('profiles')
      .upsert(updates, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { profile: data };
  } catch (err) {
    console.error('updateProfileAction error', err);
    throw err;
  }
}
