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
    search: ['............', '............', '...oooooo...', '..oVVVVVVo..', '.oVwwwwwwVo.', 'oVwwwooowwVo', '.oVwwwwwwVo.', '..oVVVVVVo..', '...oooooo...', '............', '............', '............'],
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
    lantern: ['.....oo.....', '....o..o....', '....oooo....', '...oLLLLo...', '..oLwwwwLo..', '..oLwGGwLo..', '..oLwRRwLo..', '..oLwGGwLo..', '..oLwwwwLo..', '...oLLLLo...', '....oooo....', '............'],
    // THE MASCOTS' OWN (10-08, Griz: "Lobstamonkee Icons in general"): each kit's blow and each ability its own glyph -- the orange fist, the claw, the dice, the sling; the specials by what
    // they look like on the floor (js/mpmon.js MP.KIT names them). F/f the fire ramp's orange, M/m the greens, b/B the blues, p pink -- BASE below
    fist: ['............', '...oo.oo.oo.', '..oFFoFFoFFo', '..oFFFFFFFFo', '.ooFFFFFFFfo', 'oFFoFFFFFFfo', 'oFFFFFFFffo.', '.oFFFFFfffo.', '..oFFffffo..', '...offfffo..', '....ooooo...', '............'],
    claw: ['............', '..oooo......', '.oRRRRo.....', 'oRRRRRRo....', 'oRRooRRRo...', '.oo..oRRRo..', '......oRRRoo', '...oooooRRRo', '..oRRRRRRRo.', '.oRRRRRRRo..', '..oooooo....', '............'],
    dice: ['..o......o..', '..o.oooo.o..', '..ooowwwooo.', '..owwowwwwo.', '..owwwwowwo.', '..owowwwwwo.', '..owwwwwowo.', '..owwowwwwo.', '...oooooooo.', '............', '............', '............'],
    sling: ['............', '.oo......oo.', '.oLo....oLo.', '..oLo..oLo..', '...oLooLo...', '....oLLo....', '....oLLo....', '...oLLLLo...', '..oLsSSLo...', '..oLSSSLo...', '...oooo.....', '............'],
    taunt: ['....oooo....', '..ooGGGGoo..', '.oGGoRRoGGo.', 'oGGGoRRoGGGo', 'oGGGoRRoGGGo', 'oGGGoRRoGGGo', 'oGGGGooGGGGo', '.oGGoRRoGGo.', '.oGGGooGGGo.', '..ooGGGGoo..', '....oooo....', '............'],
    denim: ['............', '..oo....oo..', '.obbo..obbo.', 'obbbbooBbbbo', 'obbBBBBBBbbo', 'obbBoBBoBbbo', 'obbBBBBBBbbo', '.ooBBBBBBoo.', '...oBBBBo...', '...oBBBBo...', '...oooooo...', '............'],
    cannonball: ['............', '......oooo..', '.....oSSSSo.', '....oSsssSSo', '....oSssssSo', '..c.oSsssSSo', '.cc.oSSSSSSo', '..c..oSSSSo.', '......oooo..', '............', '............', '............'],
    hug: ['............', '..oooooooo..', '.oFFoooooFo.', '.oFo.....oFo', '.oFo.oRo.oFo', 'oFFo.oRo.oFF', '.oFo.....oFo', '.oFFo...oFFo', '..oFFFFFFFo.', '...ooooooo..', '............', '............'],
    bubble: ['....oooo....', '..ooVVVVoo..', '.oVVwwVVVVo.', 'oVVwVVVVVVVo', 'oVwVVVVVVVVo', 'oVVVVVVVVVVo', 'oVVVVVVVVVVo', 'oVVVVVVVVVvo', '.oVVVVVVvvo.', '..ooVVvvoo..', '....oooo....', '............'],
    gaze: ['............', '............', '...oooooo...', '..oVVVVVVo..', '.oVVwooVVVo.', 'oVVwoVVoVVVo', '.oVVoooVVVo.', '..oVVVVVVo..', '...oooooo...', '............', '............', '............'],
    screen: ['............', '.......ooo..', '..oo..oVVVo.', '.oVVooVVVVo.', 'oVwoVVVVVVVo', 'oVoVVVVVVVVo', 'oVwoVVVVVVVo', '.oVVooVVVVo.', '..oo..oVVVo.', '.......ooo..', '............', '............'],
    eye: ['............', '.....o......', '....oGo.....', '..oooGooo...', '.oVVoGoVVo..', 'oVVoGGGoVVVo', '.oVVoGoVVo..', '..oooGooo...', '....oGo.....', '.....o......', '............', '............'],
    spotlight: ['.....oo.....', '....oGGo....', '....oGGo....', '...oGGGGo...', '...oGggGo...', '..oGgggGGo..', '..oGggggGo..', '.oGgggggGGo.', '.oGgggggggo.', 'oGGGGGGGGGGo', '.oooooooooo.', '............'],
    hat: ['............', '...oooooo...', '...osSSSso..', '...osSSSso..', '...osSSSso..', '...osGGGso..', '.ooosSSSsooo', 'oSSSSSSSSSSo', '.oooooooooo.', '............', '............', '............'],
    flame: ['.....o......', '....oFo.....', '...oFFo.o...', '...oFFooFo..', '..oFFGFFFo..', '..oFGGGFFo..', '.oFFGwGGFFo.', '.oFGGwwGGFo.', '.oFFGGGGFfo.', '..oFFFFFfo..', '...oooooo...', '............'],
    distancing: ['.....o......', '....ooo.....', '..ooVVVoo...', '.oVVoooVVo..', 'oVVo...oVVo.', 'oVo.....oVoo', 'oVVo...oVVo.', '.oVVoooVVo..', '..ooVVVoo...', '.....o......', '....ooo.....', '............'],
    viral: ['............', '.o.......o..', 'oFo..o..oFo.', 'oFo.oFo.oFo.', '.ooooFoooo..', '...oFFFo....', '...oFGFo....', '..oFFGFFo...', '..oFGGGFo...', '...ooooo....', '............', '............'],
    scuttle: ['............', '.cc.ooo.....', '....oFFo.oo.', '.cc.oFFFoFFo', '....oFFFFFFo', '.cc..oFFFFo.', '.....oFoFFo.', '....oFFooFFo', '....oFo..oo.', '.....o......', '............', '............'],
    heart: ['............', '..ooo..ooo..', '.oMMMooMMMo.', 'oMmMMMMMMMMo', 'oMMMMMMMMMMo', 'oMMMMMMMMMMo', '.oMMMMMMMMo.', '..oMMMMMMo..', '...oMMMMo...', '....oMMo....', '.....oo.....', '............'],
    group: ['............', '.oo.oo......', 'oMMoMMo.oooo', 'oMMMMMooMMMo', '.oMMMoomMMMo', '..oMo.oMMMo.', '...o...oMo..', '.oo.oo..o...', 'oMMoMMo.....', 'oMMMMMo.....', '.oMMMo......', '..oMo.......'],
    honk: ['............', '...oooo.....', '..oFFFFo....', '.oFFFFFFoo..', '.oFFFFFFFFo.', '..oFFFFFFFo.', '...ooFFFoo.c', '.....ooo..cc', '..........c.', '............', '............', '............'],
    fountain: ['............', '.....oo.....', '....oMMo....', '...oMMMMo...', '..oMMooMMo..', '.oMo....oMo.', 'oMo......oMo', '.oMo....oMo.', '..oMMooMMo..', '...oMMMMo...', '....oMMo....', '............'],
    lifeline: ['............', '.oo......oo.', 'oMMo....oMMo', 'oMMo....oMMo', '.ooMoooMoo..', '...oMMMo....', '....ooo.....', '............', '............', '............', '............', '............'],
    // RING2's two rings (js/ui.js cmds2): ACTIONS in the action's yellow, BONUSES a B in the bonus action's blue
    actions2: ['.....oo.....', '....oGGo....', '...oGGGGo...', '.o...GG...o.', 'oGo..GG..oGo', 'oGGGGGGGGGGo', 'oGGGGGGGGGGo', 'oGo..GG..oGo', '.o...GG...o.', '...oGGGGo...', '....oGGo....', '.....oo.....'],
    bonuses: ['....oooo....', '..ooCCCCoo..', '.oCCCCCCCCo.', 'oCCwwwwoCCCo', 'oCCwooowCCCo', 'oCCwwwwoCCCo', 'oCCwooowCCCo', 'oCCwwwwoCCCo', '.oCCCCCCCCo.', '..ooCCCCoo..', '....oooo....', '............']
  };
  function hex(c) { return c; }
  var BASE = function () {
    var P = D.PAL.ramps;
    return { o: P.outline[0], w: P.bone[2], s: P.silver[6], S: P.silver[4], g: P.gold[3], G: P.gold[4], r: P.red[3], R: P.red[4], L: P.leather[3], l: P.leather[1], c: P.glow[1], C: P.glow[2], V: P.violet[4], v: P.violet[3],
      F: P.fire[1], f: P.fire[0], M: P.moss[2], m: P.orc[3], b: P.blue[2], B: P.blue[3], p: P.accent[0] }; // (the Mascots' glyphs, 10-08: the fire ramp's orange, the greens, the blues, pink)
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
