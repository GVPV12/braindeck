'use strict';
/* Plan de ahorro guiado: preguntas → plan completo con gráficas, hitos y seguimiento */
(() => {
  const { $, $$, esc, win, store, settings, toast, uid, money, num, cssVar } = BD;

  const PURPOSES = {
    viaje: { l: 'Viaje', e: '✈️', c: ['#7fe3ff', '#3b6bff'], items: [['Vuelos', 35], ['Alojamiento', 30], ['Comida', 15], ['Actividades', 12], ['Imprevistos', 8]],
      tips: ['Activa alertas de precio de vuelos y compra con 2-3 meses de antelación.', 'Ahorra en una cuenta separada para no tocar el dinero.'] },
    emergencia: { l: 'Fondo de emergencia', e: '🛟', c: ['#b8ffd9', '#2fc28a'], items: [['3 meses de gastos', 100]],
      tips: ['La meta típica es 3-6 meses de gastos fijos.', 'Guárdalo en un lugar líquido, no en inversiones de riesgo.'] },
    tech: { l: 'Tecnología', e: '💻', c: ['#d7c6ff', '#8b6cff'], items: [['Equipo', 80], ['Accesorios', 12], ['Garantía/seguro', 8]],
      tips: ['Compara reacondicionados oficiales: suelen tener garantía y cuestan 20-30% menos.', 'Espera a fechas de rebajas (Black Friday, regreso a clases).'] },
    estudios: { l: 'Estudios', e: '🎓', c: ['#ffe29a', '#ff8a5c'], items: [['Matrícula/curso', 70], ['Materiales', 15], ['Transporte', 15]],
      tips: ['Pregunta por becas, descuentos por pronto pago o pagos fraccionados.', 'Cuenta materiales y transporte: suelen olvidarse.'] },
    casa: { l: 'Casa / mudanza', e: '🏠', c: ['#ffc2d9', '#ff5fae'], items: [['Depósito', 45], ['Mudanza', 15], ['Muebles', 30], ['Imprevistos', 10]],
      tips: ['Separa el depósito del resto: es lo que más pesa y lo primero que te piden.'] },
    auto: { l: 'Vehículo', e: '🚗', c: ['#a6f0ff', '#3e7bff'], items: [['Entrada', 70], ['Seguro', 15], ['Trámites', 15]],
      tips: ['Una entrada mayor reduce intereses del préstamo.', 'Suma seguro y mantenimiento anual al presupuesto.'] },
    evento: { l: 'Evento / regalo', e: '🎁', c: ['#ffb3d9', '#c44dff'], items: [['Principal', 75], ['Detalles', 25]],
      tips: ['Fija la fecha y trabaja hacia atrás: es la meta más fácil de visualizar.'] },
    arte: { l: 'Material de arte', e: '🎨', c: ['#ffd29b', '#ff7a7a'], items: [['Tableta / equipo', 70], ['Software / pinceles', 15], ['Cursos', 15]],
      tips: ['Destina un % de cada comisión que cobres directamente a esta meta.'] },
    otro: { l: 'Otro', e: '✨', c: ['#e0e0ff', '#8c8cff'], items: [], tips: ['Escribe por qué quieres esta meta: tenerlo claro ayuda a no rendirte.'] },
  };
  const FREQ = { semanal: { l: 'Semanal', ppm: 52 / 12, days: 7 }, quincenal: { l: 'Quincenal', ppm: 2, days: 15 }, mensual: { l: 'Mensual', ppm: 1, months: 1 } };
  const STYLE = { comodo: { l: '🌿 Cómodo', pct: .2 }, equilibrado: { l: '⚖️ Equilibrado', pct: .35 }, intenso: { l: '🔥 Intenso', pct: .5 } };

  function compute(d) {
    const f = FREQ[d.freq], ppm = f.ppm, N = Math.max(1, Math.ceil(d.months * ppm));
    const r = d.rate / 100 / 12 / ppm;
    const grow = Math.pow(1 + r, N);
    const need = Math.max(0, d.target - d.current * grow);
    const per = r ? need * r / (grow - 1) : need / N;
    const monthly = per * ppm, free = d.income - d.fixed, cap = free * STYLE[d.style].pct;
    // calendario
    const rows = []; let bal = d.current; const start = new Date();
    for (let i = 1; i <= N; i++) {
      bal = bal * (1 + r) + per;
      const date = new Date(start);
      if (f.months) date.setMonth(date.getMonth() + i); else date.setDate(date.getDate() + f.days * i);
      rows.push({ i, date: date.toISOString().slice(0, 10), amount: per, balance: Math.min(bal, d.target * 1.0001) });
    }
    // si no alcanza: ¿cuántos meses harían falta con tu capacidad?
    let suggestMonths = null;
    if (monthly > cap && cap > 0) {
      for (let m = d.months + 1; m <= 240; m++) {
        const n = Math.ceil(m * ppm), g = Math.pow(1 + r, n), nd = Math.max(0, d.target - d.current * g);
        if ((r ? nd * r / (g - 1) : nd / n) * ppm <= cap) { suggestMonths = m; break; }
      }
    }
    const milestones = [25, 50, 75, 100].map(p => ({ p, row: rows.find(x => x.balance >= d.target * p / 100 - 0.01) }));
    return { per, monthly, free, cap, pctFree: free > 0 ? monthly / free : Infinity, feasible: free > 0 && monthly <= cap, rows, N, suggestMonths, milestones, interest: rows.length ? rows[rows.length - 1].balance - d.current - per * N : 0 };
  }

  async function charts(el, d, c) {
    await BD.loadScript(BD.LIB.chart);
    const text = cssVar('--text'), muted = cssVar('--muted'), grid = cssVar('--border'), a = cssVar('--accent'), a2 = cssVar('--accent2'), a3 = cssVar('--accent3');
    Chart.defaults.color = muted; Chart.defaults.font.family = getComputedStyle(document.body).fontFamily; Chart.defaults.borderColor = grid;
    const made = [];
    const line = $('#chLine', el);
    if (line) made.push(new Chart(line, {
      type: 'line',
      data: { labels: c.rows.map(r => r.date.slice(5)), datasets: [
        { label: BD.L('Ahorro acumulado', 'Total saved'), data: c.rows.map(r => +r.balance.toFixed(2)), borderColor: a, backgroundColor: a + '33', fill: true, tension: .3, pointRadius: 0, borderWidth: 2.5 },
        { label: BD.L('Meta', 'Goal'), data: c.rows.map(() => d.target), borderColor: a3, borderDash: [6, 6], pointRadius: 0, borderWidth: 1.5 },
      ] },
      options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { labels: { color: text } }, tooltip: { callbacks: { label: x => `${x.dataset.label}: ${money(x.parsed.y, d.cur)}` } } }, scales: { y: { ticks: { callback: v => money(v, d.cur) } }, x: { ticks: { maxTicksLimit: 8 } } } },
    }));
    const pie = $('#chPie', el);
    const items = d.items.filter(i => i.amount > 0);
    if (pie && items.length) made.push(new Chart(pie, {
      type: 'doughnut',
      data: { labels: items.map(i => BD.tr(i.name)), datasets: [{ data: items.map(i => i.amount), backgroundColor: [a, a2, a3, cssVar('--good'), '#ffd25e', '#ff8a5c', '#c44dff'], borderColor: cssVar('--bg'), borderWidth: 3 }] },
      options: { maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { color: text } }, tooltip: { callbacks: { label: x => `${x.label}: ${money(x.parsed, d.cur)}` } } } },
    }));
    const bar = $('#chBar', el);
    if (bar && d.income > 0) made.push(new Chart(bar, {
      type: 'bar',
      data: { labels: [BD.L('Tu mes', 'Your month')], datasets: [
        { label: BD.L('Gastos fijos', 'Fixed expenses'), data: [d.fixed], backgroundColor: muted },
        { label: BD.L('Ahorro meta', 'Goal saving'), data: [+c.monthly.toFixed(2)], backgroundColor: a },
        { label: BD.L('Libre', 'Free'), data: [Math.max(0, d.income - d.fixed - c.monthly)], backgroundColor: a3 },
      ] },
      options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { labels: { color: text } }, tooltip: { callbacks: { label: x => `${x.dataset.label}: ${money(x.parsed.x, d.cur)}` } } }, scales: { x: { stacked: true, ticks: { callback: v => money(v, d.cur) } }, y: { stacked: true } } },
    }));
    return () => made.forEach(ch => ch.destroy());
  }

  // ---------- asistente de preguntas ----------
  BD.tool({
    path: '/ahorro', cat: 'dinero', title: 'Plan de ahorro', short: 'Ahorro', icon: BD.icon('piggy'),
    colors: ['#ffab8a', '#ff5a36'], desc: 'Dime cuánto quieres ahorrar y para qué: te hago unas preguntas y armo un plan con gráficas.',
    render(view) {
      const body = win(view, { title: 'Plan de ahorro', sub: 'Unas preguntas rápidas y te armo el plan completo.' });
      const d = Object.assign({ step: 0, target: '', cur: settings().currency, purpose: '', items: [], months: 6, income: '', fixed: '', current: 0, freq: 'mensual', rate: 0, style: 'equilibrado', name: '' }, store.get('savings:draft', {}));
      const plans = store.get('savings:plans', []);
      const STEPS = 6;

      function draw() {
        store.set('savings:draft', d);
        const p = PURPOSES[d.purpose];
        const nav = (canNext = true) => `<div class="row" style="margin-top:22px">
          ${d.step ? '<button class="btn ghost" data-go="-1">← Atrás</button>' : ''}<span class="spacer"></span>
          <button class="btn primary" data-go="1" ${canNext ? '' : 'disabled'}>${d.step === STEPS - 1 ? 'Crear mi plan ✨' : 'Siguiente →'}</button></div>`;
        let html = `<div class="row" style="margin-bottom:18px"><span class="chip">Paso ${d.step + 1} de ${STEPS}</span><div class="bar" style="flex:1"><i style="width:${(d.step + 1) / STEPS * 100}%"></i></div></div>`;
        if (d.step === 0) html += `
          <h2>¿Cuánto quieres ahorrar?</h2>
          <div class="grid g2" style="max-width:520px">
            <input type="number" id="aTarget" min="1" step="any" placeholder="Ej. 1500" value="${esc(d.target)}" inputmode="decimal">
            <select id="aCur">${['USD', 'EUR', 'MXN', 'COP', 'ARS', 'CLP', 'PEN', 'VES', 'GBP', 'BRL'].map(c => `<option ${c === d.cur ? 'selected' : ''}>${c}</option>`).join('')}</select>
          </div>
          <p class="muted small" style="margin-top:8px">¿No sabes aún? Pon un estimado; en el paso 3 lo calculamos sumando lo que quieres comprar.</p>` + nav(true);
        if (d.step === 1) html += `
          <h2>¿Para qué es este ahorro?</h2>
          <div class="bubbles">${Object.entries(PURPOSES).map(([k, v]) => `<button class="bubble ${d.purpose === k ? 'on' : ''}" data-p="${k}" style="--c1:${v.c[0]};--c2:${v.c[1]}"><span class="e">${v.e}</span>${v.l}</button>`).join('')}</div>
          <label class="field" style="max-width:520px;margin:10px auto 0"><span>Ponle nombre a tu meta</span><input type="text" id="aName" value="${esc(d.name)}" placeholder="${p ? 'Ej. ' + p.l + ' 2027' : 'Ej. Japón 2027'}"></label>` + nav(!!d.purpose);
        if (d.step === 2) html += `
          <h2>¿En qué lo vas a gastar?</h2>
          <p class="muted">Desglosa la meta. Te propuse un reparto típico para "${esc(p.l)}", edítalo libremente.</p>
          <div class="stack" id="aItems">${d.items.map((it, i) => `<div class="row"><input type="text" data-in="${i}" value="${esc(it.name)}" style="flex:2;min-width:140px"><input type="number" data-ia="${i}" value="${it.amount || ''}" min="0" step="any" placeholder="Monto" style="flex:1;min-width:100px"><button class="icon-btn" data-rm="${i}">✕</button></div>`).join('')}</div>
          <div class="row" style="margin-top:10px"><button class="btn ghost sm" id="aAdd">+ Agregar concepto</button><span class="spacer"></span>
          <span>Suma: <b>${money(d.items.reduce((a, i) => a + (i.amount || 0), 0), d.cur)}</b></span>
          <button class="btn ghost sm" id="aUseSum">Usar suma como meta</button></div>
          <p class="muted small">Meta actual: ${money(num(d.target), d.cur)}</p>` + nav(true);
        if (d.step === 3) html += `
          <h2>¿Para cuándo lo necesitas?</h2>
          <div class="result-big" id="aMonthsV"></div>
          <input type="range" id="aMonths" min="1" max="60" value="${d.months}">
          <p class="muted">Fecha objetivo: <b id="aDate"></b></p>
          <div class="field" style="margin-top:12px"><span>¿Cada cuánto puedes apartar dinero?</span><div id="aFreq"></div></div>` + nav(true);
        if (d.step === 4) html += `
          <h2>Tus números del mes</h2>
          <p class="muted">Solo se usan aquí para ver si el plan es realista. Nada sale de tu navegador.</p>
          <div class="grid g2">
            <label class="field"><span>Ingreso mensual neto</span><input type="number" id="aIncome" min="0" step="any" value="${esc(d.income)}" inputmode="decimal"></label>
            <label class="field"><span>Gastos fijos al mes (renta, comida, servicios…)</span><input type="number" id="aFixed" min="0" step="any" value="${esc(d.fixed)}" inputmode="decimal"></label>
            <label class="field"><span>¿Cuánto tienes ya ahorrado para esto?</span><input type="number" id="aCurrent" min="0" step="any" value="${d.current || ''}" inputmode="decimal"></label>
            <label class="field"><span>Rendimiento anual de tu cuenta (%) — opcional</span><input type="number" id="aRate" min="0" max="50" step="any" value="${d.rate || ''}" placeholder="0"></label>
          </div>` + nav(true);
        if (d.step === 5) html += `
          <h2>¿Qué tan intenso quieres ir?</h2>
          <p class="muted">Define qué parte de tu dinero libre estás dispuesta/o a destinar como máximo.</p>
          <div class="grid g3">${Object.entries(STYLE).map(([k, v]) => `<button class="card ${d.style === k ? '' : ''}" data-st="${k}" style="cursor:pointer;text-align:left;font:inherit;color:inherit;${d.style === k ? 'outline:2px solid var(--accent);box-shadow:var(--glow)' : ''}"><h3>${v.l}</h3><span class="muted small">hasta ${v.pct * 100}% de tu dinero libre</span></button>`).join('')}</div>` + nav(true);
        body.innerHTML = html + (plans.length ? `<hr class="sep"><h3>Mis planes</h3><div class="stack">${plans.map(pl => `<a class="card row" href="#/ahorro/plan/${pl.id}" style="text-decoration:none"><span style="font-size:1.4rem">${PURPOSES[pl.purpose]?.e || '✨'}</span><b>${esc(pl.name)}</b><span class="spacer"></span><span class="muted small">${money(pl.target, pl.cur)}</span><span class="chip">${Math.round((pl.done || []).length / Math.max(1, compute(pl).N) * 100)}%</span></a>`).join('')}</div>` : '');

        // bindings
        const v = id => $('#' + id, body);
        if (d.step === 0) { v('aTarget').oninput = e => d.target = e.target.value; v('aCur').onchange = e => d.cur = e.target.value; }
        if (d.step === 1) {
          $('.bubbles', body).onclick = e => {
            const b = e.target.closest('[data-p]'); if (!b) return;
            if (d.purpose !== b.dataset.p) { d.purpose = b.dataset.p; const t = num(d.target); d.items = PURPOSES[d.purpose].items.map(([n, pc]) => ({ name: BD.tr(n), amount: t ? Math.round(t * pc) / 100 : 0 })); }
            draw();
          };
          v('aName').oninput = e => d.name = e.target.value;
        }
        if (d.step === 2) {
          $('#aItems', body).oninput = e => {
            const i = e.target.dataset.in ?? e.target.dataset.ia; if (i === undefined) return;
            if (e.target.dataset.in !== undefined) d.items[i].name = e.target.value; else d.items[i].amount = num(e.target.value);
            store.set('savings:draft', d);
          };
          $('#aItems', body).onchange = () => draw();
          $('#aItems', body).onclick = e => { const r = e.target.closest('[data-rm]'); if (r) { d.items.splice(+r.dataset.rm, 1); draw(); } };
          v('aAdd').onclick = () => { d.items.push({ name: BD.L('Nuevo concepto', 'New item'), amount: 0 }); draw(); };
          v('aUseSum').onclick = () => { const s = d.items.reduce((a, i) => a + (i.amount || 0), 0); if (s > 0) { d.target = String(Math.round(s * 100) / 100); draw(); } };
        }
        if (d.step === 3) {
          const paintMonths = () => {
            v('aMonthsV').textContent = `${d.months} ${d.months === 1 ? 'mes' : 'meses'}`;
            const x = new Date(); x.setMonth(x.getMonth() + d.months);
            v('aDate').textContent = x.toLocaleDateString(BD.locale(), { month: 'long', year: 'numeric' });
          };
          v('aMonths').oninput = e => { d.months = +e.target.value; store.set('savings:draft', d); paintMonths(); };
          paintMonths();
          BD.seg(v('aFreq'), Object.entries(FREQ).map(([k, f]) => [k, f.l]), d.freq, x => { d.freq = x; store.set('savings:draft', d); });
        }
        if (d.step === 4) [['aIncome', 'income'], ['aFixed', 'fixed'], ['aCurrent', 'current'], ['aRate', 'rate']].forEach(([id, k]) => v(id).oninput = e => d[k] = k === 'income' || k === 'fixed' ? e.target.value : num(e.target.value));
        if (d.step === 5) $$('[data-st]', body).forEach(b => b.onclick = () => { d.style = b.dataset.st; draw(); });

        $$('[data-go]', body).forEach(b => b.onclick = () => {
          const dir = +b.dataset.go;
          if (dir > 0 && d.step === 0 && !(num(d.target) > 0)) return toast('Escribe cuánto quieres ahorrar', 'bad');
          if (dir > 0 && d.step === 4 && !(num(d.income) > 0)) return toast('Pon tu ingreso mensual (aunque sea aproximado)', 'bad');
          if (dir > 0 && d.step === STEPS - 1) return finish();
          d.step = Math.max(0, d.step + dir); draw();
        });
      }
      function finish() {
        const plan = { id: uid(), name: d.name || PURPOSES[d.purpose].l, purpose: d.purpose, target: num(d.target), cur: d.cur, items: d.items, months: d.months, freq: d.freq,
          income: num(d.income), fixed: num(d.fixed), current: num(d.current), rate: num(d.rate), style: d.style, created: Date.now(), done: [] };
        const all = store.get('savings:plans', []); all.unshift(plan); store.set('savings:plans', all);
        store.del('savings:draft');
        location.hash = '#/ahorro/plan/' + plan.id;
      }
      draw();
    },
  });

  BD.route('/ahorro/plan/:id', {
    title: 'Mi plan de ahorro',
    render(view, { id }) {
      const all = store.get('savings:plans', []), d = all.find(p => p.id === id);
      if (!d) { win(view, { title: 'Plan no encontrado', back: '#/ahorro' }).innerHTML = '<p class="muted">Este plan no existe en este navegador.</p>'; return; }
      const c = compute(d), P = PURPOSES[d.purpose] || PURPOSES.otro, m = n => money(n, d.cur);
      const body = win(view, { title: `${P.e} ${d.name}`, sub: `Meta de ${m(d.target)} en ${d.months} meses · aportes ${FREQ[d.freq].l.toLowerCase()}es`, back: '#/ahorro' });
      const doneSum = () => d.current + d.done.length * c.per;
      const verdict = d.income - d.fixed <= 0
        ? `<b>⚠ Tus gastos fijos igualan o superan tu ingreso.</b> Antes de ahorrar para esta meta, busca recortar gastos o aumentar ingresos.`
        : c.feasible
          ? `<b>✅ Plan realista.</b> Usarás el ${Math.round(c.pctFree * 100)}% de tu dinero libre (${m(c.free)}/mes). Te quedan ${m(c.free - c.monthly)} al mes.`
          : `<b>⚠ Muy ajustado.</b> Necesitas ${m(c.monthly)}/mes, el ${Math.round(c.pctFree * 100)}% de tu dinero libre (tu límite elegido es ${STYLE[d.style].pct * 100}%).
             ${c.suggestMonths ? `Con tu límite, lo lograrías en <b>${c.suggestMonths} meses</b>.` : ''} También puedes bajar la meta a ${m(d.current + c.cap * d.months)}.`;

      body.innerHTML = `
        <div class="grid g4">
          <div class="card stat"><b>${m(c.per)}</b><span>cada ${{ semanal: 'semana', quincenal: 'quincena', mensual: 'mes' }[d.freq]}</span></div>
          <div class="card stat"><b>${m(c.monthly)}</b><span>al mes</span></div>
          <div class="card stat"><b>${c.N}</b><span>aportes</span></div>
          <div class="card stat"><b id="plPct">0%</b><span>completado</span><div class="bar" style="margin-top:8px"><i id="plBar"></i></div></div>
        </div>
        <div class="note-box" style="margin:16px 0">${verdict}</div>
        <div class="split">
          <div class="card"><h3>Cómo crece tu ahorro</h3><div class="chart-box"><canvas id="chLine"></canvas></div>
            ${c.interest > 0.5 ? `<p class="muted small">Intereses ganados: ${m(c.interest)}</p>` : ''}</div>
          <div class="card"><h3>En qué se va</h3><div class="chart-box">${d.items.some(i => i.amount > 0) ? '<canvas id="chPie"></canvas>' : '<div class="empty">Sin desglose</div>'}</div></div>
        </div>
        <div class="split" style="margin-top:22px">
          <div class="card"><h3>Tu mes con el plan</h3><div class="chart-box" style="height:160px"><canvas id="chBar"></canvas></div>
            <h3 style="margin-top:16px">Hitos</h3>
            ${c.milestones.map(x => `<div class="line"><span>${x.p}% · ${m(d.target * x.p / 100)}</span><span>${x.row ? new Date(x.row.date + 'T12:00').toLocaleDateString(BD.locale(), { day: 'numeric', month: 'short', year: 'numeric' }) : 'ya lo tienes 🎉'}</span></div>`).join('')}
            <h3 style="margin-top:16px">Consejos</h3><ul class="muted small" style="padding-left:1.1em">${P.tips.concat([
              'Automatiza el aporte el mismo día que cobras: lo que no ves, no lo gastas.',
              d.freq !== 'semanal' ? 'Si cobras por semana o por encargo, prueba aportes semanales: se sienten más pequeños.' : 'Revisa tu progreso cada mes y ajusta si algo cambia.',
            ]).map(t => `<li>${esc(t)}</li>`).join('')}</ul>
          </div>
          <div class="card"><h3>Calendario de aportes</h3><p class="muted small">Marca cada aporte cuando lo hagas.</p>
            <div class="scroll-x" style="max-height:440px;overflow:auto"><table class="table"><thead><tr><th></th><th>#</th><th>Fecha</th><th class="num">Aporte</th><th class="num">Acumulado</th></tr></thead>
            <tbody>${c.rows.map(r => `<tr><td><input type="checkbox" data-r="${r.i}" ${d.done.includes(r.i) ? 'checked' : ''}></td><td>${r.i}</td><td>${r.date}</td><td class="num">${m(r.amount)}</td><td class="num">${m(r.balance)}</td></tr>`).join('')}</tbody></table></div>
          </div>
        </div>
        <div class="row" style="margin-top:18px">
          <button class="btn primary" id="plLog">Guardar en Decision Log</button>
          <button class="btn ghost" id="plCsv">Descargar calendario (CSV)</button>
          <span class="spacer"></span>
          <button class="btn ghost danger" id="plDel">Borrar plan</button>
        </div>`;

      const paintPct = () => { const p = Math.min(100, Math.round(doneSum() / d.target * 100)); $('#plPct', body).textContent = p + '%'; $('#plBar', body).style.width = p + '%'; };
      paintPct();
      $('table', body).onchange = e => {
        const r = +e.target.dataset.r; if (!r) return;
        d.done = e.target.checked ? [...new Set([...d.done, r])] : d.done.filter(x => x !== r);
        store.set('savings:plans', all); paintPct();
        if (e.target.checked && d.done.length === c.N) toast('¡Meta cumplida! 🎉🐷');
      };
      $('#plLog', body).onclick = () => BD.log('Ahorro', `${d.name}: ${m(d.target)} en ${d.months} meses`, { lines: [['Aporte', m(c.per) + ' ' + FREQ[d.freq].l.toLowerCase()], ['Al mes', m(c.monthly)], ['% de dinero libre', Math.round(c.pctFree * 100) + '%'], ['Viable', c.feasible ? 'Sí' : 'Ajustado']] });
      $('#plCsv', body).onclick = () => BD.download(new Blob(['#,fecha,aporte,acumulado\n' + c.rows.map(r => `${r.i},${r.date},${r.amount.toFixed(2)},${r.balance.toFixed(2)}`).join('\n')], { type: 'text/csv' }), `plan-${d.name}.csv`);
      $('#plDel', body).onclick = e => {
        if (!e.target.dataset.armed) { e.target.dataset.armed = 1; e.target.textContent = '¿Seguro? Pulsa otra vez'; return; }
        store.set('savings:plans', all.filter(p => p.id !== id)); location.hash = '#/ahorro';
      };

      let destroy = null, alive = true;
      charts(body, d, c).then(fn => { if (alive) destroy = fn; else fn(); }).catch(err => toast(err.message, 'bad'));
      const onTheme = () => BD.render(); // las gráficas leen los colores del tema
      window.addEventListener('bd:theme', onTheme);
      return () => { alive = false; destroy && destroy(); window.removeEventListener('bd:theme', onTheme); };
    },
  });
})();
