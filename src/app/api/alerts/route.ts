import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { getUserAlerts } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { alerts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

const CreateAlertSchema = z.object({
  query: z.string().min(1),
  filtersJson: z.record(z.string(), z.unknown()).optional(),
  notifyEmail: z.boolean().default(true),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized', code: 401 }, { status: 401 });
  }

  const userAlerts = await getUserAlerts(session.user.id);
  return NextResponse.json({ alerts: userAlerts });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized', code: 401 }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateAlertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(', '), code: 400 },
      { status: 400 }
    );
  }

  const [alert] = await db
    .insert(alerts)
    .values({ ...parsed.data, userId: session.user.id })
    .returning();

  return NextResponse.json({ alert }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized', code: 401 }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required', code: 400 }, { status: 400 });

  await db
    .delete(alerts)
    .where(and(eq(alerts.id, id), eq(alerts.userId, session.user.id)));

  return NextResponse.json({ deleted: true });
}
