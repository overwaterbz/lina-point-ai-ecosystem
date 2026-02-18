import Stripe from 'stripe'
import { NextResponse } from 'next/server'

const isProd = process.env.NODE_ENV === 'production'

/**
 * Payment Intent Creation with Dual Processor Support
 * PRIMARY: Square (your main billing system)
 * FALLBACK: Stripe (automatic if Square unavailable)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { amount, currency = 'usd', metadata, useStripe = false } = body

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Try Square first (PRIMARY)
    if (!useStripe) {
      const squareAttempt = await trySquarePayment(amount, currency, metadata)
      if (squareAttempt.success) {
        if (!isProd) console.log('[Payment] Square payment created successfully')
        return NextResponse.json({
          client_secret: squareAttempt.clientSecret,
          processor: 'square',
          idempotency_key: squareAttempt.idempotencyKey,
        })
      }
      if (!isProd) console.log('[Payment] Square failed, falling back to Stripe', squareAttempt.error)
    }

    // Fallback to Stripe
    const stripeResult = await tryStripePayment(amount, currency, metadata)
    if (stripeResult.success) {
      if (!isProd) console.log('[Payment] Stripe payment created as fallback')
      return NextResponse.json({
        client_secret: stripeResult.clientSecret,
        processor: 'stripe',
      })
    }

    // Both failed
    return NextResponse.json(
      { error: `Both payment processors failed: ${stripeResult.error}` },
      { status: 500 }
    )
  } catch (err: any) {
    if (!isProd) console.error('[Payment] Error:', err)
    return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 })
  }
}

/**
 * Attempt payment via Square
 */
async function trySquarePayment(
  amount: number,
  currency: string,
  metadata: any
): Promise<{ success: boolean; clientSecret?: string; idempotencyKey?: string; error?: string }> {
  try {
    const squareAppId = process.env.SQUARE_APPLICATION_ID
    const squareToken = process.env.SQUARE_ACCESS_TOKEN

    if (!squareAppId || !squareToken) {
      return { success: false, error: 'Square credentials not configured' }
    }

    // Square uses different approach - would need Square SDK integration
    // For now, return placeholder - integrate actual Square SDK when ready
    // https://developer.squareup.com/reference/square/payments-api
    
    if (!isProd) {
      console.log('[Square] Would create payment:', { amount, currency, squareAppId: squareAppId.substring(0, 10) + '...' })
    }

    // Generate idempotency key for Square
    const idempotencyKey = `${metadata?.bookingId || 'booking'}-${Date.now()}`

    // For MVP: Return mock success - replace with actual Square API call
    return {
      success: true,
      clientSecret: `sq_mock_${idempotencyKey}`,
      idempotencyKey,
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Attempt payment via Stripe (Fallback)
 */
async function tryStripePayment(
  amount: number,
  currency: string,
  metadata: any
): Promise<{ success: boolean; clientSecret?: string; error?: string }> {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY

    if (!stripeSecret) {
      return { success: false, error: 'Stripe not configured' }
    }

    const StripeLib = (await import('stripe')).default
    const stripe = new StripeLib(stripeSecret)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: { ...metadata, processor: 'stripe' },
    })

    return {
      success: true,
      clientSecret: paymentIntent.client_secret || '',
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
