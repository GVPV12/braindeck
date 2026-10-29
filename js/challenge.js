'use strict';
/* Reto de 30 días (estilo Inktober): lista de temas diarios + calendario .ics + póster para compartir + seguimiento. */
(() => {
  const { $, esc, win, store, toast, uid, today, L } = BD;
  const dateOf = s => new Date(s + 'T12:00');
  const addDays = (s, n) => { const d = dateOf(s); d.setDate(d.getDate() + n); return today(d); };
  const all = () => store.get('challenges', []);
  const saveAll = a => store.set('challenges', a);
  const b64url = str => btoa(Array.from(new TextEncoder().encode(str), b => String.fromCharCode(b)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64url = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)));
  const cap = s => s.replace(/^./, c => c.toUpperCase());

  // ---------- qué se practica ----------
  // Ejercicios diarios en orden de dificultad; cada 7º día es repaso y el último, un mini proyecto final.
  const SKILLS = () => ({
    arte: { l: L('Arte / dibujo', 'Art / drawing'), e: '🎨' },
    piano: { l: 'Piano', e: '🎹', steps: L(
      ['Postura, nombres de las teclas y Do central', 'Escala de Do mayor, mano derecha', 'Escala de Do mayor, mano izquierda', 'Acordes de Do, Fa y Sol', 'Ritmo: negras, blancas y corcheas con metrónomo', 'Primera melodía sencilla a una mano', 'Melodía con acompañamiento de acordes', 'Escala de Sol mayor y su acorde', 'Inversiones de acordes de Do', 'Progresión I–V–vi–IV en Do', 'Lectura de clave de sol: 10 minutos', 'Lectura de clave de fa: 10 minutos', 'Escala de La menor natural', 'Arpegios de Do y La menor', 'Independencia de manos: patrón de bajo + melodía', 'Pedal de resonancia: cuándo y cómo', 'Canción favorita: primera mitad', 'Canción favorita: segunda mitad', 'Dinámicas: piano, forte, crescendo', 'Improvisa 5 min sobre I–V–vi–IV'],
      ['Posture, key names and middle C', 'C major scale, right hand', 'C major scale, left hand', 'C, F and G chords', 'Rhythm: quarters, halves and eighths with a metronome', 'First simple one-hand melody', 'Melody with chord accompaniment', 'G major scale and chord', 'C chord inversions', 'I–V–vi–IV progression in C', 'Treble clef reading: 10 minutes', 'Bass clef reading: 10 minutes', 'A natural minor scale', 'C and A minor arpeggios', 'Hand independence: bass pattern + melody', 'Sustain pedal: when and how', 'Favorite song: first half', 'Favorite song: second half', 'Dynamics: piano, forte, crescendo', 'Improvise 5 min over I–V–vi–IV']) },
    '3d': { l: L('3D (Blender)', '3D (Blender)'), e: '🧊', steps: L(
      ['Interfaz y navegación en el visor', 'Mover, rotar, escalar y atajos básicos', 'Modo edición: vértices, aristas y caras', 'Extruir, insetar y bisel', 'Modela una taza', 'Modificadores: subdivisión y espejo', 'Modela un mueble low-poly', 'Materiales con Principled BSDF', 'Iluminación de tres puntos', 'Cámara y composición del render', 'Render en Eevee vs Cycles', 'Desplegado UV básico', 'Texturiza tu taza', 'Escultura: una piedra o un hongo', 'Modela un personaje sencillo con formas básicas', 'Animación por fotogramas clave', 'Escena diorama isométrica: bloqueo', 'Diorama: materiales y luz', 'Geometry Nodes: dispersar objetos', 'Render final y post en el compositor'],
      ['Interface and viewport navigation', 'Move, rotate, scale and basic shortcuts', 'Edit mode: vertices, edges and faces', 'Extrude, inset and bevel', 'Model a mug', 'Modifiers: subdivision and mirror', 'Model a low-poly piece of furniture', 'Materials with Principled BSDF', 'Three-point lighting', 'Camera and render composition', 'Render in Eevee vs Cycles', 'Basic UV unwrapping', 'Texture your mug', 'Sculpting: a rock or a mushroom', 'Model a simple character with basic shapes', 'Keyframe animation', 'Isometric diorama: blockout', 'Diorama: materials and light', 'Geometry Nodes: scatter objects', 'Final render and compositor post']) },
    animacion: { l: L('Animación', 'Animation'), e: '🎞️', steps: L(
      ['Pelota que rebota (timing y spacing)', 'Pelota con squash & stretch', 'Pelota pesada vs ligera', 'Péndulo: arcos y follow-through', 'Saco de harina: peso y actitud', 'Anticipación: un salto', 'Ciclo de caminata: poses clave', 'Ciclo de caminata: intermedios', 'Ciclo de carrera', 'Overlapping: una cola o un pelo', 'Parpadeo y mirada', 'Cambio de expresión facial', 'Lip sync de una palabra', 'Personaje levanta un objeto pesado', 'Acting: una reacción de sorpresa', 'Loop de efecto: fuego o humo', 'Loop de agua o lluvia', 'Animación de 3 segundos con cámara', 'Clean-up y color de tu mejor animación', 'Animación final de 5 segundos'],
      ['Bouncing ball (timing and spacing)', 'Ball with squash & stretch', 'Heavy vs light ball', 'Pendulum: arcs and follow-through', 'Flour sack: weight and attitude', 'Anticipation: a jump', 'Walk cycle: key poses', 'Walk cycle: in-betweens', 'Run cycle', 'Overlapping: a tail or hair', 'Blink and eye direction', 'Facial expression change', 'Lip sync one word', 'Character lifts a heavy object', 'Acting: a surprised reaction', 'FX loop: fire or smoke', 'Water or rain loop', '3-second animation with camera move', 'Clean-up and color your best animation', 'Final 5-second animation']) },
    idioma: { l: L('Idioma', 'Language'), e: '🗣️', steps: L(
      ['Saludos y presentarte en 5 frases', '30 palabras del día a día', 'Verbo "ser/estar" y frases básicas', 'Números, horas y fechas', 'Describe tu habitación', 'Presente simple: tu rutina', 'Escucha 10 min de un podcast para principiantes', 'Pasado: cuenta lo que hiciste ayer', 'Pide comida en un restaurante (role-play)', 'Lee un artículo corto y subraya palabras nuevas', 'Escribe un párrafo sobre tu familia', 'Futuro: tus planes del fin de semana', 'Graba 1 minuto hablando (usa el Coach de inglés)', 'Mira una escena con subtítulos en ese idioma', 'Preguntas y respuestas: entrevista imaginaria', 'Shadowing: repite un audio 10 min', 'Escribe un diario de 5 líneas', 'Conversación de 10 minutos (app o amigo)'],
      ['Greetings and introduce yourself in 5 sentences', '30 everyday words', 'Verb "to be" and basic phrases', 'Numbers, time and dates', 'Describe your room', 'Present simple: your routine', 'Listen to 10 min of a beginner podcast', 'Past tense: tell what you did yesterday', 'Order food at a restaurant (role-play)', 'Read a short article and underline new words', 'Write a paragraph about your family', 'Future: your weekend plans', 'Record 1 minute speaking (use the English coach)', 'Watch a scene with subtitles in that language', 'Q&A: an imaginary interview', 'Shadowing: repeat audio for 10 min', 'Write a 5-line diary', '10-minute conversation (app or friend)']) },
    codigo: { l: L('Programación', 'Coding'), e: '💻', steps: L(
      ['Instala el entorno y escribe "Hola mundo"', 'Variables y tipos de datos', 'Condicionales: un juego de adivinar', 'Bucles: tabla de multiplicar', 'Funciones: calculadora', 'Listas/arrays: lista de tareas', 'Objetos/diccionarios: agenda de contactos', 'Leer y escribir archivos', 'Git: primer repositorio y commit', 'HTML: tu primera página', 'CSS: dale estilo a tu página', 'JavaScript en el navegador: un botón que hace algo', 'Consumir una API pública', 'Depurar: arregla 3 errores a propósito', 'Mini proyecto: conversor de unidades', 'Publica tu página en GitHub Pages', 'Refactoriza tu código más feo', 'Lee código de otra persona 20 min'],
      ['Install the environment and write "Hello world"', 'Variables and data types', 'Conditionals: a guessing game', 'Loops: multiplication table', 'Functions: a calculator', 'Lists/arrays: a to-do list', 'Objects/dictionaries: a contact book', 'Read and write files', 'Git: first repo and commit', 'HTML: your first page', 'CSS: style your page', 'JavaScript in the browser: a button that does something', 'Call a public API', 'Debugging: fix 3 bugs on purpose', 'Mini project: unit converter', 'Publish your page on GitHub Pages', 'Refactor your ugliest code', 'Read someone else\'s code for 20 min']) },
    escritura: { l: L('Escritura', 'Writing'), e: '✍️', steps: L(
      ['Escribe 300 palabras sin parar', 'Describe un lugar usando los 5 sentidos', 'Un personaje: lo que quiere y lo que teme', 'Diálogo de dos personas que discuten', 'Microrrelato de 100 palabras', 'Reescribe una escena en otro punto de vista', 'Escribe una carta que nunca enviarías', 'Empieza una historia por el final', 'Poema sin rimas sobre un objeto cotidiano', 'Escena de tensión sin decir la emoción', 'Recorta un texto tuyo a la mitad', 'Cuento de 1000 palabras: borrador', 'Cuento: revisión y título'],
      ['Write 300 words nonstop', 'Describe a place using all 5 senses', 'A character: what they want and fear', 'Dialogue between two people arguing', '100-word flash fiction', 'Rewrite a scene from another point of view', 'Write a letter you\'d never send', 'Start a story from the ending', 'Unrhymed poem about an everyday object', 'A tense scene without naming the emotion', 'Cut one of your texts in half', '1000-word story: draft', 'Story: revision and title']) },
    plan: { l: L('Desde un plan de estudios', 'From a study plan'), e: '📅' },
    otro: { l: L('Otra cosa (con IA)', 'Something else (AI)'), e: '✨' },
  });
  // Ejercicios de una habilidad repartidos en n días, con repasos semanales y proyecto final
  function skillPrompts(steps, n, theme) {
    const isFinal = d => d === n && n > 3, isReview = d => d % 7 === 0 && !isFinal(d);
    let learnDays = 0; for (let d = 1; d <= n; d++) if (!isFinal(d) && !isReview(d)) learnDays++;
    const out = []; let k = 0;
    for (let d = 1; d <= n; d++) {
      if (isFinal(d)) out.push(L(`🏁 Proyecto final: muestra lo aprendido${theme ? ` (${theme})` : ''}`, `🏁 Final project: show what you learned${theme ? ` (${theme})` : ''}`));
      else if (isReview(d)) out.push(L('🔁 Repaso de la semana + graba/guarda tu progreso', '🔁 Weekly review + record/save your progress'));
      else {
        // si hay menos días que ejercicios, se reparten de lo básico a lo avanzado; si hay más, se repiten
        const s = learnDays <= steps.length ? steps[Math.floor(k * steps.length / learnDays)] : steps[k % steps.length];
        out.push(theme ? `${s} · ${theme}` : s); k++;
      }
    }
    return out;
  }
  // Un plan de estudios (p. ej. un curso de YouTube) → una línea por día con sus sesiones
  function planPrompts(planId, n) {
    const pl = (store.get('plans', []) || []).find(p => p.id === planId); if (!pl) return [];
    const byDay = {};
    [...pl.sessions].sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start)
      .forEach(s => (byDay[s.date] = byDay[s.date] || []).push(s.type === 'study' ? `${s.title}${s.detail ? ' (' + s.detail + ')' : ''}` : `${{ eval: '📝', review: '🔁', final: '🏁' }[s.type]} ${s.title}`));
    return Object.values(byDay).slice(0, n).map(x => x.join(' + '));
  }

  // Temas de arte: una palabra al día (Inktober), una mini escena, o una mezcla
  function prompts(style, n, theme) {
    const { B, pick } = BD.creative, b = B(), out = new Set();
    const word = () => pick([...b.words, ...b.animals, ...b.vibes, ...b.aesthetics]);
    const scene = () => `${pick(b.subjects)} ${pick(b.places)}`;
    for (let guard = 0; out.size < n && guard < 500; guard++) {
      let p = style === 'palabra' ? word() : style === 'escena' ? scene() : (out.size % 3 === 2 ? scene() : word());
      if (theme) p = style === 'palabra' ? `${p} (${theme})` : `${p} · ${theme}`;
      out.add(cap(p));
    }
    return [...out];
  }
  function ics(ch) {
    const e = s => String(s).replace(/\\/g, '\\\\').replace(/[;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
    const [h, m] = (ch.time || '19:00').split(':'), endMin = +h * 60 + +m + (ch.mins || 60);
    const end = `${String(Math.floor(endMin / 60) % 24).padStart(2, '0')}${String(endMin % 60).padStart(2, '0')}00`;
    const emoji = (SKILLS()[ch.skill] || SKILLS().arte).e;
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BrainDeck//Reto//ES', 'X-WR-CALNAME:' + e(ch.name)];
    ch.prompts.forEach((p, i) => {
      const d = addDays(ch.start, i).replace(/-/g, '');
      lines.push('BEGIN:VEVENT', `UID:${ch.id}-${i}@braindeck`, 'DTSTAMP:' + stamp, `DTSTART:${d}T${h}${m}00`, `DTEND:${d}T${end}`,
        'SUMMARY:' + e(`${emoji} ${L('Día', 'Day')} ${i + 1}: ${p}`), 'DESCRIPTION:' + e(ch.name), 'BEGIN:VALARM', 'TRIGGER:-PT0M', 'ACTION:DISPLAY', 'DESCRIPTION:' + e(p), 'END:VALARM', 'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }
  // Póster 1080×1350 (formato Instagram) con la lista de temas
  async function poster(ch) {
    await document.fonts.ready;
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1350;
    const x = c.getContext('2d'), v = BD.cssVar, font = getComputedStyle(document.body).fontFamily;
    const bg = v('--bg') || '#dcf34b', panel = v('--panel').startsWith('rgba') ? '#fffdf3' : v('--panel'), ink = '#141414', acc = v('--accent') || '#ff83b5';
    x.fillStyle = bg.startsWith('#') ? bg : '#dcf34b'; x.fillRect(0, 0, 1080, 1350);
    x.fillStyle = panel; x.strokeStyle = ink; x.lineWidth = 6; x.beginPath(); x.roundRect(50, 50, 980, 1250, 30); x.fill(); x.stroke();
    x.fillStyle = ink; x.textAlign = 'center'; x.font = `700 64px ${font}`; x.fillText(ch.name.slice(0, 28), 540, 150);
    x.font = `500 30px ${font}`; x.fillStyle = '#55554a'; x.fillText(`${ch.prompts.length} ${L('días', 'days')} · ${dateOf(ch.start).toLocaleDateString(BD.locale(), { day: 'numeric', month: 'long' })}`, 540, 200);
    const n = ch.prompts.length, cols = n > 16 ? 2 : 1, rows = Math.ceil(n / cols), lh = Math.min(64, 1000 / rows), fs = Math.min(30, lh * .55);
    ch.prompts.forEach((p, i) => {
      const col = Math.floor(i / rows), row = i % rows, X = 100 + col * 450, Y = 260 + row * lh;
      x.fillStyle = acc; x.beginPath(); x.roundRect(X, Y, lh * .8, lh * .8, 8); x.fill();
      x.fillStyle = ink; x.textAlign = 'center'; x.font = `700 ${fs * .8}px ${font}`; x.fillText(i + 1, X + lh * .4, Y + lh * .55);
      x.textAlign = 'left'; x.font = `500 ${fs}px ${font}`;
      let t = p; while (x.measureText(t).width > (cols === 2 ? 340 : 780) && t.length > 4) t = t.slice(0, -2);
      x.fillText(t === p ? p : t + '…', X + lh, Y + lh * .58);
    });
    x.font = `500 22px ${font}`; x.fillStyle = '#55554a'; x.textAlign = 'center'; x.fillText('BrainDeck', 540, 1270);
    return BD.canvasBlob(c, 'image/png');
  }

  BD.tool({
    path: '/reto', cat: 'estudio', title: 'Reto de 30 días', short: 'Reto de 30 días', icon: BD.icon('flag'),
    colors: ['#ffcf99', '#ff7b00'], desc: 'Un reto diario para lo que quieras: dibujo (tipo Inktober), piano, 3D, animación, idiomas, programación o un curso de YouTube.',
    render(view) {
      const body = win(view, { title: L('Reto de 30 días', '30-day challenge'), sub: L(
        'Una tarea por día para crear constancia en lo que elijas: dibujo (como Inktober), piano, 3D, animación, idiomas, programación, escritura, cualquier otra cosa con IA, o un curso intensivo a partir de tu plan de estudios. Descarga el calendario con recordatorio diario y un póster para compartirlo.',
        'One task a day to build a habit in whatever you pick: drawing (like Inktober), piano, 3D, animation, languages, coding, writing, anything else with AI, or an intensive course from your study plan. Download the calendar with a daily reminder and a poster to share it.') });
      const o = Object.assign({ name: '', skill: 'arte', other: '', plan: '', theme: '', style: 'palabra', days: 30, start: today(), time: '19:00', mins: 30, list: '' }, store.get('reto:draft', {}));
      const SK = SKILLS(), studyPlans = store.get('plans', []);
      if (o.start < today()) o.start = today();
      const mine = all();
      body.innerHTML = `
        ${mine.length ? `<h3>${L('Mis retos', 'My challenges')}</h3><div class="grid g2" style="margin-bottom:20px">${mine.map(ch => `
          <a class="card row" href="#/reto/${ch.id}" style="text-decoration:none;color:inherit"><b style="flex:1" translate="no">${esc(ch.name)}</b>
          <span class="chip">${ch.done.length}/${ch.prompts.length}</span></a>`).join('')}</div><hr class="sep">` : ''}
        <div class="split">
          <div class="card stack">
            <label class="field"><span>${L('Nombre del reto', 'Challenge name')}</span><input type="text" id="rName" value="${esc(o.name)}" placeholder="${L('Ej. Octubre de criaturas', 'E.g. Creature October')}"></label>
            <div class="field"><span>${L('¿Qué quieres practicar?', 'What do you want to practice?')}</span>
              <div class="row" id="rSkill">${Object.entries(SK).map(([k, s]) => `<button class="btn sm ${k === o.skill ? 'primary' : 'ghost'}" data-skill="${k}">${s.e} ${s.l}</button>`).join('')}</div></div>
            <label class="field" id="rOtherBox"><span>${L('¿Qué habilidad?', 'Which skill?')}</span><input type="text" id="rOther" value="${esc(o.other)}" placeholder="${L('guitarra, caligrafía, edición de video, yoga…', 'guitar, calligraphy, video editing, yoga…')}"></label>
            <label class="field" id="rPlanBox"><span>${L('Plan de estudios', 'Study plan')}</span>
              ${studyPlans.length ? `<select id="rPlan">${studyPlans.map(p => `<option value="${p.id}" ${p.id === o.plan ? 'selected' : ''}>${esc(p.name)} · ${p.sessions.length} ${L('sesiones', 'sessions')}</option>`).join('')}</select>
                <span class="muted small">${L('Cada día del reto = las sesiones de ese día del plan (ideal para un curso intensivo de YouTube).', 'Each challenge day = that day\'s sessions from the plan (great for an intensive YouTube course).')}</span>`
                : `<span class="muted small">${L('Aún no tienes planes.', 'No plans yet.')} <a href="#/plan">${L('Crea uno con tu lista de videos, libros o temas', 'Create one from your list of videos, books or topics')} →</a></span>`}</label>
            <label class="field"><span>${L('Enfoque o tema (opcional)', 'Focus or theme (optional)')}</span><input type="text" id="rTheme" value="${esc(o.theme)}" placeholder="${L('brujas, jazz, personajes low-poly, inglés para viajar…', 'witches, jazz, low-poly characters, travel English…')}"></label>
            <div class="field" id="rStyleBox"><span>${L('Tipo de temas', 'Prompt style')}</span><div id="rStyle"></div></div>
            <div class="grid g2">
              <div class="field"><span>${L('Duración', 'Length')}</span><div id="rDays"></div></div>
              <label class="field"><span>${L('Empieza el', 'Starts on')}</span><input type="date" id="rStart" value="${o.start}"></label>
              <label class="field"><span>${L('Recordatorio diario', 'Daily reminder')}</span><input type="time" id="rTime" value="${o.time}"></label>
              <label class="field"><span>${L('Minutos al día', 'Minutes per day')}</span><input type="number" id="rMins" min="5" step="5" value="${o.mins}"></label>
            </div>
            <div class="row"><button class="btn primary" id="rGen">🎲 ${L('Generar lista', 'Generate list')}</button><button class="btn ghost" id="rAI">✨ ${L('Con IA', 'With AI')}</button><span class="muted small" id="rSt"></span></div>
          </div>
          <div class="card stack">
            <label class="field"><span>${L('Temas (uno por línea, edítalos libremente)', 'Prompts (one per line, edit freely)')}</span>
              <textarea id="rList" rows="16" style="min-height:340px" translate="no">${esc(o.list)}</textarea></label>
            <span class="muted small" id="rCount"></span>
            <button class="btn primary" id="rCreate">${L('Crear reto', 'Create challenge')} ✨</button>
          </div>
        </div>`;
      const v = id => $('#' + id, body);
      const sync = () => {
        Object.assign(o, { name: v('rName').value, theme: v('rTheme').value.trim(), other: v('rOther').value.trim(), plan: v('rPlan')?.value || '', start: v('rStart').value || today(), time: v('rTime').value || '19:00', mins: Math.max(5, +v('rMins').value || 30), list: v('rList').value });
        store.set('reto:draft', o);
        v('rStyleBox').classList.toggle('hidden', o.skill !== 'arte');
        v('rOtherBox').classList.toggle('hidden', o.skill !== 'otro');
        v('rPlanBox').classList.toggle('hidden', o.skill !== 'plan');
        const n = o.list.split('\n').filter(l => l.trim()).length;
        v('rCount').textContent = L(`${n} temas · termina el ${dateOf(addDays(o.start, Math.max(0, n - 1))).toLocaleDateString(BD.locale(), { day: 'numeric', month: 'long' })}`, `${n} prompts · ends ${dateOf(addDays(o.start, Math.max(0, n - 1))).toLocaleDateString(BD.locale(), { day: 'numeric', month: 'long' })}`);
      };
      body.addEventListener('input', sync);
      BD.seg(v('rStyle'), [['palabra', L('Una palabra', 'One word')], ['escena', L('Mini escena', 'Mini scene')], ['mixto', L('Mezcla', 'Mix')]], o.style, x => { o.style = x; sync(); });
      BD.seg(v('rDays'), [['7', '7'], ['14', '14'], ['30', '30'], ['31', '31']], String(o.days), x => { o.days = +x; sync(); });
      v('rSkill').onclick = e => {
        const b = e.target.closest('[data-skill]'); if (!b) return;
        o.skill = b.dataset.skill;
        v('rSkill').querySelectorAll('[data-skill]').forEach(x => { x.classList.toggle('primary', x === b); x.classList.toggle('ghost', x !== b); });
        if (!v('rName').value.trim() && o.skill !== 'otro' && o.skill !== 'plan') v('rName').value = L(`30 días de ${SK[o.skill].l.toLowerCase()}`, `30 days of ${SK[o.skill].l.toLowerCase()}`);
        sync();
      };
      v('rGen').onclick = () => {
        sync();
        let list;
        if (o.skill === 'arte') list = prompts(o.style, o.days, o.theme);
        else if (o.skill === 'plan') { list = planPrompts(o.plan, o.days); if (!list.length) return toast(L('Elige un plan de estudios', 'Pick a study plan'), 'bad'); const pl = studyPlans.find(p => p.id === o.plan); if (!v('rName').value.trim()) v('rName').value = pl.name; }
        else if (o.skill === 'otro') return v('rAI').click(); // sin banco propio: la IA arma el temario
        else list = skillPrompts(SK[o.skill].steps, o.days, o.theme);
        v('rList').value = list.join('\n'); sync();
      };
      v('rAI').onclick = async e => {
        sync(); const btn = v('rAI'), st = v('rSt'); btn.disabled = true; st.innerHTML = '<span class="spin"></span>';
        try {
          const kind = { palabra: L('una sola palabra evocadora', 'a single evocative word'), escena: L('una mini escena visual de 4-8 palabras', 'a 4-8 word visual mini scene'), mixto: L('una mezcla de palabras sueltas y mini escenas', 'a mix of single words and mini scenes') }[o.style];
          const what = o.skill === 'arte' ? null : o.skill === 'otro' ? o.other : o.skill === 'plan' ? (studyPlans.find(p => p.id === o.plan)?.name || '') : SK[o.skill].l;
          if (o.skill === 'otro' && !what) throw new Error(L('Escribe qué habilidad quieres practicar', 'Type which skill you want to practice'));
          const r = await BD.anyAI(what
            ? L(`Crea un reto de ${o.days} días para aprender "${what}"${o.theme ? ` con enfoque en "${o.theme}"` : ''}, ${o.mins} minutos al día. Una tarea concreta y práctica por día, de principiante a avanzado, con un repaso cada 7 días y un mini proyecto final el último día. Cada tarea en 4-12 palabras, en español. Responde solo JSON: {"prompts":["..."]}`,
              `Create a ${o.days}-day challenge to learn "${what}"${o.theme ? ` focused on "${o.theme}"` : ''}, ${o.mins} minutes a day. One concrete, hands-on task per day, beginner to advanced, a review every 7 days and a mini final project on the last day. Each task 4-12 words, in English. Reply only JSON: {"prompts":["..."]}`)
            : L(`Crea ${o.days} temas diarios para un reto artístico tipo Inktober${o.theme ? ` sobre "${o.theme}"` : ''}. Cada tema: ${kind}. Variados, sorprendentes, nada repetido, en español. Responde solo JSON: {"prompts":["..."]}`,
              `Create ${o.days} daily prompts for an Inktober-style art challenge${o.theme ? ` about "${o.theme}"` : ''}. Each prompt: ${kind}. Varied, surprising, no repeats, in English. Reply only JSON: {"prompts":["..."]}`),
          { json: true, system: L('Eres una directora creativa. Respondes solo JSON válido.', 'You are a creative director. You reply with valid JSON only.'), onProgress: (p, msg) => st.textContent = `${msg} ${Math.round(p * 100)}%` });
          v('rList').value = (r.prompts || r).map(String).slice(0, o.days).join('\n'); sync();
        } catch (err) { toast(err.message, 'bad'); }
        st.textContent = ''; btn.disabled = false;
      };
      v('rCreate').onclick = () => {
        sync();
        const list = o.list.split('\n').map(l => l.trim()).filter(Boolean);
        if (!list.length) return toast(L('Genera o escribe la lista primero', 'Generate or type the list first'), 'bad');
        const ch = { id: uid(), name: o.name.trim() || L('Mi reto', 'My challenge'), skill: o.skill, prompts: list, start: o.start, time: o.time, mins: o.mins, done: [], created: Date.now() };
        const a = all(); a.unshift(ch); saveAll(a);
        store.set('reto:draft', { ...o, name: '', list: '' });
        location.hash = '#/reto/' + ch.id;
      };
      sync();
    },
  });

  function view(viewEl, ch, shared) {
    const body = win(viewEl, { title: ch.name, sub: `${ch.prompts.length} ${L('días', 'days')} · ${L('desde', 'from')} ${dateOf(ch.start).toLocaleDateString(BD.locale(), { day: 'numeric', month: 'long', year: 'numeric' })}`, back: '#/reto' });
    body.setAttribute('translate', 'no');
    const draw = () => {
      const t = today(), day = Math.floor((dateOf(t) - dateOf(ch.start)) / 864e5);
      const pct = Math.round(ch.done.length / ch.prompts.length * 100);
      body.innerHTML = `
        ${shared ? `<div class="note-box" style="margin-bottom:14px">${L('Te compartieron este reto.', 'Someone shared this challenge with you.')} <button class="btn primary sm" id="rcAdopt">${L('Unirme', 'Join')}</button></div>` : ''}
        <div class="grid g3">
          <div class="card stat"><b>${day >= 0 && day < ch.prompts.length ? esc(ch.prompts[day]) : day < 0 ? L('Aún no empieza', 'Not started yet') : L('Terminado', 'Finished')}</b><span>${L('tema de hoy', 'today\'s prompt')}</span></div>
          <div class="card stat"><b>${ch.done.length}/${ch.prompts.length}</b><span>${L('días hechos', 'days done')}</span><div class="bar" style="margin-top:8px"><i style="width:${pct}%"></i></div></div>
          <div class="card stat"><b>${ch.time}</b><span>${L('recordatorio', 'reminder')}</span></div>
        </div>
        <div class="row" style="margin:16px 0">
          <button class="btn primary" id="rcIcs">📅 ${L('Calendario (.ics)', 'Calendar (.ics)')}</button>
          <button class="btn ghost" id="rcPng">🖼️ ${L('Póster para redes', 'Poster for socials')}</button>
          <button class="btn ghost" id="rcShare">🔗 ${L('Compartir reto', 'Share challenge')}</button>
          <button class="btn ghost" id="rcCopy">${L('Copiar lista', 'Copy list')}</button>
        </div>
        <div class="reto-grid">${ch.prompts.map((p, i) => {
          const d = addDays(ch.start, i);
          return `<label class="reto-day ${ch.done.includes(i) ? 'done' : ''} ${d === t ? 'today' : ''}">
            <input type="checkbox" data-d="${i}" ${ch.done.includes(i) ? 'checked' : ''} ${shared ? 'disabled' : ''}>
            <span class="reto-n">${i + 1}</span><span class="reto-p">${esc(p)}</span>
            <span class="muted small">${dateOf(d).toLocaleDateString(BD.locale(), { weekday: 'short', day: 'numeric', month: 'short' })}</span></label>`;
        }).join('')}</div>
        ${shared ? '' : `<div class="row" style="margin-top:18px"><span class="spacer"></span><button class="btn ghost danger" id="rcDel">${L('Borrar reto', 'Delete challenge')}</button></div>`}`;
    };
    const persist = () => { const a = all(), i = a.findIndex(x => x.id === ch.id); if (i >= 0) { a[i] = ch; saveAll(a); } };
    body.onchange = e => {
      const i = e.target.dataset.d; if (i === undefined) return;
      ch.done = e.target.checked ? [...new Set([...ch.done, +i])] : ch.done.filter(x => x !== +i);
      persist(); if (ch.done.length === ch.prompts.length) toast(L('¡Reto completado! 🏆🎨', 'Challenge complete! 🏆🎨')); draw();
    };
    body.onclick = async e => {
      const id = e.target.closest('button')?.id; if (!id) return;
      const fn = ch.name.replace(/[\\/:*?"<>|]/g, '');
      if (id === 'rcIcs') BD.download(new Blob([ics(ch)], { type: 'text/calendar' }), fn + '.ics');
      if (id === 'rcPng') BD.download(await poster(ch), fn + '.png');
      if (id === 'rcCopy') BD.copy(ch.prompts.map((p, i) => `${i + 1}. ${p}`).join('\n'));
      if (id === 'rcShare') BD.copy(`${location.href.split('#')[0]}#/reto/share/${b64url(JSON.stringify({ n: ch.name, p: ch.prompts, s: ch.start, t: ch.time }))}`, L('Enlace del reto copiado 🔗', 'Challenge link copied 🔗'));
      if (id === 'rcAdopt') { const c = { ...ch, id: uid(), done: [], created: Date.now() }; const a = all(); a.unshift(c); saveAll(a); location.hash = '#/reto/' + c.id; }
      if (id === 'rcDel') {
        if (!e.target.dataset.armed) { e.target.dataset.armed = 1; e.target.textContent = L('¿Seguro? Pulsa otra vez', 'Sure? Click again'); return; }
        saveAll(all().filter(x => x.id !== ch.id)); location.hash = '#/reto';
      }
    };
    draw();
  }
  BD.route('/reto/share/:data', {
    title: 'Reto de 30 días', render(v, { data }) {
      let d; try { d = JSON.parse(unb64url(data)); } catch { win(v, { title: L('Enlace roto', 'Broken link'), back: '#/reto' }); return; }
      view(v, { id: 'shared', name: d.n, prompts: d.p, start: d.s, time: d.t, done: [] }, true);
    },
  });
  BD.route('/reto/:id', {
    title: 'Reto de 30 días', render(v, { id }) {
      const ch = all().find(x => x.id === id);
      if (!ch) { win(v, { title: L('Reto no encontrado', 'Challenge not found'), back: '#/reto' }); return; }
      view(v, ch, false);
    },
  });
})();
