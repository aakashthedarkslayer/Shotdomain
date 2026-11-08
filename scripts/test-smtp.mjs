import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually without external dependency
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

async function testSmtp() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  console.log('Testing SMTP connection...');
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`User: ${user}`);
  console.log(`Pass: ${pass ? '******** (configured)' : '(NOT SET)'}`);

  if (!host || !user || !pass) {
    console.error('\n❌ Missing SMTP configuration in .env.local');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    await transporter.verify();
    console.log('\n✅ SUCCESS: Connected and authenticated with GoDaddy SMTP server successfully!');
    console.log(`All emails will now be sent from: ${process.env.EMAIL_FROM || user}`);

    console.log('\nSending test confirmation email to hello@shotdomain.com...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"ShotDomain" <hello@shotdomain.com>',
      to: 'hello@shotdomain.com',
      subject: 'ShotDomain Email Service Connected',
      text: 'Your ShotDomain email hello@shotdomain.com has been successfully connected and verified. All scheduled captures and change detection alerts will now be sent from this address.',
      html: '<div style="font-family:sans-serif;padding:24px;border:1px solid #e2e8f0;border-radius:12px;"><h2 style="color:#4f46e5;">ShotDomain Email Connected</h2><p>Your mailbox <strong>hello@shotdomain.com</strong> is live and authenticated.</p><p>All scheduled captures, visual diff notifications, and system reports will now be sent directly from this address.</p></div>',
    });
    console.log(`✅ Test email delivered! Message ID: ${info.messageId}`);
  } catch (err) {
    console.error('\n❌ SMTP Verification Failed:', err.message);
    process.exit(1);
  }
}

testSmtp();
