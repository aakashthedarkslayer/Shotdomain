// Builds a small fictional shop site (example.com, 412 pages in six templates) for round 3 of the
// premium-ui directions. ShotDomain's design needs real captures to print, and the sample site in
// design/directions/shell.html is fictional, so this makes it real: six pages break their template
// on purpose (the same six as SAMPLE_SITE's outliers), so the odd-page detection can be tested.
//
//   node design/demo-site/build.mjs <outdir>
//
// Output is generated, not committed. Images are drawn as inline SVG, so nothing is fetched.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

const OUT = process.argv[2];
if (!OUT) throw new Error('usage: node build.mjs <outdir>');

function rnd(seed) { let s = (seed * 2654435761) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const pick = (r, a) => a[Math.floor(r() * a.length)];

const WORDS = 'light oak linen morning studio shelf lamp table window quiet room wool paper desk ceramic kitchen garden autumn winter summer spring weekend notes making slow small simple honest warm clay stone brass cotton walnut ash maple reading working sleeping hosting'.split(' ');
const SENT = [
  'We spent the season testing every piece in real rooms, not in a showroom.',
  'Most of what we make starts as a sketch on the back of an order slip.',
  'The finish takes three days to cure, so we never rush the last coat.',
  'Customers asked for a smaller size, and this is what we came back with.',
  'Every batch is checked by hand before it leaves the workshop.',
  'We would rather make fewer things and keep making them for years.',
  'The wood comes from a mill two hours north, cut to order each month.',
  'A good lamp should disappear until the moment you need it.',
  'We changed the stitching after a year of feedback from early buyers.',
  'Shipping is carbon neutral, and every box is made from recycled board.',
  'Our studio opens to visitors on the first Saturday of every month.',
  'The colour is mixed in small runs, so each batch is a little different.',
];
const para = (r, n) => Array.from({ length: n }, () => pick(r, SENT)).join(' ');
const title = (r, n) => { const w = Array.from({ length: n }, () => pick(r, WORDS)); w[0] = w[0][0].toUpperCase() + w[0].slice(1); return w.join(' '); };

const SKIES = [['#f4c9a8', '#e07a5f'], ['#cfe3ea', '#3d7a8c'], ['#f6e3b4', '#c9822b'], ['#e4d8ef', '#6d5a96'], ['#d8e8d2', '#4f7d4a'], ['#f3d0d0', '#b6545b'], ['#d9dee8', '#44546f']];
function scene(r, w, h, kind = 'room') {
  const [sky, deep] = pick(r, SKIES);
  const hill = (y, c, a) => `<path d="M0 ${h} L0 ${y} Q ${w * (0.2 + r() * 0.2)} ${y - h * (0.1 + r() * 0.2)} ${w * 0.5} ${y} T ${w} ${y - h * r() * 0.15} L ${w} ${h} Z" fill="${c}" opacity="${a}"/>`;
  if (kind === 'product') {
    const cx = w / 2, base = h * 0.82;
    const obj = pick(r, ['lamp', 'shelf', 'vase', 'chair']);
    let o = `<rect width="${w}" height="${h}" fill="${sky}"/><rect y="${base}" width="${w}" height="${h - base}" fill="${deep}" opacity=".25"/>`;
    if (obj === 'lamp') o += `<rect x="${cx - 4}" y="${h * 0.35}" width="8" height="${base - h * 0.35}" fill="#2b2b2b"/><path d="M${cx - w * 0.16} ${h * 0.38} L${cx - w * 0.07} ${h * 0.16} L${cx + w * 0.07} ${h * 0.16} L${cx + w * 0.16} ${h * 0.38} Z" fill="${deep}"/><ellipse cx="${cx}" cy="${base}" rx="${w * 0.1}" ry="8" fill="#2b2b2b"/>`;
    if (obj === 'shelf') for (let k = 0; k < 3; k++) o += `<rect x="${w * 0.2}" y="${h * (0.3 + k * 0.18)}" width="${w * 0.6}" height="10" fill="#8a5a33"/><rect x="${w * (0.25 + r() * 0.3)}" y="${h * (0.3 + k * 0.18) - 34}" width="22" height="34" fill="${deep}"/>`;
    if (obj === 'vase') o += `<path d="M${cx - 30} ${base} Q ${cx - 70} ${h * 0.5} ${cx - 18} ${h * 0.3} L ${cx + 18} ${h * 0.3} Q ${cx + 70} ${h * 0.5} ${cx + 30} ${base} Z" fill="${deep}"/>`;
    if (obj === 'chair') o += `<rect x="${cx - 50}" y="${h * 0.55}" width="100" height="14" fill="#8a5a33"/><rect x="${cx - 46}" y="${h * 0.25}" width="12" height="${h * 0.3}" fill="#8a5a33"/><rect x="${cx - 46}" y="${h * 0.55}" width="10" height="${base - h * 0.55}" fill="#5e3d22"/><rect x="${cx + 36}" y="${h * 0.55}" width="10" height="${base - h * 0.55}" fill="#5e3d22"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">${o}</svg>`;
  }
  const sun = `<circle cx="${w * (0.2 + r() * 0.6)}" cy="${h * (0.2 + r() * 0.2)}" r="${h * (0.08 + r() * 0.06)}" fill="#fff" opacity=".75"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice"><rect width="${w}" height="${h}" fill="${sky}"/>${sun}${hill(h * 0.62, deep, 0.45)}${hill(h * 0.74, deep, 0.75)}${hill(h * 0.86, '#2b2b2b', 0.55)}</svg>`;
}
const svgImg = (svg, cls, alt) => `<img class="${cls}" alt="${alt}" src="data:image/svg+xml;utf8,${encodeURIComponent(svg)}">`;

const CSS = `
*{box-sizing:border-box}html,body{margin:0}body{font:17px/1.6 Inter,system-ui,sans-serif;color:#1f2420;background:#fff}
a{color:#2f5d50}.wrap{max-width:1360px;margin:0 auto;padding:0 40px}
.top{border-bottom:1px solid #e6e6e1}.top .wrap{display:flex;align-items:center;gap:40px;height:76px}
.logo{font-weight:800;font-size:22px;letter-spacing:-.02em;color:#1f2420;text-decoration:none}.logo b{color:#2f5d50}
.top nav{display:flex;gap:28px;font-size:15px}.top nav a{color:#1f2420;text-decoration:none}.top .cart{margin-left:auto;font-size:15px;padding:8px 16px;border:1px solid #1f2420;border-radius:999px}
h1{font-size:54px;line-height:1.08;letter-spacing:-.025em;margin:0 0 18px;font-weight:700}h2{font-size:30px;letter-spacing:-.015em;margin:48px 0 12px}
.meta{color:#667066;font-size:15px;margin-bottom:28px}
.hero{display:block;width:100%;height:520px;object-fit:cover;border-radius:6px;margin:40px 0 44px}
.article{max-width:760px}.article p{margin:0 0 20px}
.quote{font-size:28px;line-height:1.3;border-left:4px solid #2f5d50;padding-left:24px;margin:36px 0}
.related{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin:64px 0}.related img{width:100%;height:220px;object-fit:cover;border-radius:6px}.related h3{font-size:19px;margin:12px 0 0}
footer{background:#f3f2ee;margin-top:80px;padding:56px 0;font-size:15px;color:#4d554d}footer .wrap{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:28px}
.btn{display:inline-block;background:#2f5d50;color:#fff;text-decoration:none;padding:14px 26px;border-radius:999px;font-weight:600}
table{border-collapse:collapse;font-size:15px;margin:24px 0}td,th{border-bottom:1px solid #e0e0da;padding:10px 14px;text-align:left;white-space:nowrap}
.docs{display:grid;grid-template-columns:280px minmax(0,1fr);gap:56px;padding-top:32px}.side{font-size:15px;line-height:2.1;border-right:1px solid #e6e6e1;min-height:900px}.side b{display:block;margin-top:14px;font-size:13px;color:#667066}.side a{display:block;color:#1f2420;text-decoration:none}.side a.on{color:#2f5d50;font-weight:700}
.docs h1{font-size:42px}.docs pre{background:#1f2420;color:#e9efe8;padding:20px 22px;border-radius:6px;font:14px/1.6 'JetBrains Mono',monospace;overflow:auto}
.note{background:#eef4f1;border-left:4px solid #2f5d50;padding:14px 18px;margin:24px 0;font-size:15px}
.prod{display:grid;grid-template-columns:1.2fr 1fr;gap:64px;padding-top:40px}.prod .photo{width:100%;height:640px;object-fit:cover;border-radius:6px}.prod .price{font-size:28px;margin:8px 0 24px}
.thumbs{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:12px}.thumbs img{width:100%;height:110px;object-fit:cover;border-radius:4px}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}.grid4 img{width:100%;height:300px;object-fit:cover;border-radius:6px}
.big{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;padding:56px 0}.big img{width:100%;height:600px;object-fit:cover;border-radius:6px}.big h1{font-size:72px}
.plans{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin:40px 0}.plan{border:1px solid #e0e0da;border-radius:8px;padding:32px}.plan.feat{border:2px solid #2f5d50}.plan .p{font-size:44px;font-weight:700}
`;
const OLD_CSS = `body{font:18px/1.7 'DejaVu Serif',Georgia,serif;color:#333;background:#fbfaf6}.oldtop{background:#3b3b3b;color:#fff;text-align:center;padding:30px 0 18px}.oldtop .logo{color:#fff;font-family:'DejaVu Serif',Georgia,serif;font-size:34px;font-weight:400;letter-spacing:.1em}.oldtop nav{margin-top:12px;font-size:13px;letter-spacing:.2em;text-transform:uppercase}.oldtop nav a{color:#ddd;margin:0 14px;text-decoration:none}.oldwrap{max-width:680px;margin:0 auto;padding:40px 20px}.oldwrap h1{font-family:'DejaVu Serif',Georgia,serif;font-weight:400;font-size:40px;font-style:italic}`;

const head = (t, extra = '') => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${t} | Example</title><style>${CSS}${extra}
@media (max-width:700px){.wrap{padding:0 20px}.top nav{display:none}h1{font-size:36px}.hero{height:240px;margin:24px 0}.related,.grid4,.plans,.big,.prod,.docs{grid-template-columns:1fr}.side{display:none}.big img,.prod .photo{height:360px}.big h1{font-size:44px}footer .wrap{grid-template-columns:1fr 1fr}}</style></head><body>`;
const top = `<header class="top"><div class="wrap"><a class="logo" href="/">exam<b>ple</b></a><nav><a href="/product/desk-lamp">Shop</a><a href="/blog/launch-notes">Journal</a><a href="/docs">Docs</a><a href="/pricing">Pricing</a><a href="/about">About</a></nav><span class="cart">Cart (0)</span></div></header>`;
const foot = `<footer><div class="wrap"><div><b>Example</b><br>Furniture and lighting made in small runs.</div><div>Shop<br>Journal<br>Docs</div><div>About<br>Careers<br>Press</div><div>Terms<br>Privacy<br>Security</div></div></footer></body></html>`;

const pages = [];
const add = (path, html) => pages.push({ path, html });

// Blog: 214 posts, 3 odd.
const BLOG_NAMED = ['launch-notes', 'pricing-update', 'hiring-designers', 'q3-roadmap', 'customer-story-ferro', 'accessibility-audit'];
for (let i = 0; i < 214; i++) {
  const r = rnd(1000 + i);
  let slug = i < BLOG_NAMED.length ? BLOG_NAMED[i] : `${pick(r, WORDS)}-${pick(r, WORDS)}-${i}`;
  if (i === 40) slug = '2019-recap'; if (i === 90) slug = 'benchmarks'; if (i === 150) slug = 'old-theme-post';
  const t = title(r, 3 + Math.floor(r() * 5));
  const date = `${1 + Math.floor(r() * 28)} ${pick(r, ['March', 'April', 'May', 'June', 'July', 'September', 'October'])} 2026`;
  if (slug === 'old-theme-post') {
    add(`/blog/${slug}`, head(t, OLD_CSS).replace('<body>', '<body>') + `<header class="oldtop"><div class="logo">EXAMPLE</div><nav><a>Home</a><a>Shop</a><a>Journal</a><a>Contact</a></nav></header><main class="oldwrap"><h1>${t}</h1><p class="meta">Posted ${date}</p>${Array.from({ length: 7 }, () => `<p>${para(r, 4)}</p>`).join('')}</main></body></html>`);
    continue;
  }
  const hero = slug === '2019-recap' ? `<img class="hero-missing" src="/images/2019-recap-hero.jpg" alt="Our year in review">` : svgImg(scene(r, 1280, 520), 'hero', '');
  const n = 4 + Math.floor(r() * 5);
  let body = '';
  for (let k = 0; k < n; k++) { body += `<p>${para(r, 3 + Math.floor(r() * 3))}</p>`; if (k === 1 && r() > 0.5) body += `<p class="quote">${pick(r, SENT)}</p>`; if (k === 2 && r() > 0.6) body += `<h2>${title(r, 3)}</h2>`; }
  if (slug === 'benchmarks') body = `<p>${para(r, 3)}</p><h2>Results by finish</h2><table><tr>${['Finish', 'Batch', 'Cure, h', 'Gloss', 'Scratch', 'Water', 'Heat', 'UV, 500 h', 'UV, 1000 h', 'Yellowing', 'Cost per m²', 'Supplier', 'Notes'].map((c) => `<th>${c}</th>`).join('')}</tr>${Array.from({ length: 6 }, (_, k) => `<tr>${['Hardwax oil', 'Water lacquer', 'Soap finish', 'Shellac', 'Polyurethane', 'Linseed'][k] ? `<td>${['Hardwax oil', 'Water lacquer', 'Soap finish', 'Shellac', 'Polyurethane', 'Linseed'][k]}</td>` : ''}${Array.from({ length: 12 }, () => `<td>${(r() * 100).toFixed(1)} units measured</td>`).join('')}</tr>`).join('')}</table>` + body;
  const rel = Array.from({ length: 3 }, (_, k) => `<div>${svgImg(scene(rnd(5000 + i * 3 + k), 400, 220), '', '')}<h3>${title(rnd(7000 + i * 3 + k), 4)}</h3></div>`).join('');
  add(`/blog/${slug}`, head(t) + top + `<main class="wrap">${hero}<div class="article"><h1>${t}</h1><div class="meta">${date}, by ${pick(r, ['Ana Ruiz', 'Sam Okafor', 'Lena Park', 'Tom Hale'])}</div>${body}</div><div class="related">${rel}</div></main>` + foot);
}

// Docs: 140 pages, 2 odd.
const DOCS_NAMED = ['', 'setup', 'api', 'webhooks', 'limits', 'faq', 'changelog', 'status'];
const SIDE = ['Getting started', 'Setup', 'Orders API', 'Products API', 'Webhooks', 'Rate limits', 'Errors', 'FAQ', 'Changelog'];
for (let i = 0; i < 140; i++) {
  const r = rnd(20000 + i);
  let slug = i < DOCS_NAMED.length ? DOCS_NAMED[i] : `${pick(r, ['orders', 'products', 'stock', 'partners', 'shipping', 'returns'])}/${pick(r, WORDS)}-${i}`;
  if (i === 30) slug = 'api/v1'; if (i === 70) slug = 'legacy';
  const t = title(r, 2 + Math.floor(r() * 3));
  const code = (long) => `<pre>${long ? 'curl -X POST https://api.example.com/v1/orders/create?include=line_items,shipping_address,billing_address,customer,discounts,tax_lines,fulfilments,refunds,metafields&amp;expand=all&amp;format=json -H "Authorization: Bearer $EXAMPLE_PARTNER_TOKEN_FOR_THE_WHOLESALE_PORTAL"' : `curl https://api.example.com/v2/${pick(r, ['orders', 'products', 'stock'])} \\\n  -H "Authorization: Bearer $TOKEN" \\\n  -d '{ "limit": ${10 + Math.floor(r() * 90)} }'`}</pre>`;
  let body = `<p>${para(r, 3)}</p>${code(false)}<p>${para(r, 2 + Math.floor(r() * 3))}</p>`;
  if (r() > 0.5) body += `<div class="note">${pick(r, SENT)}</div>`;
  body += `<h2>${title(r, 2)}</h2><p>${para(r, 3)}</p>${r() > 0.4 ? code(false) : ''}<p>${para(r, 2)}</p>`;
  if (slug === 'api/v1') body = `<p>${para(r, 2)}</p><pre style="overflow:visible;white-space:pre">${'curl -X POST https://api.example.com/v1/orders/create?include=line_items,shipping_address,billing_address,customer,discounts,tax_lines,fulfilments,refunds,metafields&amp;expand=all&amp;format=json -H "Authorization: Bearer $EXAMPLE_PARTNER_TOKEN_FOR_THE_WHOLESALE_PORTAL" -H "Content-Type: application/json"'}</pre><p>${para(r, 3)}</p>` + body;
  const on = Math.floor(r() * SIDE.length);
  const side = SIDE.map((s, k) => (k === 0 ? '<b>Guides</b>' : k === 2 ? '<b>Reference</b>' : '') + `<a class="${k === on ? 'on' : ''}">${s}</a>`).join('');
  if (slug === 'legacy') {
    add(`/docs/${slug}`, head(t, `.docs .side{background:#2d3436;color:#fff;border:0;padding:20px;font-family:'DejaVu Serif',serif}.docs .side a{color:#dfe6e9}.docs h1,.docs h2{font-family:'DejaVu Serif',serif;font-weight:400}`) + top + `<main class="wrap docs"><aside class="side">${side}${side}</aside><article><h1>${t}</h1>${body}</article></main>` + foot);
    continue;
  }
  add(`/docs${slug ? '/' + slug : ''}`, head(t) + top + `<main class="wrap docs"><aside class="side">${side}</aside><article><h1>${t}</h1>${body}</article></main>` + foot);
}

