import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3100', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const sections = [
    { selector: '#problem', name: 'section_problem' },
    { selector: '#how-it-works', name: 'section_how_it_works' },
    { selector: '#multi-device', name: 'section_multi_device' },
    { selector: '#quality-engine', name: 'section_quality_engine' },
    { selector: '#use-cases', name: 'section_use_cases' },
    { selector: '#pricing', name: 'section_pricing' },
    { selector: '#faq', name: 'section_faq' }
  ];

  for (const s of sections) {
    const el = await page.$(s.selector);
    if (el) {
      await el.screenshot({ path: `C:/Users/Admin/.gemini/antigravity/brain/4055cb4f-b6f9-4f4b-a66e-43e65f7cfb87/${s.name}.png` });
      console.log('Saved', s.name);
    } else {
      console.log('Not found:', s.selector);
    }
  }

  await browser.close();
}

main().catch(console.error);
