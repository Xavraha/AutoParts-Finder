import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { alerts, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ScraperEngine } from '@/lib/scraper/engine';
import { getActiveAdapters } from '@/lib/scraper/registry';
import { sendEmail } from '@/lib/email/send';
import { renderAlertEmail } from '@/lib/email/templates';

export async function POST(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const activeAlerts = await db.query.alerts.findMany({
    where: eq(alerts.isActive, true),
  });

  const engine = new ScraperEngine(getActiveAdapters());
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://autopartsfinder.app';
  let processed = 0;
  let emailsSent = 0;

  for (const alert of activeAlerts) {
    try {
      // Get user for email
      const user = await db.query.users.findFirst({
        where: eq(users.id, alert.userId),
      });

      if (!user?.email || !alert.notifyEmail) continue;

      // Run search with default US center if no location in filters
      const filters = (alert.filtersJson as Record<string, unknown> | null) ?? {};
      const result = await engine.search({
        query: alert.query,
        lat: (filters.lat as number | undefined) ?? 39.5,
        lng: (filters.lng as number | undefined) ?? -98.35,
        radiusMiles: (filters.radiusMiles as number | undefined) ?? 500,
      });

      if (result.listings.length === 0) continue;

      // Render and send email
      const emailData = renderAlertEmail({
        userName: user.name ?? 'there',
        alertQuery: alert.query,
        results: result.listings.slice(0, 5).map((l) => ({
          title: l.title,
          price: l.priceCents ? `$${(l.priceCents / 100).toFixed(2)}` : undefined,
          source: l.sourceName,
          url: l.originalUrl,
          location: [l.city, l.state].filter(Boolean).join(', ') || undefined,
        })),
        alertId: alert.id,
        appUrl,
      });

      await sendEmail({ to: user.email, ...emailData });

      // Update lastTriggeredAt
      await db
        .update(alerts)
        .set({ lastTriggeredAt: new Date() })
        .where(eq(alerts.id, alert.id));

      emailsSent++;
    } catch (err) {
      console.error(`[Cron] Failed to process alert ${alert.id}:`, err);
    }
    processed++;
  }

  return NextResponse.json({ processed, emailsSent });
}

// Vercel Cron: runs every 6 hours
export const GET = POST; // Vercel Cron uses GET by default
