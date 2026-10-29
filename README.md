# 🧠 BrainDeck

**BrainDeck** es una mesa de trabajo web para crear y aprender: herramientas para artistas, autodidactas y creativos, más minijuegos. Es una web estática (HTML + CSS + JavaScript, sin compilación ni servidor): todo corre en tu navegador y tus datos se quedan en tu dispositivo.

*BrainDeck is a web toolkit for creating and learning — tools for artists, self-learners and creatives, plus mini games. Static site, no build step, everything runs in your browser. Available in Spanish and English.*

---

## ✨ Herramientas

Cada herramienta tiene su propio enlace (`index.html#/ruta`) para compartirla directamente. En el inicio se agrupan por categoría y puedes reordenarlas a tu gusto (botón **↕ Ordenar**).

### 📚 Estudio
| Ruta | Herramienta |
|---|---|
| `#/notas` | **Capturas → notas**: OCR de tus capturas, separa el texto importante de la interfaz y crea notas (modo local, IA local o Claude). |
| `#/plan` | **Crear plan de estudios**: lista de temas, libros o videos → plan de estudio y evaluación con calendario a la hora exacta (`.ics`). |
| `#/test` | **Libro → test**: sube un PDF/EPUB/TXT y genera un test con repaso espaciado y enlace para compartir. |
| `#/reto` | **Reto de 30 días**: una tarea diaria para dibujo (tipo Inktober), piano, 3D, animación, idiomas, programación, escritura, lo que quieras con IA, o un curso intensivo desde tu plan de estudios. Calendario `.ics`, póster para redes y enlace para compartir. |
| `#/ingles` | **Coach de inglés hablado**: grábate, Whisper transcribe en el navegador y la IA corrige gramática, vocabulario, fluidez y pronunciación probable. |
| `#/foco` | **Temporizador de foco** (abre [Focus Time Is Now](https://focustimeisnow.netlify.app/)). |

### 🎨 Imágenes y arte
| Ruta | Herramienta |
|---|---|
| `#/marca-agua` | **Marca de agua + firma de autor**: en lote, con metadatos XMP/EXIF/PNG y aviso "no entrenar IA". |
| `#/convertir` | **Convertir y redimensionar** imágenes en lote (PNG, JPG, WebP, AVIF). |
| `#/quitar-fondo` | **Quitar fondo** con IA en el navegador: PNG transparente, fondo de color o sticker. |
| `#/paletas` | **Generador de paletas** desde un color, una foto o una palabra → Procreate, `.ase`, `.gpl`, Blender, CSS, PNG. |
| `#/ideas` | **Ideas para crear**: elige qué crear y dale semillas (tema, vibe, estética, color, animal, imagen…). |
| `#/art-unblock` | **Art Unblock**: frases locas al azar para desbloquear la creatividad. |
| `#/gesture` | **Gesture drawing**: poses cronometradas con tus fotos o referencias libres de Wikimedia Commons. |

### 🧰 Utilidades
| Ruta | Herramienta |
|---|---|
| `#/unir-pdf` | **Unir PDFs** (e imágenes), elegir páginas y girarlas. |
| `#/editar-pdf` | **Editar PDF**: reordenar, girar, quitar, dividir, numerar páginas, firmar y comprimir. |
| `#/descargar-video` | **Descargar videos** de forma segura: arma el comando de [yt-dlp](https://github.com/yt-dlp/yt-dlp) con la calidad y formato elegidos. |
| `#/subtitulos` | **Generar subtítulos** SRT/VTT con Whisper en el navegador, y traducirlos con IA. |
| `#/qr` | **Generador de QR** con colores, estilo de puntos y logo (PNG/SVG). |

### 💰 Dinero
| Ruta | Herramienta |
|---|---|
| `#/comision` | **Calculadora de comisión**: total + % → ecuación, valor a restar y valor final; o cuánto cobrar para recibir X. |
| `#/ahorro` | **Plan de ahorro** guiado con gráficas, hitos y calendario de aportes. |

### Más
| Ruta | |
|---|---|
| `#/juegos` | **Silly games**: texto ↔ morse, quiz, ahorcado, dibujo ASCII, historia interactiva y quiz de países. |
| `#/decisiones` | **Decision Log**: historial de cálculos y planes guardados. |
| `#/findme` | **Estoy en**: todos mis enlaces. |
| `#/ajustes` | Idioma (ES/EN), estilo (Neo pixel / Cosmos / Frost), IA y copia de tus datos. |

---

## 🚀 Usarlo

- **Online:** publícalo en GitHub Pages (Settings → Pages → *Deploy from a branch* → `main` / root) y abre la URL.
- **En local:** doble clic en `index.html`. Funciona, pero algunas funciones van mejor servidas por HTTP: los modelos de IA se guardan en caché solo en `http(s)://`. Para un servidor rápido:
  ```bash
  npx serve .        # o: python -m http.server
  ```
- Necesita internet la primera vez para cargar librerías y modelos desde CDN.

## 🤖 IA

- **Sin IA:** casi todo funciona sin IA (OCR, resúmenes locales, generadores con bancos de palabras…).
- **IA local, gratis y sin API key:** usa Gemini Nano si Chrome lo trae; si no, [WebLLM](https://github.com/mlc-ai/web-llm) descarga una vez Qwen 2.5 1.5B (~1 GB) y lo corre con WebGPU.
- **Whisper en el navegador** ([Transformers.js](https://github.com/huggingface/transformers.js)): para los subtítulos y el coach de inglés.
- **Claude (opcional):** con tu API key de Anthropic en Ajustes mejoran las notas, los tests y las guías. La key se guarda solo en tu navegador y solo se envía a `api.anthropic.com`.

## 🔒 Privacidad

No hay servidor ni cuentas. Imágenes, PDFs, audios y notas se procesan en tu navegador. Tus datos viven en `localStorage`; puedes exportar o importar una copia desde Ajustes (la API key no se exporta).

## 🧱 Estructura

```
index.html        # shell, menú y carga de scripts
css/app.css       # temas (neo / cosmos / frost) y componentes
js/core.js        # router por hash, almacenamiento, UI, IA, categorías
js/i18n.js        # traducción al inglés de la interfaz
js/*.js           # una herramienta por archivo
img/              # logo y banners del inicio
```

Para añadir una herramienta: crea `js/mi-herramienta.js` con `BD.tool({ path, cat, title, icon, colors, desc, render })` y añádelo a `index.html`.

## 🙏 Créditos

- **Fotos del banner:** [Unsplash](https://unsplash.com) (Rohit Choudhari, Warren Hansen, Willow XK, Max Zhdanov, Li Zhang, Christian Boragine, Yue Ma, Alissa Kennedy).
- **Librerías:**
  - Gráficas y archivos: [Chart.js](https://www.chartjs.org/), [JSZip](https://stuk.github.io/jszip/).
  - PDF: [pdf.js](https://mozilla.github.io/pdf.js/), [pdf-lib](https://pdf-lib.js.org/).
  - Texto y QR: [Tesseract.js](https://tesseract.projectnaptha.com/), [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator).
  - IA en el navegador: [Transformers.js](https://github.com/huggingface/transformers.js), [WebLLM](https://github.com/mlc-ai/web-llm).
- **Íconos:** trazos estilo [Lucide](https://lucide.dev) (ISC).
- **Modelos:**
  - Whisper (OpenAI, MIT).
  - [RMBG-1.4](https://huggingface.co/briaai/RMBG-1.4) (BRIA, **solo uso no comercial**).
  - MODNet (Apache 2.0).
  - Qwen 2.5 (Apache 2.0).
- **Referencias de gesture drawing:** [Wikimedia Commons](https://commons.wikimedia.org), con el crédito y la licencia de cada foto.

Hecho por **Grecia Valentina** · [grevaleart.com](https://grevaleart.com/) · [GitHub](https://github.com/GVPV12)
