'use strict';
/* Creatividad: Ideas para crear + Art Unblock (frases locas) + acceso al temporizador de foco.
   Todo se genera en local combinando bancos de palabras; la IA (local o Claude) es opcional. */
(() => {
  const { $, esc, win, store, toast, L } = BD;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const pickN = (a, n) => [...a].sort(() => Math.random() - .5).slice(0, n);

  // ---------- temporizador de foco (web externa) ----------
  BD.tool({
    path: '/foco', cat: 'estudio', external: 'https://focustimeisnow.netlify.app/', title: 'Temporizador de foco', short: 'Temporizador de foco', icon: BD.icon('timer'),
    colors: ['#b8f2ff', '#22b8cf'], desc: 'Pomodoro y temporizador para concentrarte (Focus Time Is Now).',
    render(view) {
      win(view, { title: L('Temporizador de foco', 'Focus timer') }).innerHTML =
        `<p>${L('Se abre en una pestaña nueva:', 'It opens in a new tab:')}</p><a class="btn primary" href="https://focustimeisnow.netlify.app/" target="_blank" rel="noopener">Focus Time Is Now ↗</a>`;
    },
  });

  // ---------- bancos de palabras (sin concordancia de género: frases que funcionan con cualquier sujeto) ----------
  const BANK = {
    es: {
      subjects: ['un pulpo bibliotecario', 'una ballena que flota en el cielo', 'un astronauta jubilado', 'una bruja que vende helados', 'un robot jardinero', 'un zorro con abrigo de lana',
        'una niña con cabeza de faro', 'un caracol mensajero', 'un dragón diminuto', 'una tetera con piernas', 'un ciervo de cristal', 'un fantasma tímido', 'una sirena de agua dulce',
        'un gato alquimista', 'un esqueleto bailarín', 'una polilla gigante', 'un caballero hecho de musgo', 'un oso panadero', 'una planta carnívora enamorada', 'un búho detective',
        'una nube con insomnio', 'un rey de cartón', 'una medusa eléctrica', 'un pescador de estrellas', 'una abuela pirata', 'un hongo que da consejos', 'un cartero sin cabeza', 'una rana con corona'],
      actions: ['colecciona lágrimas de dragón', 'intenta aprender a silbar', 'pinta el amanecer con un pincel enorme', 'abre una tienda de recuerdos olvidados', 'teje una bufanda para la luna',
        'huye de su propia sombra', 'organiza una fiesta de té bajo el agua', 'riega flores de neón', 'escribe cartas a su yo del futuro', 'cocina sopa de constelaciones',
        'pierde las llaves del universo', 'entrena caracoles de carreras', 'dibuja puertas en las paredes', 'pesca recuerdos en un charco', 'vende paraguas en el desierto',
        'repara relojes que cuentan sueños', 'adopta un meteorito', 'da clases de baile a las hojas secas', 'guarda tormentas en frascos', 'busca el último color del mundo'],
      places: ['en una biblioteca sumergida', 'dentro de una pecera gigante', 'en la azotea de un rascacielos de pan', 'en un bosque de lámparas', 'en el último vagón de un tren nocturno',
        'en una ciudad hecha de libros', 'sobre el lomo de una tortuga enorme', 'en un supermercado abandonado', 'dentro de un reloj', 'en un jardín en la luna', 'en un mercado flotante',
        'en una cocina antigua', 'en un planeta del tamaño de una casa', 'dentro de un sueño ajeno', 'en una lavandería a medianoche', 'en un invernadero de cristal roto', 'en el fondo de una taza de café'],
      twists: ['mientras llueven pétalos', 'pero todo tiene el tamaño equivocado', 'y nadie se da cuenta de que es un sueño', 'mientras el tiempo corre hacia atrás', 'con la luz de una sola vela',
        'mientras un gato lo juzga todo', 'justo antes de que se acabe el mundo', 'mientras suena una música que nadie más oye', 'y la gravedad se tomó el día libre', 'mientras todo se derrite despacio',
        'visto desde los ojos de una hormiga', 'en el instante exacto de un estornudo'],
      vibes: ['nostalgia', 'calma de domingo', 'caos alegre', 'misterio', 'ternura', 'soledad bonita', 'energía de verano', 'miedo tierno', 'euforia', 'melancolía lluviosa', 'fiebre de madrugada', 'cuento antes de dormir'],
      aesthetics: ['cottagecore', 'dark academia', 'vaporwave', 'solarpunk', 'cyberpunk', 'Y2K', 'art nouveau', 'ukiyo-e', 'goblincore', 'dreamcore', 'kawaii', 'gótico', 'anime de los 90', 'pixel art',
        'risografía', 'espacio liminal', 'witchcore', 'diseño Memphis', 'cine negro', 'surrealismo', 'folk art', 'acuarela botánica'],
      animals: ['axolotl', 'zorro', 'polilla', 'cuervo', 'pulpo', 'ciervo', 'rana', 'búho', 'medusa', 'gato', 'conejo', 'caracol', 'ballena', 'mapache', 'colibrí', 'murciélago', 'tortuga', 'lobo'],
      words: ['umbral', 'eco', 'raíz', 'espejo', 'migración', 'refugio', 'brillo', 'olvido', 'semilla', 'marea', 'laberinto', 'promesa', 'vértigo', 'nido', 'faro'],
      constraints: ['usa solo 3 colores', 'hazlo en 20 minutos', 'sin líneas: solo manchas', 'con tu mano no dominante', 'usa una textura de papel', 'composición simétrica', 'vista de pájaro',
        'contraluz fuerte', 'solo formas geométricas', 'formato muy vertical (9:16)', 'incluye texto escrito a mano', 'repite un patrón', 'que el fondo cuente la mitad de la historia', 'un solo punto de luz'],
      compositions: ['regla de tercios con el sujeto a la izquierda', 'primer plano muy cerrado', 'plano general con el sujeto pequeño', 'vista desde abajo para hacerlo épico', 'encuadre dentro de un marco (ventana, puerta, espejo)',
        'diagonal fuerte que guía la mirada', 'mucho espacio negativo', 'silueta recortada contra el cielo'],
    },
    en: {
      subjects: ['a librarian octopus', 'a whale floating in the sky', 'a retired astronaut', 'a witch who sells ice cream', 'a gardener robot', 'a fox in a wool coat',
        'a girl with a lighthouse for a head', 'a messenger snail', 'a tiny dragon', 'a teapot with legs', 'a glass deer', 'a shy ghost', 'a freshwater mermaid',
        'an alchemist cat', 'a dancing skeleton', 'a giant moth', 'a knight made of moss', 'a baker bear', 'a lovesick carnivorous plant', 'a detective owl',
        'an insomniac cloud', 'a cardboard king', 'an electric jellyfish', 'a star fisher', 'a pirate grandma', 'a mushroom that gives advice', 'a headless mail carrier', 'a frog with a crown'],
      actions: ['collects dragon tears', 'tries to learn how to whistle', 'paints the sunrise with a huge brush', 'opens a shop of forgotten memories', 'knits a scarf for the moon',
        'runs away from its own shadow', 'throws an underwater tea party', 'waters neon flowers', 'writes letters to its future self', 'cooks constellation soup',
        'loses the keys to the universe', 'trains racing snails', 'draws doors on walls', 'fishes for memories in a puddle', 'sells umbrellas in the desert',
        'fixes clocks that count dreams', 'adopts a meteorite', 'teaches dance to dry leaves', 'keeps storms in jars', 'searches for the last color in the world'],
      places: ['in a sunken library', 'inside a giant fishbowl', 'on the roof of a bread skyscraper', 'in a forest of lamps', 'in the last car of a night train',
        'in a city made of books', 'on the back of a huge turtle', 'in an abandoned supermarket', 'inside a clock', 'in a garden on the moon', 'in a floating market',
        'in an old kitchen', 'on a planet the size of a house', 'inside someone else\'s dream', 'in a laundromat at midnight', 'in a broken glass greenhouse', 'at the bottom of a coffee cup'],
      twists: ['while petals rain down', 'but everything is the wrong size', 'and nobody notices it\'s a dream', 'while time runs backwards', 'by the light of a single candle',
        'while a cat judges everything', 'right before the world ends', 'while music only it can hear is playing', 'and gravity took the day off', 'while everything slowly melts',
        'seen through the eyes of an ant', 'at the exact moment of a sneeze'],
      vibes: ['nostalgia', 'Sunday calm', 'happy chaos', 'mystery', 'tenderness', 'pretty loneliness', 'summer energy', 'cozy fear', 'euphoria', 'rainy melancholy', '3 a.m. fever', 'bedtime story'],
      aesthetics: ['cottagecore', 'dark academia', 'vaporwave', 'solarpunk', 'cyberpunk', 'Y2K', 'art nouveau', 'ukiyo-e', 'goblincore', 'dreamcore', 'kawaii', 'gothic', '90s anime', 'pixel art',
        'risograph', 'liminal space', 'witchcore', 'Memphis design', 'film noir', 'surrealism', 'folk art', 'botanical watercolor'],
      animals: ['axolotl', 'fox', 'moth', 'crow', 'octopus', 'deer', 'frog', 'owl', 'jellyfish', 'cat', 'rabbit', 'snail', 'whale', 'raccoon', 'hummingbird', 'bat', 'turtle', 'wolf'],
      words: ['threshold', 'echo', 'root', 'mirror', 'migration', 'shelter', 'glow', 'oblivion', 'seed', 'tide', 'labyrinth', 'promise', 'vertigo', 'nest', 'lighthouse'],
      constraints: ['use only 3 colors', 'do it in 20 minutes', 'no lines: only shapes of color', 'with your non-dominant hand', 'use a paper texture', 'symmetrical composition', 'bird\'s-eye view',
        'strong backlight', 'only geometric shapes', 'very vertical format (9:16)', 'include handwritten text', 'repeat a pattern', 'let the background tell half the story', 'a single light source'],
      compositions: ['rule of thirds with the subject on the left', 'very tight close-up', 'wide shot with a small subject', 'low angle to make it epic', 'frame within a frame (window, door, mirror)',
        'strong diagonal leading the eye', 'lots of negative space', 'silhouette against the sky'],
    },
  };
  const B = () => BANK[BD.lang()];

  // ---------- colores: nombres + paleta desde una imagen ----------
  const COLORS = [['rojo', 'red', 214, 40, 40], ['coral', 'coral', 255, 127, 102], ['naranja', 'orange', 255, 140, 0], ['mostaza', 'mustard', 204, 163, 0], ['amarillo', 'yellow', 255, 221, 51],
    ['lima', 'lime', 170, 220, 50], ['verde', 'green', 46, 160, 67], ['verde menta', 'mint', 152, 230, 190], ['verde oliva', 'olive', 110, 120, 50], ['turquesa', 'turquoise', 40, 200, 190],
    ['azul cielo', 'sky blue', 120, 190, 245], ['azul', 'blue', 40, 90, 220], ['azul marino', 'navy', 20, 35, 90], ['lavanda', 'lavender', 190, 170, 240], ['violeta', 'violet', 130, 60, 200],
    ['magenta', 'magenta', 220, 40, 160], ['rosa', 'pink', 250, 120, 170], ['rosa pastel', 'pastel pink', 255, 200, 215], ['marrón', 'brown', 120, 72, 40], ['terracota', 'terracotta', 200, 100, 70],
    ['beige', 'beige', 225, 205, 170], ['crema', 'cream', 250, 242, 220], ['dorado', 'gold', 212, 175, 55], ['gris', 'grey', 130, 130, 130], ['negro', 'black', 20, 20, 24], ['blanco', 'white', 248, 248, 248]];
  const hex = (r, g, b) => '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const colorName = (r, g, b) => { const c = COLORS.reduce((best, c) => { const d = (c[2] - r) ** 2 * 2 + (c[3] - g) ** 2 * 4 + (c[4] - b) ** 2 * 3; return d < best[0] ? [d, c] : best; }, [Infinity])[1]; return L(c[0], c[1]); };
  // Colores dominantes: cuantiza a 64 niveles y premia los saturados para no quedarse solo con el fondo
  async function palette(file, n = 4) {
    const img = await BD.loadImage(file), c = document.createElement('canvas'); c.width = c.height = 48;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, 48, 48); URL.revokeObjectURL(img.src);
    const d = x.getImageData(0, 0, 48, 48).data, bins = {};
    for (let i = 0; i < d.length; i += 4) {
      const k = (d[i] >> 6) * 16 + (d[i + 1] >> 6) * 4 + (d[i + 2] >> 6), b = bins[k] = bins[k] || { n: 0, r: 0, g: 0, b: 0 };
      b.n++; b.r += d[i]; b.g += d[i + 1]; b.b += d[i + 2];
    }
    return Object.values(bins).map(b => { const r = b.r / b.n, g = b.g / b.n, bl = b.b / b.n, sat = Math.max(r, g, bl) - Math.min(r, g, bl); return { r, g, b: bl, w: b.n * (1 + sat / 64) }; })
      .sort((a, b) => b.w - a.w).slice(0, n).map(c => ({ hex: hex(c.r, c.g, c.b), name: colorName(c.r, c.g, c.b) }));
  }
  // Paleta armónica a partir de un tono (o al azar)
  function harmony(baseHex) {
    const h0 = baseHex ? (() => { const [r, g, b] = baseHex.slice(1).match(/../g).map(v => parseInt(v, 16) / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), dd = mx - mn;
      return dd ? (mx === r ? ((g - b) / dd) % 6 : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4) * 60 : 0; })() : Math.random() * 360;
    const scheme = pick([[0, 30, 180, 200], [0, 120, 240, 30], [0, 20, 40, 200], [0, 150, 210, 0]]);
    return scheme.map((dh, i) => `hsl(${Math.round((h0 + dh + 360) % 360)} ${[70, 55, 65, 25][i]}% ${[55, 70, 40, 90][i]}%)`);
  }

  // Para Paletas y Reto de 30 días
  BD.creative = { B, pick, pickN, COLORS, hex, colorName, palette };

  // ---------- semillas que elige la persona ----------
  const TYPES = () => [['tema', L('Tema', 'Theme')], ['vibe', 'Vibe'], ['aesthetic', L('Estética', 'Aesthetic')], ['palabra', L('Palabra', 'Word')], ['color', 'Color'],
    ['animal', 'Animal'], ['definicion', L('Definición', 'Definition')], ['otro', L('Otro', 'Other')]];
  const RANDOM_FOR = { vibe: 'vibes', aesthetic: 'aesthetics', animal: 'animals', palabra: 'words', color: null };
  function seedEditor(el, key, onChange) {
    let seeds = store.get(key, []);
    el.innerHTML = `
      <div class="row"><select class="sdType" style="max-width:150px">${TYPES().map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>
        <input type="text" class="sdText" placeholder="${L('Escribe y pulsa Enter', 'Type and press Enter')}" style="flex:1;min-width:140px">
        <button class="btn ghost sm sdAdd">+</button><button class="btn ghost sm sdRand" title="${L('Añadir uno al azar de este tipo', 'Add a random one of this type')}">🎲</button></div>
      <div class="row sdImg"></div>
      <div class="row sdList" style="margin-top:6px"></div>`;
    const paint = () => {
      store.set(key, seeds);
      $('.sdList', el).innerHTML = seeds.map((s, i) => `<span class="chip" translate="no">${s.hex ? `<i class="swatch" style="background:${s.hex}"></i>` : ''}<span class="muted">${esc(TYPES().find(t => t[0] === s.type)?.[1] || s.type)}:</span> ${esc(s.text)} <b data-rm="${i}" style="cursor:pointer">✕</b></span>`).join('')
        || `<span class="muted small">${L('Sin semillas: todo será al azar.', 'No seeds: everything will be random.')}</span>`;
      onChange(seeds);
    };
    const add = (type, text, extra = {}) => {
      text = text.trim(); if (!text) return;
      // un color escrito a mano ("verde menta", "teal", "#ff00aa") también lleva su muestra
      if (type === 'color' && !extra.hex) {
        const c = COLORS.find(c => [c[0], c[1]].includes(text.toLowerCase()));
        if (c) extra.hex = hex(c[2], c[3], c[4]); else if (CSS.supports('color', text)) extra.hex = text;
      }
      seeds.push({ type, text, ...extra }); paint();
    };
    $('.sdText', el).onkeydown = e => { if (e.key === 'Enter') { add($('.sdType', el).value, e.target.value); e.target.value = ''; } };
    $('.sdAdd', el).onclick = () => { add($('.sdType', el).value, $('.sdText', el).value); $('.sdText', el).value = ''; };
    $('.sdRand', el).onclick = () => {
      const t = $('.sdType', el).value;
      if (t === 'color') { const c = pick(COLORS); return add('color', L(c[0], c[1]), { hex: hex(c[2], c[3], c[4]) }); }
      add(t, pick(B()[RANDOM_FOR[t] || 'words']));
    };
    $('.sdList', el).onclick = e => { const r = e.target.closest('[data-rm]'); if (r) { seeds.splice(+r.dataset.rm, 1); paint(); } };
    BD.dropzone($('.sdImg', el), {
      accept: 'image/*', multiple: false, paste: false, icon: '🖼️', label: L('…o sube una imagen de referencia', '…or upload a reference image'), hint: L('Se extraen sus colores', 'Its colors are extracted'),
      async onFiles([f]) { (await palette(f, 3)).forEach(c => seeds.push({ type: 'color', text: c.name, hex: c.hex })); paint(); },
    });
    paint();
    return { get: () => seeds };
  }
  const ofType = (seeds, t) => seeds.filter(s => s.type === t).map(s => s.text);
  const swatches = cols => `<div class="row" style="gap:6px">${cols.map(c => `<span class="swatch big" style="background:${c}" title="${c}"></span>`).join('')}</div>`;

  // ================= IDEAS PARA CREAR =================
  const FORMATS = () => [
    ['dibujo', L('Dibujo / ilustración', 'Drawing / illustration'), L('Empieza con 3 miniaturas de 2 minutos y elige la que mejor se lea.', 'Start with 3 two-minute thumbnails and pick the one that reads best.')],
    ['personaje', L('Diseño de personaje', 'Character design'), L('Haz una hoja con 3 poses, 3 expresiones y una paleta de 5 colores.', 'Make a sheet with 3 poses, 3 expressions and a 5-color palette.')],
    ['post', L('Post para redes', 'Social media post'), L('Primera imagen con gancho visual; en el texto, una pregunta para que comenten.', 'First image with a visual hook; in the caption, a question to get comments.')],
    ['carrusel', L('Carrusel / proceso', 'Carousel / process'), L('5 slides: resultado → boceto → color → detalle → resultado otra vez.', '5 slides: result → sketch → color → detail → result again.')],
    ['sticker', L('Stickers', 'Stickers'), L('Siluetas simples, borde blanco grueso, legible a 3 cm.', 'Simple silhouettes, thick white border, readable at 3 cm.')],
    ['comic', L('Cómic de 4 viñetas', '4-panel comic'), L('Viñeta 1 presenta, 2 complica, 3 empeora, 4 remata con un giro.', 'Panel 1 sets up, 2 complicates, 3 escalates, 4 lands a twist.')],
    ['3d', L('Escena / modelo 3D', '3D scene / model'), L('Bloquea con formas primitivas, ilumina con una luz principal y una de borde.', 'Block out with primitives, light with a key light and a rim light.')],
    ['pixel', 'Pixel art', L('Lienzo de 64×64 y una paleta de 8 colores como máximo.', '64×64 canvas and an 8-color palette max.')],
    ['animacion', L('Animación en loop', 'Looping animation'), L('8-12 frames; el último debe enlazar perfecto con el primero.', '8-12 frames; the last one must loop perfectly into the first.')],
    ['poster', L('Póster', 'Poster'), L('Una imagen central y una tipografía protagonista; deja respirar los márgenes.', 'One central image and one hero typeface; let the margins breathe.')],
    ['foto', L('Fotografía', 'Photography'), L('Busca la hora dorada o una sola lámpara lateral.', 'Look for golden hour or a single side lamp.')],
    ['tatuaje', L('Diseño de tatuaje', 'Tattoo design'), L('Línea limpia, que funcione en blanco y negro y a tamaño pequeño.', 'Clean line art that works in black and white and small.')],
    ['zine', L('Página de fanzine', 'Zine page'), L('Mezcla collage, texto a mano y una sola tinta.', 'Mix collage, handwritten text and a single ink.')],
    ['historia', L('Microrrelato', 'Flash fiction'), L('Máximo 150 palabras; termina con una imagen, no con una explicación.', '150 words max; end on an image, not an explanation.')],
  ];
  function makeIdea(fmt, seeds) {
    const b = B(), F = FORMATS().find(f => f[0] === fmt) || pick(FORMATS());
    const animals = ofType(seeds, 'animal'), cols = seeds.filter(s => s.type === 'color');
    const subject = animals.length ? L(`un personaje con forma de ${pick(animals)}`, `a character shaped like a ${pick(animals)}`) : pick(b.subjects);
    const parts = [subject, pick(b.actions), pick(b.places)];
    const extra = [];
    ofType(seeds, 'tema').forEach(t => extra.push(L(`sobre el tema «${t}»`, `about «${t}»`)));
    ofType(seeds, 'palabra').forEach(w => extra.push(L(`inspirado en la palabra «${w}»`, `inspired by the word «${w}»`)));
    ofType(seeds, 'definicion').forEach(d => extra.push(L(`que represente «${d}»`, `that represents «${d}»`)));
    ofType(seeds, 'otro').forEach(o => extra.push(L(`con «${o}» escondido en algún lugar`, `with «${o}» hidden somewhere`)));
    const vibe = ofType(seeds, 'vibe')[0] || pick(b.vibes), aes = ofType(seeds, 'aesthetic')[0] || pick(b.aesthetics);
    const pal = cols.length ? [...cols.map(c => c.hex || c.text), ...harmony(cols[0].hex).slice(cols.length)].slice(0, 4) : harmony();
    return {
      format: F[1],
      concept: `${parts.join(' ')}${extra.length ? ', ' + extra.join(', ') : ''}.`.replace(/^./, c => c.toUpperCase()),
      vibe, aes, palette: pal, paletteNames: cols.map(c => c.text),
      composition: pick(b.compositions), constraint: pick(b.constraints), tip: F[2],
    };
  }
  const ideaText = i => `${i.format}: ${i.concept}\nVibe: ${i.vibe} · ${L('Estética', 'Aesthetic')}: ${i.aes}\n${L('Composición', 'Composition')}: ${i.composition}\n${L('Reto', 'Challenge')}: ${i.constraint}\n${L('Consejo', 'Tip')}: ${i.tip}`;
  const ideaCard = (i, k, saved) => `
    <div class="card stack idea" translate="no">
      <div class="row"><span class="chip">${esc(i.format)}</span><span class="spacer"></span>
        <button class="icon-btn" data-copy="${k}" title="${L('Copiar', 'Copy')}">⧉</button>
        <button class="icon-btn" data-fav="${k}" title="${saved ? L('Quitar de guardadas', 'Remove from saved') : L('Guardar', 'Save')}">${saved ? '✕' : '★'}</button></div>
      <p style="margin:0;font-size:1.05rem;font-weight:600">${esc(i.concept)}</p>
      <div class="small"><b>Vibe:</b> ${esc(i.vibe)} · <b>${L('Estética', 'Aesthetic')}:</b> ${esc(i.aes)}</div>
      ${swatches(i.palette)}
      <div class="small"><b>${L('Composición', 'Composition')}:</b> ${esc(i.composition)}</div>
      <div class="small"><b>${L('Reto', 'Challenge')}:</b> ${esc(i.constraint)}</div>
      <div class="muted small">💡 ${esc(i.tip)}</div>
    </div>`;

  BD.tool({
    path: '/ideas', cat: 'creativo', title: 'Ideas para crear', short: 'Ideas para crear', icon: BD.icon('bulb'),
    colors: ['#fff07a', '#ffb703'], desc: 'Ideas para dibujar, ilustrar, publicar o modelar a partir de un tema, vibe, estética, color, animal o lo que quieras.',
    render(view) {
      const body = win(view, { title: L('Ideas para crear', 'Creative ideas'), sub: L(
        'Elige qué quieres crear y dale semillas: un tema, una vibe, una estética, una palabra, un color, un animal, una definición… o una imagen de referencia. Sin semillas, todo sale al azar.',
        'Pick what you want to make and give it seeds: a theme, a vibe, an aesthetic, a word, a color, an animal, a definition… or a reference image. No seeds means fully random.') });
      let fmt = store.get('ideas:fmt', 'dibujo'), current = [];
      body.innerHTML = `
        <div class="card stack">
          <div class="field"><span>${L('¿Qué quieres crear?', 'What do you want to make?')}</span><div class="row" id="iFmt"></div></div>
          <div class="field"><span>${L('Semillas (opcional)', 'Seeds (optional)')}</span><div id="iSeeds"></div></div>
          <div class="row">
            <button class="btn primary" id="iGo">🎲 ${L('Dame 4 ideas', 'Give me 4 ideas')}</button>
            <button class="btn ghost" id="iAI">✨ ${L('Ideas con IA', 'Ideas with AI')}</button><span class="muted small" id="iSt"></span>
          </div>
        </div>
        <div class="grid g2" id="iOut" style="margin-top:16px"></div>
        <div class="section-title"><h2>${L('Ideas guardadas', 'Saved ideas')}</h2></div>
        <div class="grid g2" id="iSaved"></div>`;
      const paintFmt = () => $('#iFmt', body).innerHTML = FORMATS().map(([v, l]) => `<button class="btn sm ${v === fmt ? 'primary' : 'ghost'}" data-f="${v}">${l}</button>`).join('');
      $('#iFmt', body).onclick = e => { const b = e.target.closest('[data-f]'); if (b) { fmt = b.dataset.f; store.set('ideas:fmt', fmt); paintFmt(); } };
      paintFmt();
      const seeds = seedEditor($('#iSeeds', body), 'ideas:seeds', () => {});
      const paint = () => {
        $('#iOut', body).innerHTML = current.map((i, k) => ideaCard(i, 'c' + k)).join('');
        $('#iSaved', body).innerHTML = store.get('ideas:saved', []).map((i, k) => ideaCard(i, 's' + k, true)).join('') || `<p class="muted small">${L('Pulsa ★ en una idea para guardarla.', 'Click ★ on an idea to save it.')}</p>`;
      };
      $('#iGo', body).onclick = () => { current = Array.from({ length: 4 }, () => makeIdea(fmt, seeds.get())); paint(); };
      $('#iAI', body).onclick = async e => {
        const btn = e.currentTarget, st = $('#iSt', body), F = FORMATS().find(f => f[0] === fmt);
        btn.disabled = true; st.innerHTML = '<span class="spin"></span>';
        try {
          const s = seeds.get().map(x => `${x.type}: ${x.text}`).join('; ') || L('ninguna (sorpréndeme)', 'none (surprise me)');
          const r = await BD.anyAI(L(
            `Dame 4 ideas originales y concretas para crear: ${F[1]}. Semillas: ${s}. Usa las semillas de forma creativa, no literal. Responde solo JSON: {"ideas":[{"concept":"1-2 frases visuales","vibe":"","aes":"estética","palette":["#hex","#hex","#hex","#hex"],"composition":"","constraint":"un reto","tip":"consejo práctico"}]}`,
            `Give me 4 original, concrete ideas to make: ${F[1]}. Seeds: ${s}. Use the seeds creatively, not literally. Reply only JSON: {"ideas":[{"concept":"1-2 visual sentences","vibe":"","aes":"aesthetic","palette":["#hex","#hex","#hex","#hex"],"composition":"","constraint":"a challenge","tip":"practical tip"}]}`),
          { json: true, system: L('Eres directora de arte y das ideas creativas sorprendentes. Respondes solo JSON válido.', 'You are an art director with surprising creative ideas. You reply with valid JSON only.'),
            onProgress: (p, msg) => st.textContent = `${msg} ${Math.round(p * 100)}%` });
          current = (r.ideas || r).filter(i => i && i.concept).map(i => ({ format: F[1], concept: String(i.concept), vibe: String(i.vibe || ''), aes: String(i.aes || ''),
            palette: (Array.isArray(i.palette) ? i.palette : []).filter(c => /^#[0-9a-f]{3,8}$/i.test(c)).slice(0, 5), composition: String(i.composition || ''), constraint: String(i.constraint || ''), tip: String(i.tip || '') }));
          st.textContent = ''; paint();
        } catch (err) { st.textContent = ''; toast(err.message, 'bad'); }
        btn.disabled = false;
      };
      body.addEventListener('click', e => {
        const c = e.target.closest('[data-copy]'), f = e.target.closest('[data-fav]');
        const get = k => k[0] === 'c' ? current[+k.slice(1)] : store.get('ideas:saved', [])[+k.slice(1)];
        if (c) BD.copy(ideaText(get(c.dataset.copy)));
        if (f) {
          const k = f.dataset.fav, all = store.get('ideas:saved', []);
          if (k[0] === 's') all.splice(+k.slice(1), 1); else { all.unshift(get(k)); toast(L('Idea guardada ★', 'Idea saved ★')); }
          store.set('ideas:saved', all.slice(0, 100)); paint();
        }
      });
      paint();
    },
  });

  // ================= ART UNBLOCK =================
  function crazySentence(seeds, level) {
    const b = B();
    const animals = ofType(seeds, 'animal'), cols = seeds.filter(s => s.type === 'color');
    let s = `${animals.length ? L(`un ser mitad ${pick(animals)} y mitad ${pick(b.animals)}`, `a creature half ${pick(animals)}, half ${pick(b.animals)}`) : pick(b.subjects)} ${pick(b.actions)} ${pick(b.places)}`;
    const clauses = [];
    ofType(seeds, 'palabra').forEach(w => clauses.push(L(`sin poder dejar de pensar en «${w}»`, `unable to stop thinking about «${w}»`)));
    ofType(seeds, 'definicion').forEach(d => clauses.push(L(`intentando explicar qué es «${d}»`, `trying to explain what «${d}» is`)));
    ofType(seeds, 'tema').concat(ofType(seeds, 'otro')).forEach(t => clauses.push(L(`mientras todo gira alrededor de «${t}»`, `while everything revolves around «${t}»`)));
    ofType(seeds, 'aesthetic').forEach(a => clauses.push(L(`todo en estética ${a}`, `all in ${a} aesthetic`)));
    ofType(seeds, 'vibe').forEach(v => clauses.push(L(`con una vibe de ${v}`, `with a ${v} vibe`)));
    if (cols.length) clauses.push(L(`y el mundo entero es ${cols.map(c => c.text).join(' y ')}`, `and the whole world is ${cols.map(c => c.text).join(' and ')}`));
    // todas las semillas (en orden aleatorio) + tantos giros como nivel de locura
    s += ', ' + [...pickN(clauses, clauses.length), ...pickN(b.twists, level)].join(', ') + '.';
    return { text: s.replace(/^./, c => c.toUpperCase()), colors: cols.map(c => c.hex).filter(Boolean) };
  }

  BD.tool({
    path: '/art-unblock', cat: 'creativo', title: 'Art Unblock', short: 'Art Unblock', icon: BD.icon('sparkles'),
    colors: ['#ff9ee8', '#9b5cff'], desc: 'Una frase loca y aleatoria para desbloquear tu creatividad. 100% al azar o con tus palabras, colores o imágenes.',
    render(view) {
      const body = win(view, { title: 'Art Unblock', sub: L(
        '¿Bloqueo creativo? Pide una frase absurda y conviértela en arte. Puede ser 100% aleatoria o mezclar tus palabras, colores, definiciones, estéticas o los colores de una imagen.',
        'Creative block? Get an absurd sentence and turn it into art. It can be 100% random or mix in your words, colors, definitions, aesthetics or the colors of an image.') });
      let mode = store.get('unblock:mode', 'random'), level = store.get('unblock:level', 1), cur = null;
      body.innerHTML = `
        <div class="card stack">
          <div class="row"><div id="uMode"></div><label class="field" style="flex:1;min-width:180px"><span>${L('Nivel de locura', 'Craziness level')} <b id="uLvlV"></b></span><input type="range" id="uLvl" min="1" max="3" value="${level}"></label></div>
          <div id="uSeeds" class="${mode === 'random' ? 'hidden' : ''}"></div>
        </div>
        <div class="unblock" id="uOut" translate="no"><p class="muted">${L('Pulsa el botón y deja que el caos haga lo suyo.', 'Hit the button and let chaos do its thing.')}</p></div>
        <div class="row" style="justify-content:center;margin:14px 0">
          <button class="btn primary" id="uGo">🌀 ${L('Desbloquéame', 'Unblock me')}</button>
          <button class="btn ghost" id="uAI">✨ ${L('Más loca con IA', 'Crazier with AI')}</button>
          <button class="btn ghost" id="uCopy">${L('Copiar', 'Copy')}</button>
          <button class="btn ghost" id="uFav">★ ${L('Guardar', 'Save')}</button>
        </div>
        <div class="section-title"><h2>${L('Frases guardadas', 'Saved sentences')}</h2></div>
        <div class="stack" id="uSaved"></div>`;
      BD.seg($('#uMode', body), [['random', '🎲 ' + L('100% aleatoria', '100% random')], ['seeded', '🌱 ' + L('Con mis semillas', 'With my seeds')]], mode, v => {
        mode = v; store.set('unblock:mode', v); $('#uSeeds', body).classList.toggle('hidden', v === 'random');
      });
      const lv = $('#uLvl', body), names = [L('rarita', 'odd'), L('absurda', 'absurd'), L('delirante', 'unhinged')];
      lv.oninput = () => { level = +lv.value; store.set('unblock:level', level); $('#uLvlV', body).textContent = names[level - 1]; }; lv.oninput();
      const seeds = seedEditor($('#uSeeds', body), 'unblock:seeds', () => {});
      const show = r => {
        cur = r;
        $('#uOut', body).innerHTML = `<p class="unblock-text">${esc(r.text)}</p>${r.colors?.length ? swatches(r.colors) : ''}`;
        $('#uOut', body).animate([{ transform: 'scale(.96)', opacity: .4 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)' });
      };
      $('#uGo', body).onclick = () => show(crazySentence(mode === 'random' ? [] : seeds.get(), level));
      $('#uAI', body).onclick = async e => {
        const btn = e.currentTarget; btn.disabled = true;
        try {
          const s = mode === 'random' ? '' : seeds.get().map(x => `${x.type}: ${x.text}`).join('; ');
          const r = await BD.anyAI(L(
            `Escribe UNA sola oración absurda, visual y surrealista (máx. 45 palabras) que una artista pueda dibujar. Nivel de locura ${level}/3.${s ? ' Incluye estas semillas: ' + s : ''} Responde solo JSON: {"text":""}`,
            `Write ONE absurd, visual, surreal sentence (max 45 words) an artist could draw. Craziness ${level}/3.${s ? ' Include these seeds: ' + s : ''} Reply only JSON: {"text":""}`),
          { json: true, system: L('Eres una musa caótica y poética. Respondes solo JSON válido.', 'You are a chaotic, poetic muse. You reply with valid JSON only.') });
          if (r.text) show({ text: String(r.text), colors: mode === 'random' ? [] : seeds.get().map(x => x.hex).filter(Boolean) });
        } catch (err) { toast(err.message, 'bad'); }
        btn.disabled = false;
      };
      const paintSaved = () => {
        $('#uSaved', body).innerHTML = store.get('unblock:saved', []).map((r, i) => `<div class="card row" translate="no"><span style="flex:1">${esc(r.text)}</span><button class="icon-btn" data-c="${i}">⧉</button><button class="icon-btn" data-x="${i}">✕</button></div>`).join('')
          || `<p class="muted small">${L('Aún no guardas frases.', 'No saved sentences yet.')}</p>`;
      };
      $('#uCopy', body).onclick = () => cur ? BD.copy(cur.text) : toast(L('Primero genera una frase', 'Generate a sentence first'), 'bad');
      $('#uFav', body).onclick = () => { if (!cur) return toast(L('Primero genera una frase', 'Generate a sentence first'), 'bad'); const all = store.get('unblock:saved', []); all.unshift(cur); store.set('unblock:saved', all.slice(0, 100)); paintSaved(); toast(L('Frase guardada ★', 'Sentence saved ★')); };
      $('#uSaved', body).onclick = e => {
        const c = e.target.closest('[data-c]'), x = e.target.closest('[data-x]'), all = store.get('unblock:saved', []);
        if (c) BD.copy(all[+c.dataset.c].text);
        if (x) { all.splice(+x.dataset.x, 1); store.set('unblock:saved', all); paintSaved(); }
      };
      paintSaved();
    },
  });
})();
