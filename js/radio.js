'use strict';
/* Radio: panel a la derecha que sigue sonando mientras navegas por las herramientas.
   - Ruidos de colores, frecuencias y ambientes se GENERAN en el navegador (Web Audio): sin descargas, infinitos y sin cortes.
   - Lofi, vaporwave y ambient vienen de emisoras online: SomaFM (fijas) + el directorio abierto Radio Browser (se refresca 1 vez al día). */
(() => {
  const { $, esc, store, toast, L } = BD;

  // ---------- catálogo ----------
  const CATS = [
    ['random', L('Aleatorio', 'Random'), '🎲', ['#ff5fae', '#8b6cff']],
    ['noise', L('Ruidos', 'Noise'), '〰', ['#c9c9d6', '#7d7d95']],
    ['lofi', 'Lofi', '☕', ['#ffb38a', '#c86b98']],
    ['vapor', 'Vaporwave', '🌴', ['#ff71ce', '#01cdfe']],
    ['amb', L('Ambiente', 'Ambience'), '🌧', ['#5df2b0', '#3b82c4']],
  ];
  const catOf = id => CATS.find(c => c[0] === id) || CATS[0];
  const N = (id, name, sub, c1, c2) => ({ id: 'n:' + id, cat: 'noise', kind: 'gen', gen: ['noise', id], name, sub, icon: '', colors: [c1, c2] });
  const soma = (id, cat, name, sub, icon) => ({ id: 'soma:' + id, cat, kind: 'stream', url: `https://ice2.somafm.com/${id}-128-mp3`, name, sub, icon });
  const STATIONS = [
    N('white', L('Ruido blanco', 'White noise'), L('Todas las frecuencias por igual · tapa ruidos', 'All frequencies equally · masks noise'), '#ffffff', '#cfd3dc'),
    N('pink', L('Ruido rosa', 'Pink noise'), L('Más suave, como lluvia constante', 'Softer, like steady rain'), '#ffb3d1', '#ff5fae'),
    N('brown', L('Ruido marrón', 'Brown noise'), L('Grave y profundo · ideal para concentrarse', 'Deep and low · great for focus'), '#c08a63', '#6b4226'),
    N('grey', L('Ruido gris', 'Grey noise'), L('Equilibrado para el oído humano', 'Balanced for human hearing'), '#c3c7cc', '#7d838a'),
    N('green', L('Ruido verde', 'Green noise'), L('Centro del espectro · suena a naturaleza', 'Mid spectrum · sounds like nature'), '#9be59b', '#3f9a52'),
    N('blue', L('Ruido azul', 'Blue noise'), L('Brillante, como una ducha', 'Bright, like a shower'), '#9fd0ff', '#3b7dd8'),
    N('violet', L('Ruido violeta', 'Violet noise'), L('Muy agudo · a veces alivia acúfenos', 'Very high · may soothe tinnitus'), '#cdb5ff', '#7a4dff'),

    soma('fluid', 'lofi', 'SomaFM Fluid', L('Hip hop instrumental y beats suaves', 'Instrumental hip hop and soft beats'), '☕'),
    soma('groovesalad', 'lofi', 'SomaFM Groove Salad', L('Downtempo y chill', 'Downtempo and chill'), '🥗'),
    soma('vaporwaves', 'vapor', 'SomaFM Vaporwaves', L('Vaporwave sin parar', 'Non-stop vaporwave'), '🌴'),

    { id: 'a:library', cat: 'amb', kind: 'gen', gen: ['library'], name: L('Biblioteca', 'Library'), sub: L('Silencio de sala, páginas y lápiz', 'Room tone, pages and pencil'), icon: '📚' },
    { id: 'a:rain', cat: 'amb', kind: 'gen', gen: ['rain'], name: L('Lluvia', 'Rain'), sub: L('Lluvia constante en la ventana', 'Steady rain on the window'), icon: '🌧' },
    { id: 'a:ocean', cat: 'amb', kind: 'gen', gen: ['ocean'], name: L('Olas del mar', 'Ocean waves'), sub: L('Olas lentas que van y vienen', 'Slow waves rolling in'), icon: '🌊' },
    { id: 'a:fire', cat: 'amb', kind: 'gen', gen: ['fire'], name: L('Chimenea', 'Fireplace'), sub: L('Leña crepitando', 'Crackling wood'), icon: '🔥' },
    { id: 'a:wind', cat: 'amb', kind: 'gen', gen: ['wind'], name: L('Viento', 'Wind'), sub: L('Brisa entre los árboles', 'Breeze through the trees'), icon: '🍃' },
    soma('dronezone', 'amb', 'SomaFM Drone Zone', L('Ambient atmosférico, sin ritmo', 'Atmospheric ambient, no beats'), '🌌'),
    soma('deepspaceone', 'amb', 'SomaFM Deep Space One', L('Ambient espacial', 'Deep space ambient'), '🛰'),
  ];
  // Emisoras extra del directorio Radio Browser (https, sin cuenta, datos abiertos)
  const ONLINE_TAG = { lofi: 'lofi', vapor: 'vaporwave' };
  const RB_HOSTS = ['https://de1.api.radio-browser.info', 'https://nl1.api.radio-browser.info', 'https://at1.api.radio-browser.info', 'https://de2.api.radio-browser.info', 'https://fi1.api.radio-browser.info'];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const rand = (a, b) => a + Math.random() * (b - a);

  async function online(cat) {
    const tag = ONLINE_TAG[cat]; if (!tag) return [];
    const cache = store.get('radio:cache', {});
    if (cache[tag] && Date.now() - cache[tag].at < 864e5) return cache[tag].list;
    for (const host of shuffle(RB_HOSTS)) {
      try {
        const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 6000);
        const r = await fetch(`${host}/json/stations/search?tag=${encodeURIComponent(tag)}&hidebroken=true&order=votes&reverse=true&limit=60`, { signal: ctl.signal });
        clearTimeout(t);
        if (!r.ok) continue;
        const seen = new Set(STATIONS.map(s => s.name.toLowerCase()));
        const list = (await r.json())
          .filter(s => /^https:/.test(s.url_resolved || '') && !/\.m3u8|\.pls|\.m3u$/i.test(s.url_resolved) && /^(mp3|aac\+?|ogg)$/i.test(s.codec || ''))
          .filter(s => { const k = s.name.trim().toLowerCase(); return k && !seen.has(k) && seen.add(k); })
          .slice(0, 12)
          .map(s => ({ id: 'rb:' + s.stationuuid, cat, kind: 'stream', url: s.url_resolved, icon: '📻',
            name: s.name.trim().replace(/\s+/g, ' ').slice(0, 50),
            sub: [s.countrycode, s.codec, s.bitrate ? s.bitrate + ' kbps' : ''].filter(Boolean).join(' · ') }));
        cache[tag] = { at: Date.now(), list };
        store.set('radio:cache', cache);
        return list;
      } catch {}
    }
    return cache[tag]?.list || [];
  }
  const cachedOnline = () => Object.values(store.get('radio:cache', {})).flatMap(c => c.list || []);
  const findStation = id => STATIONS.find(s => s.id === id) || cachedOnline().find(s => s.id === id);
  async function listFor(cat) {
    if (cat === 'random') return [];
    return [...STATIONS.filter(s => s.cat === cat), ...(await online(cat))];
  }

  // ---------- motor de audio ----------
  let ctx = null, master = null, cur = null; // cur = { stop() }
  const bufs = {};
  function audioCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  const gainN = v => { const g = ctx.createGain(); g.gain.value = v; return g; };
  const filt = (type, f, Q = .7, g = 0) => { const n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = Q; n.gain.value = g; return n; };
  const chain = (...n) => { n.reduce((a, b) => (a.connect(b), b)); return n[0]; };
  // Oscilador lento que mueve un parámetro alrededor de `base`
  const lfo = (freq, depth, param, base, srcs) => { param.value = base; const o = ctx.createOscillator(); o.frequency.value = freq; o.connect(gainN(depth)).connect(param); o.start(); srcs.push(o); return o; };

  // Ruido de colores: 6 s en estéreo con el final fundido con el principio (bucle sin clic)
  function noise(color) {
    if (bufs[color]) return bufs[color];
    const sr = ctx.sampleRate, len = Math.floor(sr * 6), F = Math.floor(sr * .5);
    const buf = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const x = new Float32Array(len + F);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0, prev = 0, sum = 0;
      for (let i = 0; i < len + F; i++) {
        const w = Math.random() * 2 - 1; let v;
        if (color === 'brown') { last = (last + .02 * w) / 1.02; v = last; }
        else if (color === 'violet') { v = w - prev; prev = w; }
        else if (color === 'pink' || color === 'blue') {
          b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852;
          b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898;
          const p = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362; b6 = w * .115926;
          if (color === 'blue') { v = p - prev; prev = p; } else v = p;
        } else v = w;
        x[i] = v; sum += v * v;
      }
      const k = .22 / Math.sqrt(sum / x.length), d = buf.getChannelData(ch); // misma energía para todos los colores
      for (let i = 0; i < len; i++) d[i] = Math.max(-1, Math.min(1, (i < F ? x[i] * (i / F) + x[len + i] * (1 - i / F) : x[i]) * k));
    }
    return bufs[color] = buf;
  }
  const loop = (color, srcs) => { const s = ctx.createBufferSource(); s.buffer = noise(color); s.loop = true; s.start(0, Math.random() * 5); srcs.push(s); return s; };
  // Ráfaga corta de ruido con envolvente (páginas, chasquidos de leña…)
  function burst(dest, t, dur, { type = 'bandpass', f = 2000, Q = .8, vol = .2, attack = .005, pan = 0 } = {}) {
    const s = ctx.createBufferSource(); s.buffer = noise('white');
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    const p = ctx.createStereoPanner(); p.pan.value = pan;
    chain(s, filt(type, f, Q), g, p, dest);
    s.start(t, Math.random() * 5, dur + .05);
  }
  // Programa eventos aleatorios con margen (sigue funcionando con la pestaña en segundo plano)
  function every(min, max, fn, timers) {
    let next = ctx.currentTime + rand(min * .2, max * .5);
    const tick = () => { while (next < ctx.currentTime + 1.5) { fn(next); next += rand(min, max); } };
    tick(); timers.push(setInterval(tick, 250));
  }

  const GEN = {
    noise(out, srcs, timers, color) {
      const g = { white: .55, pink: .85, brown: .95, blue: .4, violet: .3 }[color];
      if (g) return chain(loop(color, srcs), gainN(g), out);
      if (color === 'grey') return chain(loop('white', srcs), filt('lowshelf', 250, .7, 10), filt('peaking', 3500, 1, -9), filt('highshelf', 9000, .7, 4), gainN(.45), out);
      if (color === 'green') return chain(loop('white', srcs), filt('bandpass', 500, .5), gainN(1.6), out);
    },
    rain(out, srcs, timers) {
      chain(loop('pink', srcs), filt('highpass', 400), filt('lowpass', 7000), gainN(.55), out);
      chain(loop('brown', srcs), filt('lowpass', 300), gainN(.4), out);
      const patter = gainN(0); chain(loop('white', srcs), filt('highpass', 3500), patter, out);
      lfo(.23, .035, patter.gain, .06, srcs);
      every(.03, .18, t => burst(out, t, rand(.01, .03), { type: 'highpass', f: rand(2500, 6000), vol: rand(.02, .09), pan: rand(-.9, .9) }), timers);
    },
    ocean(out, srcs, timers) {
      const lp = filt('lowpass', 600), g = gainN(0);
      chain(loop('brown', srcs), lp, g, out);
      const o = ctx.createOscillator(); o.frequency.value = .075; o.start(); srcs.push(o);
      lp.frequency.value = 650; o.connect(gainN(450)).connect(lp.frequency);
      g.gain.value = .6; o.connect(gainN(.38)).connect(g.gain);
      const foam = gainN(0); chain(loop('pink', srcs), filt('highpass', 1800), foam, out);
      foam.gain.value = .06; o.connect(gainN(.06)).connect(foam.gain);
    },
    wind(out, srcs, timers) {
      [[.05, 600, 350, .9, .11], [.031, 1300, 500, .45, .07]].forEach(([fq, base, depth, g0, gq]) => {
        const bp = filt('bandpass', base, 1.3), g = gainN(0);
        chain(loop('pink', srcs), bp, g, out);
        lfo(fq, depth, bp.frequency, base, srcs); lfo(gq, g0 * .55, g.gain, g0, srcs);
      });
    },
    fire(out, srcs, timers) {
      chain(loop('brown', srcs), filt('lowpass', 500), gainN(.75), out);
      every(.04, .45, t => burst(out, t, rand(.008, .03), { type: 'highpass', f: rand(1200, 3500), vol: rand(.05, .3), pan: rand(-.6, .6) }), timers);
      every(2, 7, t => burst(out, t, rand(.05, .12), { type: 'bandpass', f: rand(600, 1200), Q: 1, vol: rand(.2, .45), pan: rand(-.4, .4) }), timers);
    },
    library(out, srcs, timers) {
      chain(loop('brown', srcs), filt('lowpass', 220), gainN(.5), out);          // sala
      chain(loop('pink', srcs), filt('bandpass', 160, .6), gainN(.22), out);     // climatización
      chain(loop('pink', srcs), filt('highpass', 3000), gainN(.018), out);       // aire
      // páginas que pasan
      every(5, 14, t => { const pan = rand(-.8, .8); burst(out, t, .35, { f: rand(1800, 3200), Q: .7, vol: .1, attack: .09, pan }); burst(out, t + .22, .25, { f: 4200, Q: .9, vol: .05, attack: .03, pan }); }, timers);
      // lápiz escribiendo
      every(9, 22, t => { const pan = rand(-.6, .6), n = 4 + Math.floor(Math.random() * 6); for (let i = 0; i < n; i++) burst(out, t + i * rand(.08, .16), rand(.05, .09), { type: 'highpass', f: 5000, vol: .025, attack: .01, pan }); }, timers);
      // un libro que se apoya en la mesa
      every(25, 60, t => burst(out, t, .14, { type: 'lowpass', f: 180, vol: .3, pan: rand(-.5, .5) }), timers);
    },
  };

  function playGen(st) {
    audioCtx();
    const out = ctx.createGain(), srcs = [], timers = [];
    out.gain.value = 0; out.connect(master);
    const [kind, ...args] = st.gen;
    GEN[kind](out, srcs, timers, ...args);
    out.gain.setTargetAtTime(1, ctx.currentTime, .15);
    return {
      stop() {
        timers.forEach(clearInterval);
        out.gain.setTargetAtTime(0, ctx.currentTime, .08);
        setTimeout(() => { srcs.forEach(s => { try { s.stop(); } catch {} }); out.disconnect(); }, 500);
      },
    };
  }
  function playStream(st, onState) {
    const a = new Audio(); a.preload = 'none'; a.src = st.url; a.volume = vol2(state.vol);
    a.onplaying = () => onState('playing'); a.onwaiting = () => onState('loading');
    a.onerror = () => onState('error');
    a.play().catch(e => { if (e.name !== 'AbortError') onState('error'); });
    return {
      audio: a,
      stop() { a.onerror = a.onplaying = a.onwaiting = null; a.pause(); a.removeAttribute('src'); a.load(); },
    };
  }
  const vol2 = v => v * v; // curva más natural para el oído
  function applyVolume() {
    if (master) master.gain.setTargetAtTime(vol2(state.vol), ctx.currentTime, .05);
    if (cur && cur.audio) cur.audio.volume = vol2(state.vol);
  }

  // ---------- estado ----------
  const saved = store.get('radio', {}) || {};
  const state = { open: !!saved.open, mini: !!saved.mini, cat: CATS.some(c => c[0] === saved.cat) ? saved.cat : 'random', id: saved.id || null, vol: saved.vol ?? .6, playing: false, loading: false };
  const persist = () => store.set('radio', { open: state.open, mini: state.mini, cat: state.cat, id: state.id, vol: state.vol });
  let token = 0, fails = 0;

  async function play(st) {
    if (!st) return;
    const my = ++token;
    if (cur) { cur.stop(); cur = null; }
    state.id = st.id; state.playing = true; state.loading = st.kind === 'stream'; persist();
    { const s = BD.stats(); s.radio.plays = (s.radio.plays || 0) + 1; store.set('stats', s); }
    if (st.kind === 'gen') { cur = playGen(st); applyVolume(); fails = 0; }
    else {
      if (master) master.gain.setTargetAtTime(0, ctx.currentTime, .05);
      cur = playStream(st, s => {
        if (my !== token) return;
        if (s === 'playing') { state.loading = false; fails = 0; paint(); }
        else if (s === 'loading') { state.loading = true; paint(); }
        else if (s === 'error') {
          if (++fails > 3) { stop(); fails = 0; return toast(L('No se pudo conectar con las emisoras. Revisa tu conexión.', 'Could not reach the stations. Check your connection.'), 'bad'); }
          toast(L(`${st.name} no responde, pasando a otra…`, `${st.name} isn't responding, switching…`));
          step(1);
        }
      });
    }
    mediaSession(st);
    paint();
  }
  function stop() {
    token++;
    if (cur) { cur.stop(); cur = null; }
    state.playing = state.loading = false;
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    paint();
  }
  const toggle = () => state.playing ? stop() : state.id && findStation(state.id) ? play(findStation(state.id)) : playRandom();
  function playRandom() {
    const pool = [...STATIONS, ...cachedOnline()].filter(s => s.id !== state.id);
    play(pool[Math.floor(Math.random() * pool.length)]);
  }
  async function step(d) {
    const st = findStation(state.id);
    if (!st || state.cat === 'random') return playRandom();
    const list = await listFor(st.cat), i = list.findIndex(s => s.id === st.id);
    play(list[(i + d + list.length) % list.length]);
  }
  function mediaSession(st) {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: st.name, artist: 'BrainDeck Radio', album: catOf(st.cat)[1] });
      navigator.mediaSession.playbackState = 'playing';
      navigator.mediaSession.setActionHandler('play', () => toggle());
      navigator.mediaSession.setActionHandler('pause', () => stop());
      navigator.mediaSession.setActionHandler('nexttrack', () => step(1));
      navigator.mediaSession.setActionHandler('previoustrack', () => step(-1));
    } catch {}
  }

  // ---------- interfaz ----------
  const SVG = p => `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${p}</svg>`;
  const IC = {
    play: SVG('<path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/>'),
    pause: SVG('<rect x="6" y="5" width="4.2" height="14" rx="1.2"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.2"/>'),
    prev: SVG('<path d="M18 6.5v11a1 1 0 0 1-1.55.83L9 13.2V17a1 1 0 0 1-2 0V7a1 1 0 0 1 2 0v3.8l7.45-5.13A1 1 0 0 1 18 6.5z"/>'),
    next: SVG('<path d="M6 6.5v11a1 1 0 0 0 1.55.83L15 13.2V17a1 1 0 0 0 2 0V7a1 1 0 0 0-2 0v3.8L7.55 5.67A1 1 0 0 0 6 6.5z"/>'),
    shuffle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>`,
    vol: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>`,
    mute: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6M16 9l6 6"/></svg>`,
    expand: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>`,
  };
  const EQ = '<span class="rd-eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>';
  const colorsOf = st => st ? (st.colors || catOf(st.cat)[3]) : catOf('random')[3];
  const iconOf = st => st ? (st.cat === 'noise' ? '' : st.icon || catOf(st.cat)[2]) : '🎲';

  const panel = document.createElement('aside');
  panel.className = 'radio'; panel.setAttribute('aria-label', 'Radio'); panel.hidden = true;
  panel.innerHTML = `
    <div class="rd-bar"><span class="rd-live" aria-hidden="true"></span><b>Radio</b><span class="spacer"></span>
      <button class="icon-btn" data-a="mini" title="${L('Minimizar (sigue sonando)', 'Minimize (keeps playing)')}" aria-label="${L('Minimizar', 'Minimize')}">–</button>
      <button class="icon-btn" data-a="close" title="${L('Cerrar y detener', 'Close and stop')}" aria-label="${L('Cerrar', 'Close')}">✕</button></div>
    <div class="rd-now"><div class="rd-art"><span class="e"></span>${EQ}</div>
      <div class="rd-meta"><span class="rd-tag"></span><b class="rd-name"></b><span class="rd-sub"></span></div></div>
    <div class="rd-ctl">
      <button class="rd-btn" data-a="prev" title="${L('Anterior', 'Previous')}" aria-label="${L('Anterior', 'Previous')}">${IC.prev}</button>
      <button class="rd-btn rd-play" data-a="play"></button>
      <button class="rd-btn" data-a="next" title="${L('Siguiente', 'Next')}" aria-label="${L('Siguiente', 'Next')}">${IC.next}</button>
      <button class="rd-btn" data-a="random" title="${L('Una al azar', 'Random station')}" aria-label="${L('Una al azar', 'Random station')}">${IC.shuffle}</button></div>
    <div class="rd-vol"><button class="rd-btn sm" data-a="mute" aria-label="${L('Silenciar', 'Mute')}"></button><input type="range" min="0" max="1" step="0.01" aria-label="${L('Volumen', 'Volume')}"></div>
    <div class="rd-tabs" role="tablist">${CATS.map(([id, n, e]) => `<button class="rd-tab" role="tab" data-cat="${id}">${n}</button>`).join('')}</div>
    <div class="rd-list"></div>
    <p class="rd-foot muted"></p>`;
  const mini = document.createElement('div');
  mini.className = 'radio-mini'; mini.hidden = true;
  mini.innerHTML = `<button class="rd-mini-open" data-a="expand" aria-label="${L('Abrir radio', 'Open radio')}"><span class="rd-art"><span class="e"></span>${EQ}</span><span class="rd-name"></span></button>
    <button class="rd-btn rd-play" data-a="play"></button><button class="rd-btn sm" data-a="expand" title="${L('Abrir', 'Open')}" aria-label="${L('Abrir', 'Open')}">${IC.expand}</button>`;
  document.body.append(panel, mini);

  const range = $('input', panel);
  let lastVol = state.vol || .6;
  range.value = state.vol;
  range.style.setProperty('--p', state.vol * 100 + '%');
  range.oninput = () => { state.vol = +range.value; if (state.vol) lastVol = state.vol; range.style.setProperty('--p', state.vol * 100 + '%'); applyVolume(); paintVol(); };
  range.onchange = persist;
  const paintVol = () => { $('[data-a=mute]', panel).innerHTML = state.vol ? IC.vol : IC.mute; };

  let listToken = 0;
  async function paintList() {
    const box = $('.rd-list', panel), my = ++listToken;
    panel.querySelectorAll('.rd-tab').forEach(b => { b.classList.toggle('on', b.dataset.cat === state.cat); b.setAttribute('aria-selected', b.dataset.cat === state.cat); });
    const foot = $('.rd-foot', panel);
    foot.textContent = {
      random: L('Mezcla todas las categorías: cada vez suena algo distinto.', 'Mixes every category: something different each time.'),
      noise: L('Generado en tu navegador: sin conexión y sin cortes.', 'Generated in your browser: offline and seamless.'),
      amb: L('Ambientes generados en tu navegador + ambient de SomaFM.', 'Ambiences generated in your browser + ambient from SomaFM.'),
      lofi: L('Emisoras en vivo de SomaFM y Radio Browser.', 'Live stations from SomaFM and Radio Browser.'),
      vapor: L('Emisoras en vivo de SomaFM y Radio Browser.', 'Live stations from SomaFM and Radio Browser.'),
    }[state.cat];
    if (state.cat === 'random') {
      box.innerHTML = `<div class="rd-random"><button class="btn primary" data-a="random">${IC.shuffle} ${L('Sorpréndeme', 'Surprise me')}</button>
        <p class="muted small">${L('Ruidos, lofi, vaporwave y ambientes.', 'Noise, lofi, vaporwave and ambiences.')}</p></div>`;
      return;
    }
    const local = STATIONS.filter(s => s.cat === state.cat);
    const row = s => { const [c1, c2] = colorsOf(s); return `
      <button class="rd-item ${s.id === state.id ? 'on' : ''}" data-id="${esc(s.id)}" style="--c1:${c1};--c2:${c2}">
        <span class="rd-ic ${s.cat === 'noise' ? 'sw' : ''}">${s.id === state.id && state.playing ? EQ : esc(iconOf(s))}</span>
        <span class="t"><b>${esc(s.name)}</b><small>${esc(s.sub || '')}</small></span>
        <span class="rd-badge">${s.kind === 'stream' ? L('EN VIVO', 'LIVE') : 'LOCAL'}</span></button>`; };
    box.innerHTML = local.map(row).join('') + (ONLINE_TAG[state.cat] ? `<p class="rd-more muted small"><span class="spin"></span> ${L('Buscando más emisoras…', 'Finding more stations…')}</p>` : '');
    if (!ONLINE_TAG[state.cat]) return;
    const extra = await online(state.cat);
    if (my !== listToken) return;
    box.innerHTML = local.map(row).join('') + extra.map(row).join('');
  }

  function paint() {
    const st = findStation(state.id), [c1, c2] = colorsOf(st), cat = st ? catOf(st.cat) : catOf('random');
    panel.hidden = !state.open || state.mini;
    mini.hidden = !state.open || !state.mini;
    [panel, mini].forEach(el => {
      el.classList.toggle('playing', state.playing && !state.loading);
      el.classList.toggle('loading', state.loading);
      el.style.setProperty('--c1', c1); el.style.setProperty('--c2', c2);
      el.querySelectorAll('.rd-art .e').forEach(e => e.textContent = iconOf(st));
      el.querySelectorAll('.rd-art').forEach(a => a.classList.toggle('sw', st?.cat === 'noise'));
      el.querySelectorAll('.rd-name').forEach(n => n.textContent = st ? st.name : L('Elige una radio', 'Pick a station'));
      el.querySelectorAll('.rd-play').forEach(b => { b.innerHTML = state.loading ? '<span class="spin"></span>' : state.playing ? IC.pause : IC.play; b.setAttribute('aria-label', state.playing ? L('Pausar', 'Pause') : L('Reproducir', 'Play')); b.title = b.getAttribute('aria-label'); });
    });
    $('.rd-tag', panel).textContent = st ? `${cat[1]} · ${st.kind === 'stream' ? L('en vivo', 'live') : L('generado', 'generated')}` : L('Radio de BrainDeck', 'BrainDeck radio');
    $('.rd-sub', panel).textContent = st ? (state.loading ? L('Conectando…', 'Connecting…') : st.sub) : L('Pulsa ▶ para una al azar', 'Press ▶ for a random one');
    $('.rd-live', panel).title = state.playing ? L('Sonando', 'Playing') : '';
    paintVol();
    if (!panel.hidden) {
      const box = $('.rd-list', panel);
      box.querySelectorAll('.rd-item').forEach(b => {
        const on = b.dataset.id === state.id; b.classList.toggle('on', on);
        const s = findStation(b.dataset.id), ic = b.querySelector('.rd-ic');
        ic.innerHTML = on && state.playing ? EQ : esc(iconOf(s));
      });
    }
  }

  function setOpen(open, isMini = false) {
    const wasClosed = panel.hidden;
    state.open = open; state.mini = isMini; persist(); paint();
    if (open && !isMini && wasClosed) { paintList(); BD.track('/radio'); }
  }
  // Minutos escuchados (para el dashboard)
  setInterval(() => {
    if (!state.playing || state.loading) return;
    const s = BD.stats(); s.radio.min = (s.radio.min || 0) + 1; store.set('stats', s);
  }, 60000);
  const onClick = e => {
    const b = e.target.closest('[data-a],[data-cat],[data-id]'); if (!b) return;
    if (b.dataset.cat) { state.cat = b.dataset.cat; persist(); paintList(); b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); return; }
    if (b.dataset.id) { const s = findStation(b.dataset.id); if (s.id === state.id && state.playing) stop(); else play(s); return; }
    ({
      play: toggle, next: () => step(1), prev: () => step(-1), random: playRandom,
      mini: () => setOpen(true, true), expand: () => setOpen(true, false),
      close: () => { stop(); setOpen(false); },
      mute: () => { state.vol = state.vol ? 0 : lastVol; range.value = state.vol; range.style.setProperty('--p', state.vol * 100 + '%'); applyVolume(); paintVol(); persist(); },
    })[b.dataset.a]?.();
  };
  panel.addEventListener('click', onClick);
  mini.addEventListener('click', onClick);
  // Botones "Radio" del menú y la barra superior: abre / cierra el panel (si está minimizado, lo despliega)
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-radio]'); if (!t || panel.contains(t)) return;
    e.preventDefault();
    if (state.open && !state.mini) setOpen(state.playing, state.playing); // sonando → se minimiza; en silencio → se cierra
    else setOpen(true, false);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.open && !state.mini && !e.target.closest('input,textarea,select')) setOpen(true, true); });

  // Al volver a la web se recuerda la radio y el panel, pero no suena sola (los navegadores lo bloquean y sería molesto)
  if (state.open) { state.mini = true; }
  document.addEventListener('DOMContentLoaded', () => { paint(); });
  BD.radio = { open: () => setOpen(true, false), play: id => play(findStation(id)), stop, toggle, next: () => step(1), state, current: () => findStation(state.id) };

  // La radio también es una herramienta de Estudio: abre el panel en vez de una pantalla nueva
  BD.tool({
    path: '/radio', cat: 'estudio', radio: true, title: 'Radio', short: L('Radio para estudiar', 'Study radio'), icon: BD.icon('radio'),
    colors: ['#ff9ee8', '#8b6cff'],
    desc: L('Ruidos de colores, lofi, vaporwave y ambientes (biblioteca, lluvia…). Sigue sonando mientras usas otras herramientas.',
      'Colored noise, lofi, vaporwave and ambiences (library, rain…). Keeps playing while you use other tools.'),
    render() { setTimeout(() => { setOpen(true, false); location.replace('#/'); }); },
  });
})();
