import { chromium } from 'playwright';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';
const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\4055cb4f-b6f9-4f4b-a66e-43e65f7cfb87';

async function run() {
  console.log('--- Starting Marketing Landing Page Verification ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // 1. Load Landing Page
  console.log(`[1] Loading landing page at ${BASE_URL}/ ...`);
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  // Check Title / Brand
  await page.waitForSelector('text=ShotDomain');
  console.log('✓ Brand logo and name visible: ShotDomain');

  // Check Hero Headline
  const headline = await page.locator('h1').textContent();
  console.log(`✓ Hero headline: "${headline.replace(/\s+/g, ' ').trim()}"`);

  // Check Value Props
  await page.waitForSelector('text=No credit card required');
  await page.waitForSelector('text=Playwright 4x concurrency');
  console.log('✓ Value prop badges present');

  // Check Tool Mockup
  await page.waitForSelector('text=https://quotes.toscrape.com');
  console.log('✓ Interactive browser mockup container rendered');

  // Check "How It Works" 4 steps
  await page.waitForSelector('text=From URL to Complete Archive in 4 Steps');
  await page.waitForSelector('text=Enter Domain & Auto-Discover');
  await page.waitForSelector('text=Filter & Bulk Select Pages');
  await page.waitForSelector('text=Configure Device & Viewport');
  await page.waitForSelector('text=Download All in One Organized ZIP');
  console.log('✓ All 4 "How It Works" steps rendered with screenshots');

  // Check Features
  await page.waitForSelector('text=Engineered for Designers, Developers & QA');
  await page.waitForSelector('text=Sitemap Index Discovery');
  await page.waitForSelector('text=4x Concurrent Playwright');
  await page.waitForSelector('text=Full-Page Scrolling');
  console.log('✓ Features grid rendered');

  // Check Pricing Plans
  await page.waitForSelector('text=Simple, Predictable Pricing');
  await page.waitForSelector('text=$0');
  await page.waitForSelector('text=5 capture jobs');
  await page.waitForSelector('text=$5');
  await page.waitForSelector('text=Most Popular');
  await page.waitForSelector('text=$50');
  await page.waitForSelector('text=Best Value');
  console.log('✓ Pricing cards verified: Free ($0/lifetime), Monthly ($5/mo), Lifetime ($50 one-time)');

  // Test FAQ Accordion
  console.log('[2] Testing FAQ Accordion interaction...');
  const firstFaqButton = page.locator('#faq button').first();
  await firstFaqButton.click();
  await page.waitForTimeout(300);
  await page.waitForSelector('text=probes standard sitemap locations');
  console.log('✓ FAQ accordion item expanded successfully');

  // Capture Desktop Screenshot
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'landing_01_desktop.png'), fullPage: true });
  console.log('✓ Captured full desktop landing page: landing_01_desktop.png');

  // Test Mobile Viewport
  console.log('[3] Testing Mobile responsive layout (393x852)...');
  await page.setViewportSize({ width: 393, height: 852 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'landing_02_mobile.png'), fullPage: false });
  console.log('✓ Captured mobile viewport: landing_02_mobile.png');

  // Test Navigation to /app
  console.log('[4] Testing Navigation from Landing to /app...');
  await page.setViewportSize({ width: 1440, height: 900 });
  const tryFreeBtn = page.locator('a:has-text("Try it free")').first();
  await tryFreeBtn.click();
  await page.waitForURL('**/app');
  await page.waitForSelector('text=Discover Website Pages');
  await page.waitForSelector('#website-url');
  console.log('✓ Navigated to /app. 5-step capture tool is active!');

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'landing_03_app_view.png') });
  console.log('✓ Captured /app view: landing_03_app_view.png');

  await browser.close();
  console.log('\n--- LANDING PAGE VERIFICATION SUCCESSFUL ---');
}

run().catch((err) => {
  console.error('Landing page verification failed:', err);
  process.exit(1);
});
