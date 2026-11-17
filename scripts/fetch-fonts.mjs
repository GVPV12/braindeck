// Descarga una sola vez las fuentes de Google y las guarda dentro del proyecto (fonts/ y css/fonts.css),
// para que quien visita BrainDeck nunca envíe su IP a Google. Uso: pnpm fonts
// Solo se guardan los alfabetos latin y latin-ext (español, inglés y acentos), que es lo que usa la app.
import { mkdir, writeFile, rm } from 'node:fs/promises';

const FAMILIES = 'family=Inter:wght@400;500;600;800&family=JetBrains+Mono:wght@400;600&family=Outfit:wght@300;400;500;600;700&family=Pixelify+Sans:wght@400;600;700&family=Space+Grotesk:wght@400;500;700&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Silkscreen:wght@400;700&display=swap';
const KEEP = new Set(['latin', 'latin-ext']);
// Con un navegador moderno como agente, Google devuelve woff2 divididos por alfabeto (con un comentario /* latin */ antes de cada bloque)
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const css = await (await fetch('https://fonts.googleapis.com/css2?' + FAMILIES, { headers: { 'User-Agent': UA } })).text();
const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*{[^}]+})/g)];
if (!blocks.length) throw new Error('Google no devolvió bloques @font-face reconocibles:\n' + css.slice(0, 300));

await rm('fonts', { recursive: true, force: true });
await mkdir('fonts', { recursive: true });
const out = ['/* Generado por scripts/fetch-fonts.mjs: fuentes de Google Fonts (licencia SIL OFL 1.1) servidas desde BrainDeck. */'];
let n = 0;
for (const [, subset, face] of blocks) {
  if (!KEEP.has(subset)) continue;
  const family = face.match(/font-family:\s*'([^']+)'/)[1];
  const style = face.match(/font-style:\s*(\w+)/)[1];
  const weight = face.match(/font-weight:\s*(\d+)/)[1];
  const url = face.match(/url\((https:[^)]+\.woff2)\)/)[1];
  const file = `${family.toLowerCase().replace(/\s+/g, '-')}-${weight}${style === 'italic' ? 'i' : ''}-${subset}.woff2`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar ${url} (${res.status})`);
  await writeFile('fonts/' + file, Buffer.from(await res.arrayBuffer()));
  out.push(`/* ${subset} */\n` + face.replace(url, '../fonts/' + file));
  n++;
}
await writeFile('css/fonts.css', out.join('\n') + '\n');

// La licencia OFL pide que su texto acompañe a las fuentes: se copia la de cada familia desde el repositorio oficial de Google Fonts
const families = [...new Set(blocks.map(([, , face]) => face.match(/font-family:\s*'([^']+)'/)[1]))];
const missing = [];
for (const fam of families) {
  const dir = fam.toLowerCase().replace(/\s+/g, '');
  const res = await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${dir}/OFL.txt`);
  if (res.ok) await writeFile(`fonts/OFL-${dir}.txt`, await res.text());
  else missing.push(fam);
}
console.log(`Listo: ${n} fuentes y ${families.length - missing.length} licencias en fonts/, más css/fonts.css`);
if (missing.length) console.warn('Aviso: no se encontró la licencia de ' + missing.join(', ') + '; añádela a mano en fonts/.');
