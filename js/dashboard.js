'use strict';
/* Inicio: dashboard de ventanas (avatar, nivel, stats tipo RPG, datos, actividad, bolsa de items y data de cada herramienta)
   + todas las herramientas como apps de un dispositivo. */
(() => {
  const { esc, store, toast, L } = BD;
  const K = '#1d1b2b', W = '#ffffff';

  // ---------- items que se desbloquean con el uso ----------
  const ITEMS = [
    { id: 'pencil', name: L('Lápiz', 'Pencil'), req: L('Usa tu primera herramienta', 'Use your first tool'), ok: c => c.total >= 1,
      p: { k: K, p: '#ff8fb1', s: '#c3cad8', y: '#ffd400', o: '#f2a900', t: '#f4c27a' },
      r: ['....kkkk....', '....kppk....', '....kssk....', '....kyok....', '....kyok....', '....kyok....', '....kyok....', '....kyok....', '....kttk....', '.....kk.....', '............', '............'] },
    { id: 'coffee', name: L('Café', 'Coffee'), req: L('Usa herramientas 10 veces', 'Use tools 10 times'), ok: c => c.total >= 10,
      p: { k: K, w: W, s: '#b8c0d0', b: '#8a5a3c', r: '#ff8fb1' },
      r: ['...s..s.....', '..s..s......', '............', '.kkkkkkkkk..', '.kbbbbbbbkkk', '.kwwwwwwwk.k', '.kwwrrwwwk.k', '.kwwwwwwwkkk', '..kwwwwwk...', '...kkkkk....', 'kkkkkkkkkkk.', '............'] },
    { id: 'book', name: L('Libro', 'Book'), req: L('Estudia 3 días', 'Study on 3 days'), ok: c => c.studyDays >= 3,
      p: { k: K, w: W, b: '#2ec27e', y: '#ffe066' },
      r: ['............', '..kkkkkkkk..', '.kbbbbbbbbk.', '.kbyyyyyybk.', '.kbbbbbbbbk.', '.kbbbbbbbbk.', '.kbbyyyybbk.', '.kbbbbbbbbk.', '.kbbbbbbbbk.', '.kwwwwwwwwk.', '.kkkkkkkkkk.', '............'] },
    { id: 'headphones', name: L('Auriculares', 'Headphones'), req: L('Escucha la radio', 'Listen to the radio'), ok: c => c.radioPlays >= 1,
      p: { k: K, p: '#8b6cff', c: '#ff71ce' },
      r: ['............', '...kkkkkk...', '..kppppppk..', '.kpk....kpk.', '.kk......kk.', 'kk........kk', 'kkkk....kkkk', 'kcck....kcck', 'kcck....kcck', 'kcck....kcck', 'kkkk....kkkk', '............'] },
    { id: 'cassette', name: L('Casete', 'Cassette'), req: L('60 minutos de radio', '60 minutes of radio'), ok: c => c.radioMin >= 60,
      p: { k: K, w: W, c: '#ff71ce' },
      r: ['............', '............', 'kkkkkkkkkkkk', 'kcccccccccck', 'kcwwwwwwwwck', 'kcwkkwwkkwck', 'kcwkkwwkkwck', 'kcwwwwwwwwck', 'kcccccccccck', 'kcckkkkkkcck', 'kkkkkkkkkkkk', '............'] },
    { id: 'sticky', name: 'Post-it', req: L('Escribe 5 notas rápidas', 'Write 5 quick notes'), ok: c => c.qnotes >= 5,
      p: { k: K, y: '#ffb8da', o: '#ff8fc4' },
      r: ['............', 'kkkkkkkkkk..', 'kyyyyyyyyk..', 'kykkkkkyyk..', 'kyyyyyyyyk..', 'kykkkkkkyk..', 'kyyyyyyyyk..', 'kykkkyyyyk..', 'kyyyyyykkk..', 'kyyyyyykok..', 'kkkkkkkkk...', '............'] },
    { id: 'potion', name: L('Poción', 'Potion'), req: L('Termina un test', 'Finish a test'), ok: c => c.tests >= 1,
      p: { k: K, w: W, p: '#9b5cff', t: '#f4c27a' },
      r: ['....kkkk....', '....kttk....', '....kwwk....', '....kwwk....', '...kwwwwk...', '..kppppppk..', '.kppwpppppk.', '.kpwppppppk.', '.kppppppppk.', '..kppppppk..', '...kkkkkk...', '............'] },
    { id: 'brush', name: L('Pincel', 'Brush'), req: L('Usa herramientas de arte 5 veces', 'Use art tools 5 times'), ok: c => (c.cat.creativo || 0) >= 5,
      p: { k: K, p: '#ff4d5e', s: '#c3cad8', t: '#2f8cff' },
      r: ['.....kk.....', '....kppk....', '....kppk....', '....kppk....', '....kssk....', '....kssk....', '....kttk....', '....kttk....', '....kttk....', '....kttk....', '.....kk.....', '............'] },
    { id: 'coin', name: L('Moneda', 'Coin'), req: L('Usa herramientas de dinero 3 veces', 'Use money tools 3 times'), ok: c => (c.cat.dinero || 0) >= 3,
      p: { k: K, w: W, y: '#ffd400', o: '#f2a900' },
      r: ['............', '...kkkkkk...', '..kyyyyyyk..', '.kywoooooyk.', '.kwoyyyyoyk.', '.kyoyyyyoyk.', '.kyoyyyyoyk.', '.kyoyyyyoyk.', '.kyooooooyk.', '..kyyyyyyk..', '...kkkkkk...', '............'] },
    { id: 'plant', name: L('Planta', 'Plant'), req: L('Racha de 3 días', '3-day streak'), ok: c => c.streak >= 3,
      p: { k: K, g: '#2ec27e', t: '#e07a4f' },
      r: ['............', '...kk..kk...', '..kggk.kggk.', '..kgggkgggk.', '...kgggggk..', '....kkgkk...', '.....kgk....', '..kkkkkkkk..', '..kttttttk..', '...kttttk...', '...kttttk...', '....kkkk....'] },
    { id: 'flame', name: L('Llama', 'Flame'), req: L('Racha de 7 días', '7-day streak'), ok: c => c.streak >= 7,
      p: { k: K, w: W, o: '#ff7b00', y: '#ffd400' },
      r: ['.....k......', '....kok.....', '....kook....', '...koyok....', '..kooyyok...', '..koyyyyok..', '.koyywyyok..', '.koyywwyyok.', '.koyywwyyok.', '..koyyyyok..', '...kooook...', '....kkkk....'] },
    { id: 'yarn', name: L('Ovillo', 'Yarn'), req: L('Abre BrainDeck 7 días distintos', 'Open BrainDeck on 7 different days'), ok: c => c.daysActive >= 7,
      p: { k: K, w: W, p: '#ff8fc4' },
      r: ['............', '...kkkkkk...', '..kppwpppk..', '.kpwpppwppk.', '.kwppwppwpk.', '.kppwppwppk.', '.kpwppwpppk.', '..kppppwpk..', '...kkkkkk.k.', '..........k.', '.........k..', '............'] },
    { id: 'gem', name: L('Gema', 'Gem'), req: L('Prueba 10 herramientas distintas', 'Try 10 different tools'), ok: c => c.distinct >= 10,
      p: { k: K, w: W, b: '#3ee6ff', d: '#1fa5c4' },
      r: ['............', '...kkkkkk...', '..kbwbbbbk..', '.kbwbbbbbbk.', 'kkkkkkkkkkkk', '.kdbbbbbbdk.', '..kdbbbbdk..', '...kdbbdk...', '....kddk....', '.....kk.....', '............', '............'] },
    { id: 'trophy', name: L('Trofeo', 'Trophy'), req: L('Completa un reto de 30 días', 'Complete a 30-day challenge'), ok: c => c.retoDone >= 1,
      p: { k: K, w: W, y: '#ffd400', t: '#a0663a' },
      r: ['.kkkkkkkkkk.', 'kkyyyyyyyykk', 'kykwyyyyykyk', 'kykyyyyyykyk', '.kkyyyyyykk.', '...kyyyyk...', '....kyyk....', '....kyyk....', '...kkkkkk...', '..kttttttk..', '..kkkkkkkk..', '............'] },
    { id: 'star', name: L('Estrella', 'Star'), req: L('Llega al nivel 5', 'Reach level 5'), ok: c => c.level >= 5,
      p: { k: K, y: '#ffe066' },
      r: ['.....kk.....', '.....kk.....', '....kyyk....', '....kyyk....', 'kkkkyyyykkkk', '.kyyyyyyyyk.', '..kyyyyyyk..', '...kyyyyk...', '..kyykkyyk..', '..kyk..kyk..', '.kyk....kyk.', '.kk......kk.'] },
    { id: 'crown', name: L('Corona', 'Crown'), req: L('Llega al nivel 10', 'Reach level 10'), ok: c => c.level >= 10,
      p: { k: K, y: '#ffd400', r: '#ff4d5e' },
      r: ['............', 'k....kk....k', 'kk..kyyk..kk', 'kyk.kyyk.kyk', 'kyykyyyykyyk', 'kyyyyryyyyyk', 'kyyyrrryyyyk', 'kyyyyryyyyyk', 'kkkkkkkkkkkk', 'kyyyyyyyyyyk', 'kkkkkkkkkkkk', '............'] },
    // ----- herramientas concretas -----
    { id: 'scroll', name: L('Pergamino', 'Scroll'), req: L('Guarda 3 notas desde capturas', 'Save 3 notes from screenshots'), ok: c => c.notesN >= 3,
      p: { k: K, t: '#f4d9a8', b: '#c9a36b' },
      r: ['............', '..kkkkkkkk..', '.kbttttttbk.', '..kttttttk..', '..ktkkkktk..', '..kttttttk..', '..ktkkkttk..', '..kttttttk..', '..ktkkkktk..', '.kbttttttbk.', '..kkkkkkkk..', '............'] },
    { id: 'notebook', name: L('Cuaderno', 'Notebook'), req: L('Escribe 25 notas rápidas', 'Write 25 quick notes'), ok: c => c.qnotes >= 25,
      p: { k: K, w: W, p: '#ff8fc4', s: '#c3cad8' },
      r: ['............', '.kkkkkkkkk..', 'kskpppppppk.', '.kkpppppppk.', 'kskpwwwwwpk.', '.kkpppppppk.', 'kskpppppppk.', '.kkpppppppk.', 'kskpppppppk.', '.kkpppppppk.', '..kkkkkkkk..', '............'] },
    { id: 'calendar', name: L('Calendario', 'Calendar'), req: L('Crea un plan de estudios', 'Create a study plan'), ok: c => c.plansN >= 1,
      p: { k: K, w: W, r: '#ff4d5e' },
      r: ['...k....k...', '.kkkkkkkkkk.', '.krrrrrrrrk.', '.krrrrrrrrk.', '.kkkkkkkkkk.', '.kwwwwwwwwk.', '.kwkwkwkwwk.', '.kwwwwwwwwk.', '.kwkwkwkwwk.', '.kwwwwwwwwk.', '.kkkkkkkkkk.', '............'] },
    { id: 'hourglass', name: L('Reloj de arena', 'Hourglass'), req: L('Completa 10 sesiones de un plan', 'Complete 10 plan sessions'), ok: c => c.plansDone >= 10,
      p: { k: K, w: W, t: '#a0663a', y: '#ffd400' },
      r: ['.kkkkkkkkkk.', '.tttttttttt.', '..kwwwwwwk..', '..kyyyyyyk..', '...kyyyyk...', '....kyyk....', '....kwyk....', '...kwwywk...', '..kwwwywwk..', '..kyyyyyyk..', '.tttttttttt.', '.kkkkkkkkkk.'] },
    { id: 'medal', name: L('Medalla', 'Medal'), req: L('Completa 30 sesiones de un plan', 'Complete 30 plan sessions'), ok: c => c.plansDone >= 30,
      p: { k: K, r: '#ff4d5e', b: '#2f8cff', y: '#ffd400', o: '#f2a900' },
      r: ['..kkk..kkk..', '..krk..kbk..', '...krkkbk...', '....krbk....', '....kkkk....', '...kyyyyk...', '..kyyooyyk..', '..kyoyyoyk..', '..kyyooyyk..', '...kyyyyk...', '....kkkk....', '............'] },
    { id: 'gradcap', name: L('Birrete', 'Grad cap'), req: L('Termina un plan de estudios completo', 'Finish a whole study plan'), ok: c => c.planComplete >= 1,
      p: { k: K, d: '#3a3550', y: '#ffd400' },
      r: ['............', '.....kk.....', '...kkddkk...', '.kkddddddkk.', 'kddddddddddk', '.kkddddddkk.', '..kddddddky.', '..kddddddky.', '..kkkkkkkky.', '..........y.', '.........yy.', '............'] },
    { id: 'mic', name: L('Micrófono', 'Microphone'), req: L('Grábate 3 veces en el coach de inglés', 'Record yourself 3 times in the English coach'), ok: c => c.speakN >= 3,
      p: { k: K, s: '#c3cad8', p: '#8b6cff' },
      r: ['....kkkk....', '...kssssk...', '...kssssk...', '...kssssk...', '.k.kssssk.k.', '.k..kkkk..k.', '..k......k..', '...kkkkkk...', '.....kk.....', '.....kk.....', '...kppppk...', '...kkkkkk...'] },
    { id: 'dumbbell', name: L('Pesa', 'Dumbbell'), req: L('Haz 10 días de retos', 'Do 10 challenge days'), ok: c => c.retoDays >= 10,
      p: { k: K, s: '#c3cad8', d: '#5a5f73' },
      r: ['............', '............', '............', '.kk......kk.', 'kddk....kddk', 'kddkkkkkkddk', 'kddssssssddk', 'kddkkkkkkddk', 'kddk....kddk', '.kk......kk.', '............', '............'] },
    { id: 'music', name: L('Notas musicales', 'Music notes'), req: L('5 horas de radio', '5 hours of radio'), ok: c => c.radioMin >= 300,
      p: { k: K, p: '#8b6cff' },
      r: ['............', '....kkkkkkk.', '....kkkkkkk.', '....k.....k.', '....k.....k.', '....k.....k.', '..kkk...kkk.', '.kppk..kppk.', '.kppk..kppk.', '..kk....kk..', '............', '............'] },
    { id: 'palette', name: L('Paleta de pintor', 'Painter palette'), req: L('Guarda 3 paletas', 'Save 3 palettes'), ok: c => c.pal >= 3,
      p: { k: K, t: '#f4c27a', r: '#ff4d5e', b: '#2f8cff', g: '#2ec27e', y: '#ffd400' },
      r: ['............', '...kkkkk....', '..kttttttk..', '.ktrttbttk..', '.kttttttttk.', '.ktgttkkttk.', '.ktttk..ttk.', '.ktyttkkttk.', '..kttttttk..', '...kkkkkk...', '............', '............'] },
    { id: 'bulb', name: L('Bombilla', 'Light bulb'), req: L('Guarda 3 ideas para crear', 'Save 3 creative ideas'), ok: c => c.ideasSaved >= 3,
      p: { k: K, w: W, y: '#ffe066', s: '#c3cad8' },
      r: ['....kkkk....', '...kyyyyk...', '..kywyyyyk..', '..kwyyyyyk..', '..kyyyyyyk..', '..kyyyyyyk..', '...kyyyyk...', '....kyyk....', '....kssk....', '....kkkk....', '....kssk....', '.....kk.....'] },
    { id: 'cloud', name: L('Nube', 'Cloud'), req: L('Guarda 3 frases de Art Unblock', 'Save 3 Art Unblock prompts'), ok: c => c.unblockSaved >= 3,
      p: { k: K, w: W, b: '#bfe3ff' },
      r: ['............', '............', '....kkk.....', '...kwwwk....', '.kkkwwwwkk..', 'kwwwwwwwwwk.', 'kwwwwwwwwwwk', 'kbwwwwwwwwbk', 'kbbbbbbbbbbk', '.kkkkkkkkkk.', '............', '............'] },
    { id: 'stopwatch', name: L('Cronómetro', 'Stopwatch'), req: L('Haz 3 sesiones de gesture drawing', 'Do 3 gesture drawing sessions'), ok: c => c.u('/gesture') >= 3,
      p: { k: K, w: W, r: '#ff4d5e' },
      r: ['....kkkk....', '.....kk.....', '...kkkkkk...', '..kwwwwwwk..', '.kwwwkwwwwk.', '.kwwwkwwwwk.', '.kwwwkrrwwk.', '.kwwwwwwwwk.', '.kwwwwwwwwk.', '..kwwwwwwk..', '...kkkkkk...', '............'] },
    { id: 'camera', name: L('Cámara', 'Camera'), req: L('Edita imágenes 5 veces (convertir, comprimir o quitar fondo)', 'Edit images 5 times (convert, compress or remove background)'), ok: c => c.u('/convertir') + c.u('/comprimir') + c.u('/quitar-fondo') >= 5,
      p: { k: K, w: W, s: '#c3cad8', b: '#3ee6ff' },
      r: ['............', '....kkk.....', '.kkkkkkkkkk.', 'kssssssssssk', 'ksssskkssssk', 'ksskbbbbkssk', 'ksskbwbbkssk', 'ksskbbbbkssk', 'ksssskkssssk', 'kssssssssssk', '.kkkkkkkkkk.', '............'] },
    { id: 'shield', name: L('Escudo', 'Shield'), req: L('Protege tus imágenes con marca de agua 3 veces', 'Protect your images with a watermark 3 times'), ok: c => c.u('/marca-agua') >= 3,
      p: { k: K, w: W, b: '#2f8cff' },
      r: ['.kkkkkkkkkk.', '.kbbbbwwwwk.', '.kbbbbwwwwk.', '.kbbbbwwwwk.', '.kwwwwbbbbk.', '.kwwwwbbbbk.', '..kwwwbbbk..', '..kwwwbbbk..', '...kwwbbk...', '....kwbk....', '.....kk.....', '............'] },
    { id: 'film', name: L('Película', 'Film'), req: L('Usa las herramientas de video 3 veces', 'Use the video tools 3 times'), ok: c => c.u('/descargar-video') + c.u('/subtitulos') + c.u('/pinterest-instagram') >= 3,
      p: { k: K, w: W, s: '#c3cad8' },
      r: ['............', 'kkkkkkkkkkkk', 'kwkwkwkwkwkk', 'kkkkkkkkkkkk', 'kssssssssssk', 'kssskksssssk', 'kssskkkssssk', 'kssskksssssk', 'kssssssssssk', 'kkkkkkkkkkkk', 'kwkwkwkwkwkk', 'kkkkkkkkkkkk'] },
    { id: 'pdf', name: L('Hoja PDF', 'PDF page'), req: L('Une o edita PDFs 3 veces', 'Merge or edit PDFs 3 times'), ok: c => c.u('/unir-pdf') + c.u('/editar-pdf') >= 3,
      p: { k: K, w: W, r: '#ff4d5e' },
      r: ['..kkkkkk....', '..kwwwwkk...', '..kwwwwkwk..', '..kwwwwkkkk.', '..kwwwwwwwk.', '.krrrrrrrrk.', '.krwrwrwrrk.', '.krrrrrrrrk.', '..kwwwwwwwk.', '..kwkkkkwwk.', '..kwwwwwwwk.', '..kkkkkkkkk.'] },
    { id: 'qr', name: L('Código QR', 'QR code'), req: L('Crea 3 códigos QR', 'Make 3 QR codes'), ok: c => c.u('/qr') >= 3,
      p: { k: K, w: W },
      r: ['............', '.kkkk..kkkk.', '.kwwk..kwwk.', '.kwwk..kwwk.', '.kkkk.kkkkk.', '......k.k...', '.k.kk.kk.kk.', '.kkkk..k.k..', '.kwwk.kk..k.', '.kwwk..kk.k.', '.kkkk.k.kk..', '............'] },
    { id: 'magnifier', name: L('Lupa', 'Magnifier'), req: L('Busca atajos 5 veces', 'Search shortcuts 5 times'), ok: c => c.u('/atajos') >= 5,
      p: { k: K, w: W, b: '#9ee7ff', t: '#a0663a' },
      r: ['............', '...kkkk.....', '..kbbbbk....', '.kbwbbbbk...', '.kbbbbbbk...', '.kbbbbbbk...', '..kbbbbk....', '...kkkkkk...', '.......ktk..', '........ktk.', '.........kk.', '............'] },
    { id: 'piggy', name: L('Cerdito', 'Piggy bank'), req: L('Crea un plan de ahorro', 'Create a savings plan'), ok: c => c.savingsN >= 1,
      p: { k: K, p: '#ff8fb1', d: '#e0607e' },
      r: ['............', '....kkkk....', '..kkppppkk..', '.kppppppppk.', 'kppkppppppk.', 'kppppppppddk', 'kppppppppddk', '.kppppppppk.', '..kpkkkkpk..', '..kk....kk..', '............', '............'] },
    { id: 'calculator', name: L('Calculadora', 'Calculator'), req: L('Calcula 3 comisiones', 'Calculate 3 commissions'), ok: c => c.u('/comision') >= 3,
      p: { k: K, w: W, s: '#c3cad8', g: '#9be7a0' },
      r: ['..kkkkkkkk..', '..kssssssk..', '..kggggggk..', '..kssssssk..', '..kwswswsk..', '..kssssssk..', '..kwswswsk..', '..kssssssk..', '..kwswswsk..', '..kssssssk..', '..kkkkkkkk..', '............'] },
    { id: 'dice', name: L('Dado', 'Die'), req: L('Juega 5 veces a los minijuegos', 'Play the minigames 5 times'), ok: c => c.u('/juegos') >= 5,
      p: { k: K, w: W },
      r: ['............', '.kkkkkkkkkk.', '.kwwwwwwwwk.', '.kwkkwwwwwk.', '.kwkkwwwwwk.', '.kwwwkkwwwk.', '.kwwwkkwwwk.', '.kwwwwwkkwk.', '.kwwwwwkkwk.', '.kwwwwwwwwk.', '.kkkkkkkkkk.', '............'] },
    { id: 'joystick', name: 'Joystick', req: L('Saca 8/10 en el quiz', 'Score 8/10 in the quiz'), ok: c => c.quizBest >= 8,
      p: { k: K, r: '#ff4d5e', d: '#3a3550' },
      r: ['....kkk.....', '...krrrk....', '...krrrk....', '....kkk.....', '.....k......', '.....k......', '..kkkkkkkk..', '.kddddddrdk.', 'kddddddddddk', 'kddddddddddk', '.kkkkkkkkkk.', '............'] },
    { id: 'globe', name: L('Globo terráqueo', 'Globe'), req: L('Saca 8/10 en el quiz de países', 'Score 8/10 in the country quiz'), ok: c => c.countriesBest >= 8,
      p: { k: K, b: '#2f8cff', g: '#2ec27e' },
      r: ['............', '...kkkkkk...', '..kbbggbbk..', '.kbggggbbbk.', '.kbbgggbbbk.', '.kbbbgbbggk.', '.kbbbbbgggk.', '.kbbbbbbggk.', '..kbbbbbbk..', '...kkkkkk...', '............', '............'] },
    // ----- hitos generales -----
    { id: 'heart', name: L('Corazón', 'Heart'), req: L('Estudia 10 días', 'Study on 10 days'), ok: c => c.studyDays >= 10,
      p: { k: K, w: W, r: '#ff5f9e' },
      r: ['............', '.kkkk..kkkk.', 'krrrrkkrrrrk', 'krwrrrrrrrrk', 'krrrrrrrrrrk', 'krrrrrrrrrrk', '.krrrrrrrrk.', '..krrrrrrk..', '...krrrrk...', '....krrk....', '.....kk.....', '............'] },
    { id: 'map', name: L('Mapa', 'Map'), req: L('Prueba 20 herramientas distintas', 'Try 20 different tools'), ok: c => c.distinct >= 20,
      p: { k: K, t: '#f4d9a8', r: '#ff4d5e', b: '#2f8cff' },
      r: ['............', '.kkkkkkkkkk.', '.kttttttttk.', '.ktbbtttttk.', '.ktbttttrtk.', '.kttbttrrrk.', '.ktttbttrtk.', '.kttttbbttk.', '.kttttttbtk.', '.kttttttttk.', '.kkkkkkkkkk.', '............'] },
    { id: 'backpack', name: L('Mochila', 'Backpack'), req: L('Usa herramientas 100 veces', 'Use tools 100 times'), ok: c => c.total >= 100,
      p: { k: K, g: '#2ec27e', d: '#1f8f5a', y: '#ffd400' },
      r: ['....kkkk....', '...k....k...', '..kkkkkkkk..', '.kggggggggk.', '.kggggggggk.', '.kddddddddk.', '.kgkkkkkkgk.', '.kgkggggkgk.', '.kgkgyygkgk.', '.kgkkkkkkgk.', '.kkkkkkkkkk.', '............'] },
    { id: 'rocket', name: L('Cohete', 'Rocket'), req: L('Usa herramientas 250 veces', 'Use tools 250 times'), ok: c => c.total >= 250,
      p: { k: K, w: W, r: '#ff4d5e', b: '#3ee6ff', o: '#ff7b00' },
      r: ['.....kk.....', '....krrk....', '...kwwwwk...', '...kwbbwk...', '...kwbbwk...', '...kwwwwk...', '..kkwwwwkk..', '.krkwwwwkrk.', '.krkkkkkkrk.', '.kk.kook.kk.', '.....oo.....', '.....kk.....'] },
    { id: 'sun', name: L('Sol', 'Sun'), req: L('Racha de 14 días', '14-day streak'), ok: c => c.streak >= 14,
      p: { k: K, y: '#ffd400', o: '#ff7b00' },
      r: ['.....o......', '.o...o...o..', '..o.kkkk.o..', '...kyyyyk...', '..kyyyyyyk..', 'ookyyyyyykoo', '..kyyyyyyk..', '...kyyyyk...', '..o.kkkk.o..', '.o...o...o..', '.....o......', '............'] },
    { id: 'rainbow', name: L('Arcoíris', 'Rainbow'), req: L('Racha de 30 días', '30-day streak'), ok: c => c.streak >= 30,
      p: { w: W, r: '#ff4d5e', o: '#ff7b00', y: '#ffd400', g: '#2ec27e', b: '#2f8cff' },
      r: ['............', '............', '...rrrrrr...', '..roooooor..', '.royyyyyyor.', 'roygbbbbgyor', 'roygb..bgyor', 'roygb..bgyor', 'wwwgb..bgwww', 'wwww....wwww', '............', '............'] },
    { id: 'moon', name: L('Luna', 'Moon'), req: L('Abre BrainDeck 30 días distintos', 'Open BrainDeck on 30 different days'), ok: c => c.daysActive >= 30,
      p: { k: K, y: '#ffe066' },
      r: ['............', '....kkkk....', '..kkyyk.....', '.kyyyk......', '.kyyk.......', 'kyyyk.......', 'kyyyk.......', 'kyyyyk......', '.kyyyykkkk..', '.kkyyyyyyk..', '...kkkkkk...', '............'] },
    { id: 'diamond', name: L('Diamante', 'Diamond'), req: L('Llega al nivel 15', 'Reach level 15'), ok: c => c.level >= 15,
      p: { k: K, w: W, b: '#9ee7ff', d: '#3ec4ff' },
      r: ['............', '............', '...kkkkkk...', '..kwbbbbdk..', '.kwbbbbbddk.', 'kkkkkkkkkkkk', '.kbbbbbbddk.', '..kbbbbddk..', '...kbbddk...', '....kbdk....', '.....kk.....', '............'] },
    { id: 'key', name: L('Llave', 'Key'), req: L('Consigue 10 items', 'Collect 10 items'), ok: c => c.itemsGot >= 10,
      p: { k: K, y: '#ffd400' },
      r: ['............', '..kkkk......', '.kyyyyk.....', 'kyykkyyk....', 'kyk..kykkkkk', 'kyk..kyyyyyk', 'kyykkyykkkyk', '.kyyyyk..kyk', '..kkkk...kk.', '............', '............', '............'] },
    { id: 'chest', name: L('Cofre', 'Chest'), req: L('Consigue 25 items', 'Collect 25 items'), ok: c => c.itemsGot >= 25,
      p: { k: K, t: '#a0663a', d: '#7a4a2a', y: '#ffd400' },
      r: ['............', '..kkkkkkkk..', '.kttttttttk.', 'kttttttttttk', 'kddddddddddk', 'kkkkkyykkkkk', 'ktttkyyktttk', 'kttttkkttttk', 'kttttttttttk', 'kddddddddddk', 'kkkkkkkkkkkk', '............'] },
  ];
  BD.items = ITEMS; // para las pruebas y la guía
  const HEART = ['.kk.kk.', 'kppkppk', 'kpppppk', '.kpppk.', '..kpk..', '...k...'];
  const heart = on => BD.pixel(HEART, { k: 'var(--heart-line)', p: on ? '#ff5f9e' : 'var(--heart-empty)' }, 'px heart');

  // ---------- números del dashboard ----------
  function numbers() {
    const s = BD.stats(), pr = BD.progress ? BD.progress.load() : { results: [], mistakes: [] };
    const sum = BD.progress ? BD.progress.summary() : { streak: 0, todayDone: 0, todayTotal: 0, next: null, due: 0 };
    const plans = store.get('plans', []), sessions = plans.flatMap(p => p.sessions || []);
    const done = sessions.filter(x => x.done);
    const study = new Set([...Object.keys(s.sdays), ...pr.results.map(r => r.date), ...done.map(x => x.doneOn || x.date)]);
    const chal = store.get('challenges', []);
    const cat = {};
    Object.entries(s.uses).forEach(([p, n]) => { const t = BD.tools.find(x => x.path === p); const c = t ? (t.cat || 'extra') : 'extra'; cat[c] = (cat[c] || 0) + n; });
    const total = Object.values(s.uses).reduce((a, b) => a + b, 0);
    const c = {
      s, sum, total, cat, distinct: Object.keys(s.uses).length, study,
      studyDays: study.size, daysActive: Object.keys(s.days).length, streak: sum.streak,
      tests: pr.results.length, plansDone: done.length, qnotes: store.get('qnotes', []).length,
      radioPlays: s.radio.plays || 0, radioMin: s.radio.min || 0,
      retoDays: chal.reduce((a, ch) => a + (ch.done || []).length, 0), retoDone: chal.filter(ch => ch.prompts && ch.done && ch.done.length >= ch.prompts.length).length,
      decisions: store.get('decisions', []).length,
      // contadores para los items de cada herramienta
      u: p => s.uses[p] || 0, notesN: arr('notes'), pal: arr('pal:saved'), ideasSaved: arr('ideas:saved'), unblockSaved: arr('unblock:saved'),
      speakN: arr('speak:history'), savingsN: arr('savings:plans'), plansN: plans.length,
      planComplete: plans.filter(p => (p.sessions || []).length && p.sessions.every(x => x.done)).length,
      quizBest: store.get('games:quizBest', 0), countriesBest: store.get('games:countriesBest', 0), itemsGot: (s.items || []).length,
    };
    c.xp = Math.round(total * 2 + c.studyDays * 10 + c.plansDone * 5 + c.tests * 8 + c.retoDays * 5 + c.qnotes * 2 + c.radioMin / 2 + c.decisions * 2);
    // nivel n necesita 60·n XP más que el anterior
    let level = 1, need = 60, rest = c.xp;
    while (rest >= need) { rest -= need; level++; need = 60 * level; }
    Object.assign(c, { level, lvXp: rest, lvNeed: need });
    return c;
  }

  // Nivel y XP para otras herramientas (el Tracker los muestra: cada sesión hecha suma XP aquí)
  BD.level = () => { const c = numbers(); return { level: c.level, xp: c.lvXp, need: c.lvNeed }; };

  // Data que guarda cada herramienta (además de cuántas veces la abriste)
  const n = (x, one, many) => `${x} ${x === 1 ? one : many}`;
  const arr = k => (store.get(k, []) || []).length;
  const DATA = {
    '/notas': () => n(arr('notes'), L('nota', 'note'), L('notas', 'notes')),
    '/plan': () => { const p = store.get('plans', []), s = p.flatMap(x => x.sessions || []); return `${n(p.length, L('plan', 'plan'), L('planes', 'plans'))} · ${s.filter(x => x.done).length}/${s.length} ${L('sesiones', 'sessions')}`; },
    '/tracker': () => { const s = store.get('plans', []).flatMap(x => x.sessions || []); return s.length ? `${Math.round(s.filter(x => x.done).length / s.length * 100)}% ${L('del plan completado', 'of plan done')}` : L('Sin planes aún', 'No plans yet'); },
    '/test': () => { const pr = BD.progress.load(); return `${n(arr('decks'), 'test', 'tests')} · ${pr.results.length} ${L('hechos', 'done')} · ${pr.mistakes.length} ${L('en repaso', 'in review')}`; },
    '/reto': () => { const c = store.get('challenges', []); return `${n(c.length, L('reto', 'challenge'), L('retos', 'challenges'))} · ${c.reduce((a, x) => a + (x.done || []).length, 0)} ${L('días hechos', 'days done')}`; },
    '/ingles': () => n(arr('speak:history'), L('grabación', 'recording'), L('grabaciones', 'recordings')),
    '/notas-rapidas': () => n(arr('qnotes'), L('nota', 'note'), L('notas', 'notes')),
    '/radio': () => { const r = BD.stats().radio; return `${n(r.plays || 0, L('reproducción', 'play'), L('reproducciones', 'plays'))} · ${r.min || 0} min`; },
    '/ideas': () => n(arr('ideas:saved'), L('idea guardada', 'saved idea'), L('ideas guardadas', 'saved ideas')),
    '/art-unblock': () => n(arr('unblock:saved'), L('frase guardada', 'saved prompt'), L('frases guardadas', 'saved prompts')),
    '/paletas': () => n(arr('pal:saved'), L('paleta', 'palette'), L('paletas', 'palettes')),
    '/marca-agua': () => n(arr('wm:saved'), L('marca guardada', 'saved watermark'), L('marcas guardadas', 'saved watermarks')),
    '/ahorro': () => n(arr('savings:plans'), L('plan de ahorro', 'savings plan'), L('planes de ahorro', 'savings plans')),
    '/comision': () => store.get('commission:last', null) ? L('Último cálculo guardado', 'Last calculation saved') : L('Sin cálculos aún', 'No calculations yet'),
    '/decisiones': () => n(arr('decisions'), L('decisión', 'decision'), L('decisiones', 'decisions')),
    '/comprimir': () => { const s = store.get('compress:saved', 0); return s ? L(`${BD.fmtBytes(s)} ahorrados`, `${BD.fmtBytes(s)} saved`) : L('Sin compresiones aún', 'No compressions yet'); },
    '/atajos': () => n(arr('shortcuts:fav'), L('atajo favorito', 'favorite shortcut'), L('atajos favoritos', 'favorite shortcuts')),
    '/juegos': () => `${L('Quiz', 'Quiz')} ${store.get('games:quizBest', 0)}/10 · ${L('Países', 'Countries')} ${store.get('games:countriesBest', 0)}/10 · ${arr('games:endings')} ${L('finales', 'endings')}`,
  };
  const ago = ms => {
    if (!ms) return L('nunca', 'never');
    const d = Math.floor((Date.now() - ms) / 864e5);
    return d <= 0 ? L('hoy', 'today') : d === 1 ? L('ayer', 'yesterday') : L(`hace ${d} días`, `${d} days ago`);
  };

  // ---------- avatar y ocupaciones ----------
  const avatarId = () => { const id = (store.get('profile', {}) || {}).avatar; return BD.AVATARS[id] ? id : 'cat'; };
  const avatarSvg = () => BD.AVATARS[avatarId()].svg;
  // Ocupación según la herramienta que más usas (nombres que sirven para cualquier persona)
  const JOBS = {
    '/notas': () => L('Archivista', 'Archivist'), '/plan': () => L('Estratega', 'Strategist'), '/tracker': () => L('Cronista', 'Chronicler'),'/test': () => L('Estudiante', 'Scholar'),
    '/reto': () => L('Atleta de retos', 'Challenge athlete'), '/ingles': () => L('Políglota', 'Polyglot'), '/notas-rapidas': () => L('Escriba', 'Scribe'),
    '/radio': () => 'DJ', '/foco': () => L('Mente zen', 'Zen mind'), '/ideas': () => L('Artista', 'Artist'), '/art-unblock': () => L('Surrealista', 'Surrealist'),
    '/paletas': () => L('Colorista', 'Colorist'), '/gesture': () => L('Dibujante', 'Sketch artist'), '/marca-agua': () => L('Centinela', 'Sentinel'),
    '/quitar-fondo': () => L('Ilusionista', 'Illusionist'), '/convertir': () => L('Alquimista', 'Alchemist'), '/descargar-video': () => L('Videasta', 'Videographer'), '/pinterest-instagram': () => L('Curador', 'Curator'),
    '/subtitulos': () => L('Intérprete', 'Interpreter'), '/editar-pdf': () => L('Copista', 'Copyist'), '/unir-pdf': () => L('Coleccionista de páginas', 'Page collector'),
    '/qr': () => 'Hacker', '/comision': () => L('Comerciante', 'Merchant'), '/ahorro': () => L('Economista', 'Economist'),
    '/decisiones': () => L('Analista', 'Analyst'), '/juegos': () => 'Gamer',
    '/comprimir': () => L('Minimalista', 'Minimalist'), '/atajos': () => L('Ninja del teclado', 'Keyboard ninja'),
  };

  // ---------- stats: [sigla, nombre, qué cuenta, valor, puntos por bloque] (la guía usa la misma lista) ----------
  const STATS = c => [
    ['FOC', L('Enfoque', 'Focus'), L('Cada vez que abres una herramienta de estudio, más 2 por cada día que estudias', 'Each time you open a study tool, plus 2 for every day you study'), (c.cat.estudio || 0) + c.studyDays * 2, 5],
    ['INT', L('Intelecto', 'Intellect'), L('Tests terminados en Libro → test', 'Tests finished in Book → test'), c.tests, 2],
    ['DIS', L('Disciplina', 'Discipline'), L('Sesiones de tus planes de estudio marcadas como hechas', 'Study plan sessions marked as done'), c.plansDone, 3],
    ['MEM', L('Memoria', 'Memory'), L('Notas guardadas: notas rápidas más notas desde capturas', 'Saved notes: quick notes plus notes from screenshots'), c.qnotes + c.notesN, 5],
    ['ART', L('Arte', 'Art'), L('Usos de herramientas de imágenes y arte', 'Uses of image and art tools'), c.cat.creativo || 0, 4],
    ['UTL', L('Utilidades', 'Utilities'), L('Usos de utilidades: PDF, video, QR, atajos…', 'Uses of utilities: PDF, video, QR, shortcuts…'), c.cat.media || 0, 4],
    [L('ORO', 'GLD'), L('Dinero', 'Money'), L('Usos de la calculadora de comisión y el plan de ahorro', 'Uses of the commission calculator and savings plan'), c.cat.dinero || 0, 3],
    ['ZEN', L('Calma', 'Calm'), L('Minutos escuchando la radio para estudiar', 'Minutes listening to the study radio'), c.radioMin, 30],
    [L('CON', 'CST'), L('Constancia', 'Consistency'), L('Días distintos en los que abriste BrainDeck', 'Different days you opened BrainDeck'), c.daysActive, 3],
  ];

  // ---------- piezas ----------
  // help: ruta de la guía que abre el botón «?» de la ventana
  const dw = (cls, title, body, extra = '', help = '') => `
    <section class="dw ${cls}" ${extra}>
      <div class="dw-bar"><span>${title}</span>${help ? `<a class="dw-help" href="#/guia?s=${help}" title="${L('¿Qué significa?', 'What does it mean?')}" aria-label="${L('Ayuda: qué significa cada cosa', 'Help: what each thing means')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 9a3 3 0 1 1 4.2 2.75c-.75.33-1.2 1.07-1.2 1.9V14M12 18h.01"/></svg></a>` : ''}<i class="dw-dots" aria-hidden="true"><b></b><b></b></i></div>
      <div class="dw-body">${body}</div>
    </section>`;
  const slot = (it, got, fresh) => got.has(it.id)
    ? `<div class="bag-slot on ${fresh.includes(it) ? 'new' : ''}" data-tip="${esc(it.name)} — ${esc(it.req)}">${BD.pixel(it.r, it.p)}</div>`
    : `<div class="bag-slot" data-tip="??? — ${esc(it.req)}">${BD.pixel(it.r, Object.fromEntries(Object.keys(it.p).map(k => [k, 'var(--lock)'])))}<em>?</em></div>`;
  const PER_PAGE = 16;
  const blocks = (v, step) => { const f = Math.min(10, Math.ceil(v / step)); return `<span class="seg10">${Array.from({ length: 10 }, (_, i) => `<i class="${i < f ? 'on' : ''}"></i>`).join('')}</span>`; };
  // planes "sin horas fijas": solo el día (y la duración), nunca una hora
  const fmtNext = nx => nx ? new Date(nx.date + 'T12:00').toLocaleDateString(BD.locale(), { weekday: 'short', day: 'numeric' }) + ' · ' +
    (nx.flex ? `≈${nx.end - nx.start} min` : String(Math.floor(nx.start / 60)).padStart(2, '0') + ':' + String(nx.start % 60).padStart(2, '0')) : '—';

  // study = días con estudio (herramientas de estudio abiertas, sesiones del plan hechas o tests): los mismos que usa el Tracker
  function heatmap(s, study) {
    // columnas = semanas (lunes arriba); termina en la semana actual
    const weeks = 18, end = new Date(), start = new Date(end);
    start.setDate(end.getDate() - (end.getDay() + 6) % 7 - (weeks - 1) * 7);
    let out = '';
    for (let d = new Date(start), i = 0; i < weeks * 7; i++, d.setDate(d.getDate() + 1)) {
      const k = BD.today(d), v = (s.days[k] || 0) + (study.has(k) ? 2 : 0);
      const l = d > end ? -1 : !v ? 0 : v < 3 ? 1 : v < 6 ? 2 : v < 10 ? 3 : 4;
      out += l < 0 ? '<i style="visibility:hidden"></i>' : `<i data-l="${l}" title="${k}: ${s.days[k] || 0}"></i>`;
    }
    return `<div class="heat dash-heat">${out}</div>`;
  }

  function appGrid(main, extra) {
    const app = t => `
      <a class="dev-app" href="${t.external || '#' + t.path}" ${t.external ? `target="_blank" rel="noopener" data-track="${t.path}"` : ''} ${t.radio ? 'data-radio' : ''} title="${esc(t.title)}">
        ${BD.hasAppIcon(t.path) ? BD.appIcon(t.path) : `<span class="app-ic" style="--tile:${t.colors[0]}">${t.icon}</span>`}
        <span class="dev-label">${esc(t.short || t.title)}</span></a>`;
    return main.map(app).join('') + extra.map(app).join('');
  }

  // ---------- Guía: qué significa cada stat, recompensa e item (botón «?» de STATS e ITEM BAG) ----------
  BD.route('/guia', {
    title: 'Guía',
    render(view) {
      const c = numbers(), got = new Set(c.s.items || []);
      const body = BD.win(view, { title: L('Guía de stats e items', 'Stats & items guide'), sub: L('Qué significa cada cosa del inicio y cómo se consigue. Nada se pierde: lo que ganas es tuyo aunque cortes la racha.', 'What everything on the home screen means and how to get it. Nothing is lost: what you earn stays yours even if you break your streak.') });
      const XP = [
        [L('Abrir una herramienta', 'Opening a tool'), '+2'], [L('Cada día con estudio', 'Each day you study'), '+10'],
        [L('Terminar un test', 'Finishing a test'), '+8'], [L('Sesión de plan hecha', 'Plan session done'), '+5'],
        [L('Día de reto cumplido', 'Challenge day done'), '+5'], [L('Nota rápida', 'Quick note'), '+2'],
        [L('Decisión guardada', 'Saved decision'), '+2'], [L('Cada 2 min de radio', 'Every 2 min of radio'), '+1'],
      ];
      body.innerHTML = `<div class="guide">
        <nav class="guide-nav" aria-label="${L('Secciones', 'Sections')}">
          <a href="#/guia?s=stats">Stats</a><a href="#/guia?s=rewards">${L('Recompensas', 'Rewards')}</a><a href="#/guia?s=items">Items · ${got.size}/${ITEMS.length}</a>
        </nav>

        <section class="guide-sec" id="g-stats">
          <h3>Stats</h3>
          <p class="muted">${L('Cada barra tiene 10 bloques. Se llena un bloque cada cierto número de puntos; el número de la derecha es tu valor real.', 'Each bar has 10 blocks. One block fills every few points; the number on the right is your real value.')}</p>
          <div class="guide-list">${STATS(c).map(([k, name, what, v, st]) => `
            <div class="guide-row">
              <b class="guide-abbr">${k}</b>
              <div class="guide-txt"><b>${esc(name)}</b><span>${esc(what)}</span><small>${L(`1 bloque = ${st} puntos`, `1 block = ${st} points`)}</small></div>
              <span class="guide-val">${v}</span>
            </div>`).join('')}</div>
        </section>

        <section class="guide-sec" id="g-rewards">
          <h3>${L('Recompensas', 'Rewards')}</h3>
          <div class="guide-cards">
            <div class="guide-card"><h4>XP ${L('y nivel', '& level')}</h4>
              <p>${L(`Ganas XP al usar BrainDeck. Subir del nivel n al siguiente cuesta 60 × n XP. Ahora: <b>nivel ${c.level}</b>, ${c.lvXp}/${c.lvNeed} XP.`, `You earn XP by using BrainDeck. Going from level n to the next costs 60 × n XP. Now: <b>level ${c.level}</b>, ${c.lvXp}/${c.lvNeed} XP.`)}</p>
              <ul class="guide-xp">${XP.map(([a, b]) => `<li><span>${a}</span><b>${b}</b></li>`).join('')}</ul></div>
            <div class="guide-card"><h4>${L('Racha (corazones)', 'Streak (hearts)')}</h4>
              <p>${L('Días seguidos con estudio. Cada día llena un corazón, hasta 10. Si un día no estudias la racha vuelve a empezar, pero tu XP, nivel e items se quedan.', 'Days in a row with study. Each day fills a heart, up to 10. If you skip a day the streak restarts, but your XP, level and items stay.')} ${L('Ahora', 'Now')}: <b>${c.streak}</b>.</p></div>
            <div class="guide-card"><h4>${L('Ocupaciones', 'Occupations')}</h4>
              <p>${L('Tus 3 herramientas más usadas te dan un título (Escriba, Estratega, DJ…). Su nivel sube con la raíz de tus usos: 1, 4, 9, 16… usos.', 'Your 3 most used tools give you a title (Scribe, Strategist, DJ…). Their level grows with the square root of your uses: 1, 4, 9, 16… uses.')}</p></div>
            <div class="guide-card"><h4>Items</h4>
              <p>${L(`Hay ${ITEMS.length}. Se desbloquean solos al cumplir su condición y se guardan para siempre. Los bloqueados se ven en gris con «?».`, `There are ${ITEMS.length}. They unlock by themselves when you meet their condition and are kept forever. Locked ones show in grey with "?".`)}</p></div>
          </div>
        </section>

        <section class="guide-sec" id="g-items">
          <h3>Items <small class="muted">${got.size}/${ITEMS.length}</small></h3>
          <div class="guide-items">${ITEMS.map(it => {
            const on = got.has(it.id);
            return `<div class="guide-item ${on ? 'on' : ''}">
              <span class="guide-px">${BD.pixel(it.r, on ? it.p : Object.fromEntries(Object.keys(it.p).map(k => [k, 'var(--lock)'])))}</span>
              <span class="guide-txt"><b>${on ? esc(it.name) : '???'}</b><span>${esc(it.req)}</span><small>${on ? L('Conseguido ✓', 'Unlocked ✓') : L('Bloqueado', 'Locked')}</small></span>
            </div>`;
          }).join('')}</div>
        </section>
      </div>`;
      const sec = (location.hash.match(/[?&]s=(\w+)/) || [])[1];
      const target = sec && body.querySelector('#g-' + sec);
      if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    },
  });

  BD.route('/', {
    title: '',
    render(view) {
      const c = numbers(), s = c.s, set = BD.settings();
      // items nuevos → se guardan para siempre (aunque luego pierdas la racha)
      const got = new Set(s.items || []), fresh = ITEMS.filter(it => !got.has(it.id) && it.ok(c));
      if (fresh.length) { fresh.forEach(it => got.add(it.id)); s.items = [...got]; store.set('stats', s); setTimeout(() => toast(L('¡Nuevo item: ', 'New item: ') + fresh.map(i => i.name).join(', ') + '! 🎁'), 500); }

      const lay = BD.layout(), main = lay.flatMap(x => x.tools), extra = BD.tools.filter(t => !t.hidden && t.group === 'extra');
      const top = Object.entries(s.uses).map(([p, v]) => [BD.tools.find(t => t.path === p), v]).filter(([t]) => t).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const maxTop = top.length ? top[0][1] : 1;
      const jobs = top.slice(0, 3);
      const hearts = Array.from({ length: 10 }, (_, i) => heart(i < Math.min(10, c.streak))).join('');
      const name = (set.author || '').trim();

      view.innerHTML = `
        <section class="dash">
          <div class="dash-head">
            <span class="dash-lv">LV.${c.level}</span>
            <span class="dash-title">BRAINDECK.EXE</span>
            <span class="spacer"></span>
            <span class="dash-install-w">
              <button type="button" class="dash-date dash-install hidden" id="dashInstall" aria-haspopup="dialog" aria-expanded="false" title="${L('Instalar BrainDeck como app', 'Install BrainDeck as an app')}" aria-label="${L('Instalar app', 'Install app')}">${BD.icon('download')}<span>${L('Instalar app', 'Install app')}</span></button>
              <div class="dash-install-pop hidden" id="dashInstallPop" role="dialog" aria-label="${L('Cómo instalar BrainDeck', 'How to install BrainDeck')}"></div>
            </span>
            <span class="dash-date" id="dashClock"></span>
          </div>
          <div class="dash-cat-wrap">${BD.CAT || ''}</div>
          <div class="dash-grid">
            ${dw('dw-me', 'ME.EXE', `
              <div class="me">
                <button class="me-av" id="meAv" title="${L('Cambiar avatar', 'Change avatar')}" aria-label="${L('Cambiar avatar', 'Change avatar')}">${avatarSvg()}</button>
                <div class="me-info">
                  <div class="bubble-say">${L('¡Hola', 'Hi')}${name ? ', ' + esc(name) : ''}! ${c.total ? L('¿Qué creamos hoy?', 'What are we making today?') : L('Bienvenido a BrainDeck', 'Welcome to BrainDeck')}</div>
                  <div class="me-lv"><b>LV ${c.level}</b><span class="muted small">${c.lvXp}/${c.lvNeed} XP</span></div>
                  <div class="xp"><i style="width:${Math.round(c.lvXp / c.lvNeed * 100)}%"></i></div>
                  <div class="me-hearts" title="${L('Racha', 'Streak')}: ${c.streak}">${hearts}</div>
                </div>
              </div>
              <div class="av-pick hidden" id="avPick">${Object.entries(BD.AVATARS).map(([id, a]) => `
                <button class="${id === avatarId() ? 'on' : ''}" data-av="${id}" title="${esc(a.name)}" aria-label="${esc(a.name)}">${a.svg}</button>`).join('')}</div>
              <div class="jobs">
                <div class="jobs-h">${L('Ocupaciones', 'Occupations')}</div>
                ${jobs.length ? `<div class="jobs-list">${jobs.map(([t, v], i) => `
                  <a class="job ${i ? '' : 'main'}" href="${t.external || '#' + t.path}" ${t.radio ? 'data-radio' : ''} ${t.external ? `target="_blank" rel="noopener" data-track="${t.path}"` : ''} title="${esc(t.short || t.title)} · ${v} ${L('usos', 'uses')}">
                    ${BD.appIcon(t.path) || ''}<b>${esc(JOBS[t.path] ? JOBS[t.path]() : t.short || t.title)}</b><small>Lv${Math.floor(Math.sqrt(v)) + 1}</small></a>`).join('')}</div>`
                  : `<p class="muted small" style="margin:0">${L('Aún ninguna: usa herramientas y aquí aparecerá en qué te estás convirtiendo.', 'None yet: use tools and you\'ll see here what you\'re becoming.')}</p>`}
              </div>`)}
            ${dw('dw-stats', 'STATS', `
              <div class="rpg">
                ${STATS(c).map(([k, name, , v, st]) => `
                  <div class="rpg-row" data-tip="${esc(name)}: ${v}"><b>${k}</b>${blocks(v, st)}<span>${v}</span></div>`).join('')}
              </div>
              <p class="dash-tip">${BD.icon('download')}<span>${L('Tu progreso, nivel e items se guardan en este navegador. Puedes exportarlos e importarlos en',
                'Your progress, level and items are stored in this browser. You can export and import them in')} <a href="#/ajustes">${L('Ajustes', 'Settings')} →</a></span></p>`, '', 'stats')}
            ${dw('dw-data', 'DATA', `
              <div class="tiles">
                <div class="tile"><b>${c.streak}</b><span>${L('días de racha', 'day streak')}</span></div>
                <div class="tile"><b>${c.studyDays}</b><span>${L('días de estudio', 'study days')}</span></div>
                <a class="tile" href="#/plan"><b>${c.sum.todayDone}<small>/${c.sum.todayTotal}</small></b><span>${L('sesiones hoy', 'sessions today')}</span></a>
                <a class="tile" href="#/test/repaso"><b>${c.sum.due}</b><span>${L('repasos pendientes', 'reviews due')}</span></a>
                <a class="tile wide" href="#/plan"><b>${fmtNext(c.sum.next)}</b><span>${L('próxima sesión', 'next session')}</span></a>
                <div class="tile wide"><b>${c.total}</b><span>${L('usos en total', 'total uses')} · ${c.distinct} ${L('apps distintas', 'different apps')}</span></div>
              </div>`)}
            ${dw('dw-bag', `ITEM BAG <small>${got.size}/${ITEMS.length}</small>`, `
              <div class="bag-car">
                <button type="button" class="bag-arrow" id="bagPrev" aria-label="${L('Página anterior', 'Previous page')}">‹</button>
                <div class="bag-track" id="bagTrack" tabindex="0" aria-label="${L('Items, 16 por página', 'Items, 16 per page')}">${Array.from({ length: Math.ceil(ITEMS.length / PER_PAGE) }, (_, pg) => `
                  <div class="bag">${ITEMS.slice(pg * PER_PAGE, pg * PER_PAGE + PER_PAGE).map(it => slot(it, got, fresh)).join('')}</div>`).join('')}</div>
                <button type="button" class="bag-arrow" id="bagNext" aria-label="${L('Página siguiente', 'Next page')}">›</button>
              </div>
              <div class="bag-pages" id="bagPages" aria-hidden="true">${Array.from({ length: Math.ceil(ITEMS.length / PER_PAGE) }, (_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>`, '', 'items')}
            ${dw('dw-act', L('ACTIVIDAD', 'ACTIVITY'), `${heatmap(s, c.study)}
              <p class="muted small dash-note">${L('Cada cuadro es un día. Más color = más uso (estudiar cuenta doble).', 'Each square is a day. More color = more use (studying counts double).')}</p>`)}
            ${dw('dw-top', 'TOP APPS', top.length ? `<div class="top-apps">${top.map(([t, v]) => `
              <a class="top-row" href="${t.external || '#' + t.path}" ${t.radio ? 'data-radio' : ''} ${t.external ? `target="_blank" rel="noopener" data-track="${t.path}"` : ''}>${BD.appIcon(t.path, 'sm') || ''}<span class="t">${esc(t.short || t.title)}</span>
                <span class="top-bar"><i style="width:${Math.max(6, Math.round(v / maxTop * 100))}%"></i></span><b>${v}</b></a>`).join('')}</div>`
              : `<p class="muted small">${L('Abre cualquier herramienta y aparecerá aquí.', 'Open any tool and it will show up here.')}</p>`)}
            ${dw('dw-apps', L('DATA · HERRAMIENTAS', 'DATA · TOOLS'), `
              <div class="tool-data">${[...main, ...extra].map(t => `
                <a class="td-row" href="${t.external || '#' + t.path}" ${t.radio ? 'data-radio' : ''} ${t.external ? `target="_blank" rel="noopener" data-track="${t.path}"` : ''}>
                  ${BD.appIcon(t.path, 'sm') || ''}
                  <span class="t"><b>${esc(t.short || t.title)}</b><small>${DATA[t.path] ? esc(DATA[t.path]()) + ' · ' : ''}${L('abierta', 'opened')} ${ago(s.last[t.path])}</small></span>
                  <span class="td-n">${s.uses[t.path] || 0}<small>${L('usos', 'uses')}</small></span></a>`).join('')}</div>`)}
          </div>
        </section>

        <section class="device" aria-label="${L('Herramientas', 'Tools')}">
          <div class="dev-screen">
            <div class="dev-status"><span id="devTime"></span><b>BrainDeck OS</b><span class="dev-power"><span id="battPct"></span><span class="dev-batt" id="batt"><i style="width:100%"></i></span></span></div>
            <div class="dev-grid">${appGrid(main, extra)}</div>
            <div class="dev-dock">
              <a class="dev-app" href="#/herramientas">${BD.appIcon('/herramientas')}<span class="dev-label">${L('Todas', 'All')}</span></a>
              <a class="dev-app" href="#/ajustes">${BD.appIcon('/ajustes')}<span class="dev-label">${L('Ajustes', 'Settings')}</span></a>
            </div>
          </div>
        </section>`;

      const clock = () => {
        const d = new Date(), el = document.getElementById('dashClock'), t = document.getElementById('devTime');
        if (el) el.textContent = d.toLocaleDateString(BD.locale(), { weekday: 'long', day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString(BD.locale(), { hour: '2-digit', minute: '2-digit' });
        if (t) t.textContent = d.toLocaleTimeString(BD.locale(), { hour: '2-digit', minute: '2-digit' });
      };
      // clic en el avatar → elegir otro
      const pick = view.querySelector('#avPick'), av = view.querySelector('#meAv');
      av.onclick = () => pick.classList.toggle('hidden');
      pick.onclick = e => {
        const b = e.target.closest('[data-av]'); if (!b) return;
        store.set('profile', { ...(store.get('profile', {}) || {}), avatar: b.dataset.av });
        av.innerHTML = avatarSvg();
        pick.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
        pick.classList.add('hidden');
      };

      // ---------- carrusel de la bolsa: 16 items por página, flechas, deslizar en el móvil ----------
      const track = view.querySelector('#bagTrack'), prev = view.querySelector('#bagPrev'), next = view.querySelector('#bagNext');
      const dots = [...view.querySelectorAll('#bagPages i')];
      const page = () => Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      const syncBag = () => {
        const p = page();
        prev.disabled = p <= 0; next.disabled = p >= dots.length - 1;
        dots.forEach((d, i) => d.classList.toggle('on', i === p));
      };
      const goPage = (p, smooth = true) => track.scrollTo({ left: p * track.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
      prev.onclick = () => goPage(page() - 1);
      next.onclick = () => goPage(page() + 1);
      track.onkeydown = e => { if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); } if (e.key === 'ArrowLeft') { e.preventDefault(); prev.click(); } };
      track.addEventListener('scroll', syncBag, { passive: true });
      if (fresh.length) goPage(Math.floor(ITEMS.indexOf(fresh[0]) / PER_PAGE), false);
      syncBag();

      clock(); const id = setInterval(clock, 20000);

      // Batería real del dispositivo (Chrome/Edge). Un PC de escritorio informa 100 % enchufado;
      // si el navegador no da el dato (Firefox, Safari) también se muestra 100 %.
      let bat = null;
      const showBatt = () => {
        const pct = bat ? Math.round(bat.level * 100) : 100, charging = !bat || bat.charging;
        const t = document.getElementById('battPct'), b = document.getElementById('batt'); if (!t || !b) return;
        t.textContent = (charging && bat && pct < 100 ? '⚡' : '') + pct + '%';
        b.firstElementChild.style.width = pct + '%';
        b.classList.toggle('low', pct <= 20 && !charging);
        b.title = bat ? (charging ? L('Cargando', 'Charging') : L('Con batería', 'On battery')) : L('Sin datos de batería', 'No battery data');
      };
      // Mientras el navegador responde no se muestra nada (evita que una laptop parpadee en 100 %)
      if (navigator.getBattery) navigator.getBattery().then(b => {
        bat = b; showBatt();
        ['levelchange', 'chargingchange'].forEach(ev => b.addEventListener(ev, showBatt));
      }).catch(showBatt);
      else showBatt();

      // ---------- Instalar la app (PWA) ----------
      const inst = view.querySelector('#dashInstall'), pop = view.querySelector('#dashInstallPop');
      const installed = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
      const ua = navigator.userAgent, ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
      const safari = /Safari/.test(ua) && !/Chrome|CriOS|Edg|FxiOS|Firefox/.test(ua), firefox = /Firefox|FxiOS/.test(ua);
      // Instrucciones para los navegadores que no tienen botón de instalar automático
      function steps() {
        const li = s => `<li>${s}</li>`;
        if (ios) return [L('En iPhone/iPad, desde <b>Safari</b>:', 'On iPhone/iPad, in <b>Safari</b>:'), li(L('Toca <b>Compartir</b> (el cuadrado con la flecha).', 'Tap <b>Share</b> (the square with the arrow).')), li(L('Elige <b>Añadir a pantalla de inicio</b>.', 'Choose <b>Add to Home Screen</b>.'))];
        if (safari) return [L('En Safari para Mac:', 'In Safari on Mac:'), li(L('Menú <b>Archivo</b> → <b>Añadir al Dock</b>.', '<b>File</b> menu → <b>Add to Dock</b>.'))];
        if (firefox && /Android/.test(ua)) return [L('En Firefox para Android:', 'In Firefox for Android:'), li(L('Menú ⋮ → <b>Añadir a pantalla de inicio</b>.', 'Menu ⋮ → <b>Add to Home screen</b>.'))];
        if (firefox) return [L('Firefox de escritorio no instala apps web. Ábrela en <b>Chrome</b> o <b>Edge</b> y pulsa este botón allí.', 'Desktop Firefox can\'t install web apps. Open it in <b>Chrome</b> or <b>Edge</b> and press this button there.')];
        return [L('En Chrome o Edge:', 'In Chrome or Edge:'), li(L('Pulsa el icono de instalar a la derecha de la barra de direcciones,', 'Click the install icon at the right of the address bar,')),
          li(L('o menú ⋮ → <b>Enviar, guardar y compartir</b> → <b>Instalar página como app</b> (en Edge: <b>Aplicaciones</b>).', 'or menu ⋮ → <b>Cast, save and share</b> → <b>Install page as app</b> (in Edge: <b>Apps</b>).'))];
      }
      const showInst = () => inst.classList.toggle('hidden', installed() || !location.protocol.startsWith('http'));
      showInst();
      const closePop = () => { pop.classList.add('hidden'); inst.setAttribute('aria-expanded', 'false'); };
      inst.onclick = async e => {
        e.stopPropagation();
        const ev = window.__bdInstall; // lo guarda boot.js (Chrome/Edge/Android lo ofrecen una sola vez)
        if (ev) {
          ev.prompt();
          const { outcome } = await ev.userChoice;
          window.__bdInstall = null;
          if (outcome === 'accepted') { inst.classList.add('hidden'); toast(L('¡BrainDeck instalada! 🎉', 'BrainDeck installed! 🎉')); }
          return;
        }
        const [head, ...items] = steps();
        pop.innerHTML = `<p>${head}</p>${items.length ? `<ol>${items.join('')}</ol>` : ''}<p class="muted small">${L('Se abre en su propia ventana y funciona sin conexión.', 'It opens in its own window and works offline.')}</p>`;
        const open = pop.classList.toggle('hidden') === false; inst.setAttribute('aria-expanded', String(open));
      };
      const onDoc = e => { if (!e.target.closest('.dash-install-w')) closePop(); };
      const onKey = e => { if (e.key === 'Escape') closePop(); };
      const onInstalled = () => { inst.classList.add('hidden'); closePop(); };
      document.addEventListener('click', onDoc); document.addEventListener('keydown', onKey);
      window.addEventListener('appinstalled', onInstalled); window.addEventListener('bd:installable', showInst);
      return () => {
        clearInterval(id);
        document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey);
        window.removeEventListener('appinstalled', onInstalled); window.removeEventListener('bd:installable', showInst);
        if (bat) ['levelchange', 'chargingchange'].forEach(ev => bat.removeEventListener(ev, showBatt));
      };
    },
  });
})();
