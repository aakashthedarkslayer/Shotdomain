import { chromium } from 'playwright';

async function testSectionMap() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const targetUrl = 'https://quotes.toscrape.com';
  console.log(`Navigating to ${targetUrl}...`);

  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for fonts & scroll to trigger lazy loading
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(r => setTimeout(r, 400));
    window.scrollTo(0, 0);
  });

  // Extract Section Map
  const sectionMap = await page.evaluate(() => {
    const sections = [];
    const seenElements = new Set();

    // Helper to generate a clean, stable selector
    function getSelector(el) {
      if (el.id) return `#${CSS.escape(el.id)}`;
      const tag = el.tagName.toLowerCase();
      if (['header', 'footer', 'main', 'nav'].includes(tag)) {
        return tag;
      }
      if (el.className && typeof el.className === 'string') {
        const classes = el.className.trim().split(/\s+/).filter(c => c && !c.includes(':') && !c.includes('/'));
        if (classes.length > 0) {
          return `${tag}.${classes.slice(0, 2).map(c => CSS.escape(c)).join('.')}`;
        }
      }
      return tag;
    }

    // Helper to get meaningful human-readable label
    function getLabel(el) {
      const tag = el.tagName.toLowerCase();
      const ariaLabel = el.getAttribute('aria-label');
      if (ariaLabel) return ariaLabel;

      const role = el.getAttribute('role');
      if (role) return `${role.charAt(0).toUpperCase() + role.slice(1)} (${tag})`;

      if (el.id) {
        const cleanId = el.id.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return cleanId;
      }

      // Check for first heading
      const heading = el.querySelector('h1, h2, h3, h4');
      if (heading && heading.textContent && heading.textContent.trim().length > 0) {
        const text = heading.textContent.trim();
        return text.length > 30 ? text.slice(0, 30) + '…' : text;
      }

      if (tag === 'header') return 'Header';
      if (tag === 'footer') return 'Footer';
      if (tag === 'nav') return 'Navigation Bar';
      if (tag === 'main') return 'Main Content';

      if (el.className && typeof el.className === 'string') {
        const firstClass = el.className.trim().split(/\s+/)[0];
        if (firstClass) {
          return firstClass.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }
      }

      return `${tag.toUpperCase()} section`;
    }

    // Candidates: landmarks, tags, IDs, roles
    const candidates = Array.from(document.querySelectorAll(
      'header, nav, main, footer, section, article, aside, [role="banner"], [role="navigation"], [role="main"], [role="contentinfo"], div[id], div[class*="header"], div[class*="footer"], div[class*="nav"], div[class*="content"], div[class*="container"], div[class*="hero"], div[class*="quote"]'
    ));

    const bodyRect = document.body.getBoundingClientRect();
    const scrollX = window.scrollX || document.documentElement.scrollLeft || 0;
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;

    let index = 0;
    for (const el of candidates) {
      if (seenElements.has(el)) continue;

      const rect = el.getBoundingClientRect();
      // Filter out hidden, collapsed, or offscreen tiny elements
      if (rect.width < 100 || rect.height < 40) continue;
      // Filter out elements with display: none or visibility: hidden
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

      // Ensure this is not just the whole body / html
      if (el === document.body || el === document.documentElement) continue;

      // Absolute coordinates within the full scrollable page
      const absTop = Math.round(rect.top + scrollY);
      const absLeft = Math.round(rect.left + scrollX);
      const absWidth = Math.round(rect.width);
      const absHeight = Math.round(rect.height);

      // Avoid duplicates with identical geometry
      const isDuplicate = sections.some(s =>
        Math.abs(s.rect.y - absTop) < 5 &&
        Math.abs(s.rect.height - absHeight) < 5 &&
        Math.abs(s.rect.width - absWidth) < 5
      );
      if (isDuplicate) continue;

      seenElements.add(el);
      const tag = el.tagName.toLowerCase();
      const label = getLabel(el);
      const selector = getSelector(el);

      sections.push({
        id: `section-${index++}`,
        label,
        tag,
        selector,
        rect: {
          x: absLeft,
          y: absTop,
          width: absWidth,
          height: absHeight
        }
      });
    }

    // Always add Above the fold (first viewport) if not present
    sections.unshift({
      id: 'preset-above-the-fold',
      label: 'Above the fold (Viewport)',
      tag: 'viewport',
      selector: 'viewport',
      rect: {
        x: 0,
        y: 0,
        width: Math.round(window.innerWidth),
        height: Math.round(window.innerHeight)
      }
    });

    return {
      url: window.location.href,
      pageWidth: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth),
      pageHeight: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
      sections
    };
  });

  console.log(`\n--- Extracted Section Map for ${targetUrl} ---`);
  console.log(`Page Dimensions: ${sectionMap.pageWidth} x ${sectionMap.pageHeight} px`);
  console.log(`Total Sections Detected: ${sectionMap.sections.length}\n`);

  console.log(JSON.stringify(sectionMap, null, 2));

  await browser.close();
}

testSectionMap().catch(console.error);
