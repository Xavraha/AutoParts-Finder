import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { toggleFavorite, getUserFavorites } from '@/lib/db/queries';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized', code: 401 }, { status: 401 });
  }

  const favorites = await getUserFavorites(session.user.id);
  return NextResponse.json({ favorites });
}

const ToggleSchema = z.object({ listingId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized', code: 401 }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ToggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid listingId', code: 400 }, { status: 400 });
  }

  const result = await toggleFavorite(session.user.id, parsed.data.listingId);
  return NextResponse.json(result);
}
