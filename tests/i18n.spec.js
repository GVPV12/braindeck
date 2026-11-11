// Auditoría de traducciones: abre cada pantalla en inglés y lista los textos que siguen en español.
// No hace fallar el CI: escribe el informe en la salida (y en GitHub como aviso) para ir completando i18n.js.
const { test } = require('@playwright/test');

// Señales de español: tildes/ñ/¿¡ o palabras muy frecuentes que no existen en inglés
const SPANISH = /[áéíóúñ¿¡]|\b(de|para|con|los|las|una|del|tus|aquí|herramienta|guardar|borrar|nuevo|nueva)\b/i;
// Nombres propios y contenido del usuario que es normal ver en español
const ALLOW = /BrainDeck|Grecia|Español|grevaleart|Ko-fi|VGen|Contra|Gumroad/;

test('textos sin traducir en inglés', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'basta con un tamaño');
  test.setTimeout(120_000);
  await page.addInitScript(() => localStorage.setItem('bd:settings', JSON.stringify({ lang: 'en' })));
  await page.goto('/');
  const paths = await page.evaluate(() => ['/', '/herramientas', '/ajustes', ...BD.tools.filter(t => !t.external && !t.radio).map(t => t.path)]);
  const report = {};
  for (const p of paths) {
    await page.evaluate(path => { location.hash = '#' + path; }, p);
    await page.waitForTimeout(250);
    const texts = await page.evaluate(() => {
      const out = new Set(), w = document.createTreeWalker(document.querySelector('.shell'), NodeFilter.SHOW_TEXT);
      while (w.nextNode()) {
        const n = w.currentNode, el = n.parentElement, t = n.textContent.trim();
        if (!t || t.length < 3 || !el || el.closest('script,style,[translate="no"],input,textarea')) continue;
        if (getComputedStyle(el).display === 'none') continue;
        out.add(t.slice(0, 120));
      }
      ['placeholder', 'title', 'aria-label'].forEach(a => document.querySelectorAll(`.shell [${a}]`).forEach(el => out.add(el.getAttribute(a).slice(0, 120))));
      return [...out];
    });
    const es = texts.filter(t => SPANISH.test(t) && !ALLOW.test(t));
    if (es.length) report[p] = es;
  }
  const lines = Object.entries(report).map(([p, l]) => `\n${p}\n  - ${l.join('\n  - ')}`).join('');
  const total = Object.values(report).reduce((a, l) => a + l.length, 0);
  console.log(total ? `Textos posiblemente sin traducir: ${total}${lines}` : 'Todo traducido ✓');
  if (total) info.annotations.push({ type: 'warning', description: `${total} textos posiblemente sin traducir (ver el log)` });
});
