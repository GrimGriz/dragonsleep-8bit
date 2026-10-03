// A cloud seat's own look at the game (no pane in the cloud): the spin-up skill. The review seat's recipe, tested 10-03.
// NODE_PATH=/opt/node22/lib/node_modules node .claude/skills/spin-up/eyes.js "<path?query>" out.png <seconds> <port>
const { chromium } = require('playwright');
(async () => {
  const [path = 'index.html', out = 'eyes.png', secs = '5', port = '8930'] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto('http://127.0.0.1:' + port + '/' + path.replace(/^\//, ''));
  await page.waitForTimeout(+secs * 1000);
  await page.screenshot({ path: out });
  console.log(errs.length ? errs.join('\n') : 'no page errors');
  await browser.close();
})();
