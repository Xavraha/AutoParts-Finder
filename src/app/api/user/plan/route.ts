import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getUserPlan } from '@/lib/stripe/subscription';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const plan = await getUserPlan(session.user.id);
  const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });

  return NextResponse.json({
    plan,
    subscriptionStatus: user?.subscriptionStatus ?? null,
    subscriptionEndsAt: user?.subscriptionEndsAt?.toISOString() ?? null,
  });
}
