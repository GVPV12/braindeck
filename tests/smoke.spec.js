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
  for (const p of [...paths, '/herramientas', '/ajustes', '/findme']) {
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
