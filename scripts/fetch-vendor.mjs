// Descarga una sola vez las librerías que usan las herramientas y las guarda en vendor/, para que BrainDeck
// las sirva desde su propio dominio: quien la usa no envía su IP al CDN y no depende de que el CDN siga igual.
// Cada archivo se comprueba con su huella SHA-384 publicada (SRI) antes de guardarlo: si no coincide, no se guarda.
// Uso: pnpm vendor
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/';
// [archivo local, URL con versión fija, huella SRI (null = se calcula y se muestra)]
const LIBS = [
  ['chart.umd.min.js', CDN + 'Chart.js/4.4.1/chart.umd.min.js', 'sha384-bs/nf9FbdNouRbMiFcrcZfLXYPKiPaGVGplVbv7dLGECccEXDW+S3zjqSKR5ZEaD'],
  ['jszip.min.js', CDN + 'jszip/3.10.1/jszip.min.js', 'sha384-+mbV2IY1Zk/X1p/nWllGySJSUN8uMs+gUAN10Or95UBH0fpj6GfKgPmgC5EXieXG'],
  ['pdf.min.js', CDN + 'pdf.js/3.11.174/pdf.min.js', 'sha384-/1qUCSGwTur9vjf/z9lmu/eCUYbpOTgSjmpbMQZ1/CtX2v/WcAIKqRv+U1DUCG6e'],
  ['pdf.worker.min.js', CDN + 'pdf.js/3.11.174/pdf.worker.min.js', null],
  ['pdf-lib.min.js', CDN + 'pdf-lib/1.17.1/pdf-lib.min.js', 'sha384-weMABwrltA6jWR8DDe9Jp5blk+tZQh7ugpCsF3JwSA53WZM9/14PjS5LAJNHNjAI'],
  ['qrcode.min.js', CDN + 'qrcode-generator/1.4.4/qrcode.min.js', 'sha384-mZT2gIty7ZDdOGkxfP6joZcYdMW1Jvj9dRlfpTmaJAKKXTqzygtB22k7FLe+KZC1'],
];

await mkdir('vendor', { recursive: true });
for (const [file, url, sri] of LIBS) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar ${url} (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  const got = 'sha384-' + createHash('sha384').update(buf).digest('base64');
  if (sri && got !== sri) throw new Error(`La huella de ${file} no coincide: el archivo del CDN cambió. No se guarda.\n  esperada ${sri}\n  recibida ${got}`);
  await writeFile('vendor/' + file, buf);
  console.log(`✓ vendor/${file} (${Math.round(buf.length / 1024)} KB)${sri ? ' · huella verificada' : ' · ' + got}`);
}
