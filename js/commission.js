'use strict';
/* Calculadora de comisión y porcentaje (port web de GVPV12/commission-calculator + extras) */
(() => {
  const { $, esc, win, money, num, settings, store } = BD;

  BD.tool({
    path: '/comision', cat: 'dinero', title: 'Calculadora de comisión', short: 'Comisión', icon: BD.icon('calculator'),
    colors: ['#ff8fc4', '#ff3d8f'], desc: 'Valor total + porcentaje → cuánto se resta y cuánto te queda. También: cuánto cobrar para recibir X.',
    render(view) {
      const body = win(view, { title: 'Calculadora de comisión', sub: 'Ingresa el valor total y el porcentaje. Verás la ecuación, el valor a restar y el valor final.' });
      const st = Object.assign({ mode: 'restar', total: '', pct: '', fixed: '', cur: settings().currency }, store.get('commission:last', {}));
      body.innerHTML = `
        <div class="split">
          <div class="stack">
            <div id="cMode"></div>
            <div class="grid g2">
              <label class="field"><span id="cTotalLbl">Valor total</span><input type="number" id="cTotal" inputmode="decimal" min="0" step="any" placeholder="100" value="${esc(st.total)}"></label>
              <label class="field"><span>Porcentaje (%)</span><input type="number" id="cPct" inputmode="decimal" min="0" max="100" step="any" placeholder="20" value="${esc(st.pct)}"></label>
            </div>
            <div class="row" id="cChips">${[5, 10, 15, 20, 25, 30, 50].map(p => `<button class="btn ghost sm" data-p="${p}">${p}%</button>`).join('')}</div>
            <div class="grid g2">
              <label class="field"><span>Tarifa fija extra (opcional)</span><input type="number" id="cFixed" inputmode="decimal" min="0" step="any" placeholder="0.30" value="${esc(st.fixed)}"></label>
              <label class="field"><span>Moneda</span><select id="cCur">${['USD', 'EUR', 'MXN', 'COP', 'ARS', 'CLP', 'PEN', 'VES', 'GBP', 'BRL'].map(c => `<option ${c === st.cur ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
            </div>
            <div>
              <span class="label">Plataformas (aprox., revisa la tarifa actual de tu país)</span>
              <div class="row" id="cPresets" style="margin-top:6px">
                <button class="btn ghost sm" data-pp="5.4,0.30">PayPal 5.4% + 0.30</button>
                <button class="btn ghost sm" data-pp="2.9,0.30">Stripe 2.9% + 0.30</button>
                <button class="btn ghost sm" data-pp="5,0">Ko-fi 5%</button>
                <button class="btn ghost sm" data-pp="20,0">Fiverr 20%</button>
                <button class="btn ghost sm" data-pp="10,0">Upwork 10%</button>
              </div>
            </div>
          </div>
          <div class="card" id="cOut"></div>
        </div>`;

      BD.seg($('#cMode', body), [['restar', 'Restar %'], ['sumar', 'Sumar %'], ['cobrar', '¿Cuánto cobrar?']], st.mode, v => { st.mode = v; calc(); });
      const inputs = ['cTotal', 'cPct', 'cFixed', 'cCur'].map(id => $('#' + id, body));
      inputs.forEach(i => i.addEventListener('input', calc));
      $('#cChips', body).onclick = e => { const p = e.target.closest('[data-p]'); if (p) { $('#cPct', body).value = p.dataset.p; calc(); } };
      $('#cPresets', body).onclick = e => {
        const p = e.target.closest('[data-pp]'); if (!p) return;
        const [pct, fixed] = p.dataset.pp.split(',');
        $('#cPct', body).value = pct; $('#cFixed', body).value = fixed !== '0' ? fixed : ''; calc();
      };

      let lastLines = [];
      function calc() {
        st.total = $('#cTotal', body).value; st.pct = $('#cPct', body).value; st.fixed = $('#cFixed', body).value; st.cur = $('#cCur', body).value;
        store.set('commission:last', st);
        $('#cTotalLbl', body).textContent = st.mode === 'cobrar' ? 'Lo que quieres recibir' : 'Valor total';
        const T = num(st.total), P = num(st.pct), F = num(st.fixed), m = n => money(n, st.cur);
        const out = $('#cOut', body);
        if (!T || P < 0) { out.innerHTML = `<div class="empty"><span class="big">🧮</span>Escribe un valor y un porcentaje</div>`; lastLines = []; return; }
        let big, label, eq, lines;
        if (st.mode === 'restar') {
          const cut = T * P / 100 + F, fin = T - cut;
          label = 'Valor final'; big = m(fin);
          eq = `${T} × ${P}% ${F ? `+ ${F}` : ''} = ${+cut.toFixed(4)}  →  ${T} − ${+cut.toFixed(4)} = ${+fin.toFixed(4)}`;
          lines = [['Valor total', m(T)], [`Valor a restar (${P}%${F ? ' + fija' : ''})`, '− ' + m(cut)], ['Valor final', m(fin)]];
        } else if (st.mode === 'sumar') {
          const add = T * P / 100 + F, fin = T + add;
          label = 'Total con porcentaje'; big = m(fin);
          eq = `${T} × ${P}% ${F ? `+ ${F}` : ''} = ${+add.toFixed(4)}  →  ${T} + ${+add.toFixed(4)} = ${+fin.toFixed(4)}`;
          lines = [['Valor base', m(T)], [`Valor a sumar (${P}%${F ? ' + fija' : ''})`, '+ ' + m(add)], ['Total', m(fin)]];
        } else {
          if (P >= 100) { out.innerHTML = `<div class="empty">Con ${P}% nunca recibirías nada 😅</div>`; return; }
          const gross = (T + F) / (1 - P / 100), fee = gross - T;
          label = 'Debes cobrar'; big = m(gross);
          eq = `(${T}${F ? ` + ${F}` : ''}) ÷ (1 − ${P / 100}) = ${+gross.toFixed(4)}`;
          lines = [['Cobras al cliente', m(gross)], [`Comisión (${P}%${F ? ' + fija' : ''})`, '− ' + m(fee)], ['Recibes', m(T)]];
        }
        lastLines = lines;
        out.innerHTML = `
          <span class="label">${label}</span>
          <div class="result-big">${big}</div>
          <div class="out" style="margin-bottom:14px">${esc(eq)}</div>
          <div class="lines">${lines.map(([a, b], i) => `<div class="line ${i === lines.length - 1 ? 'total' : ''}"><span>${esc(a)}</span><span>${esc(b)}</span></div>`).join('')}</div>
          <input type="text" id="cNote" placeholder="Nota opcional (ej. encargo de Ana, 2 personajes)" style="margin-top:16px">
          <div class="row" style="margin-top:12px">
            <button class="btn primary sm" id="cSave">Guardar decisión</button>
            <button class="btn ghost sm" id="cCopy">Copiar resumen</button>
          </div>`;
        $('#cCopy', out).onclick = () => BD.copy(lines.map(l => l.join(': ')).join('\n') + '\n' + eq);
        $('#cSave', out).onclick = () => {
          const note = $('#cNote', out).value.trim();
          BD.log('Comisión', `${{ restar: 'Restar', sumar: 'Sumar', cobrar: 'Cobrar' }[st.mode]} ${P}% de ${m(T)}`, { lines: lastLines, note });
        };
      }
      calc();
    },
  });
})();
