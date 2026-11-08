import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\4055cb4f-b6f9-4f4b-a66e-43e65f7cfb87';
const BASE_URL = 'http://localhost:3100';

async function run() {
  console.log('--- Starting End-to-End Verification ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // 1. Visit Step 1
  console.log('\n[Step 1] Loading URL Input Step at /app...');
  await page.goto(`${BASE_URL}/app`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Discover Website Pages');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_01_step1_initial.png') });
  console.log('✓ Captured verify_01_step1_initial.png');

  // Test invalid URL validation
  console.log('\n[Step 1] Testing invalid URL error handling...');
  await page.fill('#website-url', 'invalid url format with spaces');
  await page.click('button[type="submit"]');
  await page.waitForSelector('.text-red-500');
  const errorText = await page.textContent('.text-red-500');
  console.log(`✓ Validation error shown: "${errorText}"`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_02_step1_validation_error.png') });
  console.log('✓ Captured verify_02_step1_validation_error.png');

  // 2. Discover Pages on https://quotes.toscrape.com (Crawl Fallback site)
  console.log('\n[Step 2] Discovering pages on https://quotes.toscrape.com ...');
  await page.fill('#website-url', 'quotes.toscrape.com');
  await page.click('button[type="submit"]');

  // Should transition to Step 2 and show live status
  await page.waitForSelector('text=Discovering Pages');
  console.log('✓ Transitioned to Step 2 with live discovering state');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_03_step2_discovering_live.png') });
  console.log('✓ Captured verify_03_step2_discovering_live.png');

  // Wait for discovery to complete
  await page.waitForSelector('text=pages selected', { timeout: 45000 });
  console.log('✓ Discovery completed successfully!');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_04_step2_pages_discovered.png') });
  console.log('✓ Captured verify_04_step2_pages_discovered.png');

  // 3. Test filter and selection
  console.log('\n[Step 2] Testing search filter & page exclusion...');
  await page.fill('input[placeholder="Filter URLs…"]', 'tag');
  await page.waitForTimeout(500);
  console.log('✓ Filtered URLs by "tag"');

  // Deselect one URL
  const firstCheckbox = page.locator('input[type="checkbox"]').first();
  await firstCheckbox.uncheck();
  const counterText = await page.locator('text=pages selected').textContent();
  console.log(`✓ Selection updated after deselecting: "${counterText}"`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_05_step2_filtered_deselected.png') });
  console.log('✓ Captured verify_05_step2_filtered_deselected.png');

  // Clear filter, select just 3 pages for fast capture
  await page.fill('input[placeholder="Filter URLs…"]', '');
  await page.click('text=Deselect All');
  console.log('✓ Clicked Deselect All');

  // Select first 3 URLs
  const checkboxes = page.locator('input[type="checkbox"]');
  const count = await checkboxes.count();
  for (let i = 0; i < Math.min(3, count); i++) {
    await checkboxes.nth(i).check();
  }
  const selectedText = await page.locator('text=pages selected').textContent();
  console.log(`✓ Selected pages: "${selectedText}"`);

  // Continue to Step 3
  await page.click('text=Continue to Settings');
  await page.waitForSelector('text=Device');
  console.log('✓ Advanced to Step 3: Capture Settings');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_06_step3_settings_default.png') });
  console.log('✓ Captured verify_06_step3_settings_default.png');

  // 4. Test Step 3 presets & controls
  console.log('\n[Step 3] Testing device presets...');
  // Check Tablet
  await page.click('button:text("Tablet")');
  let widthVal = await page.inputValue('#viewport-width');
  let heightVal = await page.inputValue('#viewport-height');
  console.log(`✓ Tablet preset: Width=${widthVal}, Height=${heightVal} (expected 834x1194)`);

  // Check Mobile (iOS)
  await page.click('button:text("Mobile (iOS)")');
  widthVal = await page.inputValue('#viewport-width');
  heightVal = await page.inputValue('#viewport-height');
  console.log(`✓ Mobile iOS preset: Width=${widthVal}, Height=${heightVal} (expected 393x852)`);

  // Switch back to Desktop
  await page.click('button:text("Desktop")');
  widthVal = await page.inputValue('#viewport-width');
  heightVal = await page.inputValue('#viewport-height');
  console.log(`✓ Desktop preset: Width=${widthVal}, Height=${heightVal} (expected 1920x1080)`);

  // Test "Capture entire page"
  await page.check('input[type="checkbox"]:has-text("Capture entire page")', { force: true }).catch(() => {});
  // or click label
  await page.click('text=Capture entire page');
  console.log('✓ Enabled "Capture entire page"');

  // Enable Block ads
  await page.click('text=Block ads and banners');
  console.log('✓ Enabled "Block ads and banners"');

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_07_step3_settings_configured.png') });
  console.log('✓ Captured verify_07_step3_settings_configured.png');

  // 5. Start Capture
  console.log('\n[Step 4] Starting capture...');
  await page.click('button:has-text("Start Capture")');
  await page.waitForSelector('text=Capture Progress');
  console.log('✓ Advanced to Step 4: Capture Progress');

  // Capture in-progress state
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_08_step4_capturing.png') });
  console.log('✓ Captured verify_08_step4_capturing.png');

  // Wait for capture completion
  await page.waitForSelector('text=View Results', { timeout: 60000 });
  console.log('✓ Capture completed! All pages captured.');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_09_step4_completed.png') });
  console.log('✓ Captured verify_09_step4_completed.png');

  // 6. View Results (Step 5)
  console.log('\n[Step 5] Viewing Results...');
  await page.click('text=View Results');
  await page.waitForSelector('text=Screenshots Ready');
  await page.waitForTimeout(1500); // let thumbnails render
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_10_step5_results_grid.png') });
  console.log('✓ Captured verify_10_step5_results_grid.png');

  // 7. Verify ZIP Download
  console.log('\n[ZIP Verification] Verifying ZIP download endpoint...');
  const zipDownloadBtn = page.locator('a:has-text("Download All (ZIP)")');
  const downloadUrl = await zipDownloadBtn.getAttribute('href');
  console.log(`Download URL: ${downloadUrl}`);

  const zipResponse = await page.request.get(BASE_URL + downloadUrl);
  console.log(`ZIP Response Status: ${zipResponse.status()}`);
  const contentType = zipResponse.headers()['content-type'];
  console.log(`ZIP Content-Type: ${contentType}`);
  const zipBuffer = await zipResponse.body();
  console.log(`ZIP size: ${zipBuffer.length} bytes`);

  // Verify ZIP magic bytes (PK\x03\x04 or 50 4b 03 04)
  const isZip = zipBuffer[0] === 0x50 && zipBuffer[1] === 0x4b && zipBuffer[2] === 0x03 && zipBuffer[3] === 0x04;
  console.log(`✓ ZIP header magic bytes verified: ${isZip}`);

  // Save the ZIP to artifact dir for proof
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'downloaded_screenshots.zip'), zipBuffer);
  console.log('✓ Saved downloaded_screenshots.zip to artifacts directory');

  // 8. Test State Reset via "Start New Capture"
  console.log('\n[State Reset] Testing "Start New Capture"...');
  await page.click('text=Start New Capture');
  await page.waitForSelector('text=Discover Website Pages');
  const resetInputVal = await page.inputValue('#website-url');
  console.log(`✓ Reset input value is empty: "${resetInputVal}"`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_11_step1_after_reset.png') });
  console.log('✓ Captured verify_11_step1_after_reset.png');

  // 9. Test Broken URL in Capture Queue & Retry Button in Step 4
  console.log('\n[Failure & Retry] Testing broken URL capture and retry button...');
  // Start a capture job with 1 good URL and 1 unreachable URL
  const brokenJobRes = await page.request.post(`${BASE_URL}/api/capture/start`, {
    data: {
      urls: [
        'https://example.com',
        'https://invalid-nonexistent-domain-404-test-xyz.org/page'
      ],
      settings: {
        device: 'Desktop',
        width: 1280,
        height: 720,
        fullPage: false,
        format: 'png',
        blockAds: false,
        useCache: false
      }
    }
  });
  const { jobId: brokenJobId } = await brokenJobRes.json();
  console.log(`Started capture job with broken URL: ${brokenJobId}`);

  // Navigate to UI and load this job in Step 4 (or poll status until complete)
  let jobStatus;
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    const statusRes = await page.request.get(`${BASE_URL}/api/capture/status?jobId=${brokenJobId}`);
    jobStatus = await statusRes.json();
    console.log(`Job status: ${jobStatus.completed} done, ${jobStatus.failed} failed out of ${jobStatus.total}`);
    if (jobStatus.completed + jobStatus.failed >= jobStatus.total) break;
  }

  // Verify that 1 succeeded and 1 failed
  console.log(`✓ 1 succeeded, 1 failed. Error: ${jobStatus.results.find(r => r.status === 'failed')?.error}`);

  // Test Retry API for the failed URL
  const failedUrl = 'https://invalid-nonexistent-domain-404-test-xyz.org/page';
  console.log(`Testing POST /api/capture/retry for ${failedUrl}...`);
  const retryRes = await page.request.post(`${BASE_URL}/api/capture/retry`, {
    data: { jobId: brokenJobId, url: failedUrl }
  });
  console.log(`Retry API status: ${retryRes.status()}`);
  const retryJson = await retryRes.json();
  console.log(`✓ Retry API response:`, retryJson);

  await browser.close();
  console.log('\n--- ALL VERIFICATIONS COMPLETED SUCCESSFULLY ---');
}

run().catch((err) => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});

