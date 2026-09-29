/* DEEP16 — 12x12 command icons for the ring menu, drawn by hand as pixel maps and coloured from the palette.
   A spell's icon is the star in its element's colours; an item's is the flask in its effect's. */
'use strict';
(function () {
  var D = window.D16;
  var MAPS = {
    attack: ['.........oo.', '........oSso', '.......oSso.', '......oSso..', '.oo..oSso...', '.ogo.Sso....', '..ogoso.....', '...ogo......', '..oLgo......', '.oLo.ogo....', 'oLo...oo....', '.o..........'],
    spell: ['.....oo.....', '.....oVo....', '....oVVo....', '.oooVVVVooo.', '.oVVVwwVVVo.', '..oVVwwVVo..', '...oVVVVo...', '...oVoVVo...', '..oVo.oVo...', '..oo...oo...', '............', '............'],
    item: ['....oooo....', '....owwo....', '.....oo.....', '....orRo....', '...orRRRo...', '..orRRwRRo..', '..orRRRRRo..', '..orrRRRRo..', '..orrrRRRo..', '...orrrro...', '....oooo....', '............'],
    dash: ['............', '.......oooo.', '......oLLLo.', '......oLLo..', '......oLLo..', '.cc...oLLLoo', '......oLLLLo', '.ccc..oLLLLo', '......ollllo', '..cc..oooooo', '............', '............'],
    disengage: ['............', '....oooo....', '...occcco...', '..occoocco..', '.oo.o..occo.', 'o.cco...oco.', '.occo...oco.', '..oco..occo.', '...o..occo..', '.....occo...', '.....ooo....', '............'],
    dodge: ['............', '..ooooooo...', '.occccccco..', '..ooooooco..', '.....ooco...', '..ooococo...', '.occccoco...', '..ooooooo...', '....ooooooo.', '...occcccco.', '....ooooooo.', '............'],
    help: ['....o.o.....', '...owowo.o..', '...owowoowo.', '.o.owowowo..', 'owoowwwwwo..', '.owowwwwwo..', '..owwwwwwo..', '..owwwwwo...', '...owwwwo...', '...owwwo....', '....ooo.....', '............'],
    hide: ['............', '............', '...oooooo...', '..oVVVVVVo..', '.oVVwwwwVVo.', 'oVVwwoowwVVo', '.oVVwwwwVVo.', '..oVVVVVVo..', '...oooooo...', '.oooooooooo.', '............', '............'],
    secondwind: ['............', '..oo...oo...', '.orro.orro..', 'orRRrorRRro.', 'orRRRRRwRro.', 'orRRRRwwwRo.', '.orRRRRwRo..', '..orRRRRo...', '...orRRo....', '....oro.....', '.....o......', '............'],
    surge: ['......oooo..', '.....oGGo...', '....oGGo....', '...oGGo.....', '..oGGGGGo...', '..ooooGGo...', '.....oGo....', '....oGo.....', '...oGo......', '..oGo.......', '..oo........', '............'],
    skills: ['...oooooo...', '..osSSSSso..', '.osSSgGSSso.', '.osSgGGgSso.', '.osgGGGGgso.', '.osSgGGgSso.', '.osSSgGSSso.', '..osSSSSso..', '..osSSSSso..', '...osSSso...', '....osso....', '.....oo.....'],
    actions: ['.....oo.....', '....occo....', '...occcco...', '.o...cc...o.', 'oco..cc..oco', 'occcccccccco', 'occcccccccco', 'oco..cc..oco', '.o...cc...o.', '...occcco...', '....occo....', '.....oo.....'],
    sacred: ['..w......oo.', '.www....oGgo', '..w....oGgo.', '......oGgo..', '.oo..oGgo.w.', '.ogo.Ggo.www', '..ogogo...w.', '...ogo......', '..oLgo......', '.oLo.ogo....', 'oLo...oo....', '.o..........'],
    lay: ['....o.o.....', '...ogogo.o..', '...ogogoogo.', '.o.ogogogo..', 'ogoogggggo..', '.ogogggggo..', '..ogggGggo..', '..oggGGgo...', '...oggggo...', '...ogggo....', '....ooo.....', '............'],
    free: ['............', '.ooo....ooo.', 'oSSSo..oSSSo', 'oS.So..oS.So', 'oSSSo..oSSSo', '.ooo....ooo.', '....o..o....', '...o....o...', '............', '..o......o..', '............', '............'],
    move: ['............', '...oo.......', '..oLLo......', '..oLLo..oo..', '..oLLo.oLLo.', '...oo..oLLo.', '.......oLLo.', '..oo....oo..', '.oLLo.......', '.oLLo.......', '..oo........', '............'],
    end: ['..oooooooo..', '..oggggggo..', '...ogwwgo...', '....owwo....', '.....oo.....', '....owwo....', '...ogwwgo...', '..oggwwggo..', '..oggggggo..', '..oooooooo..', '............', '............'],
    back: ['............', '....o.......', '...oco......', '..occooooo..', '.occcccccco.', '..occooooco.', '...oco...co.', '....o...oco.', '.......occo.', '...ooooocco.', '...occcccoo.', '...ooooooo..'],
    torch: ['.....oo.....', '....oGGo....', '...oGwwGo...', '...oGRRGo...', '....oRRo....', '....oLLo....', '....oLlo....', '....oLlo....', '....oLlo....', '....oLlo....', '....oLlo....', '.....oo.....'],
    lantern: ['.....oo.....', '....o..o....', '....oooo....', '...oLLLLo...', '..oLwwwwLo..', '..oLwGGwLo..', '..oLwRRwLo..', '..oLwGGwLo..', '..oLwwwwLo..', '...oLLLLo...', '....oooo....', '............']
  };
  function hex(c) { return c; }
  var BASE = function () {
    var P = D.PAL.ramps;
    return { o: P.outline[0], w: P.bone[2], s: P.silver[6], S: P.silver[4], g: P.gold[3], G: P.gold[4], r: P.red[3], R: P.red[4], L: P.leather[3], l: P.leather[1], c: P.glow[1], C: P.glow[2], V: P.violet[4], v: P.violet[3] };
  };
  // element / effect recolours: which palette colours stand in for the star's violets or the flask's reds
  var TINT = {
    fire: { V: ['fire', 1], v: ['fire', 0], w: ['fire', 2] }, cold: { V: ['glow', 1], v: ['blue', 2], w: ['glow', 2] },
    lightning: { V: ['gold', 3], v: ['gold', 2], w: ['gold', 4] }, acid: { V: ['moss', 2], v: ['moss', 1], w: ['orc', 3] },
    thunder: { V: ['silver', 5], v: ['silver', 3], w: ['bone', 2] }, force: {}, radiant: { V: ['gold', 4], v: ['gold', 3], w: ['bone', 2] },
    heal: { V: ['moss', 2], v: ['moss', 1], w: ['bone', 2] }, buff: { V: ['glow', 2], v: ['glow', 1], w: ['bone', 2] },
    antitoxin: { r: ['moss', 1], R: ['moss', 2] }, damage: { r: ['fire', 0], R: ['fire', 1] }, revive: { r: ['bone', 0], R: ['bone', 1] }, cure: { r: ['glow', 0], R: ['glow', 1] }
  };
  var cache = {};
  D.icon = function (name, tint) {
    var key = name + '|' + (tint || '');
    if (cache[key]) return cache[key];
    var map = MAPS[name] || MAPS.spell, col = BASE(), t = TINT[tint] || {};
    Object.keys(t).forEach(function (k) { col[k] = D.PAL.ramps[t[k][0]][t[k][1]]; });
    var cv = document.createElement('canvas'); cv.width = 12; cv.height = 12;
    var x = cv.getContext('2d');
    for (var r = 0; r < 12; r++) for (var q = 0; q < 12; q++) { var ch = map[r][q]; if (ch !== '.' && col[ch]) { x.fillStyle = col[ch]; x.fillRect(q, r, 1, 1); } }
    cache[key] = cv;
    return cv;
  };
  // which icon and tint a command, a spell or an item wears
  D.iconFor = function (e) {
    if (e.kind === 'spell') {
      var sp = e.sp || {}, k = sp.kind;
      if (k === 'heal' || k === 'cure') return D.icon('spell', 'heal');
      if (k === 'buff' || k === 'teleport') return D.icon('spell', 'buff');
      return D.icon('spell', { fire: 'fire', cold: 'cold', lightning: 'lightning', acid: 'acid', thunder: 'thunder', bludgeoning: 'cold', radiant: 'radiant' }[sp.el] || 'force');
    }
    if (e.kind === 'level') return D.icon('spell', ['thunder', 'cold', 'acid', 'lightning', 'fire', 'fire', 'force', 'force', 'force', 'force'][e.level] || 'force');
    if (e.kind === 'item') return D.icon('item', e.use && e.use.effect === 'heal' ? '' : e.use && e.use.effect);
    return D.icon(e.icon || e.id);
  };
})();
