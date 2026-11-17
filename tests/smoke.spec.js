// Abre el inicio y cada herramienta; falla si aparece un error de JavaScript o la pantalla queda vacía.
const { test, expect } = require('@playwright/test');

// Ruido externo que no depende de BrainDeck (sin red en CI, extensiones, etc.)
const IGNORE = /favicon|net::ERR|Failed to load resource|fonts\.g|radio-browser|somafm/i;

function watch(page) {
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push('console: ' + m.text()); });
  return errors;
}

test('inicio y menú', async ({ page }) => {
  const errors = watch(page);
  await page.goto('/');
  await expect(page.locator('.dash')).toBeVisible();
  await expect(page.locator('#sideNav .nav-item, #bottomNav .nav-item').first()).toBeAttached();
  expect(errors).toEqual([]);
});

test('el menú de laptop muestra las categorías', async ({ page }, info) => {
  test.skip(info.project.name !== 'laptop', 'solo en laptop');
  await page.goto('/');
  await expect(page.locator('#sideNav .nav-label').first()).toBeVisible();
});

test('todas las herramientas abren sin errores', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watch(page);
  await page.goto('/');
  const paths = await page.evaluate(() => BD.tools.filter(t => !t.external && !t.radio).map(t => t.path));
  expect(paths.length).toBeGreaterThan(20);
  for (const p of [...paths, '/herramientas', '/ajustes', '/findme', '/privacidad']) {
    await page.evaluate(path => { location.hash = '#' + path; }, p);
    await expect(page.locator('#view > *').first(), p).toBeVisible();
    await expect(page.locator('#view'), p).not.toContainText('Ups 😵');
  }
  expect(errors).toEqual([]);
});

test('el idioma inglés se recuerda', async ({ page }) => {
  await page.goto('/');
  await page.locator('#langBtn').click();
  await page.waitForLoadState('load');
  await expect(page.locator('#langBtn')).toHaveText('EN');
  await page.reload();
  await expect(page.locator('#langBtn')).toHaveText('EN');
});

test('copia cifrada: se exporta y se vuelve a abrir con la contraseña', async ({ page }) => {
  await page.goto('/');
  const ok = await page.evaluate(async () => {
    const enc = await BD.vault.lock({ hola: [1, 2, 3] }, 'contraseña-larga');
    const back = await BD.vault.unlock(enc, 'contraseña-larga');
    let wrong = false; try { await BD.vault.unlock(enc, 'otra-cosa'); } catch { wrong = true; }
    return JSON.stringify(back) === '{"hola":[1,2,3]}' && wrong;
  });
  expect(ok).toBe(true);
});

test('lo que no cabe en localStorage pasa a IndexedDB y se recupera', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => BD.store.set('test:big', 'x'.repeat(400 * 1024)));
  await page.reload();
  await page.waitForFunction(() => window.BD && BD.store.get('test:big', '').length === 400 * 1024);
  await page.evaluate(() => BD.store.del('test:big'));
});

test('el buscador de atajos encuentra resultados', async ({ page }) => {
  await page.goto('/#/atajos');
  await page.locator('#scQ').fill('captura');
  await expect(page.locator('.sc-row').first()).toBeVisible();
});

test('los enlaces compartidos no inyectan HTML y los rotos no rompen la página', async ({ page }) => {
  const errors = watch(page);
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  const evil = '<img src=x id=pwned>';
  await page.goto('/#/reto/share/' + b64({ n: evil, p: [evil, 'día 2'], s: '2026-01-01', t: evil }));
  await expect(page.locator('.reto-grid')).toBeVisible();
  await expect(page.locator('#pwned')).toHaveCount(0);
  await page.goto('/#/test/share/' + b64({ t: evil, q: [{ q: evil, answer: 'a', options: ['a', evil] }] }));
  await expect(page.locator('.q-text')).toBeVisible();
  await expect(page.locator('#pwned')).toHaveCount(0);
  for (const bad of ['/#/reto/share/' + b64({ n: 'x', p: 'no-es-lista' }), '/#/test/share/' + b64({ t: 'x', q: [{ q: 1 }] }), '/#/test/share/%%%']) {
    await page.goto(bad);
    await expect(page.locator('.win h1')).toContainText(/Enlace roto|Broken link/);
  }
  expect(errors).toEqual([]);
});

