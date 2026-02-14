import Stripe from 'stripe'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature') || ''
  const text = await req.text()

  const stripeSecret = process.env.STRIPE_SECRET_KEY || ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''
  if (!stripeSecret) {
    console.error('Stripe secret key not configured for webhook')
    return NextResponse.json({ received: false }, { status: 500 })
  }

  const StripeLib = (await import('stripe')).default
  const stripe = new StripeLib(stripeSecret)

  let event: any
  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(text, sig, webhookSecret)
    } else {
      event = JSON.parse(text)
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message)
    return NextResponse.json({ received: false }, { status: 400 })
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const pi = event.data.object
      console.log('PaymentIntent succeeded:', pi.id, 'amount:', pi.amount)
      try {
        const bookingId = pi.metadata?.booking_id
        if (bookingId) {
          // Update tour_bookings associated with this booking_id to paid
          const { createServerSupabaseClient } = await import('@/lib/supabase-server')
          const supabase = await createServerSupabaseClient()
          const { error: updateErr } = await supabase
            .from('tour_bookings')
            .update({ status: 'paid', payment_intent: pi.id })
            .eq('booking_id', bookingId)

          if (updateErr) console.warn('[Stripe Webhook] Failed to mark tours paid:', updateErr.message)
          else console.log(`[Stripe Webhook] Marked tour_bookings paid for booking ${bookingId}`)
        }
      } catch (webhookErr) {
        console.error('Error handling payment_intent.succeeded webhook:', webhookErr)
      }
      break
    case 'payment_intent.payment_failed':
      console.warn('Payment failed:', event.data.object)
      break
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
