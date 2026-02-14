import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const bookingId = url.searchParams.get('booking_id')
    if (!bookingId) return NextResponse.json({ error: 'booking_id required' }, { status: 400 })

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('tour_bookings')
      .select('*')
      .eq('booking_id', bookingId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ rows: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'server error' }, { status: 500 })
  }
}
