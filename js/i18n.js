'use strict';
/* Inglés para la interfaz: diccionario español → inglés aplicado al DOM (texto y atributos) cuando el idioma es "en".
   Lo marcado con translate="no" (contenido del usuario, preguntas de tests, textos de juegos) no se toca.
   El código nuevo puede usar BD.L('es', 'en') directamente; esto cubre el resto sin duplicar cada pantalla. */
(() => {
  const EN = {
    // ---------- general / núcleo ----------
    'Inicio': 'Home', 'Herramientas': 'Tools', 'Más': 'More', 'Ajustes': 'Settings', 'Juegos': 'Games',
    'Cambiar estilo': 'Change style', 'Volver': 'Back', 'Cerrar': 'Close', 'Copiar enlace a esta herramienta': 'Copy link to this tool', 'Copiar enlace': 'Copy link',
    'Enlace copiado ✨': 'Link copied ✨', 'Copiado': 'Copied', 'No se pudo copiar': 'Couldn\'t copy', 'Ups 😵': 'Oops 😵', 'Volver al inicio': 'Back to home',
    'No se pudo guardar (almacenamiento lleno o bloqueado)': 'Couldn\'t save (storage full or blocked)', 'Arrastra archivos aquí o haz clic': 'Drop files here or click',
    'No se pudo leer la imagen': 'Couldn\'t read the image', 'Configura tu API key en Ajustes para usar IA.': 'Set your API key in Settings to use AI.',
    'Guardado en tu Decision Log 📒': 'Saved to your Decision Log 📒', 'Borrar': 'Delete', 'Eliminar': 'Remove', 'Copiar': 'Copy', 'Descargar': 'Download', 'Quitar': 'Remove',
    'Guardar': 'Save', 'Abrir': 'Open', 'Moneda': 'Currency', 'Formato de salida': 'Output format', 'Tamaño': 'Size', 'Calidad': 'Quality', 'Texto': 'Text',
    '¿Seguro? Pulsa otra vez': 'Sure? Click again', 'Borrar todo': 'Delete everything', 'Copia importada': 'Backup imported', 'Archivo no válido': 'Invalid file', 'Datos borrados': 'Data deleted',

    // ---------- herramientas (menú y tarjetas) ----------
    'Calculadora de comisión': 'Commission calculator', 'Comisión': 'Commission',
    'Valor total + porcentaje → cuánto se resta y cuánto te queda. También: cuánto cobrar para recibir X.': 'Total + percentage → how much is taken and how much you keep. Also: how much to charge to receive X.',
    'Marca de agua + firma de autor': 'Watermark + author signature', 'Marca de agua': 'Watermark', 'Marca de agua (BWM)': 'Watermark (BWM)',
    'BWM en la web: marcas de agua en lote, guardables, y metadatos de autor con aviso "no entrenar IA".': 'BWM on the web: batch watermarks you can save, plus author metadata with a "no AI training" notice.',
    'Screenshot → Notas': 'Screenshot → Notes', 'Capturas a notas': 'Screenshots to notes',
    'Sube tus capturas del móvil: las transcribe, limpia y resume en notas con tareas, citas y preguntas.': 'Upload your phone screenshots: they get transcribed, cleaned and summarized into notes with tasks, quotes and questions.',
    'Lista de temas, libros o videos → plan de estudio y evaluación con calendario a la hora exacta para guardar en tu PC.': 'List of topics, books or videos → study and assessment plan with an hour-by-hour calendar to save on your PC.',
    'Crear plan de estudios': 'Create study plan', 'Estoy en': 'Find me on',
    'Generador de paletas': 'Palette generator', 'Paletas': 'Palettes',
    'Paletas desde un color, una foto o una palabra ("otoño en Tokio"). Exporta para Procreate, Photoshop, Krita y Blender.': 'Palettes from a color, a photo or a word ("autumn in Tokyo"). Export for Procreate, Photoshop, Krita and Blender.',
    'Temporizador de dibujo de poses: 30 s, 1 min, 5 min o clase completa, con tus fotos o referencias libres.': 'Pose drawing timer: 30 s, 1 min, 5 min or a full class, with your photos or free references.',
    'Reto de 30 días': '30-day challenge', 'Un reto diario para lo que quieras: dibujo (tipo Inktober), piano, 3D, animación, idiomas, programación o un curso de YouTube.': 'A daily challenge for anything: drawing (Inktober-style), piano, 3D, animation, languages, coding or a YouTube course.',
    'Coach de inglés hablado': 'English speaking coach', 'Coach de inglés': 'English coach',
    'Grábate hablando en inglés: transcribe tu audio, corrige errores y te da recomendaciones de vocabulario, fluidez y pronunciación.': 'Record yourself speaking English: it transcribes your audio, corrects mistakes and gives vocabulary, fluency and pronunciation tips.',
    'Quitar fondo': 'Remove background', 'Quita el fondo de tus fotos o dibujos con IA en tu navegador. PNG transparente, fondo de color o sticker.': 'Remove the background from your photos or drawings with AI in your browser. Transparent PNG, color background or sticker.',
    'Editar PDF': 'Edit PDF', 'Divide, gira, quita o reordena páginas, numéralas, firma y comprime tus PDF sin subirlos a ningún sitio.': 'Split, rotate, remove or reorder pages, number them, sign and compress your PDFs without uploading them anywhere.',
    'Generador de QR': 'QR generator', 'Códigos QR': 'QR codes',
    'Códigos QR para tu portafolio, Ko-fi, WiFi o contacto, con tus colores, estilo de puntos y tu logo. PNG y SVG.': 'QR codes for your portfolio, Ko-fi, WiFi or contact, with your colors, dot style and logo. PNG and SVG.',
    'Temporizador de foco': 'Focus timer', 'Pomodoro y temporizador para concentrarte (Focus Time Is Now).': 'Pomodoro and timer to help you focus (Focus Time Is Now).',
    'Ideas para crear': 'Creative ideas', 'Ideas para dibujar, ilustrar, publicar o modelar a partir de un tema, vibe, estética, color, animal o lo que quieras.': 'Ideas to draw, illustrate, post or model from a theme, vibe, aesthetic, color, animal or anything you like.',
    'Art Unblock': 'Art Unblock', 'Una frase loca y aleatoria para desbloquear tu creatividad. 100% al azar o con tus palabras, colores o imágenes.': 'A wild random sentence to unblock your creativity. 100% random or seeded with your words, colors or images.',
    'Unir PDFs': 'Merge PDFs', 'Junta varios PDF (e imágenes) en uno: ordénalos, elige páginas y gíralas. No se sube nada.': 'Combine several PDFs (and images) into one: sort them, pick pages and rotate them. Nothing is uploaded.',
    'Descargar videos': 'Download videos', 'YouTube, Vimeo, Bilibili, TikTok y 1800+ webs: elige calidad y formato y descarga de forma segura con yt-dlp.': 'YouTube, Vimeo, Bilibili, TikTok and 1800+ sites: pick quality and format and download safely with yt-dlp.',
    'Generar subtítulos': 'Generate subtitles', 'Subtítulos': 'Subtitles',
    'Subtítulos SRT/VTT de cualquier video o audio con Whisper en tu navegador. Para YouTube, Bilibili, Vimeo, OK.ru… te da el comando para traerlos.': 'SRT/VTT subtitles for any video or audio with Whisper in your browser. For YouTube, Bilibili, Vimeo, OK.ru… it gives you the command to fetch them.',
    'Libro → Test': 'Book → Test', 'Libro a test': 'Book to test',
    'Sube un PDF/EPUB/TXT y genera un test online para estudiar, con repaso espaciado y enlace para compartir.': 'Upload a PDF/EPUB/TXT and generate an online test to study, with spaced review and a share link.',
    'Plan de ahorro': 'Savings plan', 'Ahorro': 'Savings',
    'Dime cuánto quieres ahorrar y para qué: te hago unas preguntas y armo un plan con gráficas.': 'Tell me how much you want to save and what for: I ask a few questions and build a plan with charts.',
    'Convertir y redimensionar': 'Convert & resize', 'Convertir imágenes': 'Convert images',
    'Cambia formato (PNG, JPG, WebP, AVIF) y tamaño de una o cientos de imágenes sin pérdida visible.': 'Change format (PNG, JPG, WebP, AVIF) and size of one or hundreds of images with no visible loss.',
    'Historial de cálculos de comisión, planes de ahorro y conversiones guardadas como decisiones.': 'History of commission calculations, savings plans and study plans saved as decisions.',
    'Minijuegos': 'Mini games',
    'Mini apps inútiles pero divertidas: morse, ahorcado, ASCII, historias y quizzes.': 'Useless but fun mini apps: morse, hangman, ASCII, stories and quizzes.',
    'Test': 'Test', 'Test compartido': 'Shared test', 'Repaso espaciado': 'Spaced review', 'Mi plan de ahorro': 'My savings plan', 'Juego': 'Game',

    // ---------- inicio y Decision Log ----------
    '¿Qué hacemos hoy? Cada herramienta tiene su propio enlace: ábrela y usa 🔗 para compartirla directamente.': 'What are we doing today? Every tool has its own link: open it and use 🔗 to share it directly.',
    'Más cosas': 'More stuff', 'silly games & registro': 'silly games & log',
    'Flor de cristal violeta brillando': 'Glowing violet glass flower', 'Habitación isométrica con escritorio y plantas': 'Isometric room with desk and plants',
    'Cristal iridiscente en forma de cono': 'Cone-shaped iridescent glass', 'Arcos rosas con figuras geométricas flotando': 'Pink arches with floating geometric shapes',
    'Estudio blanco con cuadros colgantes': 'White studio with hanging frames', 'Anillo de discos de cristal iridiscente': 'Ring of iridescent glass discs',
    'Esfera de cristal iridiscente con burbujas': 'Iridescent glass sphere with bubbles', 'Pétalos de cristal en rosa y azul': 'Glass petals in pink and blue', 'Margarita con pétalos arcoíris': 'Daisy with rainbow petals',
    'Cada cálculo que guardas queda como una decisión documentada: qué, cuándo y con qué números.': 'Every calculation you save becomes a documented decision: what, when and with which numbers.',
    'Todos los tipos': 'All types', 'Exportar JSON': 'Export JSON',
    'Aún no hay decisiones. Guarda un cálculo desde la calculadora de comisión o el plan de ahorro.': 'No decisions yet. Save a calculation from the commission calculator or the savings plan.',
    'Plan de estudio': 'Study plan',

    // ---------- comisión ----------
    'Ingresa el valor total y el porcentaje. Verás la ecuación, el valor a restar y el valor final.': 'Enter the total and the percentage. You\'ll see the equation, the amount to subtract and the final value.',
    'Valor total': 'Total amount', 'Porcentaje (%)': 'Percentage (%)', 'Tarifa fija extra (opcional)': 'Extra fixed fee (optional)',
    'Plataformas (aprox., revisa la tarifa actual de tu país)': 'Platforms (approx., check the current fee in your country)',
    'Restar %': 'Subtract %', 'Sumar %': 'Add %', '¿Cuánto cobrar?': 'How much to charge?', 'Lo que quieres recibir': 'What you want to receive',
    'Escribe un valor y un porcentaje': 'Type an amount and a percentage', 'Valor final': 'Final value', 'Total con porcentaje': 'Total with percentage',
    'Debes cobrar': 'You should charge', 'Valor base': 'Base amount', 'Cobras al cliente': 'You charge the client', 'Recibes': 'You receive',
    'Nota opcional (ej. encargo de Ana, 2 personajes)': 'Optional note (e.g. Ana\'s commission, 2 characters)', 'Guardar decisión': 'Save decision', 'Copiar resumen': 'Copy summary',

    // ---------- marca de agua ----------
    'Agrega tu marca a muchas imágenes a la vez y deja tu firma y tus condiciones de uso dentro del archivo.': 'Add your mark to many images at once and leave your signature and terms of use inside the file.',
    '¿Funciona lo de "que la IA no lo copie"?': 'Does the "keep AI from copying it" part work?',
    'Parcialmente. Los metadatos (autor, copyright,': 'Partially. The metadata (author, copyright,', ') son una': ') is a', 'señal legal': 'legal signal',
    'válida —en la UE cuenta como reserva de derechos de minería de datos— y algunos rastreadores la respetan, pero muchas plataformas (Instagram, X, Discord…)': 'that is valid —in the EU it counts as a text-and-data-mining rights reservation— and some crawlers respect it, but many platforms (Instagram, X, Discord…)',
    'borran los metadatos al subir': 'strip metadata on upload',
    'y un scraper puede ignorarlos. La marca de agua visible es la parte que más protege. Para defensa técnica real contra el entrenamiento existen Glaze/Nightshade (Univ. de Chicago), que alteran los píxeles; esta app no los reemplaza.': 'and a scraper can ignore it. The visible watermark is what protects the most. For real technical defense against training there are Glaze/Nightshade (Univ. of Chicago), which alter the pixels; this app doesn\'t replace them.',
    'Marca': 'Mark', 'Guardar marca': 'Save mark', 'Actualizar seleccionada': 'Update selected', 'Opacidad': 'Opacity', 'Fuente': 'Font',
    'Redondeada': 'Rounded', 'Serif itálica': 'Italic serif', 'Sombra para que se lea en fondos claros': 'Shadow so it reads on light backgrounds', 'Posición': 'Position',
    '◎ Centro': '◎ Center', '🎲 Aleatoria': '🎲 Random', '▦ Mosaico': '▦ Tiled', 'Mover ← →': 'Move ← →', 'Mover ↑ ↓': 'Move ↑ ↓',
    'Incrustar metadatos de autor': 'Embed author metadata', 'Autor/a': 'Author', 'Web / contacto': 'Website / contact', 'Condiciones de uso': 'Terms of use',
    'Marcar como "prohibido para minería de datos / entrenamiento de IA"': 'Mark as "prohibited for data mining / AI training"',
    'PNG (sin pérdida)': 'PNG (lossless)', 'Calidad JPG': 'JPG quality', 'Procesar imágenes': 'Process images', 'Verificar metadatos de un archivo': 'Check a file\'s metadata',
    'Sin marcas guardadas': 'No saved marks', 'Marca guardada': 'Mark saved', 'Primero toca una marca guardada': 'First tap a saved mark', 'Marca actualizada': 'Mark updated',
    'Arrastra tus imágenes (o pega con Ctrl+V)': 'Drop your images (or paste with Ctrl+V)', 'JPG, PNG, WebP, GIF, BMP… todo se procesa en tu navegador': 'JPG, PNG, WebP, GIF, BMP… everything is processed in your browser',
    'Sube una imagen para ver su firma': 'Upload an image to see its signature', 'Lee el bloque XMP': 'Reads the XMP block',
    'Autor': 'Author', 'Términos de uso': 'Terms of use', 'Minería de datos / IA': 'Data mining / AI',
    'No se encontraron metadatos XMP en este archivo (puede que una plataforma los haya borrado).': 'No XMP metadata found in this file (a platform may have stripped it).',

    // ---------- libro → test ----------
    'Sube un libro o apuntes. Elige capítulos y tipo de preguntas. El test se guarda y puedes compartirlo con un enlace.': 'Upload a book or notes. Pick chapters and question types. The test is saved and you can share it with a link.',
    '…o pega el texto': '…or paste the text', 'Pega aquí tus apuntes o un capítulo': 'Paste your notes or a chapter here', 'Usar este texto': 'Use this text',
    'Título del test': 'Test title', 'Capítulos': 'Chapters', 'Todos': 'All', 'Ninguno': 'None', 'Nº de preguntas': 'No. of questions', 'Motor': 'Engine',
    'Opción múltiple': 'Multiple choice', 'V/F': 'T/F', 'Completar': 'Fill in', 'Generar test': 'Generate test', 'Guía de estudio (IA)': 'Study guide (AI)',
    'Mis tests': 'My tests', '✨ IA': '✨ AI', 'Sube tu libro': 'Upload your book',
    'PDF con texto, EPUB, TXT o MD (los PDF escaneados no tienen texto: usa Capturas → Notas)': 'PDF with text, EPUB, TXT or MD (scanned PDFs have no text: use Screenshots → Notes)',
    'Leyendo…': 'Reading…', 'El PDF casi no tiene texto (¿es escaneado?).': 'The PDF has almost no text (is it scanned?).', 'Pega un poco más de texto': 'Paste a bit more text',
    'Elige al menos un capítulo': 'Pick at least one chapter', 'Elige un tipo de pregunta': 'Pick a question type', 'Generando': 'Generating',
    'No se pudieron sacar preguntas de este texto.': 'Couldn\'t get questions out of this text.', 'La guía de estudio necesita tu API key (Ajustes)': 'The study guide needs your API key (Settings)',
    'Creando guía': 'Creating guide', 'Descargar .md': 'Download .md', 'Jugar': 'Play', 'Copiar enlace para compartir': 'Copy share link', 'Aún no tienes tests.': 'No tests yet.',
    'Copiado (enlace muy largo, puede fallar en algunas apps)': 'Copied (very long link, may fail in some apps)', 'Enlace del test copiado 🔗': 'Test link copied 🔗',
    'Tu respuesta': 'Your answer', 'Comprobar': 'Check', '¡Correcto! ✨': 'Correct! ✨', 'Siguiente →': 'Next →', 'Ver resultado': 'See result',
    'Para repasar': 'To review', 'Repetir': 'Retry', 'Solo los fallos': 'Only mistakes', 'Salir': 'Exit', 'Bandera': 'Flag',
    'Test no encontrado': 'Test not found', 'Este test no existe en este navegador. Pide un enlace de "compartir".': 'This test doesn\'t exist in this browser. Ask for a "share" link.',
    'Enlace roto': 'Broken link', 'El enlace del test está incompleto.': 'The test link is incomplete.',
    'Preguntas que fallaste. Si aciertas, vuelven más tarde (1→3→7→14→30 días); si fallas, mañana otra vez.': 'Questions you missed. Get them right and they come back later (1→3→7→14→30 days); miss them and they\'re back tomorrow.',
    'No tienes repasos pendientes hoy.': 'No reviews due today.',

    // ---------- ahorro ----------
    'Unas preguntas rápidas y te armo el plan completo.': 'A few quick questions and I\'ll build the full plan.',
    'Viaje': 'Trip', 'Fondo de emergencia': 'Emergency fund', 'Tecnología': 'Tech', 'Estudios': 'Education', 'Casa / mudanza': 'Home / moving', 'Vehículo': 'Vehicle',
    'Evento / regalo': 'Event / gift', 'Material de arte': 'Art supplies', 'Otro': 'Other',
    'Vuelos': 'Flights', 'Alojamiento': 'Lodging', 'Comida': 'Food', 'Actividades': 'Activities', 'Imprevistos': 'Unexpected costs', '3 meses de gastos': '3 months of expenses',
    'Equipo': 'Device', 'Accesorios': 'Accessories', 'Garantía/seguro': 'Warranty/insurance', 'Matrícula/curso': 'Tuition/course', 'Materiales': 'Materials', 'Transporte': 'Transport',
    'Depósito': 'Deposit', 'Mudanza': 'Moving', 'Muebles': 'Furniture', 'Entrada': 'Down payment', 'Seguro': 'Insurance', 'Trámites': 'Paperwork', 'Principal': 'Main',
    'Detalles': 'Extras', 'Tableta / equipo': 'Tablet / gear', 'Software / pinceles': 'Software / brushes', 'Cursos': 'Courses',
    'Activa alertas de precio de vuelos y compra con 2-3 meses de antelación.': 'Turn on flight price alerts and book 2-3 months ahead.',
    'Ahorra en una cuenta separada para no tocar el dinero.': 'Save in a separate account so you don\'t touch the money.',
    'La meta típica es 3-6 meses de gastos fijos.': 'The usual goal is 3-6 months of fixed expenses.',
    'Guárdalo en un lugar líquido, no en inversiones de riesgo.': 'Keep it somewhere liquid, not in risky investments.',
    'Compara reacondicionados oficiales: suelen tener garantía y cuestan 20-30% menos.': 'Compare official refurbished options: they usually have a warranty and cost 20-30% less.',
    'Espera a fechas de rebajas (Black Friday, regreso a clases).': 'Wait for sales (Black Friday, back to school).',
    'Pregunta por becas, descuentos por pronto pago o pagos fraccionados.': 'Ask about scholarships, early-payment discounts or installments.',
    'Cuenta materiales y transporte: suelen olvidarse.': 'Count materials and transport: they\'re often forgotten.',
    'Separa el depósito del resto: es lo que más pesa y lo primero que te piden.': 'Keep the deposit separate: it\'s the biggest chunk and the first thing they ask for.',
    'Una entrada mayor reduce intereses del préstamo.': 'A bigger down payment lowers the loan interest.',
    'Suma seguro y mantenimiento anual al presupuesto.': 'Add insurance and yearly maintenance to the budget.',
    'Fija la fecha y trabaja hacia atrás: es la meta más fácil de visualizar.': 'Set the date and work backwards: it\'s the easiest goal to picture.',
    'Destina un % de cada comisión que cobres directamente a esta meta.': 'Send a % of every commission you get straight to this goal.',
    'Escribe por qué quieres esta meta: tenerlo claro ayuda a no rendirte.': 'Write down why you want this goal: being clear helps you not give up.',
    'Semanal': 'Weekly', 'Quincenal': 'Biweekly', 'Mensual': 'Monthly', '🌿 Cómodo': '🌿 Easy', '⚖️ Equilibrado': '⚖️ Balanced', '🔥 Intenso': '🔥 Intense',
    '← Atrás': '← Back', 'Crear mi plan ✨': 'Create my plan ✨', '¿Cuánto quieres ahorrar?': 'How much do you want to save?', 'Ej. 1500': 'E.g. 1500',
    '¿No sabes aún? Pon un estimado; en el paso 3 lo calculamos sumando lo que quieres comprar.': 'Not sure yet? Put an estimate; in step 3 we add up what you want to buy.',
    '¿Para qué es este ahorro?': 'What are you saving for?', 'Ponle nombre a tu meta': 'Name your goal', '¿En qué lo vas a gastar?': 'What will you spend it on?',
    'Monto': 'Amount', '+ Agregar concepto': '+ Add item', 'Suma:': 'Total:', 'Usar suma como meta': 'Use total as goal', '¿Para cuándo lo necesitas?': 'When do you need it?',
    'Fecha objetivo:': 'Target date:', '¿Cada cuánto puedes apartar dinero?': 'How often can you set money aside?', 'Tus números del mes': 'Your monthly numbers',
    'Solo se usan aquí para ver si el plan es realista. Nada sale de tu navegador.': 'They\'re only used here to check the plan is realistic. Nothing leaves your browser.',
    'Ingreso mensual neto': 'Net monthly income', 'Gastos fijos al mes (renta, comida, servicios…)': 'Fixed monthly expenses (rent, food, bills…)',
    '¿Cuánto tienes ya ahorrado para esto?': 'How much have you already saved for this?', 'Rendimiento anual de tu cuenta (%) — opcional': 'Annual yield of your account (%) — optional',
    '¿Qué tan intenso quieres ir?': 'How intense do you want to go?', 'Define qué parte de tu dinero libre estás dispuesta/o a destinar como máximo.': 'Set the maximum share of your free money you\'re willing to put in.',
    'Mis planes': 'My plans', 'Escribe cuánto quieres ahorrar': 'Type how much you want to save', 'Pon tu ingreso mensual (aunque sea aproximado)': 'Enter your monthly income (even a rough one)',
    'Plan no encontrado': 'Plan not found', 'Este plan no existe en este navegador.': 'This plan doesn\'t exist in this browser.',
    '⚠ Tus gastos fijos igualan o superan tu ingreso.': '⚠ Your fixed expenses equal or exceed your income.',
    'Antes de ahorrar para esta meta, busca recortar gastos o aumentar ingresos.': 'Before saving for this goal, look to cut expenses or increase income.',
    '✅ Plan realista.': '✅ Realistic plan.', '⚠ Muy ajustado.': '⚠ Very tight.', 'Con tu límite, lo lograrías en': 'With your limit you\'d make it in',
    'al mes': 'per month', 'aportes': 'deposits', 'completado': 'done', 'Cómo crece tu ahorro': 'How your savings grow', 'En qué se va': 'Where it goes', 'Sin desglose': 'No breakdown',
    'Tu mes con el plan': 'Your month with the plan', 'Hitos': 'Milestones', 'ya lo tienes 🎉': 'already there 🎉', 'Consejos': 'Tips',
    'Automatiza el aporte el mismo día que cobras: lo que no ves, no lo gastas.': 'Automate the deposit on payday: what you don\'t see, you don\'t spend.',
    'Si cobras por semana o por encargo, prueba aportes semanales: se sienten más pequeños.': 'If you get paid weekly or per job, try weekly deposits: they feel smaller.',
    'Revisa tu progreso cada mes y ajusta si algo cambia.': 'Check your progress every month and adjust if something changes.',
    'Calendario de aportes': 'Deposit schedule', 'Marca cada aporte cuando lo hagas.': 'Tick each deposit when you make it.', 'Fecha': 'Date', 'Aporte': 'Deposit', 'Acumulado': 'Saved',
    'Guardar en Decision Log': 'Save to Decision Log', 'Descargar calendario (CSV)': 'Download schedule (CSV)', 'Borrar plan': 'Delete plan', '¡Meta cumplida! 🎉🐷': 'Goal reached! 🎉🐷',

    // ---------- convertir ----------
    'Todo ocurre en tu navegador: tus imágenes no se suben a ningún servidor.': 'Everything happens in your browser: your images are never uploaded to a server.',
    '(90+ = sin pérdida visible)': '(90+ = no visible loss)', 'Escala': 'Scale', 'Ancho (px)': 'Width (px)', 'Alto (px)': 'Height (px)',
    'Permitir agrandar (puede perder nitidez)': 'Allow upscaling (may lose sharpness)', 'Fondo para transparencias (JPG)': 'Background for transparency (JPG)',
    'Sufijo del nombre (opcional)': 'Name suffix (optional)', 'Convertir': 'Convert',
    'Tip: para web usa WebP 85-90; para arte con bordes nítidos o transparencia, PNG. JPG y WebP/AVIF a calidad < 100 comprimen con pérdida (normalmente invisible ≥ 90).': 'Tip: for the web use WebP 85-90; for art with crisp edges or transparency, PNG. JPG and WebP/AVIF below 100 quality are lossy (usually invisible at ≥ 90).',
    'Máx. ancho/alto': 'Max width/height', 'Exacto': 'Exact', 'Arrastra imágenes (una o muchas)': 'Drop images (one or many)',
    'PNG, JPG, WebP, GIF, BMP, AVIF, SVG… o pega con Ctrl+V': 'PNG, JPG, WebP, GIF, BMP, AVIF, SVG… or paste with Ctrl+V', 'Archivo': 'File', 'Nuevo': 'New', 'Peso': 'Size',

    // ---------- juegos ----------
    'Inútiles pero divertidos. Cada juego tiene su propio enlace.': 'Useless but fun. Each game has its own link.',
    'Texto ↔ Morse': 'Text ↔ Morse', 'Traduce, escucha y mira parpadear tu mensaje.': 'Translate, listen to and watch your message blink.',
    'Quiz rápido': 'Quick quiz', '10 preguntas de cultura general.': '10 general knowledge questions.', 'Ahorcado': 'Hangman', 'Adivina la palabra antes de que sea tarde.': 'Guess the word before it\'s too late.',
    'Dibujo ASCII': 'ASCII drawing', 'Pinta con caracteres o convierte una imagen. Copia y pega donde quieras.': 'Paint with characters or convert an image. Copy and paste it anywhere.',
    'Crea tu propia historia': 'Choose your own story', 'Tus decisiones cambian el final. ¿Los encuentras todos?': 'Your choices change the ending. Can you find them all?',
    'Quiz de países': 'Countries quiz', 'Capitales, banderas y continentes.': 'Capitals, flags and continents.',
    'Escribe texto o código morse': 'Type text or morse code', 'Resultado': 'Result', '▶ Escuchar': '▶ Listen', '■ Parar': '■ Stop', 'Velocidad': 'Speed', 'Ver alfabeto': 'Show alphabet',
    'Código morse': 'Morse code', 'Hola mundo · o · .... --- .-.. .-': 'Hello world · or · .... . .-.. .-.. ---',
    'otro': 'other', 'Copiar dibujo': 'Copy drawing', 'Limpiar': 'Clear', 'Imagen → ASCII': 'Image → ASCII', 'Ancho en caracteres': 'Width in characters',
    'Invertir (para fondos oscuros)': 'Invert (for dark backgrounds)', '✏️ Pincel': '✏️ Brush', '🧽 Borrar': '🧽 Erase', '🪣 Relleno': '🪣 Fill', 'Dibujo copiado 🎨': 'Drawing copied 🎨',
    'Sube una imagen': 'Upload an image', '🎲 Mixto': '🎲 Mixed', 'Capitales': 'Capitals', 'Banderas': 'Flags', 'Continentes': 'Continents',
  };

  const tm = s => EN[s] || s;
  const FREQ_EN = { semanales: 'weekly', quincenales: 'biweekly', mensuales: 'monthly', semana: 'week', quincena: 'two weeks', mes: 'month' };
  // Textos con números o datos dentro
  const RX = [
    [/^No se pudo cargar (.+) \(¿sin conexión\?\)$/, 'Couldn\'t load $1 (offline?)'],
    [/^Error de la API: (.*)$/, 'API error: $1'],
    [/^⚠ (.+)$/, (_, m) => '⚠ ' + tr(m)],
    [/^No se pudo abrir (.+)$/, 'Couldn\'t open $1'],
    [/^Estilo: (.+)$/, 'Style: $1'],
    [/^Valor a restar \((.+?)( \+ fija)?\)$/, (_, p, f) => `Amount to subtract (${p}${f ? ' + fixed' : ''})`],
    [/^Valor a sumar \((.+?)( \+ fija)?\)$/, (_, p, f) => `Amount to add (${p}${f ? ' + fixed' : ''})`],
    [/^Comisión \((.+?)( \+ fija)?\)$/, (_, p, f) => `Fee (${p}${f ? ' + fixed' : ''})`],
    [/^Con (.+)% nunca recibirías nada 😅$/, 'At $1% you\'d never receive anything 😅'],
    [/^Procesar (\d+) imagen(es)?$/, (_, n) => `Process ${n} image${n > 1 ? 's' : ''}`],
    [/^✓ (\d+) listas$/, '✓ $1 ready'],
    [/^Pregunta (\d+)\/(\d+)$/, 'Question $1/$2'],
    [/^Respuesta: (.*)$/, 'Answer: $1'],
    [/^(\d+) de (\d+) correctas · (.*)$/, '$1 of $2 correct · $3'],
    [/^(\d+) preguntas( · mejor (\d+)%)?$/, (_, n, b, p) => `${n} questions${b ? ` · best ${p}%` : ''}`],
    [/^(\d+) preguntas pendientes hoy$/, '$1 questions due today'],
    [/^\((\d+) palabras\)$/, '($1 words)'],
    [/^✓ (\d+) secciones detectadas$/, '✓ $1 sections found'],
    [/^Leyendo PDF (\d+)%$/, 'Reading PDF $1%'],
    [/^Paso (\d+) de (\d+)$/, 'Step $1 of $2'],
    [/^Ej\. (.+)$/, (_, x) => 'E.g. ' + tm(x.replace(/ \d{4}$/, '')) + (x.match(/ \d{4}$/) || [''])[0]],
    [/^Desglosa la meta\. Te propuse un reparto típico para "(.+)", edítalo libremente\.$/, (_, x) => `Break down the goal. I suggested a typical split for "${tm(x)}", edit it freely.`],
    [/^Meta actual: (.*)$/, 'Current goal: $1'],
    [/^(\d+) mes(es)?$/, (_, n) => `${n} month${n > 1 ? 's' : ''}`],
    [/^hasta (\d+)% de tu dinero libre$/, 'up to $1% of your free money'],
    [/^Meta de (.+) en (\d+) meses · aportes (\w+)$/, (_, m, n, f) => `Goal of ${m} in ${n} months · ${FREQ_EN[f] || f} deposits`],
    [/^Usarás el (\d+)% de tu dinero libre \((.+)\/mes\)\. Te quedan (.+) al mes\.$/, 'You\'ll use $1% of your free money ($2/month). You keep $3 per month.'],
    [/^Necesitas (.+?)\/mes, el (\d+)% de tu dinero libre \(tu límite elegido es (\d+)%\)\.\s*(.*)$/, (_, a, b, c, rest) => `You need ${a}/month, ${b}% of your free money (your chosen limit is ${c}%). ${rest ? tr(rest) : ''}`],
    [/^\.?\s*También puedes bajar la meta a (.+)\.$/, (s, x) => (s.startsWith('.') ? '. ' : '') + `You could also lower the goal to ${x}.`],
    [/^cada (semana|quincena|mes)$/, (_, f) => 'every ' + FREQ_EN[f]],
    [/^Intereses ganados: (.*)$/, 'Interest earned: $1'],
    [/^Pincel: "(.*)"$/, 'Brush: "$1"'],
    [/^¡Nuevo récord: (\d+)\/(\d+)! 🏆$/, 'New record: $1/$2! 🏆'],
    [/^¡Récord: (\d+)\/10! 🌍$/, 'Record: $1/10! 🌍'],
  ];

  const norm = s => s.replace(/\s+/g, ' ').trim();
  function tr(s) {
    if (s == null || BD.lang() !== 'en') return s;
    const k = norm(String(s));
    if (Object.prototype.hasOwnProperty.call(EN, k)) return EN[k];
    for (const [re, to] of RX) { const m = k.match(re); if (m) return typeof to === 'function' ? to(...m) : k.replace(re, to); }
    return s;
  }
  BD.tr = tr;

  // ---------- aplicación al DOM ----------
  const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  const SKIP = 'script,style,textarea,pre,[translate="no"],.ascii-grid';
  const wordy = s => /[A-Za-zÁÉÍÓÚáéíóúñÑ¿¡]{2}/.test(s);
  function text(n) {
    const v = n.nodeValue;
    if (!wordy(v)) return;
    const t = tr(v); if (t === v) return;
    const nv = v.match(/^\s*/)[0] + t + v.match(/\s*$/)[0];
    if (nv !== v) n.nodeValue = nv; // comparar evita bucles con el observer
  }
  function attrs(e) {
    for (const a of ATTRS) {
      const v = e.getAttribute(a); if (!v || !wordy(v)) continue;
      const t = tr(v); if (t !== v && norm(t) !== norm(v)) e.setAttribute(a, t);
    }
  }
  function walk(root) {
    if (root.nodeType === 3) { if (root.parentElement && !root.parentElement.closest(SKIP)) text(root); return; }
    if (root.nodeType !== 1 || root.closest(SKIP)) return;
    attrs(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: n => n.nodeType === 1 && n.matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    for (let n = w.nextNode(); n; n = w.nextNode()) n.nodeType === 3 ? text(n) : attrs(n);
  }
  const mo = new MutationObserver(recs => {
    for (const r of recs) {
      if (r.type === 'childList') r.addedNodes.forEach(walk);
      else if (r.type === 'characterData') walk(r.target);
      else if (r.target.isConnected && !r.target.closest(SKIP)) attrs(r.target);
    }
  });
  // core.js emite "bd:lang" al iniciar, antes de pintar el menú y la primera pantalla
  window.addEventListener('bd:lang', () => {
    mo.disconnect();
    if (BD.lang() !== 'en') return;
    walk(document.body);
    mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  });
})();
