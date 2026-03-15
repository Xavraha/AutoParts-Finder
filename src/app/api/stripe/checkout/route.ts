import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { createCheckoutSession } from '@/lib/stripe/subscription';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized', code: 401 }, { status: 401 });
  }

  try {
    const url = await createCheckoutSession(session.user.id, session.user.email);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return NextResponse.json({ error: message, code: 500 }, { status: 500 });
  }
}
