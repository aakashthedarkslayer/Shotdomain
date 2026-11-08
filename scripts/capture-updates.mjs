import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // 1. Capture Dashboard with card-level Download ZIP button and formatted 12h badge
  await page.goto('http://localhost:3100/schedules', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: 'C:/Users/Admin/.gemini/antigravity/brain/4055cb4f-b6f9-4f4b-a66e-43e65f7cfb87/updated_schedules_dashboard.png',
    fullPage: true,
  });
  console.log('Saved updated_schedules_dashboard.png');

  // 2. Open History drawer
  const historyBtn = page.getByRole('button', { name: 'History' }).first();
  if (await historyBtn.isVisible()) {
    await historyBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'C:/Users/Admin/.gemini/antigravity/brain/4055cb4f-b6f9-4f4b-a66e-43e65f7cfb87/updated_schedules_history.png',
      fullPage: true,
    });
    console.log('Saved updated_schedules_history.png');
  }

  // 3. Open Save Schedule modal to see the new 12h AM/PM time selector
  await page.goto('http://localhost:3100/app', { waitUntil: 'networkidle' });
  await page.locator('input[type="url"]').fill('https://quotes.toscrape.com');
  await page.getByRole('button', { name: 'Discover Pages' }).click();
  await page.waitForSelector('text=Select Pages', { timeout: 15000 });
  await page.getByRole('button', { name: 'Continue to Settings' }).click();
  await page.waitForSelector('text=Save as Schedule', { timeout: 15000 });
  await page.getByRole('button', { name: 'Save as Schedule' }).click();
  await page.waitForSelector('text=Execution Time', { timeout: 5000 });
  await page.screenshot({
    path: 'C:/Users/Admin/.gemini/antigravity/brain/4055cb4f-b6f9-4f4b-a66e-43e65f7cfb87/updated_modal_ampm_picker.png',
    fullPage: true,
  });
  console.log('Saved updated_modal_ampm_picker.png');

  await browser.close();
}

main().catch(console.error);
