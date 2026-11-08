import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  await page.goto('http://localhost:3100/app', { waitUntil: 'networkidle' });
  await page.locator('input[type="url"]').fill('https://quotes.toscrape.com');
  await page.getByRole('button', { name: 'Discover Pages' }).click();
  
  await page.waitForSelector('text=Select Pages', { timeout: 15000 });
  await page.getByRole('button', { name: 'Continue to Settings' }).click();
  
  await page.waitForSelector('text=Save as Schedule', { timeout: 15000 });
  await page.screenshot({
    path: 'C:/Users/Admin/.gemini/antigravity/brain/4055cb4f-b6f9-4f4b-a66e-43e65f7cfb87/app_step3_schedule_button.png',
    fullPage: true,
  });

  await page.getByRole('button', { name: 'Save as Schedule' }).click();
  await page.waitForSelector('text=Save as Recurring Capture', { timeout: 5000 });
  await page.screenshot({
    path: 'C:/Users/Admin/.gemini/antigravity/brain/4055cb4f-b6f9-4f4b-a66e-43e65f7cfb87/app_save_schedule_modal.png',
    fullPage: true,
  });

  console.log('Saved step 3 and modal screenshots successfully');
  await browser.close();
}

main().catch(console.error);