test('las librerías de vendor/ se cargan desde BrainDeck y funcionan', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'basta con un tamaño');
  await page.goto('/');
  const libs = await page.evaluate(async () => {
    for (const k of ['chart', 'jszip', 'pdf', 'pdflib', 'qr']) await BD.loadScript(BD.LIB[k]);
    const w = await fetch(BD.LIB.pdfWorker);
    return { local: ['chart', 'jszip', 'pdf', 'pdfWorker', 'pdflib', 'qr'].every(k => !/^https?:/.test(BD.LIB[k])),
      Chart: typeof Chart, JSZip: typeof JSZip, pdfjsLib: typeof pdfjsLib, PDFLib: typeof PDFLib, qrcode: typeof qrcode, worker: w.ok };
  });
  expect(libs).toEqual({ local: true, Chart: 'function', JSZip: 'function', pdfjsLib: 'object', PDFLib: 'object', qrcode: 'function', worker: true });
});

// Una copia importada o datos manipulados no deben poder meter HTML en ninguna pantalla
test('datos guardados con HTML se muestran como texto en todas las herramientas', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'basta con un tamaño');
  test.setTimeout(120_000);
  const evil = '<img src=x id=pwned>';
  await page.goto('/');
  await page.evaluate(e => {
    const t = BD.today(), s = BD.store;
    BD.qnotes.add({ title: e, text: e, tab: 'estudio' });
    BD.log('Prueba', e, { lines: [[e, e]] });
    s.set('plans', [{ id: 'xp', name: e, created: Date.now(), opts: { days: [1, 2, 3, 4, 5], time: '18:00', perDay: 90, block: 45, pause: 10 },
      sessions: [{ id: 's1', type: 'study', item: e, title: e, detail: e, dur: 30, date: t, start: 1080, end: 1110, done: false, goal: e }] }]);
    s.set('decks', [{ id: 'xd', title: e, questions: [{ type: 'mc', q: e, options: [e, 'b'], answer: e }] }]);
    s.set('challenges', [{ id: 'xc', name: e, prompts: [e, e], start: t, time: '19:00', done: [] }]);
    s.set('pal:saved', [{ name: e, cols: ['#ff0000', '#00ff00'] }]);
    s.set('wm:saved', [e]);
    s.set('profile', { avatar: 'cat' }); BD.saveSettings({ author: e });
  }, evil);
  const paths = await page.evaluate(() => ['/', '/guia', '/ajustes', '/decisiones', '/plan/xp', '/test/deck/xd', '/reto/xc', ...BD.tools.filter(t => !t.external && !t.radio).map(t => t.path)]);
  let shown = 0;
  for (const p of paths) {
    await page.evaluate(path => { location.hash = '#' + path; }, p);
    await page.waitForTimeout(150);
    await expect(page.locator('#pwned'), p).toHaveCount(0);
    shown += await page.evaluate(e => document.body.innerText.split(e).length - 1, evil);
  }
  // el texto malicioso tiene que verse (como texto) en varias pantallas: si no, la prueba no estaría probando nada
  expect(shown).toBeGreaterThan(5);
});

test('la bolsa tiene 50 items válidos en páginas de 16 y la guía los explica', async ({ page }) => {
  await page.goto('/');
  const check = await page.evaluate(() => {
    const ids = BD.items.map(i => i.id);
    const bad = BD.items.filter(it => it.r.length !== 12 || it.r.some(r => r.length !== 12) || [...it.r.join('')].some(ch => ch !== '.' && !it.p[ch])).map(i => i.id);
    return { n: ids.length, dup: ids.length - new Set(ids).size, bad };
  });
  expect(check).toEqual({ n: 50, dup: 0, bad: [] });
  await expect(page.locator('.bag')).toHaveCount(4);
  await expect(page.locator('.bag').first().locator('.bag-slot')).toHaveCount(16);
  await expect(page.locator('#bagPrev')).toBeDisabled();
  await page.locator('#bagNext').click();
  await expect(page.locator('#bagPages i').nth(1)).toHaveClass(/on/);
  await page.locator('.dw-bag .dw-help').click();
  await expect(page.locator('#g-items .guide-item')).toHaveCount(50);
  await expect(page.locator('#g-stats .guide-row')).toHaveCount(9);
});
