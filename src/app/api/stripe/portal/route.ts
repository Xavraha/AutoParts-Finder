import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { createPortalSession } from '@/lib/stripe/subscription';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized', code: 401 }, { status: 401 });
  }

  try {
    const url = await createPortalSession(session.user.id);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Portal session failed';
    return NextResponse.json({ error: message, code: 500 }, { status: 500 });
  }
}
