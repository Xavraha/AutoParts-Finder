export interface AlertEmailData {
  userName: string;
  alertQuery: string;
  results: Array<{
    title: string;
    price?: string;
    source: string;
    url: string;
    location?: string;
  }>;
  alertId: string;
  appUrl: string;
}

export function renderAlertEmail(data: AlertEmailData): { subject: string; html: string; text: string } {
  const subject = `AutoParts Finder: New results for "${data.alertQuery}"`;

  const resultsHtml = data.results
    .slice(0, 5)
    .map(
      (r) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">
          <a href="${r.url}" style="color:#2563eb;font-weight:600;text-decoration:none;">${r.title}</a>
          <br/><small style="color:#6b7280;">${r.source}${r.location ? ' · ' + r.location : ''}</small>
        </td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:700;color:#16a34a;">
          ${r.price ?? 'Price not listed'}
        </td>
      </tr>`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;">
      <div style="background:white;border-radius:12px;padding:24px;border:1px solid #e5e7eb;">
        <h1 style="color:#2563eb;font-size:20px;">🔧 AutoParts Finder Alert</h1>
        <p style="color:#374151;">Hi ${data.userName}, we found new listings for your alert:</p>
        <p style="background:#eff6ff;border-radius:8px;padding:12px;font-weight:600;color:#1e40af;">
          "${data.alertQuery}"
        </p>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:8px;text-align:left;color:#6b7280;font-size:12px;">PART</th>
              <th style="padding:8px;text-align:right;color:#6b7280;font-size:12px;">PRICE</th>
            </tr>
          </thead>
          <tbody>${resultsHtml}</tbody>
        </table>
        <div style="margin-top:20px;text-align:center;">
          <a href="${data.appUrl}/search?q=${encodeURIComponent(data.alertQuery)}"
             style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
            View all results
          </a>
        </div>
        <hr style="margin:20px 0;border:none;border-top:1px solid #e5e7eb;"/>
        <p style="color:#9ca3af;font-size:12px;text-align:center;">
          <a href="${data.appUrl}/alerts" style="color:#6b7280;">Manage your alerts</a>
        </p>
      </div>
    </body>
    </html>`;

  const text = `AutoParts Finder Alert: "${data.alertQuery}"\n\n` +
    data.results.slice(0, 5).map((r) => `- ${r.title} ${r.price ?? ''} (${r.source})\n  ${r.url}`).join('\n') +
    `\n\nView all: ${data.appUrl}/search?q=${encodeURIComponent(data.alertQuery)}`;

  return { subject, html, text };
}
