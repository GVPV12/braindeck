'use strict';
/* Silly games: morse, quiz, ahorcado, dibujo ASCII, historia interactiva, quiz de países */
(() => {
  const { $, $$, esc, win, store, toast } = BD;
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const deaccent = s => s.replace(/ñ/g, '\u0001').replace(/Ñ/g, '\u0002').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'ñ').replace(/\u0002/g, 'Ñ');

  const GAMES = [
    { id: 'morse', title: 'Texto ↔ Morse', icon: BD.icon('radio'), colors: ['#6ff0e0', '#0fb5a5'], desc: 'Traduce, escucha y mira parpadear tu mensaje.' },
    { id: 'quiz', title: 'Quiz rápido', icon: BD.icon('help'), colors: ['#ffe066', '#ffa400'], desc: '10 preguntas de cultura general.' },
    { id: 'ahorcado', title: 'Ahorcado', icon: BD.icon('gallows'), colors: ['#ff8fc4', '#ff3d8f'], desc: 'Adivina la palabra antes de que sea tarde.' },
    { id: 'ascii', title: 'Dibujo ASCII', icon: BD.icon('terminal'), colors: ['#c4a8ff', '#7448ff'], desc: 'Pinta con caracteres o convierte una imagen. Copia y pega donde quieras.' },
    { id: 'historia', title: 'Crea tu propia historia', icon: BD.icon('scroll'), colors: ['#ffab8a', '#ff5a36'], desc: 'Tus decisiones cambian el final. ¿Los encuentras todos?' },
    { id: 'paises', title: 'Quiz de países', icon: BD.icon('globe'), colors: ['#7ef0b6', '#14b86a'], desc: 'Capitales, banderas y continentes.' },
  ];

  BD.tool({
    path: '/juegos', title: 'Silly games', short: 'Minijuegos', icon: BD.icon('gamepad'), group: 'extra',
    colors: ['#f7a1ff', '#c13bff'], desc: 'Mini apps inútiles pero divertidas: morse, ahorcado, ASCII, historias y quizzes.',
    render(view) {
      const body = win(view, { title: 'Silly games', sub: 'Inútiles pero divertidos. Cada juego tiene su propio enlace.' });
      body.innerHTML = `<div class="tool-grid">${GAMES.map(g => `
        <a class="tool-card" href="#/juegos/${g.id}" style="--c1:${g.colors[0]};--c2:${g.colors[1]}"><span class="go">→</span>
        <div class="orb"><span>${g.icon}</span></div><h3>${g.title}</h3><p>${g.desc}</p></a>`).join('')}</div>`;
    },
  });

  BD.route('/juegos/:id', {
    title: 'Juego',
    render(view, { id }) {
      const g = GAMES.find(g => g.id === id);
      if (!g) { location.hash = '#/juegos'; return; }
      document.title = BD.tr(g.title) + ' · BrainDeck';
      const body = win(view, { title: g.title, sub: g.desc, back: '#/juegos' });
      return GAME_FN[id](body);
    },
  });

  // ================= MORSE =================
  const MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', Ñ: '--.--', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
    0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--', '¿': '..-.-', '¡': '--...-', '@': '.--.-.', '/': '-..-.', '-': '-....-', ':': '---...', '"': '.-..-.', "'": '.----.', '=': '-...-', '+': '.-.-.', '(': '-.--.', ')': '-.--.-', '&': '.-...' };
  const REV = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));
  const toMorse = t => deaccent(t.toUpperCase()).split(/\s+/).filter(Boolean).map(w => [...w].map(c => MORSE[c] || '').filter(Boolean).join(' ')).join(' / ');
  const fromMorse = m => m.trim().split(/\s*\/\s*|\s{3,}/).map(w => w.split(/\s+/).map(c => REV[c] || '�').join('')).join(' ');

  const GAME_FN = {};
  GAME_FN.morse = body => {
    body.innerHTML = `
      <div class="grid g2">
        <label class="field"><span>Escribe texto o código morse</span><textarea id="mIn" placeholder="Hola mundo  ·  o  ·  .... --- .-.. .-"></textarea></label>
        <div class="field"><span id="mLbl">Resultado</span><div class="card morse-out" id="mOut" style="min-height:110px"></div></div>
      </div>
      <div class="row" style="margin-top:14px">
        <button class="btn primary" id="mPlay">▶ Escuchar</button><button class="btn ghost" id="mStop">■ Parar</button>
        <button class="btn ghost" id="mCopy">Copiar</button><div class="flash" id="mFlash"></div>
        <label class="field" style="flex:1;min-width:160px"><span>Velocidad</span><input type="range" id="mWpm" min="5" max="30" value="15"></label>
      </div>
      <details style="margin-top:16px"><summary class="muted">Ver alfabeto</summary>
        <div class="grid g4 mono small" style="margin-top:10px">${Object.entries(MORSE).slice(0, 37).map(([k, v]) => `<span><b>${k}</b> ${v}</span>`).join('')}</div></details>`;
    const inp = $('#mIn', body), out = $('#mOut', body);
    const isMorse = s => /^[\s.\-/·—_]+$/.test(s) && /[.\-]/.test(s);
    const conv = () => {
      const s = inp.value.replace(/·/g, '.').replace(/[—_]/g, '-');
      if (!s.trim()) { out.textContent = ''; return; }
      if (isMorse(s)) { $('#mLbl', body).textContent = 'Texto'; out.textContent = fromMorse(s); }
      else { $('#mLbl', body).textContent = 'Código morse'; out.textContent = toMorse(s); }
    };
    inp.oninput = conv;
    let ctx = null, timers = [];
    const stop = () => { timers.forEach(clearTimeout); timers = []; if (ctx) { ctx.close(); ctx = null; } $('#mFlash', body)?.classList.remove('on'); };
    $('#mPlay', body).onclick = () => {
      stop();
      const s = inp.value.replace(/·/g, '.').replace(/[—_]/g, '-');
      const code = isMorse(s) ? s.trim() : toMorse(s);
      if (!code) return;
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const unit = 1.2 / +$('#mWpm', body).value;
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.frequency.value = 620; osc.connect(gain); gain.connect(ctx.destination); gain.gain.value = 0;
      let t = ctx.currentTime + .1; const t0 = t;
      const flash = $('#mFlash', body);
      const beep = len => {
        gain.gain.setTargetAtTime(.25, t, .004); gain.gain.setTargetAtTime(0, t + len, .004);
        const on = (t - t0 + .1) * 1000, off = on + len * 1000;
        timers.push(setTimeout(() => flash.classList.add('on'), on), setTimeout(() => flash.classList.remove('on'), off));
        t += len + unit;
      };
      for (const ch of code) {
        if (ch === '.') beep(unit); else if (ch === '-') beep(unit * 3);
        else if (ch === ' ') t += unit * 2; else if (ch === '/') t += unit * 2;
      }
      osc.start(); osc.stop(t + .1);
      timers.push(setTimeout(stop, (t - t0 + .3) * 1000));
    };
    $('#mStop', body).onclick = stop;
    $('#mCopy', body).onclick = () => BD.copy(out.textContent);
    return stop;
  };

  // ================= QUIZ =================
  const TRIVIA = [
    ['¿Cuál es el planeta más grande del sistema solar?', 'Júpiter', ['Saturno', 'Neptuno', 'Tierra']],
    ['¿Cuántos lados tiene un hexágono?', '6', ['5', '7', '8']],
    ['¿Quién pintó "La noche estrellada"?', 'Vincent van Gogh', ['Claude Monet', 'Pablo Picasso', 'Frida Kahlo']],
    ['¿Cuál es el océano más grande?', 'Pacífico', ['Atlántico', 'Índico', 'Ártico']],
    ['¿Qué gas absorben las plantas para la fotosíntesis?', 'Dióxido de carbono', ['Oxígeno', 'Nitrógeno', 'Helio']],
    ['¿En qué año llegó el ser humano a la Luna?', '1969', ['1959', '1972', '1981']],
    ['¿Cuál es el hueso más largo del cuerpo humano?', 'Fémur', ['Tibia', 'Húmero', 'Radio']],
    ['¿Qué lenguaje se usa para dar estilo a las páginas web?', 'CSS', ['HTML', 'SQL', 'Python']],
    ['¿Cuántos colores tiene el arcoíris?', '7', ['5', '6', '8']],
    ['¿Qué animal es el mamífero más grande?', 'Ballena azul', ['Elefante africano', 'Jirafa', 'Tiburón ballena']],
    ['¿Quién escribió "Cien años de soledad"?', 'Gabriel García Márquez', ['Mario Vargas Llosa', 'Isabel Allende', 'Julio Cortázar']],
    ['¿Cuál es el símbolo químico del oro?', 'Au', ['Ag', 'Go', 'Or']],
    ['¿Qué instrumento tiene 88 teclas?', 'Piano', ['Órgano', 'Acordeón', 'Clavicordio']],
    ['¿Cuál es la capital de Japón?', 'Tokio', ['Kioto', 'Osaka', 'Seúl']],
    ['¿Cuántos minutos tiene un día?', '1440', ['1240', '1600', '960']],
    ['¿Qué colores primarios usa el modelo de luz RGB?', 'Rojo, verde y azul', ['Rojo, amarillo y azul', 'Cian, magenta y amarillo', 'Negro, blanco y gris']],
    ['¿Qué estudia la botánica?', 'Las plantas', ['Los animales', 'Las rocas', 'Las estrellas']],
    ['¿Cuál es el río más caudaloso del mundo?', 'Amazonas', ['Nilo', 'Misisipi', 'Yangtsé']],
    ['¿Cuántas patas tiene una araña?', '8', ['6', '10', '12']],
    ['¿Qué significa "www" en una dirección web?', 'World Wide Web', ['Wide World Web', 'Web World Wide', 'World Web Window']],
    ['¿Qué país tiene forma de bota?', 'Italia', ['Grecia', 'Portugal', 'Chile']],
    ['¿Cuál es el metal líquido a temperatura ambiente?', 'Mercurio', ['Plomo', 'Aluminio', 'Estaño']],
  ];
  const TRIVIA_EN = [
    ['What is the largest planet in the solar system?', 'Jupiter', ['Saturn', 'Neptune', 'Earth']],
    ['How many sides does a hexagon have?', '6', ['5', '7', '8']],
    ['Who painted "The Starry Night"?', 'Vincent van Gogh', ['Claude Monet', 'Pablo Picasso', 'Frida Kahlo']],
    ['What is the largest ocean?', 'Pacific', ['Atlantic', 'Indian', 'Arctic']],
    ['Which gas do plants absorb for photosynthesis?', 'Carbon dioxide', ['Oxygen', 'Nitrogen', 'Helium']],
    ['In what year did humans first land on the Moon?', '1969', ['1959', '1972', '1981']],
    ['What is the longest bone in the human body?', 'Femur', ['Tibia', 'Humerus', 'Radius']],
    ['Which language is used to style web pages?', 'CSS', ['HTML', 'SQL', 'Python']],
    ['How many colors are in a rainbow?', '7', ['5', '6', '8']],
    ['What is the largest mammal?', 'Blue whale', ['African elephant', 'Giraffe', 'Whale shark']],
    ['Who wrote "One Hundred Years of Solitude"?', 'Gabriel García Márquez', ['Mario Vargas Llosa', 'Isabel Allende', 'Julio Cortázar']],
    ['What is the chemical symbol for gold?', 'Au', ['Ag', 'Go', 'Gd']],
    ['Which instrument has 88 keys?', 'Piano', ['Organ', 'Accordion', 'Clavichord']],
    ['What is the capital of Japan?', 'Tokyo', ['Kyoto', 'Osaka', 'Seoul']],
    ['How many minutes are in a day?', '1440', ['1240', '1600', '960']],
    ['Which primary colors does the RGB light model use?', 'Red, green and blue', ['Red, yellow and blue', 'Cyan, magenta and yellow', 'Black, white and grey']],
    ['What does botany study?', 'Plants', ['Animals', 'Rocks', 'Stars']],
    ['Which river carries the most water in the world?', 'Amazon', ['Nile', 'Mississippi', 'Yangtze']],
    ['How many legs does a spider have?', '8', ['6', '10', '12']],
    ['What does "www" stand for in a web address?', 'World Wide Web', ['Wide World Web', 'Web World Wide', 'World Web Window']],
    ['Which country is shaped like a boot?', 'Italy', ['Greece', 'Portugal', 'Chile']],
    ['Which metal is liquid at room temperature?', 'Mercury', ['Lead', 'Aluminium', 'Tin']],
  ];
  GAME_FN.quiz = body => {
    const start = () => BD.runQuiz(body, shuffle(BD.L(TRIVIA, TRIVIA_EN)).slice(0, 10).map(([q, a, w]) => ({ type: 'mc', q, answer: a, options: shuffle([a, ...w]) })), {
      title: 'Quiz rápido',
      onFinish: (c, t) => { const best = store.get('games:quizBest', 0); if (c > best) { store.set('games:quizBest', c); toast(`¡Nuevo récord: ${c}/${t}! 🏆`); } },
    });
    start();
  };

  // ================= AHORCADO =================
  const WORDS = {
    Animales: ['ajolote', 'murciélago', 'pingüino', 'jirafa', 'mariposa', 'camaleón', 'hipopótamo', 'tortuga', 'colibrí', 'pulpo', 'ornitorrinco', 'flamenco'],
    Comida: ['arepa', 'empanada', 'guacamole', 'paella', 'chocolate', 'aguacate', 'tamal', 'ceviche', 'quesadilla', 'churros', 'sushi', 'lasaña'],
    Arte: ['acuarela', 'pincel', 'lienzo', 'boceto', 'escultura', 'perspectiva', 'ilustración', 'paleta', 'carboncillo', 'acrílico', 'tinta', 'sombreado'],
    Tecnología: ['teclado', 'algoritmo', 'variable', 'servidor', 'navegador', 'pantalla', 'función', 'internet', 'programa', 'satélite', 'robot', 'píxel'],
  };
  const WORDS_EN = {
    Animals: ['axolotl', 'bat', 'penguin', 'giraffe', 'butterfly', 'chameleon', 'hippopotamus', 'turtle', 'hummingbird', 'octopus', 'platypus', 'flamingo'],
    Food: ['pancake', 'burrito', 'guacamole', 'paella', 'chocolate', 'avocado', 'pretzel', 'noodles', 'quesadilla', 'waffle', 'sushi', 'lasagna'],
    Art: ['watercolor', 'brush', 'canvas', 'sketch', 'sculpture', 'perspective', 'illustration', 'palette', 'charcoal', 'acrylic', 'ink', 'shading'],
    Tech: ['keyboard', 'algorithm', 'variable', 'server', 'browser', 'screen', 'function', 'internet', 'program', 'satellite', 'robot', 'pixel'],
  };
  GAME_FN.ahorcado = body => {
    const STAGES = 7, W = BD.L(WORDS, WORDS_EN), ABC = BD.L('ABCDEFGHIJKLMNÑOPQRSTUVWXYZ', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    let cat, word, plain, guessed, misses;
    const fig = m => `<svg viewBox="0 0 120 130" width="150" height="160" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" style="display:block;margin:auto">
      <path d="M10 125 H70 M30 125 V8 H82 V22" />
      ${m > 0 ? '<circle cx="82" cy="34" r="12"/>' : ''}${m > 1 ? '<path d="M82 46 V82"/>' : ''}${m > 2 ? '<path d="M82 56 L66 70"/>' : ''}
      ${m > 3 ? '<path d="M82 56 L98 70"/>' : ''}${m > 4 ? '<path d="M82 82 L68 104"/>' : ''}${m > 5 ? '<path d="M82 82 L96 104"/>' : ''}
      ${m > 6 ? '<path d="M77 30 l4 4 m0 -4 l-4 4 M84 30 l4 4 m0 -4 l-4 4" stroke-width="2"/>' : ''}</svg>`;
    const newGame = () => {
      cat = pick(Object.keys(W)); word = pick(W[cat]).toUpperCase(); plain = deaccent(word);
      guessed = new Set(); misses = 0; draw();
    };
    const draw = () => {
      const won = [...plain].every(c => guessed.has(c)), lost = misses >= STAGES;
      body.innerHTML = `
        <div class="split">
          <div style="text-align:center">${fig(misses)}<p class="muted">${STAGES - misses} ${BD.L('intentos restantes', 'tries left')}</p></div>
          <div translate="no">
            <span class="chip">${BD.L('Categoría', 'Category')}: ${cat}</span>
            <div class="word">${[...word].map((c, i) => guessed.has(plain[i]) || lost ? c : '_').join('')}</div>
            ${won ? `<div class="note-box" style="text-align:center"><b>${BD.L('¡Ganaste! 🎉', 'You won! 🎉')}</b></div>` : lost ? `<div class="note-box" style="text-align:center">${BD.L('Era', 'It was')} <b>${word}</b> 💀</div>` : ''}
            <div class="keys" style="margin-top:16px">${[...ABC].map(l => `<button data-l="${l}" ${guessed.has(l) || won || lost ? 'disabled' : ''} class="${guessed.has(l) && plain.includes(l) ? 'ok' : ''}">${l}</button>`).join('')}</div>
            <div class="row" style="justify-content:center;margin-top:16px"><button class="btn primary" id="hNew">${BD.L('Nueva palabra', 'New word')}</button></div>
          </div>
        </div>`;
      $('.keys', body).onclick = e => { const b = e.target.closest('[data-l]'); if (b && !b.disabled) guess(b.dataset.l); };
      $('#hNew', body).onclick = newGame;
    };
    const guess = l => {
      if (guessed.has(l) || misses >= STAGES || [...plain].every(c => guessed.has(c))) return;
      guessed.add(l); if (!plain.includes(l)) misses++; draw();
    };
    const onKey = e => { const k = e.key.toUpperCase(); if (/^[A-ZÑ]$/.test(k) && !e.target.closest('input,textarea')) guess(k); };
    document.addEventListener('keydown', onKey);
    newGame();
    return () => document.removeEventListener('keydown', onKey);
  };

  // ================= ASCII =================
  GAME_FN.ascii = body => {
    const W = 56, H = 24;
    let grid = store.get('games:ascii', null) || Array.from({ length: H }, () => Array(W).fill(' '));
    let brush = '█', tool = 'pen', down = false;
    body.innerHTML = `
      <div class="row" style="margin-bottom:12px">
        <div id="aTool"></div>
        <div class="row" id="aBrushes">${[...'█▓▒░@#*+=-:.o/\\|_<>^~♥★'].map(c => `<button class="btn ghost sm mono" data-b="${esc(c)}" style="padding:6px 10px">${esc(c)}</button>`).join('')}</div>
        <input type="text" id="aCustom" maxlength="1" placeholder="otro" style="width:64px" class="mono">
      </div>
      <div class="scroll-x"><div class="ascii-grid" id="aGrid"></div></div>
      <div class="row" style="margin-top:12px">
        <button class="btn primary" id="aCopy">Copiar dibujo</button><button class="btn ghost" id="aClear">Limpiar</button>
        <span class="muted small" id="aBrushLbl"></span>
      </div>
      <hr class="sep">
      <h3>Imagen → ASCII</h3>
      <div class="split">
        <div class="stack"><div id="aImgDrop"></div>
          <label class="field"><span>Ancho en caracteres <b id="aColsV"></b></span><input type="range" id="aCols" min="30" max="160" value="80"></label>
          <label class="check"><input type="checkbox" id="aInv"> Invertir (para fondos oscuros)</label>
        </div>
        <div><pre class="out" id="aImgOut" style="font-size:8px;line-height:1">Sube una imagen…</pre><div class="row" style="margin-top:8px"><button class="btn ghost sm" id="aImgCopy">Copiar</button></div></div>
      </div>`;
    BD.seg($('#aTool', body), [['pen', '✏️ Pincel'], ['erase', '🧽 Borrar'], ['fill', '🪣 Relleno']], tool, v => tool = v);
    const g = $('#aGrid', body);
    const paintAll = () => { g.innerHTML = grid.map((row, y) => `<div class="r">${row.map((c, x) => `<span data-x="${x}" data-y="${y}">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('')}</div>`).join(''); };
    const save = () => store.set('games:ascii', grid);
    const setCell = (x, y, c) => { grid[y][x] = c; const s = g.children[y].children[x]; s.innerHTML = c === ' ' ? '&nbsp;' : esc(c); };
    const fill = (x, y, c) => {
      const from = grid[y][x]; if (from === c) return;
      const st = [[x, y]];
      while (st.length) { const [i, j] = st.pop(); if (i < 0 || j < 0 || i >= W || j >= H || grid[j][i] !== from) continue; grid[j][i] = c; st.push([i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]); }
      paintAll();
    };
    const at = e => { const el = document.elementFromPoint(e.clientX, e.clientY); return el && el.dataset && el.dataset.x !== undefined && g.contains(el) ? [+el.dataset.x, +el.dataset.y] : null; };
    const act = e => { const p = at(e); if (!p) return; if (tool === 'fill') { fill(p[0], p[1], brush); down = false; } else setCell(p[0], p[1], tool === 'erase' ? ' ' : brush); };
    g.onpointerdown = e => { down = true; g.setPointerCapture(e.pointerId); act(e); };
    g.onpointermove = e => { if (down) act(e); };
    g.onpointerup = g.onpointercancel = () => { if (down) save(); down = false; };
    const setBrush = c => { brush = c; $('#aBrushLbl', body).textContent = `Pincel: "${c}"`; if (tool === 'erase') { tool = 'pen'; BD.seg($('#aTool', body), [['pen', '✏️ Pincel'], ['erase', '🧽 Borrar'], ['fill', '🪣 Relleno']], tool, v => tool = v); } };
    $('#aBrushes', body).onclick = e => { const b = e.target.closest('[data-b]'); if (b) setBrush(b.dataset.b); };
    $('#aCustom', body).oninput = e => { if (e.target.value) setBrush(e.target.value); };
    $('#aCopy', body).onclick = () => {
      const lines = grid.map(r => r.join('').replace(/\s+$/, ''));
      while (lines.length && !lines[0]) lines.shift(); while (lines.length && !lines[lines.length - 1]) lines.pop();
      BD.copy(lines.join('\n'), 'Dibujo copiado 🎨');
    };
    $('#aClear', body).onclick = () => { grid = Array.from({ length: H }, () => Array(W).fill(' ')); save(); paintAll(); };
    paintAll(); setBrush('█');

    let img = null;
    const RAMP = ' .:-=+*#%@';
    const convert = () => {
      if (!img) return;
      const cols = +$('#aCols', body).value, rows = Math.max(1, Math.round(cols * img.naturalHeight / img.naturalWidth * .5));
      $('#aColsV', body).textContent = cols;
      const c = document.createElement('canvas'); c.width = cols; c.height = rows;
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, cols, rows); x.drawImage(img, 0, 0, cols, rows);
      const d = x.getImageData(0, 0, cols, rows).data, inv = $('#aInv', body).checked;
      let s = '';
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const k = (j * cols + i) * 4, l = (0.299 * d[k] + 0.587 * d[k + 1] + 0.114 * d[k + 2]) / 255;
          s += RAMP[Math.min(RAMP.length - 1, Math.floor((inv ? l : 1 - l) * RAMP.length))];
        }
        s += '\n';
      }
      $('#aImgOut', body).textContent = s;
    };
    BD.dropzone($('#aImgDrop', body), { accept: 'image/*', multiple: false, icon: '🖼️', label: 'Sube una imagen', async onFiles([f]) { img = await BD.loadImage(f); convert(); } });
    $('#aCols', body).oninput = convert; $('#aInv', body).onchange = convert;
    $('#aImgCopy', body).onclick = () => BD.copy($('#aImgOut', body).textContent);
  };

  // ================= HISTORIA =================
  const STORY = {
    start: { t: 'Son las 00:00. Te quedaste dormida/o en la biblioteca y las luces se apagan. Un gato negro con ojos dorados te mira desde una estantería… y habla: "Llegas tarde a la Noche de los Libros".', c: [['Seguir al gato', 'gato'], ['Buscar la salida', 'salida'], ['Abrir el libro que brilla sobre la mesa', 'libro']] },
    gato: { t: 'El gato te guía por un pasillo que no existía. Al final hay dos puertas: una huele a café y la otra a lluvia.', c: [['Puerta del café', 'cafe'], ['Puerta de la lluvia', 'lluvia']] },
    salida: { t: 'La puerta principal está cerrada. El conserje dejó su linterna y un manojo de llaves. Escuchas pasos en el piso de arriba.', c: [['Probar las llaves', 'llaves'], ['Subir a ver quién es', 'arriba']] },
    libro: { t: 'Las letras del libro flotan y forman una pregunta: "¿Qué darías por conocer cualquier historia jamás escrita?"', c: [['"Mi nombre"', 'nombre'], ['"Nada. Cierro el libro."', 'cerrar']] },
    cafe: { t: 'Es una cafetería donde los clientes son personajes de novelas. Don Quijote discute con Sherlock Holmes. Te ofrecen un asiento.', c: [['Sentarte con ellos', 'fin_tertulia'], ['Pedir un café para llevar', 'fin_cafe']] },
    lluvia: { t: 'Llueve dentro de una sala llena de mapas. Cada gota cae sobre un país distinto. El gato dice: "Elige un lugar y estarás allí".', c: [['Tocar un mapa al azar', 'fin_viaje'], ['Volver con el gato', 'gato2']] },
    gato2: { t: 'El gato suspira. "Los humanos siempre dudan." Te deja en la sala de lectura con una taza caliente. Amanece.', c: [['Fin… ¿o no?', 'fin_amanecer']] },
    llaves: { t: 'La quinta llave abre una puerta pequeña con tu nombre grabado. Dentro hay un escritorio con tus dibujos y apuntes… de dentro de diez años.', c: [['Leer tus apuntes del futuro', 'fin_futuro'], ['Cerrar sin mirar', 'fin_presente']] },
    arriba: { t: 'Es la bibliotecaria, que también se quedó dormida. Se ríe y te muestra un pasadizo secreto para salir.', c: [['Tomar el pasadizo', 'fin_pasadizo'], ['Preguntar por el gato que habla', 'gato']] },
    nombre: { t: 'El libro escribe tu nombre en su última página. Ahora eres un personaje. Alguien, en otra biblioteca, empieza a leerte.', c: [['Saludar al lector', 'fin_personaje']] },
    cerrar: { t: 'Cierras el libro. El gato asiente con respeto: "Sabia decisión". Las luces vuelven.', c: [['Irte a casa', 'fin_sabio']] },
    fin_tertulia: { e: '☕ Final: La tertulia eterna', t: 'Discutes de literatura hasta el amanecer y te nombran miembro honorario del Club de Personajes.' },
    fin_cafe: { e: '🥤 Final: Para llevar', t: 'El café sabe a ideas nuevas. Al día siguiente escribes tu primera historia.' },
    fin_viaje: { e: '🗺️ Final: Viajera/o de mapas', t: 'Apareces en una playa desconocida con el carné de la biblioteca en la mano. Tienes 21 días para devolver el mapa.' },
    fin_amanecer: { e: '🌅 Final: Solo fue un sueño', t: 'Despiertas con la cabeza sobre un libro. En tu manga hay un pelo de gato negro.' },
    fin_futuro: { e: '🔮 Final: Spoilers', t: 'Lees tus apuntes del futuro. Dicen: "Sigue estudiando, vale la pena". Lloras un poquito.' },
    fin_presente: { e: '🌱 Final: Escribir tu propio camino', t: 'Prefieres no saber. Mañana empiezas un proyecto nuevo, sin spoilers.' },
    fin_pasadizo: { e: '🚪 Final: El pasadizo', t: 'Sales a la calle por una tapa de alcantarilla con forma de libro. Nadie te cree.' },
    fin_personaje: { e: '📖 Final: Personaje', t: 'Saludas. El lector salta del susto. Ahora vives entre páginas, y no está nada mal.' },
    fin_sabio: { e: '🐈‍⬛ Final: El elegido del gato', t: 'Cada noche el gato te espera en la ventana. Eres su humano favorito.' },
  };
  const STORY_EN = {
    start: { t: 'It\'s midnight. You fell asleep in the library and the lights go out. A black cat with golden eyes watches you from a shelf… and speaks: "You\'re late for the Night of Books".', c: [['Follow the cat', 'gato'], ['Look for the exit', 'salida'], ['Open the glowing book on the table', 'libro']] },
    gato: { t: 'The cat leads you down a hallway that didn\'t exist. At the end there are two doors: one smells of coffee, the other of rain.', c: [['Coffee door', 'cafe'], ['Rain door', 'lluvia']] },
    salida: { t: 'The main door is locked. The caretaker left a flashlight and a bunch of keys. You hear footsteps upstairs.', c: [['Try the keys', 'llaves'], ['Go up and see who it is', 'arriba']] },
    libro: { t: 'The letters float off the page and form a question: "What would you give to know any story ever written?"', c: [['"My name"', 'nombre'], ['"Nothing. I close the book."', 'cerrar']] },
    cafe: { t: 'It\'s a café where the customers are characters from novels. Don Quixote argues with Sherlock Holmes. They offer you a seat.', c: [['Sit with them', 'fin_tertulia'], ['Order a coffee to go', 'fin_cafe']] },
    lluvia: { t: 'It\'s raining inside a room full of maps. Each drop falls on a different country. The cat says: "Pick a place and you\'ll be there".', c: [['Touch a random map', 'fin_viaje'], ['Go back with the cat', 'gato2']] },
    gato2: { t: 'The cat sighs. "Humans always hesitate." It leaves you in the reading room with a warm cup. Dawn breaks.', c: [['The end… or is it?', 'fin_amanecer']] },
    llaves: { t: 'The fifth key opens a small door with your name engraved on it. Inside there\'s a desk with your drawings and notes… from ten years in the future.', c: [['Read your future notes', 'fin_futuro'], ['Close it without looking', 'fin_presente']] },
    arriba: { t: 'It\'s the librarian, who also fell asleep. She laughs and shows you a secret passage out.', c: [['Take the passage', 'fin_pasadizo'], ['Ask about the talking cat', 'gato']] },
    nombre: { t: 'The book writes your name on its last page. Now you\'re a character. Someone, in another library, starts reading you.', c: [['Wave at the reader', 'fin_personaje']] },
    cerrar: { t: 'You close the book. The cat nods respectfully: "Wise choice". The lights come back on.', c: [['Go home', 'fin_sabio']] },
    fin_tertulia: { e: '☕ Ending: The eternal gathering', t: 'You talk literature until dawn and become an honorary member of the Characters\' Club.' },
    fin_cafe: { e: '🥤 Ending: To go', t: 'The coffee tastes like new ideas. The next day you write your first story.' },
    fin_viaje: { e: '🗺️ Ending: Map traveler', t: 'You appear on an unknown beach holding your library card. You have 21 days to return the map.' },
    fin_amanecer: { e: '🌅 Ending: It was just a dream', t: 'You wake up with your head on a book. There\'s a black cat hair on your sleeve.' },
    fin_futuro: { e: '🔮 Ending: Spoilers', t: 'You read your future notes. They say: "Keep studying, it\'s worth it". You cry a little.' },
    fin_presente: { e: '🌱 Ending: Your own path', t: 'You\'d rather not know. Tomorrow you start a new project, spoiler-free.' },
    fin_pasadizo: { e: '🚪 Ending: The passage', t: 'You come out onto the street through a book-shaped manhole cover. Nobody believes you.' },
    fin_personaje: { e: '📖 Ending: Character', t: 'You wave. The reader jumps in fright. Now you live between pages, and it\'s not bad at all.' },
    fin_sabio: { e: '🐈‍⬛ Ending: The cat\'s chosen one', t: 'Every night the cat waits for you at the window. You\'re its favorite human.' },
  };
  GAME_FN.historia = body => {
    const ST = BD.L(STORY, STORY_EN);
    const ends = Object.keys(ST).filter(k => ST[k].e);
    body.setAttribute('translate', 'no');
    const show = id => {
      const n = ST[id], found = new Set(store.get('games:endings', []));
      if (n.e) { found.add(id); store.set('games:endings', [...found]); }
      body.innerHTML = `
        <div class="row" style="margin-bottom:14px"><span class="chip">${BD.L('Finales encontrados', 'Endings found')}: ${found.size}/${ends.length}</span></div>
        ${n.e ? `<h2>${n.e}</h2>` : ''}
        <p class="story-text">${esc(n.t)}</p>
        <div class="q-opts">${n.e ? `<button class="q-opt" data-n="start">↺ ${BD.L('Volver a empezar', 'Start over')}</button>` : n.c.map(([l, to]) => `<button class="q-opt" data-n="${to}">${esc(l)}</button>`).join('')}</div>
        ${n.e ? `<div class="row" style="margin-top:16px">${ends.map(k => `<span class="chip" title="${found.has(k) ? esc(ST[k].e) : '???'}">${found.has(k) ? ST[k].e.split(' ')[0] : '❔'}</span>`).join('')}</div>` : ''}`;
      $('.q-opts', body).onclick = e => { const b = e.target.closest('[data-n]'); if (b) show(b.dataset.n); };
    };
    show('start');
  };

  // ================= PAÍSES =================
  const C = [
    ['México', 'Ciudad de México', '🇲🇽', 'América'], ['Venezuela', 'Caracas', '🇻🇪', 'América'], ['Colombia', 'Bogotá', '🇨🇴', 'América'], ['Argentina', 'Buenos Aires', '🇦🇷', 'América'],
    ['Chile', 'Santiago', '🇨🇱', 'América'], ['Perú', 'Lima', '🇵🇪', 'América'], ['Brasil', 'Brasilia', '🇧🇷', 'América'], ['Canadá', 'Ottawa', '🇨🇦', 'América'],
    ['Estados Unidos', 'Washington D. C.', '🇺🇸', 'América'], ['Cuba', 'La Habana', '🇨🇺', 'América'], ['Uruguay', 'Montevideo', '🇺🇾', 'América'], ['Ecuador', 'Quito', '🇪🇨', 'América'],
    ['Bolivia', 'Sucre', '🇧🇴', 'América'], ['Paraguay', 'Asunción', '🇵🇾', 'América'], ['Costa Rica', 'San José', '🇨🇷', 'América'], ['Panamá', 'Ciudad de Panamá', '🇵🇦', 'América'],
    ['España', 'Madrid', '🇪🇸', 'Europa'], ['Francia', 'París', '🇫🇷', 'Europa'], ['Italia', 'Roma', '🇮🇹', 'Europa'], ['Alemania', 'Berlín', '🇩🇪', 'Europa'],
    ['Portugal', 'Lisboa', '🇵🇹', 'Europa'], ['Reino Unido', 'Londres', '🇬🇧', 'Europa'], ['Países Bajos', 'Ámsterdam', '🇳🇱', 'Europa'], ['Suecia', 'Estocolmo', '🇸🇪', 'Europa'],
    ['Noruega', 'Oslo', '🇳🇴', 'Europa'], ['Grecia', 'Atenas', '🇬🇷', 'Europa'], ['Polonia', 'Varsovia', '🇵🇱', 'Europa'], ['Suiza', 'Berna', '🇨🇭', 'Europa'],
    ['Japón', 'Tokio', '🇯🇵', 'Asia'], ['China', 'Pekín', '🇨🇳', 'Asia'], ['Corea del Sur', 'Seúl', '🇰🇷', 'Asia'], ['India', 'Nueva Delhi', '🇮🇳', 'Asia'],
    ['Tailandia', 'Bangkok', '🇹🇭', 'Asia'], ['Vietnam', 'Hanói', '🇻🇳', 'Asia'], ['Turquía', 'Ankara', '🇹🇷', 'Asia'], ['Filipinas', 'Manila', '🇵🇭', 'Asia'],
    ['Egipto', 'El Cairo', '🇪🇬', 'África'], ['Marruecos', 'Rabat', '🇲🇦', 'África'], ['Nigeria', 'Abuya', '🇳🇬', 'África'], ['Kenia', 'Nairobi', '🇰🇪', 'África'],
    ['Sudáfrica', 'Pretoria', '🇿🇦', 'África'], ['Etiopía', 'Adís Abeba', '🇪🇹', 'África'], ['Australia', 'Canberra', '🇦🇺', 'Oceanía'], ['Nueva Zelanda', 'Wellington', '🇳🇿', 'Oceanía'],
  ];
  // Versión en inglés: nombres de país desde Intl (por código ISO) y capitales/continentes que cambian
  const CAP_EN = { 'Ciudad de México': 'Mexico City', 'Bogotá': 'Bogotá', 'Brasilia': 'Brasília', 'La Habana': 'Havana', 'Asunción': 'Asunción', 'Ciudad de Panamá': 'Panama City',
    'París': 'Paris', 'Roma': 'Rome', 'Berlín': 'Berlin', 'Lisboa': 'Lisbon', 'Londres': 'London', 'Ámsterdam': 'Amsterdam', 'Estocolmo': 'Stockholm', 'Atenas': 'Athens',
    'Varsovia': 'Warsaw', 'Berna': 'Bern', 'Tokio': 'Tokyo', 'Pekín': 'Beijing', 'Seúl': 'Seoul', 'Nueva Delhi': 'New Delhi', 'Hanói': 'Hanoi', 'El Cairo': 'Cairo',
    'Abuya': 'Abuja', 'Adís Abeba': 'Addis Ababa' };
  const CONT_EN = { 'América': 'Americas', 'Europa': 'Europe', 'Asia': 'Asia', 'África': 'Africa', 'Oceanía': 'Oceania' };
  const isoOf = flag => [...flag].map(ch => String.fromCharCode(ch.codePointAt(0) - 0x1F1E6 + 97)).join('');
  function countries() {
    if (BD.lang() === 'es') return C;
    let dn = null; try { dn = new Intl.DisplayNames(['en'], { type: 'region' }); } catch {}
    return C.map(([n, cap, flag, cont]) => [dn ? dn.of(isoOf(flag).toUpperCase()) : n, CAP_EN[cap] || cap, flag, CONT_EN[cont]]);
  }
  GAME_FN.paises = body => {
    let mode = 'mix';
    const CC = countries(), CONTS = BD.L(['América', 'Europa', 'Asia', 'África', 'Oceanía'], Object.values(CONT_EN));
    body.innerHTML = `<div class="row" style="margin-bottom:16px"><div id="pMode"></div></div><div id="pQuiz"></div>`;
    const make = () => shuffle(CC).slice(0, 10).map(([name, cap, flag, cont], i) => {
      const kind = mode === 'mix' ? ['cap', 'flag', 'cont', 'capOf'][i % 4] : mode;
      const others = shuffle(CC.filter(c => c[0] !== name));
      if (kind === 'cap') return { type: 'mc', q: BD.L(`¿Cuál es la capital de ${name}?`, `What is the capital of ${name}?`), answer: cap, options: shuffle([cap, ...others.slice(0, 3).map(c => c[1])]) };
      if (kind === 'capOf') return { type: 'mc', q: BD.L(`${cap} es la capital de…`, `${cap} is the capital of…`), answer: name, options: shuffle([name, ...others.slice(0, 3).map(c => c[0])]) };
      // los emojis de bandera no se ven en Windows: se usa la imagen por código ISO
      if (kind === 'flag') return { type: 'mc', flag: isoOf(flag), q: BD.L('¿De qué país es esta bandera?', 'Which country does this flag belong to?'), answer: name, options: shuffle([name, ...others.slice(0, 3).map(c => c[0])]) };
      return { type: 'mc', q: BD.L(`¿En qué continente está ${name}?`, `Which continent is ${name} in?`), answer: cont, options: shuffle(CONTS.filter(x => x !== cont)).slice(0, 3).concat(cont).sort() };
    });
    const start = () => BD.runQuiz($('#pQuiz', body), make(), {
      title: 'Quiz de países',
      onFinish: c => { const best = store.get('games:countriesBest', 0); if (c > best) { store.set('games:countriesBest', c); toast(`¡Récord: ${c}/10! 🌍`); } },
    });
    BD.seg($('#pMode', body), [['mix', '🎲 Mixto'], ['cap', 'Capitales'], ['flag', 'Banderas'], ['cont', 'Continentes']], mode, v => { mode = v; start(); });
    start();
  };
})();
