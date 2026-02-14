import Stripe from 'stripe'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY || ''
    if (!stripeSecret) {
      return NextResponse.json({ error: 'Stripe secret key not configured' }, { status: 500 })
    }
    const StripeLib = (await import('stripe')).default
    const stripe = new StripeLib(stripeSecret)
    const body = await req.json()
    const { amount, currency = 'usd', metadata } = body

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: metadata || {},
    })

    return NextResponse.json({ client_secret: paymentIntent.client_secret })
  } catch (err: any) {
    console.error('create-payment-intent error', err)
    return NextResponse.json({ error: err.message || 'server error' }, { status: 500 })
  }
}
