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
              <span><b>${esc(name)}</b>${note ? `<span class="muted small">${esc(note)}</span>` : ''}</span>
              <span class="muted small">${esc(host(url))} ↗</span>
            </a>`).join('')}
        </div>`).join('')}</div>`;
    },
  });
})();
