<div align="center">

<img src="img/logo.svg" alt="BrainDeck" width="88" height="88">

# 🧠 BrainDeck

**Una mesa de trabajo web para crear y aprender.**
Herramientas para artistas, autodidactas y creativos, todo dentro de tu navegador.

[Demo en vivo](https://mybraindeck.netlify.app/) · [Herramientas](#herramientas) · [Empezar](#empezar) · [English](#english)

![HTML](https://img.shields.io/badge/HTML-static-e34f26?style=flat-square)
![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-f7df1e?style=flat-square&logoColor=black)
![Build](https://img.shields.io/badge/build-none-141414?style=flat-square)
![Privacy](https://img.shields.io/badge/datos-100%25%20local-36b866?style=flat-square)
![i18n](https://img.shields.io/badge/idiomas-ES%20%7C%20EN-8b6cff?style=flat-square)

</div>

---

## Índice

- [Qué es](#qué-es)
- [Herramientas](#herramientas)
- [Empezar](#empezar)
- [Accesibilidad para TDAH](#accesibilidad-para-tdah)
- [Inteligencia artificial](#inteligencia-artificial)
- [Privacidad](#privacidad)
- [Seguridad](#seguridad)
- [Pruebas](#pruebas)
- [Arquitectura](#arquitectura)
- [Añadir una herramienta](#añadir-una-herramienta)
- [Créditos](#créditos)

## Qué es

BrainDeck reúne en un solo lugar más de 20 herramientas que normalmente estarían repartidas entre webs con anuncios, apps de pago y servicios que suben tus archivos a servidores ajenos. Es una web **estática**: HTML, CSS y JavaScript sin compilación, sin backend y sin cuentas. Todo se procesa en tu dispositivo.

- **Cada herramienta tiene su propio enlace** (`index.html#/ruta`) para compartirla directamente.
- **Organizable:** se agrupan por categoría y puedes reordenarlas o moverlas de categoría arrastrando.
- **Inicio tipo dashboard:** ventanas con tu avatar, nivel y XP, stats estilo RPG, racha en corazones, datos de estudio, actividad diaria, apps más usadas, la data de cada herramienta y una bolsa de items pixel que se desbloquean según tu uso. Debajo, todas las herramientas como apps de un dispositivo. La vista clásica sigue en `#/herramientas`.
- **Cuatro estilos visuales:** Paper (predeterminado: papel cuadriculado y ventanas retro en blanco y negro), Neo pixel (neobrutalista), Cosmos (glass oscuro) y Frost (minimal). El estilo elegido se recuerda en cada visita.
- **Radio integrada** (herramienta de Estudio): reproductor abajo a la derecha que sigue sonando mientras usas las herramientas. Ruidos de colores y ambientes (biblioteca, lluvia, mar, chimenea, viento) generados en el navegador, más emisoras en vivo de lofi, vaporwave y ambient ([SomaFM](https://somafm.com/) y [Radio Browser](https://www.radio-browser.info/)), con modo aleatorio.
- **Pensado también para TDAH:** el plan de estudios y el tracker evitan horarios rígidos y la culpa por atrasarse (ver [Accesibilidad para TDAH](#accesibilidad-para-tdah)).
- **Bilingüe:** español por defecto e inglés desde Ajustes.
- **Responsive:** menú lateral en escritorio y barra inferior en móvil; probado a 360, 390 y 768 px sin desplazamiento horizontal.

## Herramientas

### Estudio

| Herramienta | Ruta | Descripción |
|---|---|---|
| Notas rápidas | `#/notas-rapidas` | Cuaderno de anillas estilo HyperCard con pestañas, búsqueda, notas fijadas y exportación a `.txt`. En "Todas" las notas se ven como apps. Se guarda solo. |
| Capturas → notas | `#/notas` | OCR de capturas que separa el texto importante de la interfaz y lo convierte en notas, que puedes llevar a Notas rápidas. Modo local, IA local o Claude. |
| Crear plan de estudios | `#/plan` | De una lista de temas, libros o videos a un plan de estudio y evaluación con calendario `.ics`. Opciones TDAH que eliges tú: sin horas fijas, un tema por día, día comodín y sin culpa. |
| Tracker de progreso | `#/tracker` | Progreso de cada plan por curso, video o libro (% y páginas, minutos u horas), "qué hago ahora" según tu energía, cronómetro visible, XP, semana, notas y actividad. Modo calma y enlace directo a cada plan (`#/tracker?plan=ID`). |
| Libro → test | `#/test` | Tests desde PDF, EPUB o TXT, con repaso espaciado (Leitner) y enlace para compartir. |
| Reto de 30 días | `#/reto` | Una tarea diaria para dibujo, piano, 3D, animación, idiomas, programación, escritura o un curso desde tu plan de estudios. |
| Coach de inglés hablado | `#/ingles` | Te grabas, Whisper transcribe y la IA corrige gramática, vocabulario, fluidez y posibles fallos de pronunciación. |
| Radio para estudiar | `#/radio` | Ruidos de colores, lofi, vaporwave, ambientes y modo aleatorio. |
| Temporizador de foco | `#/foco` | Acceso a [Focus Time Is Now](https://focustimeisnow.netlify.app/). |

### Imágenes y arte

| Herramienta | Ruta | Descripción |
|---|---|---|
| Marca de agua | `#/marca-agua` | Marcas en lote con metadatos de autor (XMP, EXIF, PNG iTXt) y señal de exclusión de entrenamiento de IA. |
| Convertir y redimensionar | `#/convertir` | PNG, JPG, WebP y AVIF en lote, con reescalado de alta calidad. |
| Comprimir imágenes | `#/comprimir` | Por calidad o a un peso exacto en KB, en lote, con comparador antes/después. Elimina los metadatos ocultos (EXIF, GPS). |
| Quitar fondo | `#/quitar-fondo` | Segmentación con IA en el navegador: PNG transparente, fondo de color o sticker. |
| Generador de paletas | `#/paletas` | Desde un color, una foto o una palabra. Exporta a Procreate, Adobe (`.ase`), GIMP/Krita (`.gpl`), Blender y CSS. |
| Ideas para crear | `#/ideas` | Ideas por formato (ilustración, post, 3D, cómic…) a partir de semillas: tema, vibe, estética, color, animal o imagen. |
| Art Unblock | `#/art-unblock` | Frases surrealistas al azar, o con tus semillas, para vencer el bloqueo creativo. |
| Gesture drawing | `#/gesture` | Sesiones de poses cronometradas con tus referencias o fotos libres de Wikimedia Commons. |

### Utilidades

| Herramienta | Ruta | Descripción |
|---|---|---|
| Unir PDFs | `#/unir-pdf` | Combina PDFs e imágenes, elige rangos de páginas y gíralas. |
| Editar PDF | `#/editar-pdf` | Reordena, gira, elimina y divide páginas, numéralas, firma y comprime. |
| Descargar videos | `#/descargar-video` | Genera el comando exacto de [yt-dlp](https://github.com/yt-dlp/yt-dlp) para la calidad y el formato elegidos, sin webs de descarga inseguras. |
| Pinterest e Instagram | `#/pinterest-instagram` | Comandos de [gallery-dl](https://github.com/mikf/gallery-dl) (imágenes y carruseles) y yt-dlp (reels), con cookies del navegador opcionales para contenido que pide sesión. Solo para lo tuyo o con permiso. |
| Generar subtítulos | `#/subtitulos` | SRT y VTT con Whisper en el navegador, editables y traducibles con IA. |
| Generador de QR | `#/qr` | Enlaces, WiFi, contacto o WhatsApp, con estilo de puntos, colores, degradado y logo. PNG y SVG. |
| Buscador de atajos | `#/atajos` | Atajos de Windows, macOS, Linux, terminal, navegador, VS Code, Photoshop, Krita, Blender, Figma, Procreate, Docs, Excel y YouTube. Se adapta a Ctrl o ⌘ y guarda favoritos. |

### Dinero

| Herramienta | Ruta | Descripción |
|---|---|---|
| Calculadora de comisión | `#/comision` | Muestra la ecuación, el valor a restar y el valor final; o cuánto cobrar para recibir una cantidad neta. |
| Plan de ahorro | `#/ahorro` | Asistente paso a paso con gráficas, hitos, viabilidad y calendario de aportes. |

### Extras

| Herramienta | Ruta | Descripción |
|---|---|---|
| Minijuegos | `#/juegos` | Morse con sonido, quiz, ahorcado, dibujo ASCII, historia interactiva y quiz de países. |
| Decision Log | `#/decisiones` | Historial de cálculos y planes guardados. |
| Ajustes | `#/ajustes` | Idioma, estilo, IA y copia de seguridad de tus datos. |
| Privacidad | `#/privacidad` | Qué se guarda, dónde, y qué servicios externos ven tu IP y cuándo. |

## Empezar

**Online:** abre la [demo](https://mybraindeck.netlify.app/).

**En local:**

```bash
git clone https://github.com/GVPV12/braindeck.git
cd braindeck
pnpm install
pnpm serve             # http://localhost:4173
```

> Usa **pnpm** (`npm i -g pnpm@9.15.0` si no lo tienes). Sin instalar nada también sirve `python -m http.server`.

También funciona con doble clic en `index.html`. Aun así, se recomienda servirlo por HTTP: los modelos de IA solo se guardan en caché en `http(s)://`.

**Publicar:** en GitHub Pages, Netlify o Vercel, tal cual, sin configuración. En Netlify, el archivo `_headers` añade las cabeceras de seguridad.

**Instalar como app:** en Chrome o Edge, el botón "Instalar" de la barra de direcciones. Tras la primera visita, BrainDeck abre también sin conexión (las herramientas que usan internet, como la radio o la IA, necesitan red).

> La primera vez se necesita conexión para cargar librerías y modelos desde CDN.

## Accesibilidad para TDAH

Basado en investigación sobre gamificación y TDAH: recompensas inmediatas en vez de castigos, rutinas flexibles, tareas en partes pequeñas y el tiempo siempre visible. Sin Pomodoro obligatorio.

**En el creador de planes** (casillas desmarcadas por defecto; cada persona elige):

| Opción | Qué hace |
|---|---|
| Sin horas fijas | Cada sesión es para un día, no a una hora (se muestra solo la duración, p. ej. "≈40 min"); sin descansos obligatorios. En el `.ics` son eventos de todo el día con aviso a las 9:00. |
| Un tema por día | No mezcla libros, temas o videos distintos el mismo día. |
| Día comodín | El último día de estudio de cada semana queda libre para ponerse al día; atrasarse no mueve el resto del plan. |
| Sin culpa | Lo pendiente "espera su turno" en vez de "atrasado", con botones para reacomodar desde hoy o hacer una sola cosa ahora. |

**En el tracker:** una sola tarea sugerida ("ahora.exe") según tu energía de hoy, que prefiere seguir con lo mismo que hiciste antes; meta concreta por sesión; cronómetro visible contra la ceguera temporal; +5 XP y un mensaje de ánimo al terminar; "más tarde" sin penalización; modo calma con menos estímulos. La fecha de fin se muestra como estimación, no como plazo.

## Inteligencia artificial

La IA es opcional y tiene tres niveles:

| Nivel | Qué usa | Requisitos |
|---|---|---|
| Sin IA | OCR, heurísticas y bancos de palabras locales | Ninguno |
| IA local | Gemini Nano (integrado en Chrome) o [WebLLM](https://github.com/mlc-ai/web-llm) con Qwen 2.5 1.5B; Whisper y segmentación con [Transformers.js](https://github.com/huggingface/transformers.js) | Navegador con WebGPU (Chrome o Edge recientes) |
| Claude | API de Anthropic | Tu API key en Ajustes; solo se envía a `api.anthropic.com` |

## Privacidad

- No hay servidor, analítica ni cuentas.
- Imágenes, PDFs, audios y notas se procesan en el navegador.
- Los datos viven en tu navegador: `localStorage` para lo pequeño e IndexedDB para lo grande o cuando `localStorage` se llena. BrainDeck pide al navegador que no los borre automáticamente. Desde **Ajustes → Importar y exportar datos** puedes:
  - elegir qué grupos guardar (notas, planes, tests, retos, paletas, ahorro…);
  - **cifrar la copia con contraseña** (AES-256-GCM, clave derivada con PBKDF2-SHA256 y 310.000 iteraciones, con Web Crypto);
  - ver qué trae un archivo antes de importarlo;
  - **combinarlo** con lo que ya tienes, sin duplicados, o **reemplazarlo**.
- La API key nunca se exporta. Puedes guardarla en el navegador o usarla **solo durante la sesión** (se olvida al cerrar la pestaña y nunca se escribe en disco).
- **Servicios de terceros**, solo cuando los usas:
  - Radio: [SomaFM](https://somafm.com/) y [Radio Browser](https://www.radio-browser.info/) (y la emisora elegida) ven tu IP.
  - Gesture drawing: Wikimedia Commons. Plan de estudios: noembed.com para los títulos de videos. Quiz de países: flagcdn.com.
  - IA: los modelos se descargan de Hugging Face; Claude solo recibe lo que envías a `api.anthropic.com`.
  - Librerías: las de PDF, gráficas, ZIP y QR se sirven desde BrainDeck (`vendor/`); solo el OCR y la IA local (Tesseract, Transformers.js, WebLLM) vienen de jsDelivr. Alojamiento: Netlify (registros de acceso).
- **Sin cookies ni seguimiento**, así que no hace falta aviso de cookies: lo que se guarda es solo lo necesario para que funcione.
- **Fuentes propias:** las tipografías se sirven desde BrainDeck (`fonts/`), no desde Google, para que abrir la app no envíe tu IP a Google. Para regenerarlas: `pnpm fonts`.
- La página **Privacidad** (`#/privacidad`) explica todo esto dentro de la app, en español e inglés.

## Seguridad

- **Content Security Policy** (`_headers`): solo se ejecutan scripts propios y de jsDelivr; ningún script en línea, sin `eval`, sin incrustar la app en otras webs (`frame-ancestors 'none'`). Los bloques `<style>` solo pueden venir de BrainDeck (`style-src-elem`), así que un estilo inyectado no se aplica.
- **Librerías verificadas:** `pnpm vendor` descarga a `vendor/` las librerías de PDF, gráficas, ZIP y QR y comprueba su huella SHA-384 antes de guardarlas. Lo que sigue en el CDN (Tesseract) lleva Subresource Integrity: si el CDN lo modificara, el navegador no lo ejecuta.
- **HTML seguro por defecto:** `BD.html\`…\`` escapa todo lo que se interpola; lo usan las pantallas que muestran enlaces compartidos. Los enlaces de tests y retos se validan (tipos, tamaños, formatos) antes de usarse.
- **Pruebas de seguridad:** una prueba mete HTML malicioso en los datos guardados y en enlaces compartidos, abre todas las herramientas y falla si algo se inyecta.
- Cabeceras `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (solo micrófono, para el coach de inglés), `Cross-Origin-Opener-Policy` y HSTS.
- Las copias importadas se validan (tamaño, formato y nombres de clave) antes de tocar tus datos.
- Los comandos de yt-dlp y gallery-dl se generan con la URL entre comillas simples y sin comillas internas, para que no pueda inyectar órdenes.

## Pruebas

```bash
pnpm install
pnpm exec playwright install chromium
pnpm lint           # ESLint: errores reales, sin reglas de estilo
pnpm test           # abre cada herramienta en escritorio, laptop y móvil y falla si hay errores de JavaScript
pnpm test:i18n      # lista los textos que siguen en español con la interfaz en inglés
```

GitHub Actions ejecuta lo mismo en cada push (`.github/workflows/ci.yml`).

## Arquitectura

```
braindeck/
├── index.html            Shell, menú y carga de scripts
├── sw.js                 Service worker (sin conexión e instalable)
├── manifest.webmanifest  Datos de la app instalable
├── _headers              Cabeceras de seguridad (Netlify)
├── css/app.css           Temas (paper, neo, cosmos, frost) y componentes
├── css/fonts.css         Fuentes propias (generado por pnpm fonts)
├── fonts/                Archivos .woff2 (SIL OFL 1.1)
├── img/                  Logo, icono y banners del inicio
├── scripts/              fetch-fonts.mjs y fetch-vendor.mjs: descargan fuentes y librerías una vez
├── vendor/               Librerías de PDF, gráficas, ZIP y QR (generado por pnpm vendor)
├── tests/                Pruebas con Playwright
└── js/
    ├── boot.js           Aplica tema e idioma antes de pintar
    ├── core.js           Router, almacenamiento, cifrado, UI, IA y categorías
    ├── i18n.js           Traducción de la interfaz al inglés
    └── *.js              Una herramienta por archivo
```

- **Sin build:** scripts clásicos que funcionan incluso desde `file://`.
- **Librerías bajo demanda:** cada librería pesada se carga solo cuando una herramienta la necesita.
- **Router por hash:** cada pantalla devuelve su propia función de limpieza.

## Añadir una herramienta

```js
// js/mi-herramienta.js
BD.tool({
  path: '/mi-herramienta',
  cat: 'estudio',                 // estudio | creativo | media | dinero
  title: 'Mi herramienta',
  icon: BD.icon('bulb'),
  colors: ['#fff07a', '#ffb703'],
  desc: 'Qué hace, en una línea.',
  render(view) {
    const body = BD.win(view, { title: BD.L('Mi herramienta', 'My tool') });
    body.innerHTML = '<p>Hola</p>';
  },
});
```

Después, añade `<script src="js/mi-herramienta.js"></script>` en `index.html`.

## Créditos

**Librerías:**
- Gráficas y archivos: [Chart.js](https://www.chartjs.org/), [JSZip](https://stuk.github.io/jszip/).
- PDF: [pdf.js](https://mozilla.github.io/pdf.js/), [pdf-lib](https://pdf-lib.js.org/).
- Texto y QR: [Tesseract.js](https://tesseract.projectnaptha.com/), [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator).
- IA en el navegador: [Transformers.js](https://github.com/huggingface/transformers.js), [WebLLM](https://github.com/mlc-ai/web-llm).

**Modelos:**
- Whisper (MIT).
- [RMBG-1.4](https://huggingface.co/briaai/RMBG-1.4) (BRIA, solo uso no comercial).
- MODNet (Apache 2.0).
- Qwen 2.5 (Apache 2.0).

**Recursos:**
- Fuentes: Inter, JetBrains Mono, Outfit, Pixelify Sans, Space Grotesk, Courier Prime y Silkscreen ([Google Fonts](https://fonts.google.com), SIL OFL 1.1), servidas desde el propio proyecto.
- Íconos: trazos estilo [Lucide](https://lucide.dev) (ISC).
- Fotos del banner: [Unsplash](https://unsplash.com) (Rohit Choudhari, Warren Hansen, Willow XK, Max Zhdanov, Li Zhang, Christian Boragine, Yue Ma, Alissa Kennedy).
- Referencias de poses: [Wikimedia Commons](https://commons.wikimedia.org), con el crédito de cada foto.

---

## English

**BrainDeck** is a static web toolkit for creating and learning: 20+ tools for artists, self-learners and creatives. It covers study plans with `.ics` calendars and an ADHD-friendly progress tracker (opt-in flexible scheduling, one topic per day, catch-up days, guilt-free wording), tests from books, a Pinterest/Instagram downloader command builder, screenshot-to-notes OCR, English speaking feedback, palettes, background removal, PDF editing, subtitles, QR codes and more.

There is no backend, no build step and no accounts: everything runs in your browser and your data stays on your device. AI is optional: in-browser models (Whisper, WebLLM, Gemini Nano) or your own Anthropic API key. Switch the interface to English in **Settings**.

---

<div align="center">

Hecho por **Grecia Valentina**
[grevaleart.com](https://grevaleart.com/) · [GitHub](https://github.com/GVPV12) · [Ko-fi](https://ko-fi.com/grevaleart)

</div>
