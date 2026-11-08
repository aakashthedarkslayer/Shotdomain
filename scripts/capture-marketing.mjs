import { chromium } from 'playwright';
import path from 'path';

const outDir = 'C:/Users/Admin/.gemini/antigravity/brain/4055cb4f-b6f9-4f4b-a66e-43e65f7cfb87';

const viewports = [
  { name: 'marketing_375px', width: 375, height: 812, isMobile: true },
  { name: 'marketing_768px', width: 768, height: 1024, isMobile: false },
  { name: 'marketing_1280px', width: 1280, height: 900, isMobile: false },
  { name: 'marketing_1920px', width: 1920, height: 1080, isMobile: false },
];

async function main() {
  const browser = await chromium.launch({ headless: true });

  for (const vp of viewports) {
    console.log(`Capturing homepage at ${vp.width}x${vp.height}...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      isMobile: vp.isMobile,
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3100', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000); // let animations settle

    // Capture hero fold
    await page.screenshot({
      path: path.join(outDir, `${vp.name}_hero.png`),
      fullPage: false,
    });

    // Capture full page
    await page.screenshot({
      path: path.join(outDir, `${vp.name}_full.png`),
      fullPage: true,
    });

    await context.close();
  }

  // Also capture 404 page and login page
  console.log('Capturing 404 and login pages...');
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });
  const p404 = await ctx.newPage();
  await p404.goto('http://localhost:3100/unexposed-frame-test', { waitUntil: 'networkidle' });
  await p404.screenshot({ path: path.join(outDir, 'marketing_404.png') });
  await p404.close();

  const pLogin = await ctx.newPage();
  await pLogin.goto('http://localhost:3100/login', { waitUntil: 'networkidle' });
  await pLogin.screenshot({ path: path.join(outDir, 'marketing_login.png') });
  await pLogin.close();

  await ctx.close();
  await browser.close();
  console.log('All screenshots captured successfully!');
}

main().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