// Product: 48 pages, 1 odd.
const PROD_NAMED = ['desk-lamp', 'oak-shelf', 'linen-throw', 'gift-card'];
for (let i = 0; i < 48; i++) {
  const r = rnd(30000 + i);
  const slug = i < PROD_NAMED.length ? PROD_NAMED[i] : `${pick(r, WORDS)}-${pick(r, ['lamp', 'shelf', 'stool', 'throw', 'vase', 'bench', 'tray'])}-${i}`;
  const t = slug === 'gift-card' ? 'Gift card' : title(r, 2 + Math.floor(r() * 2));
  const photo = slug === 'gift-card' ? `<img class="photo-missing" src="/images/gift-card.jpg" alt="Gift card">` : svgImg(scene(r, 800, 640, 'product'), 'photo', '') + `<div class="thumbs">${Array.from({ length: 4 }, (_, k) => svgImg(scene(rnd(31000 + i * 4 + k), 200, 110, 'product'), '', '')).join('')}</div>`;
  const specs = `<table>${['Size', 'Material', 'Finish', 'Weight', 'Made in'].map((s) => `<tr><th>${s}</th><td>${pick(r, ['Oak', 'Walnut', 'Ash', 'Brass', 'Linen'])} ${Math.floor(r() * 90 + 10)}</td></tr>`).join('')}</table>`;
  add(`/product/${slug}`, head(t) + top + `<main class="wrap"><div class="prod"><div>${photo}</div><div><h1>${t}</h1><div class="price">$${Math.floor(r() * 400 + 40)}</div><a class="btn">Add to cart</a><p style="margin-top:28px">${para(r, 4)}</p>${specs}</div></div><h2>You might also like</h2><div class="grid4">${Array.from({ length: 4 }, (_, k) => svgImg(scene(rnd(32000 + i * 4 + k), 300, 300, 'product'), '', '')).join('')}</div></main>` + foot);
}

