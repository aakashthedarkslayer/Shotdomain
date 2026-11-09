import nodemailer, { type Transporter } from 'nodemailer';
import type { ScheduledRun, Schedule } from './scheduleStore';

interface EmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string | false;
  error?: string;
}

let cachedTransporter: Transporter | null = null;

async function getTransporter(): Promise<Transporter> {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    return cachedTransporter;
  }

  // Development/Test fallback: create an Ethereal test account automatically
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log('[Email] Created ephemeral test account for development:', testAccount.user);
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return cachedTransporter;
  } catch (err) {
    console.warn('[Email] Could not create Ethereal account, falling back to JSON transport:', err);
    cachedTransporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    return cachedTransporter;
  }
}

/**
 * Send scheduled run completion report to configured recipients
 */
export async function sendScheduledRunEmail(
  schedule: Schedule,
  run: ScheduledRun,
  baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
): Promise<EmailResult> {
  const recipients = schedule.recipients && schedule.recipients.length > 0
    ? schedule.recipients
    : ['hello@shotdomain.com'];

  const fromEmail = process.env.EMAIL_FROM || '"ShotDomain" <hello@shotdomain.com>';
  const isSuccess = run.status === 'success';
  const statusColor = isSuccess ? '#10B981' : run.status === 'partial' ? '#F59E0B' : '#EF4444';
  const statusLabel = isSuccess ? 'Completed Successfully' : run.status === 'partial' ? 'Completed with Warnings' : 'Failed';

  const dashboardUrl = `${baseUrl}/schedules`;

  // Change summary vs. the previous run (absent on the first run).
  const threshold = schedule.changeThreshold ?? 1;
  const changed = run.results
    .filter((r) => typeof r.changePct === 'number' && r.changePct >= threshold)
    .sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0));
  const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  const changesHtml = !run.comparedToRunId
    ? ''
    : changed.length === 0
      ? `<p style="font-size:13px;color:#475569;margin:0 0 24px;">No pages changed by ${threshold}% or more since the previous run.</p>`
      : `<p style="font-size:13px;color:#0f172a;font-weight:600;margin:0 0 8px;">${changed.length} page${changed.length === 1 ? '' : 's'} changed since the previous run</p>
         <table width="100%" cellpadding="6" style="font-size:12px;color:#475569;margin-bottom:24px;border-collapse:collapse;">
           ${changed
             .slice(0, 15)
             .map((r) => `<tr><td style="border-top:1px solid #e2e8f0;">${esc(r.url)}${r.device ? ` · ${esc(r.device)}` : ''}</td><td align="right" style="border-top:1px solid #e2e8f0;white-space:nowrap;">${r.changePct}%</td></tr>`)
             .join('')}
         </table>`;
  const changesText = !run.comparedToRunId
    ? ''
    : changed.length === 0
      ? 'No pages changed since the previous run.'
      : `${changed.length} page(s) changed since the previous run:\n${changed.slice(0, 15).map((r) => `- ${r.url}${r.device ? ` (${r.device})` : ''}: ${r.changePct}%`).join('\n')}`;
  const runDate = new Date(run.timestamp).toLocaleString();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Scheduled Capture Report: ${schedule.name}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 24px; margin: 0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #4F46E5; padding: 24px 32px; color: #ffffff;">
              <h1 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: -0.02em;">ShotDomain · Scheduled Capture Report</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <div style="display: inline-block; padding: 4px 12px; border-radius: 9999px; background-color: ${statusColor}15; color: ${statusColor}; font-size: 12px; font-weight: 600; margin-bottom: 16px;">
                ${statusLabel}
              </div>

              <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #0f172a;">${schedule.name}</h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #64748b;">
                Target: <a href="${schedule.targetUrl}" style="color: #4F46E5; text-decoration: none;">${schedule.targetUrl}</a>
              </p>

              <!-- Metrics Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="12" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <tr>
                  <td width="33%" style="text-align: center; border-right: 1px solid #e2e8f0;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600;">Total Pages</div>
                    <div style="font-size: 20px; font-weight: bold; color: #0f172a; margin-top: 4px;">${run.totalUrls}</div>
                  </td>
                  <td width="33%" style="text-align: center; border-right: 1px solid #e2e8f0;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600;">Captured</div>
                    <div style="font-size: 20px; font-weight: bold; color: #10B981; margin-top: 4px;">${run.completedUrls}</div>
                  </td>
                  <td width="33%" style="text-align: center;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600;">Failed</div>
                    <div style="font-size: 20px; font-weight: bold; color: ${run.failedUrls > 0 ? '#EF4444' : '#64748b'}; margin-top: 4px;">${run.failedUrls}</div>
                  </td>
                </tr>
              </table>

              <!-- Details Table -->
              <table width="100%" border="0" cellspacing="0" cellpadding="8" style="font-size: 13px; color: #475569; margin-bottom: 24px;">
                <tr>
                  <td style="color: #94a3b8; width: 120px;">Execution Time:</td>
                  <td>${runDate}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8;">Frequency:</td>
                  <td style="text-transform: capitalize;">${schedule.frequency}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8;">Devices:</td>
                  <td>${esc((schedule.settings.devices?.length ? schedule.settings.devices : [schedule.settings.device ?? 'Desktop']).join(', '))}</td>
                </tr>
              </table>

              ${changesHtml}

              <!-- Call to Action -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">
                      View Schedule & Download ZIP
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
              ShotDomain Automated Site Captures · <a href="${baseUrl}" style="color: #64748b; text-decoration: none;">shotdomain.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textContent = `
[ShotDomain] Scheduled Capture Report: ${schedule.name}
Status: ${statusLabel}
Target URL: ${schedule.targetUrl}
Execution Time: ${runDate}
Completed: ${run.completedUrls}/${run.totalUrls} (${run.failedUrls} failed)
${changesText}

View results on dashboard: ${dashboardUrl}
  `.trim();

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: fromEmail,
      to: recipients.join(', '),
      subject: changed.length
        ? `[ShotDomain] ${changed.length} page${changed.length === 1 ? '' : 's'} changed: ${schedule.name}`
        : `[ShotDomain] Scheduled Capture: ${schedule.name} (${run.completedUrls}/${run.totalUrls} captured)`,
      text: textContent,
      html: htmlContent,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email] View sent email online: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Email] Failed to send scheduled run email:', errMsg);
    return {
      success: false,
      error: errMsg,
    };
  }
}
