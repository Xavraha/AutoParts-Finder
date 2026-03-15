import { NextRequest, NextResponse } from 'next/server';
import { buildAffiliateUrl } from '@/lib/utils/affiliate';

// Click tracker: logs the click and redirects with affiliate URL
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const url = searchParams.get('url');
  const source = searchParams.get('source') ?? 'unknown';

  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  let targetUrl: string;
  try {
    // Validate it's a real URL before redirecting
    const parsed = new URL(decodeURIComponent(url));
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    targetUrl = buildAffiliateUrl(source, parsed.toString());
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // Log click for analytics (fire-and-forget — don't block redirect)
  console.log(`[Click] source=${source} url=${targetUrl}`);

  return NextResponse.redirect(targetUrl, { status: 302 });
}
