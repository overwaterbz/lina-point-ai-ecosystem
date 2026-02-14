/**
 * Example Server Action for authenticated operations
 * This shows how to use the serverSupabaseClient in a Server Action
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { Reservation } from '@/types/supabase';

/**
 * Create a reservation for the authenticated user
 */
export async function createReservation(reservation: Omit<Reservation, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('reservations')
      .insert({
        ...reservation,
        user_id: user.id,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Get all reservations for the authenticated user
 */
export async function getUserReservations(): Promise<{ data: Reservation[] | null; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data as Reservation[]) || [] };
  } catch (error) {
    return { data: null, error: String(error) };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  fullName?: string,
  avatarUrl?: string,
  bio?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        avatar_url: avatarUrl,
        bio: bio,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
