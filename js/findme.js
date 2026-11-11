'use strict';
/* Find me on: todos los enlaces de la autora de BrainDeck */
(() => {
  const { esc, win, L } = BD;

  // [título, [[nombre, url, nota]]]
  const GROUPS = () => [
    ['✭ ' + L('Principal', 'Main'), [
      ['Portfolio', 'https://grevaleart.com/'],
      ['Email', 'mailto:greciavalentinapv@gmail.com', 'greciavalentinapv@gmail.com'],
      [L('Donaciones (Ko-fi)', 'Donations (Ko-fi)'), 'https://ko-fi.com/grevaleart'],
    ]],
    ['✭ ' + L('Tiendas online', 'Online shops'), [
      ['Ko-fi shop', 'https://ko-fi.com/grevaleart/shop', L('Plantillas web para Nekoweb y Neocities', 'Web templates for Nekoweb and Neocities')],
      ['Contra', 'https://contra.com/greciavalentina_/products?r=greciavalentina_', L('Mis modelos 3D más vendidos', 'My bestselling 3D models')],
      ['Gumroad', 'https://gvarte.gumroad.com', L('Algunos modelos 3D', 'Some 3D models')],
    ]],
    ['✭ ' + L('Comisiones', 'Commissions'), [
      ['VGen', 'https://vgen.co/grevaleart', L('Comisiones 3D y web retro', '3D and retro web commissions')],
      [L('Comisiones de dibujo', 'Drawing commissions'), 'https://vgen.co/grevaleart/service/semirealistic-human-fantasy-creature-chibi-anime-traditional-art-hand-drawn-/e83e3793-7df6-498d-b521-4a539fea97c3', L('Semirrealista, fantasía, chibi, anime, tradicional', 'Semi-realistic, fantasy, chibi, anime, traditional')],
      [L('Mi perfil de Contra', 'My Contra profile'), 'https://contra.com/greciavalentina_?referralExperimentNid=DEFAULT_REFERRAL_PROGRAM&referrerUsername=greciavalentina_'],
      [L('Únete a Contra', 'Join Contra'), 'https://on.contra.com/bgqh9n', L('Gana 100 USD gratis con este enlace de referido', 'Get 100 USD free with this referral link')],
    ]],
    ['✭ ' + L('Proyectos', 'Projects'), [
      ['GitHub', 'https://github.com/GVPV12', L('Todos mis proyectos', 'All my projects')],
      ['itch.io', 'https://grecia-v.itch.io/', L('Proyectos de juegos', 'Game projects')],
      [L('Mi web retro', 'My retro website'), 'https://starmoon.nekoweb.org/'],
      [L('Mi jardín digital', 'My digital garden'), 'https://gvpv12.github.io/'],
    ]],
    ['✭ ' + L('Arte y video', 'Art & video'), [
      ['YouTube', 'https://www.youtube.com/@grevaleart'],
      [L('Tutoriales de Blender', 'Blender tutorials'), 'https://www.youtube.com/playlist?list=PL7vSt-bQmdf7v73BJuaZ4PoJ6pUGOqWKX', L('Mi lista de YouTube', 'My YouTube playlist')],
      ['Behance', 'https://www.behance.net/greciavalero/'],
      ['ArtStation', 'https://www.artstation.com/gvarte'],
    ]],
    ['✭ ' + L('Redes', 'Socials'), [
      ['Pinterest', 'https://www.pinterest.com/grevaleart'],
      ['Pinterest 2', 'https://www.pinterest.com/greciartUI/_created/'],
      ['LinkedIn', 'https://www.linkedin.com/in/grecia-valentina-valero/'],
      ['Tumblr', 'https://gvartblog.tumblr.com'],
      ['Substack', 'https://substack.com/@greciart'],
      [L('Instagram arte', 'Instagram art'), 'https://www.instagram.com/grevaleartdraws', L('En pausa', 'On hiatus')],
      [L('Instagram arte 3D', 'Instagram 3D art'), 'https://www.instagram.com/grevaleart3d', L('En pausa', 'On hiatus')],
    ]],
  ];
  const host = u => u.startsWith('mailto:') ? '' : new URL(u).hostname.replace(/^www\./, '');

  // Iconos de línea (estilo Lucide) según el tipo de enlace
  const P = {
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    coffee: '<path d="M17 8h1a4 4 0 0 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><path d="M6 2v2M10 2v2M14 2v2"/>',
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    brush: '<path d="M9.06 11.9 17.1 3.86a2.7 2.7 0 1 1 3.82 3.82l-8.04 8.04"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/>',
    code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    sprout: '<path d="M7 20h10M12 20v-8"/><path d="M12 12c0-3-2-5-6-5 0 3 2 5 6 5zM12 10c0-3 2-6 6-6 0 3-2 6-6 6z"/>',
    play: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/>',
    pin: '<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    pen: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    camera: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    news: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9h4"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>',
  };
  const svg = p => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  function iconFor(url) {
    if (url.startsWith('mailto:')) return svg(P.mail);
    const h = host(url);
    const pick = [
      [/grevaleart\.com/, () => BD.icon('palette')], [/ko-fi/, () => svg(url.includes('/shop') ? P.bag : P.coffee)],
      [/contra/, () => svg(url.includes('/products') ? P.bag : P.briefcase)], [/gumroad/, () => svg(P.bag)], [/vgen/, () => svg(P.brush)],
      [/github\.io/, () => svg(P.sprout)], [/github\.com/, () => svg(P.code)], [/itch\.io/, () => BD.icon('gamepad')], [/nekoweb/, () => BD.icon('globe')],
      [/youtube/, () => svg(P.play)], [/behance|artstation/, () => BD.icon('image')], [/pinterest/, () => svg(P.pin)], [/linkedin/, () => svg(P.users)],
      [/tumblr/, () => svg(P.pen)], [/substack/, () => svg(P.news)], [/instagram/, () => svg(P.camera)],
    ].find(([re]) => re.test(h));
    return pick ? pick[1]() : BD.icon('link');
  }

  BD.route('/findme', {
    title: 'Estoy en',
    render(view) {
      const body = win(view, { title: L('Estoy en', 'Find me on'), sub: '.✧･ﾟ・。.・゜✭・.・✫・゜・。..・。.・゜✭・.・✫・゜・。.' });
      body.setAttribute('translate', 'no');
      body.innerHTML = `<div class="grid g2 findme">${GROUPS().map(([h, links]) => `
        <div class="card stack">
          <h3 style="margin:0">${esc(h)}</h3>
          ${links.map(([name, url, note]) => `
            <a class="find-link" href="${esc(url)}" ${url.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>
              <span class="find-ic">${iconFor(url)}</span>
              <span><b>${esc(name)}</b>${note ? `<span class="muted small">${esc(note)}</span>` : ''}</span>
              <span class="muted small">${esc(host(url))} ↗</span>
            </a>`).join('')}
        </div>`).join('')}</div>`;
    },
  });
})();
