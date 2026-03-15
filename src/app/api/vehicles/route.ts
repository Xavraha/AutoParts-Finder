import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { userVehicles } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

const VehicleSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  engine: z.string().optional(),
  nickname: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized', code: 401 }, { status: 401 });
  }

  const vehicles = await db.query.userVehicles.findMany({
    where: eq(userVehicles.userId, session.user.id),
    orderBy: [desc(userVehicles.createdAt)],
  });

  return NextResponse.json({ vehicles });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized', code: 401 }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = VehicleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(', '), code: 400 },
      { status: 400 }
    );
  }

  const [vehicle] = await db
    .insert(userVehicles)
    .values({ ...parsed.data, userId: session.user.id })
    .returning();

  return NextResponse.json({ vehicle }, { status: 201 });
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
    .delete(userVehicles)
    .where(eq(userVehicles.id, id));

  return NextResponse.json({ deleted: true });
}
