import type { SupabaseClient } from '@supabase/supabase-js';
import { runContentAgent, sendContentEmail } from '@/lib/contentAgent';
import type { MagicQuestionnaire, GeneratedContent } from '@/lib/contentAgent';

export type MagicGenerateOptions = {
  userId: string;
  reservationId?: string | null;
  occasion: MagicQuestionnaire['occasion'];
  musicStyle?: MagicQuestionnaire['musicStyle'];
  mood?: MagicQuestionnaire['mood'];
  recipientName?: string;
  giftYouName?: string;
  message?: string;
  userEmail?: string | null;
};

type MagicQuestionnaireRow = {
  occasion: string | null;
  recipient_name: string | null;
  gift_you_name: string | null;
  key_memories: string | null;
  favorite_colors: string | null;
  favorite_songs_artists: string | null;
  message: string | null;
  music_style: string | null;
  mood: string | null;
};

function parseStringArray(value?: string | null): string[] | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // fall through
  }

  if (value.includes(',')) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [value];
}

function normalizeOccasion(value: string): MagicQuestionnaire['occasion'] {
  const lower = value.toLowerCase();
  if (lower.includes('anniversary')) return 'anniversary';
  if (lower.includes('proposal')) return 'proposal';
  if (lower.includes('reunion')) return 'reunion';
  if (lower.includes('celebration')) return 'celebration';
  return 'birthday';
}

function normalizeMood(value?: string | null): MagicQuestionnaire['mood'] {
  const lower = (value || '').toLowerCase();
  if (lower.includes('energetic')) return 'energetic';
  if (lower.includes('peace')) return 'peaceful';
  if (lower.includes('celebrat')) return 'celebratory';
  return 'romantic';
}

function normalizeMusicStyle(value?: string | null): MagicQuestionnaire['musicStyle'] {
  const lower = (value || '').toLowerCase();
  if (lower.includes('edm')) return 'edm';
  if (lower.includes('reggae')) return 'reggae';
  if (lower.includes('calypso')) return 'calypso';
  if (lower.includes('tropical')) return 'tropical';
  return 'ambient';
}

export async function fetchMagicQuestionnaire(
  supabase: SupabaseClient<any>,
  userId: string,
  reservationId?: string | null
): Promise<MagicQuestionnaire | null> {
  if (!reservationId) return null;

  const { data, error } = await supabase
    .from('magic_questionnaire')
    .select('*')
    .eq('reservation_id', reservationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as MagicQuestionnaireRow;

  return {
    occasion: normalizeOccasion(row.occasion || 'celebration'),
    recipientName: row.recipient_name || 'Guest',
    giftYouName: row.gift_you_name || 'Lina Point Resort',
    keyMemories: parseStringArray(row.key_memories),
    favoriteColors: parseStringArray(row.favorite_colors),
    favoriteSongsArtists: parseStringArray(row.favorite_songs_artists),
    message: row.message || undefined,
    musicStyle: normalizeMusicStyle(row.music_style),
    mood: normalizeMood(row.mood),
  };
}

export function buildQuestionnaireFromProfile(
  options: MagicGenerateOptions,
  profile?: Record<string, any> | null
): MagicQuestionnaire {
  const occasion = normalizeOccasion(options.occasion);
  const musicStyle = options.musicStyle || normalizeMusicStyle(profile?.music_style || profile?.musicStyle);
  const mood = options.mood || normalizeMood(profile?.magic_mood || profile?.mood);

  return {
    occasion,
    recipientName:
      options.recipientName ||
      profile?.full_name ||
      profile?.fullName ||
      profile?.first_name ||
      'Guest',
    giftYouName: options.giftYouName || profile?.full_name || 'Lina Point Resort',
    keyMemories: profile?.key_memories || undefined,
    favoriteColors: profile?.favorite_colors || undefined,
    favoriteSongsArtists: profile?.favorite_songs_artists || undefined,
    message: options.message || profile?.magic_message || profile?.message || undefined,
    musicStyle,
    mood,
  };
}

function getDefaultTitle(questionnaire: MagicQuestionnaire, contentType: string) {
  return `${questionnaire.occasion} ${contentType} for ${questionnaire.recipientName}`;
}

async function runSingleGeneration(
  supabase: SupabaseClient<any>,
  options: MagicGenerateOptions,
  questionnaire: MagicQuestionnaire,
  contentType: 'song' | 'video'
): Promise<{ recordId: string; result: GeneratedContent | null }>
{
  const placeholderTitle = `Processing ${contentType}`;
  const { data: record, error } = await supabase
    .from('magic_content')
    .insert({
      user_id: options.userId,
      reservation_id: options.reservationId || null,
      content_type: contentType,
      title: placeholderTitle,
      description: '',
      genre: questionnaire.musicStyle,
      prompt: '',
      media_url: '',
      duration_seconds: null,
      file_size_bytes: null,
      status: 'processing',
      error_message: null,
      generation_provider: null,
      processing_time_ms: null,
    })
    .select('id')
    .single();

  if (error || !record?.id) {
    throw new Error(error?.message || 'Failed to create magic content record');
  }

  try {
    const result = await runContentAgent({
      userId: options.userId,
      reservationId: options.reservationId || undefined,
      contentType,
      questionnaire,
    });

    await supabase
      .from('magic_content')
      .update({
        title: result.title || getDefaultTitle(questionnaire, contentType),
        description: result.description || null,
        prompt: result.prompt || null,
        media_url: result.mediaUrl,
        duration_seconds: result.durationSeconds,
        file_size_bytes: result.fileSizeBytes,
        status: 'completed',
        generation_provider: result.provider,
        processing_time_ms: result.processingTimeMs,
        updated_at: new Date().toISOString(),
      })
      .eq('id', record.id);

    if (options.userEmail) {
      await sendContentEmail(
        options.userEmail,
        result.mediaUrl,
        contentType,
        questionnaire.recipientName
      );
    }

    return { recordId: record.id, result };
  } catch (error) {
    await supabase
      .from('magic_content')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
        updated_at: new Date().toISOString(),
      })
      .eq('id', record.id);

    return { recordId: record.id, result: null };
  }
}

export async function generateMagicContent(
  supabase: SupabaseClient<any>,
  options: MagicGenerateOptions,
  profile?: Record<string, any> | null
): Promise<{ items: Array<{ contentType: 'song' | 'video'; recordId: string; mediaUrl?: string }>; questionnaire: MagicQuestionnaire }>
{
  const questionnaire =
    (await fetchMagicQuestionnaire(supabase, options.userId, options.reservationId)) ||
    buildQuestionnaireFromProfile(options, profile);

  const songResult = await runSingleGeneration(supabase, options, questionnaire, 'song');
  const videoResult = await runSingleGeneration(supabase, options, questionnaire, 'video');

  return {
    items: [
      {
        contentType: 'song',
        recordId: songResult.recordId,
        mediaUrl: songResult.result?.mediaUrl,
      },
      {
        contentType: 'video',
        recordId: videoResult.recordId,
        mediaUrl: videoResult.result?.mediaUrl,
      },
    ],
    questionnaire,
  };
}
