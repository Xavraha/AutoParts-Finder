import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  // Placeholder — will query DB once connected
  return NextResponse.json({ listings: [], total: 0 });
}
