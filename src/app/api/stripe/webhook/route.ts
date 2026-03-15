import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { handleSubscriptionChange } from '@/lib/stripe/subscription';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        // current_period_end renamed in newer Stripe API versions
        const subAny = sub as unknown as Record<string, unknown>;
        const periodEnd = (subAny['current_period_end'] ?? subAny['billing_cycle_anchor']) as number | undefined;
        await handleSubscriptionChange(
          sub.customer as string,
          sub.status,
          sub.items.data[0]?.price.id ?? null,
          sub.id,
          periodEnd ? new Date(periodEnd * 1000) : null
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(
          sub.customer as string,
          'canceled',
          null,
          sub.id,
          null
        );
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceAny = invoice as unknown as Record<string, unknown>;
        await handleSubscriptionChange(
          invoice.customer as string,
          'past_due',
          null,
          (invoiceAny['subscription'] as string) ?? '',
          null
        );
        break;
      }

      default:
        // Unhandled event type — ignore
        break;
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Handler failed for ${event.type}:`, err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
