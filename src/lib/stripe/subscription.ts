import { getStripe, PLANS, type PlanKey } from './client';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getUserPlan(userId: string): Promise<PlanKey> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (
    user?.subscriptionStatus === 'active' &&
    user.subscriptionEndsAt &&
    user.subscriptionEndsAt > new Date()
  ) {
    return 'premium';
  }

  return 'free';
}

export async function createCheckoutSession(userId: string, email: string): Promise<string> {
  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  // Get or create Stripe customer
  let customerId: string;
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });

  if (user?.stripeCustomerId) {
    customerId = user.stripeCustomerId;
  } else {
    const customer = await stripe.customers.create({ email, metadata: { userId } });
    customerId = customer.id;
    await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, userId));
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: PLANS.premium.priceId,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/settings?upgrade=success`,
    cancel_url: `${appUrl}/pricing`,
    metadata: { userId },
    subscription_data: {
      metadata: { userId },
    },
  });

  return session.url!;
}

export async function createPortalSession(userId: string): Promise<string> {
  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user?.stripeCustomerId) throw new Error('No Stripe customer found');

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl}/settings`,
  });

  return session.url;
}

export async function handleSubscriptionChange(
  stripeCustomerId: string,
  status: string,
  priceId: string | null,
  subscriptionId: string,
  endsAt: Date | null
): Promise<void> {
  await db
    .update(users)
    .set({
      subscriptionStatus: status,
      stripePriceId: priceId,
      stripeSubscriptionId: subscriptionId,
      subscriptionEndsAt: endsAt,
    })
    .where(eq(users.stripeCustomerId, stripeCustomerId));
}
