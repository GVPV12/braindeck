'use strict';
/* Iconos pixel art a color (12×12) para cada herramienta, y el avatar del gato (16×16).
   Cada icono: tile = color de fondo de la baldosa, p = paleta (letra → color), r = filas. '.' = transparente. */
(() => {
  const K = '#1d1b2b', W = '#ffffff', L = BD.L;
  // Dibuja filas de letras como SVG nítido (une los píxeles seguidos del mismo color en un solo rectángulo)
  function pixel(rows, pal, cls = 'px') {
    const w = Math.max(...rows.map(r => r.length)), h = rows.length;
    let out = '';
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length;) {
        const ch = row[x], c = pal[ch];
        let n = 1; while (row[x + n] === ch) n++;
        if (c) out += `<rect x="${x}" y="${y}" width="${n}" height="1" ${c.startsWith('var(') ? `style="fill:${c}"` : `fill="${c}"`}/>`;
        x += n;
      }
    });
    return `<svg class="${cls}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true">${out}</svg>`;
  }

  const T = { pink: '#ffb8da', lilac: '#cbb8ff', blue: '#acc9ff', mint: '#93e6c8', yellow: '#ffd978', peach: '#ffc3a3', lime: '#d9f27a' };
  const I = {
    '/notas': { tile: T.yellow, p: { k: K, w: W, p: '#7b61ff' }, r: [
      '...kkkkkk...', '..kppppppk..', '..kpwwwwpk..', '..kpwkkwpk..', '..kpwwwwpk..', '..kpwkkkpk..',
      '..kpwwwwpk..', '..kpwkkwpk..', '..kpwwwwpk..', '..kppppppk..', '..kppkkppk..', '...kkkkkk...'] },
    '/plan': { tile: T.mint, p: { k: K, w: W, r: '#ff5a5f', g: '#2ec27e' }, r: [
      '..k.....k...', '.kkkkkkkkkk.', '.krrrrrrrrk.', '.krrrrrrrrk.', '.kkkkkkkkkk.', '.kwwwwwwwwk.',
      '.kwggwwwwwk.', '.kwggwwrwwk.', '.kwwwwwwwwk.', '.kwwwrwwggk.', '.kkkkkkkkkk.', '............'] },
    '/test': { tile: T.lilac, p: { k: K, w: W, p: '#7448ff', l: '#d9ccff', g: '#2ec27e' }, r: [
      '............', '.kkkk..kkkk.', 'kwwwwkkwwwwk', 'kwllwkkwwwwk', 'kwwwwkkwwwgk', 'kwllwkkwwggk',
      'kwwwwkkgwgwk', 'kwllwkkwgwwk', 'kwwwwkkwwwwk', 'kppppkkppppk', '.kkkkkkkkkk.', '............'] },
    '/reto': { tile: T.peach, p: { k: K, o: '#ff7b00', y: '#ffe08a' }, r: [
      '.kk.........', '.kkkkkkkkkk.', '.kkoooyyyok.', '.kkoooyyyok.', '.kkyyyooook.', '.kkyyyooook.',
      '.kkkkkkkkkk.', '.kk.........', '.kk.........', '.kk.........', 'kkkk........', '............'] },
    '/ingles': { tile: T.blue, p: { k: K, b: '#2f8cff', l: '#bfeaff' }, r: [
      '....kkkk....', '...kllllk...', '...klbblk...', '...kllllk...', '...klbblk...', '...kllllk...',
      '.k.kllllk.k.', '.k..kkkk..k.', '..k......k..', '...kkkkkk...', '.....kk.....', '...kkkkkk...'] },
    '/foco': { tile: T.pink, p: { k: K, w: W, r: '#ff4d5e', g: '#2ec27e' }, r: [
      '.....kgk....', '...kggggk...', '..kkrggrkk..', '.krrrrrrrrk.', 'krwrrrrrrrrk', 'krwrrrrrrrrk',
      'krrrrrrrrrrk', 'krrrrrrrrrrk', '.krrrrrrrrk.', '..kkrrrrkk..', '....kkkk....', '............'] },
    '/radio': { tile: T.lilac, p: { k: K, w: W, c: '#ff71ce', y: '#ffe066' }, r: [
      '........k...', '.......k....', '.kkkkkkkkkk.', 'kcccccccccck', 'kcyyyyyyyyck', 'kcccccccccck',
      'kckkkcckkkck', 'kckwkcckwkck', 'kckkkcckkkck', 'kcccccccccck', '.kkkkkkkkkk.', '............'] },
    '/notas-rapidas': { tile: T.yellow, p: { k: K, y: '#fff6b8', o: '#f2c94c' }, r: [
      '.k.k.k.k.k..', 'kkkkkkkkkkk.', 'kyyyyyyyyyk.', 'kykkkkkkyyk.', 'kyyyyyyyyyk.', 'kykkkkkyyyk.',
      'kyyyyyyyyyk.', 'kykkkkkkkyk.', 'kyyyyyykkkk.', 'kyyyyyykok..', 'kyyyyyykk...', 'kkkkkkkk....'] },
    '/quitar-fondo': { tile: T.mint, p: { k: K, w: W, s: '#c7ccd9', r: '#ff4d5e' }, r: [
      '..k......k..', '..ks....sk..', '...ks..sk...', '....kssk....', '.....kk.....', '....kkkk....',
      '..rrr..rrr..', '.rwwr..rwwr.', '.rwwr..rwwr.', '..rrr..rrr..', '............', '............'] },
    '/convertir': { tile: T.blue, p: { k: K, b: '#8fd3ff', g: '#2ec27e', y: '#ffd36b', d: '#1f9d61' }, r: [
      '............', 'kkkkkkkkkkkk', 'kbbbbbbbbyyk', 'kbbbbbbbbyyk', 'kbbbbkbbbbbk', 'kbbbkgkbbbbk',
      'kbbkgggkbkbk', 'kbkgggggkdkk', 'kkgggggggddk', 'kgggggggdddk', 'kkkkkkkkkkkk', '............'] },
    '/paletas': { tile: T.pink, p: { k: K, t: '#f4c27a', r: '#ff4d5e', b: '#2f8cff', y: '#ffd400', g: '#2ec27e' }, r: [
      '...kkkkkk...', '.kkttttttkk.', 'kttrrttbbttk', 'kttrrttbbttk', 'kttttttttttk', 'ktyyttttggtk',
      'ktyyttttggtk', '.kttttttttk.', '..kkkkkkkk..', '............', '............', '............'], shift: 1 },
    '/ideas': { tile: T.yellow, p: { k: K, w: W, y: '#ffe066', o: '#ffb703', s: '#9aa3b5' }, r: [
      '.o..kkkk..o.', '...kyyyyk...', '..kywyyyyk..', '..kwyyyyyk..', 'o.kyyyyyyk.o', '..kyyyyyyk..',
      '...kyyyyk...', '....kyyk....', '....kssk....', '....kssk....', '.....kk.....', '............'] },
    '/art-unblock': { tile: T.lilac, p: { k: K, p: '#ff9ee8', y: '#fff3a8' }, r: [
      '.....k......', '....kpk.....', '....kpk.....', '...kpppk....', '.kkppyppkk..', 'kpppyyypppk.',
      '.kkppyppkk..', '...kpppk....', '....kpk...k.', '....kpk..kyk', '.....k....k.', '............'] },
    '/gesture': { tile: T.mint, p: { k: K, g: '#ffb38a' }, r: [
      '.....kkk....', '....kgggk...', '....kgggk...', '.....kkk....', '..k..kgk..k.', '...kkkgkkk..',
      '.....kgk....', '.....kgk....', '....kgkgk...', '...kgk.kgk..', '..kgk...kgk.', '..kk.....kk.'] },
    '/marca-agua': { tile: T.blue, p: { k: K, w: W, l: '#7cc8ff', b: '#2f6bff' }, r: [
      '.....kk.....', '....kllk....', '....kllk....', '...kllllk...', '..kllllllk..', '..kwlllllk..',
      '.kwllllllbk.', '.kwllllllbk.', '.kllllllbbk.', '..kllllbbk..', '...kkkkkk...', '............'] },
    '/descargar-video': { tile: T.lilac, p: { k: K, v: '#4d5bff' }, r: [
      '....kkkk....', '....kvvk....', '....kvvk....', '....kvvk....', '.kkkkvvkkkk.', '..kvvvvvvk..',
      '...kvvvvk...', '....kvvk....', '.....kk.....', 'k..........k', 'k..........k', 'kkkkkkkkkkkk'] },
    '/subtitulos': { tile: T.peach, p: { k: K, w: W, s: '#2b2b45', o: '#ff9f1c' }, r: [
      '............', 'kkkkkkkkkkkk', 'kssssssssssk', 'kssssssssssk', 'kssssssssssk', 'kswwwswwwwsk',
      'kssssssssssk', 'ksoooosooosk', 'kssssssssssk', 'kkkkkkkkkkkk', '....kkkk....', '............'] },
    '/editar-pdf': { tile: T.pink, p: { k: K, w: W, r: '#e63946' }, r: [
      '.kkkkkkk....', '.kwwwwwkk...', '.kwwwwwkwk..', '.kwwwwwkkkk.', '.kwkkkwwwwk.', '.kwwwwwwwwk.',
      '.krrrrrrrrk.', '.krrrrrrrrk.', '.kwkkkkkkwk.', '.kwwwwwwwwk.', '.kkkkkkkkkk.', '............'] },
    '/unir-pdf': { tile: T.peach, p: { k: K, w: W, r: '#ff4d5e' }, r: [
      '....kkkkkkk.', '....kwwwwwk.', '.kkkkkkkwwk.', '.kwwwwwkwwk.', '.kwkkkwkwwk.', '.kwwwwwkkkk.',
      '.kwkkkwk....', '.kwwwwwk.rr.', '.kkkkkkkrrrr', '.........rr.', '............', '............'] },
    '/qr': { tile: T.lilac, p: { k: K, p: '#8a5cff' }, r: [
      'kkkk.kk.kkkk', 'kppk..k.kppk', 'kppk.k..kppk', 'kkkk.kk.kkkk', '....k.k.....', 'kk.kk.kkk.k.',
      '.k..k..k.kk.', '....kkk..k.k', 'kkkk..k.k...', 'kppk.kk.kkkk', 'kppk..k...k.', 'kkkk.k.kk.kk'] },
    '/comision': { tile: T.pink, p: { k: K, w: W, p: '#ff3d8f', s: '#c8f7c5', y: '#ffe066' }, r: [
      '.kkkkkkkkkk.', '.kppppppppk.', '.kpsssssspk.', '.kpsssssspk.', '.kppppppppk.', '.kwwpwwpyyk.',
      '.kppppppppk.', '.kwwpwwpyyk.', '.kppppppppk.', '.kwwpwwpyyk.', '.kkkkkkkkkk.', '............'] },
    '/ahorro': { tile: T.mint, p: { k: K, p: '#ff9ec7', d: '#ff3d8f' }, r: [
      '............', '.kk......kk.', '.kpk....kpk.', '.kppkkkkppk.', 'kppppppppppk', 'kppkppppkppk',
      'kpppkkkkpppk', 'kppkdkkdkppk', 'kpppkkkkpppk', '.kppppppppk.', '..kkkkkkkk..', '............'] },
    '/decisiones': { tile: T.lime, p: { k: K, w: W, g: '#8fbf00', r: '#ff4d5e' }, r: [
      '.kkkkkkkkkk.', '.kggkwwwwwk.', '.kggkwkkkwk.', '.kggkwwwwwk.', '.kggkwkkwwk.', '.kggkwwwwwk.',
      '.kggkwkkkwk.', '.kggkwwwwwk.', '.kggkwwwrwk.', '.kggkwwrrwk.', '.kkkkkkkkkk.', '............'] },
    '/juegos': { tile: T.pink, p: { k: K, w: W, p: '#c13bff', y: '#ffe066', r: '#ff4d5e', b: '#2f8cff', g: '#2ec27e' }, r: [
      '............', '............', '.kkkkkkkkkk.', 'kppppppppppk', 'kppwppppgppk', 'kpwwwppbpypk',
      'kppwpppprppk', 'kppppppppppk', 'kpppkkkkpppk', '.kkk....kkk.', '............', '............'] },
    '/ajustes': { tile: T.blue, p: { k: K, s: '#c3cad8' }, r: [
      '....kkkk....', '.kk.kssk.kk.', '.kskssssksk.', '..kssssssk..', 'kkssskkssskk', 'ksssk..ksssk',
      'ksssk..ksssk', 'kkssskkssskk', '..kssssssk..', '.kskssssksk.', '.kk.kssk.kk.', '....kkkk....'] },
    '/herramientas': { tile: T.yellow, p: { k: K, r: '#ff5a5f', b: '#2f8cff', y: '#ffd400', g: '#2ec27e' }, r: [
      '............', '.kkkk..kkkk.', '.krrk..kbbk.', '.krrk..kbbk.', '.kkkk..kkkk.', '............',
      '............', '.kkkk..kkkk.', '.kyyk..kggk.', '.kyyk..kggk.', '.kkkk..kkkk.', '............'] },
  };
  // El de paletas queda más centrado bajando 2 filas
  I['/paletas'].r = ['............', '............', ...I['/paletas'].r.slice(0, 10)];

  const appIcon = (path, cls = '') => {
    const d = I[path]; if (!d) return '';
    return `<span class="app-ic ${cls}" style="--tile:${d.tile}">${pixel(d.r, d.p)}</span>`;
  };

  // Avatar: gatito BrainDeck (sus colores cambian con cada estilo vía CSS)
  const AVATAR = pixel([
    '................', '.kk..........kk.', '.kck........kck.', '.kcck......kcck.', '.kccckkkkkkccck.', '.kcccccccccccck.',
    'kcccccccccccccck', 'kccyyccccccyycck', 'kccykccccccykcck', 'kccccccnncccccck', 'kcrrccmccmccrrck', 'kccccccmmcccccck',
    '.kcccccccccccck.', '..kkcccccccckk..', '....kkkkkkkk....', '................'],
    { k: 'var(--av-line)', c: 'var(--av-cat)', y: 'var(--av-eye)', n: '#ff8fb1', r: '#ff9ec7', m: 'var(--av-mouth)' }, 'px avatar');

  // Más avatares para elegir (clic en el avatar de ME.EXE)
  const AV = {
    cat: { name: L('Gatito', 'Kitty'), svg: AVATAR },
    bunny: { name: L('Conejo', 'Bunny'), svg: pixel([
      '....kk....kk....', '...kwwk..kwwk...', '...kwpk..kpwk...', '...kwpk..kpwk...', '...kwpk..kpwk...', '..kkwwkkkkwwkk..',
      '.kwwwwwwwwwwwwk.', 'kwwwwwwwwwwwwwwk', 'kwwkkwwwwwwkkwwk', 'kwwkkwwwwwwkkwwk', 'kwrwwwwnnwwwwrwk', 'kwwwwwwmmwwwwwwk',
      '.kwwwwwwwwwwwwk.', '..kkwwwwwwwwkk..', '....kkkkkkkk....', '................'],
      { k: K, w: '#fdfbff', p: '#ffb3d1', n: '#ff8fb1', r: '#ffc4dc', m: K }, 'px avatar') },
    frog: { name: L('Rana', 'Frog'), svg: pixel([
      '................', '..kkkk....kkkk..', '.kwwwwk..kwwwwk.', '.kwkkwk..kwkkwk.', '.kwkkwkkkkwkkwk.', 'kgkkkkggggkkkkgk',
      'kggggggggggggggk', 'kggggggggggggggk', 'kgrrggggggggrrgk', 'kggkggggggggkggk', 'kgggkkkkkkkkgggk', 'kggggggggggggggk',
      '.kggggggggggggk.', '..kkkkkkkkkkkk..', '................', '................'],
      { k: K, w: W, g: '#6cc86c', r: '#ff9ec7' }, 'px avatar') },
    ghost: { name: L('Fantasma', 'Ghost'), svg: pixel([
      '................', '.....kkkkkk.....', '...kkwwwwwwkk...', '..kwwwwwwwwwwk..', '.kwwwwwwwwwwwwk.', '.kwwkkwwwwkkwwk.',
      '.kwwkkwwwwkkwwk.', '.kwwwwwwwwwwwwk.', '.kwrwwwkkwwwrwk.', '.kwwwwwkkwwwwwk.', '.kwwwwwwwwwwwwk.', '.kwwwwwwwwwwwwk.',
      '.kwwkkwwkkwwkwk.', '.kk..kk..kk..kk.', '................', '................'],
      { k: K, w: '#f4f1ff', r: '#ff9ec7' }, 'px avatar') },
    robot: { name: 'Robot', svg: pixel([
      '......kyyk......', '.......kk.......', '..kkkkkkkkkkkk..', '..kssssssssssk..', '..ksbbbssbbbsk..', '..ksbcbssbcbsk..',
      '..ksbbbssbbbsk..', '..kssssssssssk..', '..kssyyyyyyssk..', '..kssssssssssk..', '..kkkkkkkkkkkk..', '.....kssssk.....',
      '...kkkkkkkkkk...', '..kbbbbbbbbbbk..', '..kbbbbbbbbbbk..', '..kkkkkkkkkkkk..'],
      { k: K, s: '#c3cad8', b: '#2f8cff', c: '#3ee6ff', y: '#ffd400' }, 'px avatar') },
    bear: { name: L('Osito', 'Bear'), svg: pixel([
      '................', '.kkk........kkk.', 'kbbbk......kbbbk', 'kbpbkkkkkkkkbpbk', 'kbbbbbbbbbbbbbbk', '.kbbbbbbbbbbbbk.',
      '.kbbkkbbbbkkbbk.', '.kbbkkbbbbkkbbk.', '.kbbbbttttbbbbk.', '.kbrbbtkktbbrbk.', '.kbbbbttttbbbbk.', '.kbbbbbbbbbbbbk.',
      '..kbbbbbbbbbbk..', '...kkkkkkkkkk...', '................', '................'],
      { k: K, b: '#b07a4a', p: '#ffb3a0', t: '#e8c39e', r: '#ff9ec7' }, 'px avatar') },
  };

  Object.assign(BD, { pixel, appIcon, hasAppIcon: p => !!I[p], AVATAR, AVATARS: AV });
})();