// Home and pricing.
{ const r = rnd(1); add('/', head('Home') + top + `<main class="wrap"><div class="big"><div><h1>Furniture for rooms you live in.</h1><p>${para(r, 2)}</p><a class="btn">Shop the collection</a></div>${svgImg(scene(r, 700, 600), '', '')}</div><h2>New this season</h2><div class="grid4">${Array.from({ length: 4 }, (_, k) => svgImg(scene(rnd(40 + k), 300, 300, 'product'), '', '')).join('')}</div><h2>From the journal</h2><div class="related">${Array.from({ length: 3 }, (_, k) => `<div>${svgImg(scene(rnd(60 + k), 400, 220), '', '')}<h3>${title(rnd(80 + k), 4)}</h3></div>`).join('')}</div></main>` + foot); }
{ const r = rnd(2); add('/pricing', head('Pricing') + top + `<main class="wrap"><h1 style="margin-top:56px">Studio membership</h1><p>${para(r, 2)}</p><div class="plans">${['Visitor', 'Member', 'Trade'].map((p, k) => `<div class="plan ${k === 1 ? 'feat' : ''}"><h3>${p}</h3><div class="p">$${[0, 12, 40][k]}</div><p>${para(r, 2)}</p><a class="btn">Choose ${p.toLowerCase()}</a></div>`).join('')}</div></main>` + foot); }
// One-off pages.
for (const [k, s] of ['about', 'contact', 'careers', 'press', 'terms', 'privacy', 'security', 'status'].entries()) {
  const r = rnd(90 + k);
  add(`/${s}`, head(s) + top + `<main class="wrap"><div class="article" style="padding-top:56px"><h1>${s[0].toUpperCase() + s.slice(1)}</h1>${Array.from({ length: 3 + k % 4 }, () => `<p>${para(r, 4)}</p>`).join('')}</div></main>` + foot);
}

for (const p of pages) {
  const f = join(OUT, p.path === '/' ? 'index.html' : p.path.slice(1) + '/index.html');
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, p.html);
}
writeFileSync(join(OUT, 'pages.json'), JSON.stringify(pages.map((p) => p.path)));
console.log(`wrote ${pages.length} pages to ${OUT}`);
