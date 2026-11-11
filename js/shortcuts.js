'use strict';
/* Buscador de atajos de teclado de programas y sistemas operativos.
   Teclas: 'Mod' = Ctrl en Windows/Linux y ⌘ en Mac; un espacio separa dos pulsaciones seguidas (Mod+K Mod+S).
   Si el atajo cambia entre sistemas se escribe como [windows/linux, mac]. */
(() => {
  const { $, esc, win, store, L } = BD;

  const APPS = [
    { id: 'basic', name: L('Básicos (todo el sistema)', 'Basics (system-wide)'), items: [
      ['Mod+C', 'Copiar', 'Copy'], ['Mod+X', 'Cortar', 'Cut'], ['Mod+V', 'Pegar', 'Paste'],
      ['Mod+Shift+V', 'Pegar sin formato (navegadores, Docs, Slack…)', 'Paste without formatting (browsers, Docs, Slack…)'],
      ['Mod+Z', 'Deshacer', 'Undo'], [['Ctrl+Y', 'Mod+Shift+Z'], 'Rehacer', 'Redo'], ['Mod+A', 'Seleccionar todo', 'Select all'],
      ['Mod+S', 'Guardar', 'Save'], ['Mod+F', 'Buscar', 'Find'], ['Mod+P', 'Imprimir', 'Print'], ['Mod+N', 'Nuevo', 'New'], ['Mod+O', 'Abrir', 'Open'],
      [['Ctrl+Backspace', 'Alt+Backspace'], 'Borrar la palabra anterior', 'Delete previous word'],
      [['Ctrl+←', 'Alt+←'], 'Saltar a la palabra anterior', 'Jump to previous word'],
      [['Home', 'Mod+←'], 'Ir al inicio de la línea', 'Go to start of line'],
    ] },
    { id: 'windows', name: 'Windows', os: 'win', items: [
      ['Win+D', 'Mostrar el escritorio', 'Show desktop'], ['Win+E', 'Abrir el Explorador de archivos', 'Open File Explorer'],
      ['Win+L', 'Bloquear el equipo', 'Lock the PC'], ['Win+V', 'Historial del portapapeles', 'Clipboard history'],
      ['Win+Shift+S', 'Captura de una zona (Recortes)', 'Screenshot of an area (Snipping)'], ['Win+PrtScn', 'Captura completa guardada en Imágenes', 'Full screenshot saved to Pictures'],
      ['Win+.', 'Panel de emojis y símbolos', 'Emoji and symbol panel'], ['Win+Tab', 'Vista de tareas', 'Task view'],
      ['Alt+Tab', 'Cambiar de ventana', 'Switch window'], ['Win+←', 'Acoplar la ventana a la izquierda', 'Snap window left'],
      ['Win+↑', 'Maximizar la ventana', 'Maximize window'], ['Win+Ctrl+D', 'Nuevo escritorio virtual', 'New virtual desktop'],
      ['Win+Ctrl+→', 'Cambiar de escritorio virtual', 'Switch virtual desktop'], ['Ctrl+Shift+Esc', 'Administrador de tareas', 'Task Manager'],
      ['Win+I', 'Configuración', 'Settings'], ['Win+R', 'Ejecutar', 'Run dialog'], ['Win+H', 'Dictado por voz', 'Voice typing'],
      ['Win+Alt+R', 'Grabar la pantalla (Xbox Game Bar)', 'Record screen (Xbox Game Bar)'], ['Win+1', 'Abrir la app 1 de la barra de tareas', 'Open taskbar app 1'],
      ['Alt+F4', 'Cerrar la ventana', 'Close window'], ['F2', 'Renombrar el archivo seleccionado', 'Rename selected file'],
    ] },
    { id: 'mac', name: 'macOS', os: 'mac', items: [
      ['⌘+Space', 'Spotlight (buscar)', 'Spotlight (search)'], ['⌘+Tab', 'Cambiar de app', 'Switch app'], ['⌘+`', 'Cambiar entre ventanas de la misma app', 'Switch windows of the same app'],
      ['⌘+Shift+3', 'Captura de toda la pantalla', 'Full screenshot'], ['⌘+Shift+4', 'Captura de una zona', 'Screenshot of an area'],
      ['⌘+Shift+5', 'Capturas y grabación de pantalla', 'Screenshot and screen recording'], ['⌘+Q', 'Salir de la app', 'Quit app'],
      ['⌘+W', 'Cerrar la ventana', 'Close window'], ['⌘+H', 'Ocultar la app', 'Hide app'], ['⌘+M', 'Minimizar', 'Minimize'],
      ['⌘+,', 'Ajustes de la app', 'App settings'], ['⌘+Option+Esc', 'Forzar salida', 'Force quit'], ['Ctrl+⌘+Q', 'Bloquear la pantalla', 'Lock screen'],
      ['Ctrl+⌘+Space', 'Emojis y símbolos', 'Emoji and symbols'], ['Ctrl+↑', 'Mission Control', 'Mission Control'],
      ['Space', 'Vista rápida en Finder', 'Quick Look in Finder'], ['⌘+Shift+.', 'Mostrar archivos ocultos en Finder', 'Show hidden files in Finder'],
      ['⌘+Delete', 'Mover a la papelera', 'Move to Trash'], ['⌘+Shift+G', 'Ir a una carpeta por ruta', 'Go to folder by path'],
    ] },
    { id: 'linux', name: 'Linux (GNOME / Ubuntu)', os: 'linux', items: [
      ['Super', 'Vista de actividades', 'Activities overview'], ['Super+A', 'Todas las aplicaciones', 'All applications'],
      ['Ctrl+Alt+T', 'Abrir la terminal (Ubuntu)', 'Open terminal (Ubuntu)'], ['Super+L', 'Bloquear la pantalla', 'Lock screen'],
      ['Alt+Tab', 'Cambiar de ventana', 'Switch window'], ['Super+←', 'Acoplar la ventana a la izquierda', 'Snap window left'],
      ['Super+Page Down', 'Siguiente área de trabajo', 'Next workspace'], ['PrtScn', 'Capturas y grabación de pantalla', 'Screenshot and screen recording'],
      ['Super+V', 'Notificaciones y calendario', 'Notifications and calendar'], ['Alt+F2', 'Ejecutar un comando', 'Run a command'],
      ['Ctrl+H', 'Mostrar archivos ocultos (Archivos)', 'Show hidden files (Files)'],
    ] },
    { id: 'terminal', name: L('Terminal (bash/zsh)', 'Terminal (bash/zsh)'), items: [
      ['Ctrl+C', 'Cancelar el comando en curso', 'Cancel running command'], ['Ctrl+L', 'Limpiar la pantalla', 'Clear screen'],
      ['Ctrl+R', 'Buscar en el historial', 'Search history'], ['↑', 'Comando anterior', 'Previous command'], ['Tab', 'Autocompletar', 'Autocomplete'],
      ['Ctrl+A', 'Ir al inicio de la línea', 'Go to start of line'], ['Ctrl+E', 'Ir al final de la línea', 'Go to end of line'],
      ['Ctrl+U', 'Borrar hasta el inicio', 'Delete to start'], ['Ctrl+W', 'Borrar la palabra anterior', 'Delete previous word'],
      ['Ctrl+Z', 'Suspender el proceso (fg para volver)', 'Suspend process (fg to resume)'], ['Ctrl+D', 'Cerrar la sesión', 'Exit shell'],
    ] },
    { id: 'browser', name: L('Navegador (Chrome, Edge, Firefox)', 'Browser (Chrome, Edge, Firefox)'), items: [
      ['Mod+T', 'Nueva pestaña', 'New tab'], ['Mod+Shift+T', 'Reabrir la pestaña cerrada', 'Reopen closed tab'], ['Mod+W', 'Cerrar la pestaña', 'Close tab'],
      ['Mod+L', 'Ir a la barra de direcciones', 'Focus address bar'], ['Mod+Shift+N', 'Ventana de incógnito (Chrome/Edge)', 'Incognito window (Chrome/Edge)'],
      ['Mod+1', 'Ir a la pestaña 1 (con 9, a la última)', 'Go to tab 1 (with 9, the last one)'], ['Ctrl+Tab', 'Siguiente pestaña', 'Next tab'],
      ['Mod+D', 'Guardar en marcadores', 'Bookmark page'], ['Mod+Shift+B', 'Mostrar la barra de marcadores', 'Show bookmarks bar'],
      [['Ctrl+H', '⌘+Y'], 'Historial', 'History'], [['Ctrl+J', '⌘+Shift+J'], 'Descargas', 'Downloads'],
      ['Mod+Shift+R', 'Recargar sin caché', 'Hard reload'], ['Mod+Plus', 'Acercar (con 0 se restablece)', 'Zoom in (with 0 it resets)'],
      ['Mod+Shift+Delete', 'Borrar datos de navegación', 'Clear browsing data'], [['F12', '⌘+Option+I'], 'Herramientas para desarrolladores', 'Developer tools'],
    ] },
    { id: 'vscode', name: 'VS Code', items: [
      ['Mod+P', 'Abrir un archivo por nombre', 'Quick open file'], ['Mod+Shift+P', 'Paleta de comandos', 'Command palette'],
      ['Mod+B', 'Mostrar/ocultar la barra lateral', 'Toggle sidebar'], ['Ctrl+`', 'Abrir la terminal', 'Toggle terminal'],
      ['Mod+/', 'Comentar la línea', 'Toggle line comment'], ['Alt+↑', 'Mover la línea arriba', 'Move line up'],
      ['Shift+Alt+↓', 'Duplicar la línea', 'Duplicate line'], ['Mod+Shift+K', 'Borrar la línea', 'Delete line'],
      ['Mod+D', 'Seleccionar la siguiente coincidencia', 'Select next match'], ['Mod+Shift+L', 'Seleccionar todas las coincidencias', 'Select all matches'],
      ['Alt+Click', 'Añadir un cursor', 'Add cursor'], ['Shift+Alt+F', 'Formatear el documento', 'Format document'],
      ['F2', 'Renombrar el símbolo', 'Rename symbol'], ['F12', 'Ir a la definición', 'Go to definition'], ['Ctrl+G', 'Ir a una línea', 'Go to line'],
      ['Mod+Shift+F', 'Buscar en todos los archivos', 'Search in all files'], ['Mod+\\', 'Dividir el editor', 'Split editor'],
      ['Alt+Z', 'Ajuste de línea', 'Toggle word wrap'], ['Mod+K Mod+S', 'Ver todos los atajos', 'Show all shortcuts'],
    ] },
    { id: 'photoshop', name: 'Photoshop', items: [
      ['B', 'Pincel', 'Brush'], ['E', 'Borrador', 'Eraser'], ['V', 'Mover', 'Move'], ['M', 'Marco de selección', 'Marquee'], ['L', 'Lazo', 'Lasso'],
      ['W', 'Selección de objetos / rápida', 'Object / quick selection'], ['I', 'Cuentagotas', 'Eyedropper'], ['G', 'Degradado / bote de pintura', 'Gradient / paint bucket'],
      ['T', 'Texto', 'Type'], ['C', 'Recortar', 'Crop'], ['J', 'Pincel corrector', 'Healing brush'], ['S', 'Tampón de clonar', 'Clone stamp'],
      ['[', 'Pincel más pequeño (] más grande)', 'Smaller brush (] bigger)'], ['X', 'Intercambiar colores', 'Swap colors'], ['D', 'Colores por defecto', 'Default colors'],
      ['Space', 'Mano (mantener y arrastrar)', 'Hand (hold and drag)'], ['R', 'Rotar la vista', 'Rotate view'], ['Mod+0', 'Ajustar a la pantalla', 'Fit on screen'],
      ['Mod+Shift+N', 'Nueva capa', 'New layer'], ['Mod+J', 'Duplicar la capa', 'Duplicate layer'], ['Mod+E', 'Combinar hacia abajo', 'Merge down'],
      ['Mod+G', 'Agrupar capas', 'Group layers'], ['Mod+Alt+G', 'Máscara de recorte', 'Clipping mask'], ['Mod+Shift+Alt+E', 'Sellar lo visible en una capa', 'Stamp visible to a layer'],
      ['Mod+T', 'Transformación libre', 'Free transform'], ['Mod+D', 'Deseleccionar', 'Deselect'], ['Mod+Shift+I', 'Invertir la selección', 'Invert selection'],
      ['Mod+I', 'Invertir colores', 'Invert colors'], ['Mod+L', 'Niveles', 'Levels'], ['Mod+M', 'Curvas', 'Curves'], ['Mod+U', 'Tono/saturación', 'Hue/saturation'],
      ['Mod+Shift+Alt+W', 'Exportar como', 'Export as'],
    ] },
    { id: 'krita', name: 'Krita', items: [
      ['B', 'Pincel', 'Brush'], ['E', 'Modo borrador', 'Eraser mode'], ['Space', 'Mover el lienzo', 'Pan canvas'], ['Shift+Space', 'Rotar el lienzo', 'Rotate canvas'],
      ['5', 'Restablecer la rotación', 'Reset rotation'], ['M', 'Espejo de la vista', 'Mirror view'], ['Tab', 'Solo lienzo (oculta la interfaz)', 'Canvas-only mode'],
      ['[', 'Pincel más pequeño (] más grande)', 'Smaller brush (] bigger)'], ['K', 'Color más oscuro (L más claro)', 'Darker color (L lighter)'],
      ['Insert', 'Nueva capa de pintura', 'New paint layer'], ['Ctrl+J', 'Duplicar la capa', 'Duplicate layer'], ['Ctrl+E', 'Combinar hacia abajo', 'Merge down'],
      ['Ctrl+T', 'Transformar', 'Transform'], ['Ctrl+R', 'Selección rectangular', 'Rectangular selection'], ['Ctrl+Shift+A', 'Deseleccionar', 'Deselect'],
      ['Ctrl+I', 'Invertir colores', 'Invert colors'],
    ] },
    { id: 'blender', name: 'Blender', items: [
      ['G', 'Mover', 'Grab / move'], ['R', 'Rotar', 'Rotate'], ['S', 'Escalar', 'Scale'], ['Tab', 'Modo edición / objeto', 'Edit / object mode'],
      ['Shift+A', 'Añadir objeto', 'Add object'], ['Shift+D', 'Duplicar', 'Duplicate'], ['Alt+D', 'Duplicar enlazado', 'Linked duplicate'], ['X', 'Borrar', 'Delete'],
      ['E', 'Extruir', 'Extrude'], ['I', 'Insertar caras', 'Inset faces'], ['Ctrl+R', 'Corte en bucle', 'Loop cut'], ['Ctrl+B', 'Bisel', 'Bevel'],
      ['A', 'Seleccionar todo (Alt+A ninguno)', 'Select all (Alt+A none)'], ['L', 'Seleccionar lo conectado', 'Select linked'], ['P', 'Separar', 'Separate'],
      ['Ctrl+J', 'Unir objetos', 'Join objects'], ['Ctrl+P', 'Emparentar', 'Parent'], ['Ctrl+A', 'Aplicar transformaciones', 'Apply transforms'],
      ['M', 'Mover a una colección', 'Move to collection'], ['H', 'Ocultar (Alt+H mostrar)', 'Hide (Alt+H unhide)'], ['Shift+S', 'Menú de ajuste (snap)', 'Snap menu'],
      ['Numpad .', 'Encuadrar la selección', 'Frame selected'], ['Numpad 0', 'Vista de cámara', 'Camera view'], ['Numpad 1', 'Vista frontal (3 lateral, 7 superior)', 'Front view (3 side, 7 top)'],
      ['`', 'Menú circular de vistas', 'View pie menu'], ['Z', 'Menú de sombreado', 'Shading pie menu'], ['N', 'Panel lateral', 'Sidebar'],
      ['Ctrl+Space', 'Maximizar el área', 'Maximize area'], ['F12', 'Renderizar imagen', 'Render image'],
    ] },
    { id: 'figma', name: 'Figma', items: [
      ['V', 'Mover', 'Move'], ['F', 'Frame', 'Frame'], ['R', 'Rectángulo', 'Rectangle'], ['O', 'Elipse', 'Ellipse'], ['T', 'Texto', 'Text'], ['P', 'Pluma', 'Pen'],
      ['K', 'Escalar proporcionalmente', 'Scale proportionally'], ['Shift+A', 'Auto layout', 'Auto layout'], ['Mod+G', 'Agrupar', 'Group'],
      ['Mod+Alt+G', 'Meter la selección en un frame', 'Frame selection'], ['Mod+Alt+K', 'Crear componente', 'Create component'], ['Mod+D', 'Duplicar', 'Duplicate'],
      ['Alt+Click', 'Arrastrar con Alt para duplicar / ver distancias', 'Alt-drag to duplicate / measure distances'], ['Shift+1', 'Zoom para ver todo', 'Zoom to fit'],
      ['Shift+2', 'Zoom a la selección', 'Zoom to selection'], ['Mod+R', 'Renombrar la capa', 'Rename layer'], ['Mod+Shift+H', 'Mostrar/ocultar', 'Show/hide'],
      ['Mod+Shift+L', 'Bloquear/desbloquear', 'Lock/unlock'], ['Mod+Alt+C', 'Copiar propiedades (con V se pegan)', 'Copy properties (with V to paste)'],
      ['Mod+/', 'Buscar acciones', 'Quick actions'], ['Mod+\\', 'Ocultar la interfaz', 'Hide UI'], ['Shift+R', 'Reglas', 'Rulers'],
    ] },
    { id: 'procreate', name: L('Procreate (gestos)', 'Procreate (gestures)'), gesture: true, items: [
      [L('Toque con 2 dedos', '2-finger tap'), 'Deshacer', 'Undo'], [L('Toque con 3 dedos', '3-finger tap'), 'Rehacer', 'Redo'],
      [L('Frotar con 3 dedos', '3-finger scrub'), 'Borrar la capa', 'Clear layer'], [L('Deslizar 3 dedos hacia abajo', '3-finger swipe down'), 'Copiar y pegar', 'Copy & paste'],
      [L('Toque con 4 dedos', '4-finger tap'), 'Pantalla completa', 'Full screen'], [L('Pellizco rápido', 'Quick pinch'), 'Ajustar el lienzo a la pantalla', 'Fit canvas to screen'],
      [L('Mantener al terminar un trazo', 'Hold at end of a stroke'), 'QuickShape (línea o forma perfecta)', 'QuickShape (perfect line or shape)'],
      [L('Mantener un dedo en el lienzo', 'Touch and hold on canvas'), 'Cuentagotas', 'Eyedropper'],
      [L('Toque con 2 dedos en una capa', '2-finger tap on a layer'), 'Bloqueo alfa', 'Alpha lock'], [L('Pellizcar capas', 'Pinch layers together'), 'Combinar capas', 'Merge layers'],
    ] },
    { id: 'docs', name: L('Google Docs y Word', 'Google Docs & Word'), items: [
      ['Mod+B', 'Negrita', 'Bold'], ['Mod+I', 'Cursiva', 'Italic'], ['Mod+U', 'Subrayado', 'Underline'], ['Mod+K', 'Insertar enlace', 'Insert link'],
      ['Mod+Alt+1', 'Título 1 (Mod+Alt+2 = título 2)', 'Heading 1 (Mod+Alt+2 = heading 2)'], ['Mod+Alt+M', 'Añadir comentario', 'Add comment'],
      ['Mod+Shift+7', 'Lista numerada (Docs)', 'Numbered list (Docs)'], ['Mod+Shift+8', 'Lista con viñetas (Docs)', 'Bulleted list (Docs)'],
      ['Mod+Enter', 'Salto de página', 'Page break'], ['Mod+Shift+C', 'Contar palabras (Docs)', 'Word count (Docs)'],
      [['Ctrl+H', '⌘+Shift+H'], 'Buscar y reemplazar (Docs)', 'Find and replace (Docs)'], ['Mod+/', 'Ver todos los atajos (Docs)', 'Show all shortcuts (Docs)'],
    ] },
    { id: 'excel', name: L('Excel y Sheets', 'Excel & Sheets'), items: [
      ['F2', 'Editar la celda', 'Edit cell'], [['Alt+Enter', 'Ctrl+Option+Enter'], 'Salto de línea dentro de la celda (Excel)', 'Line break inside a cell (Excel)'],
      ['Mod+;', 'Insertar la fecha de hoy', 'Insert today\'s date'], ['Mod+D', 'Rellenar hacia abajo', 'Fill down'], ['Mod+↓', 'Ir al final de los datos', 'Jump to end of data'],
      ['Mod+Shift+↓', 'Seleccionar hasta el final de los datos', 'Select to end of data'], ['Ctrl+Space', 'Seleccionar la columna', 'Select column'],
      ['Shift+Space', 'Seleccionar la fila', 'Select row'], [['F4', '⌘+T'], 'Referencia absoluta ($A$1) (Excel)', 'Absolute reference ($A$1) (Excel)'],
      ['Mod+Shift+L', 'Activar filtros (Excel)', 'Toggle filters (Excel)'], ['Mod+T', 'Convertir en tabla (Excel)', 'Format as table (Excel)'], ['Mod+1', 'Formato de celdas (Excel)', 'Format cells (Excel)'],
    ] },
    { id: 'youtube', name: 'YouTube', items: [
      ['K', 'Pausar / reproducir', 'Pause / play'], ['J', 'Retroceder 10 s (L avanza)', 'Back 10 s (L forward)'], ['F', 'Pantalla completa', 'Full screen'],
      ['M', 'Silenciar', 'Mute'], ['C', 'Subtítulos', 'Captions'], ['Shift+.', 'Más velocidad (Shift+, menos)', 'Faster (Shift+, slower)'],
      ['.', 'Siguiente fotograma en pausa (, anterior)', 'Next frame while paused (, previous)'], ['0', 'Ir al inicio (1-9 = 10-90 %)', 'Go to start (1-9 = 10-90 %)'], ['I', 'Minirreproductor', 'Miniplayer'],
    ] },
  ];

  const isMac = /Mac|iPhone|iPad/.test((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '');
  const MAC = { Mod: '⌘', Alt: '⌥ Option', Option: '⌥ Option', Shift: '⇧', Ctrl: '⌃ Ctrl', Delete: '⌫', Backspace: '⌫', Enter: '↩' };
  const SHOW = { Plus: '+', Mod: 'Ctrl' };
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const keysFor = (k, os) => Array.isArray(k) ? (os === 'mac' ? k[1] : k[0]) : k;
  function kbd(k, os, app) {
    if (app.gesture) return `<span class="sc-gest">${esc(k)}</span>`;
    // Las apps multiplataforma se adaptan al sistema elegido; las de un sistema concreto usan sus propios símbolos
    const mac = app.os ? app.os === 'mac' : os === 'mac';
    const label = t => (mac && MAC[t]) || SHOW[t] || t;
    return keysFor(k, os).split(' ').map(chord => chord.split('+').map(t => `<kbd>${esc(label(t))}</kbd>`).join('<i>+</i>')).join('<i class="sc-then">→</i>');
  }

  BD.tool({
    path: '/atajos', cat: 'media', title: 'Buscador de atajos', short: 'Atajos de teclado', icon: BD.icon('terminal'),
    colors: ['#cbb8ff', '#7b61ff'], desc: 'Busca atajos de teclado de Windows, macOS, Linux, VS Code, Photoshop, Blender, Figma y más.',
    render(view) {
      const body = win(view, { title: L('Buscador de atajos', 'Shortcut finder'), sub: L('Escribe lo que quieres hacer ("captura", "nueva capa", "duplicar") o una tecla.', 'Type what you want to do ("screenshot", "new layer", "duplicate") or a key.') });
      const ui = Object.assign({ app: 'all', os: isMac ? 'mac' : 'win', q: '' }, store.get('shortcuts:ui', {}));
      let fav = new Set(store.get('shortcuts:fav', []));
      body.innerHTML = `
        <div class="sc-head">
          <input type="search" id="scQ" class="sc-q" placeholder="${L('Buscar atajo…', 'Search shortcut…')}" value="${esc(ui.q)}" autocomplete="off" aria-label="${L('Buscar atajo', 'Search shortcut')}">
          <div id="scOs"></div>
        </div>
        <div class="sc-apps" id="scApps"></div>
        <div id="scList"></div>`;
      BD.seg($('#scOs', body), [['win', 'Windows / Linux'], ['mac', 'Mac']], ui.os, v => { ui.os = v; save(); paint(); });

      const save = () => store.set('shortcuts:ui', ui);
      const chips = () => [['all', L('Todos', 'All')], ['fav', '★ ' + L('Favoritos', 'Favorites')], ...APPS.map(a => [a.id, a.name])];
      function paintChips() {
        $('#scApps', body).innerHTML = chips().map(([id, n]) => `<button type="button" class="sc-chip ${ui.app === id ? 'on' : ''}" data-app="${id}">${esc(n)}</button>`).join('');
      }
      function paint() {
        const words = norm(ui.q).split(/\s+/).filter(Boolean);
        const groups = APPS.filter(a => ui.app === 'all' || ui.app === 'fav' || ui.app === a.id).map(a => ({ a, rows: a.items.map((it, i) => ({ it, i, id: a.id + '|' + i })).filter(({ it, id }) => {
          if (ui.app === 'fav' && !fav.has(id)) return false;
          if (!words.length) return true;
          const hay = norm([a.name, it[1], it[2], keysFor(it[0], ui.os)].join(' '));
          return words.every(w => hay.includes(w));
        }) })).filter(g => g.rows.length);
        const total = groups.reduce((n, g) => n + g.rows.length, 0);
        $('#scList', body).innerHTML = total ? groups.map(({ a, rows }) => `
          <section class="sc-group"><h3>${esc(a.name)} <span class="muted small">${rows.length}</span></h3>
            <div class="sc-rows">${rows.map(({ it, id }) => `
              <div class="sc-row">
                <span class="sc-keys">${kbd(it[0], ui.os, a)}</span>
                <span class="sc-desc">${esc(L(it[1], it[2]))}</span>
                <button type="button" class="sc-star ${fav.has(id) ? 'on' : ''}" data-fav="${id}" aria-label="${L('Favorito', 'Favorite')}" title="${L('Favorito', 'Favorite')}">${fav.has(id) ? '★' : '☆'}</button>
              </div>`).join('')}</div></section>`).join('')
          : `<p class="muted">${ui.app === 'fav' && !fav.size ? L('Aún no tienes favoritos: pulsa ☆ en un atajo para guardarlo aquí.', 'No favorites yet: press ☆ on a shortcut to keep it here.') : L('No encontré atajos con esa búsqueda.', 'No shortcuts match that search.')}</p>`;
      }
      $('#scQ', body).oninput = e => { ui.q = e.target.value; save(); paint(); };
      $('#scApps', body).onclick = e => { const b = e.target.closest('[data-app]'); if (!b) return; ui.app = b.dataset.app; save(); paintChips(); paint(); };
      $('#scList', body).onclick = e => {
        const b = e.target.closest('[data-fav]'); if (!b) return;
        fav.has(b.dataset.fav) ? fav.delete(b.dataset.fav) : fav.add(b.dataset.fav);
        store.set('shortcuts:fav', [...fav]); paint();
      };
      // "/" enfoca la búsqueda
      const onKey = e => { if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); $('#scQ', body).focus(); } };
      document.addEventListener('keydown', onKey);
      paintChips(); paint();
      $('#scQ', body).focus();
      return () => document.removeEventListener('keydown', onKey);
    },
  });
})();
