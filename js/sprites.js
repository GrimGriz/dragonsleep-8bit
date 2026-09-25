/* DRAGONSLEEP — people: field walkers (16x16) and battle figures (16x24), built from
   hand-typed templates + per-person palettes and styles. */
'use strict';
(function () {
  var DS = window.DS, Pix = DS.Pix, N = DS.N;

  // palette keys: o outline, h/H hair, s/S skin, e eye, c/C cloth, x trim, p pants, b boots, t tusk, w weapon, W weapon dark, k shield
  var FIELD = {
    down: [
      '................',
      '.....oooooo.....',
      '....ohhhhhho....',
      '...ohhhhhhhho...',
      '...ohhhhhhhho...',
      '...ohssssssho...',
      '...ossessesso...',
      '...osssssssso...',
      '....oSssssSo....',
      '...occxccxcco...',
      '..osccccccccso..',
      '..osccxxxxccso..',
      '...occcccccco...',
      '....oppoopppo...',
      '....obbo.obbo...',
      '.....oo...oo....'],
    up: [
      '................',
      '.....oooooo.....',
      '....ohhhhhho....',
      '...ohhhhhhhho...',
      '...ohhhhhhhho...',
      '...ohhhhhhhho...',
      '...ohHhhhhHho...',
      '...oHhhhhhhHo...',
      '....oHHHHHHo....',
      '...occcccccco...',
      '..osccccccccso..',
      '..osccxxxxccso..',
      '...occcccccco...',
      '....oppoopppo...',
      '....obbo.obbo...',
      '.....oo...oo....'],
    side: [
      '................',
      '......ooooo.....',
      '.....ohhhhho....',
      '....ohhhhhhho...',
      '....ohhhhhhho...',
      '....ohhhhssso...',
      '....ohhhsssseo..',
      '....ohhssssso...',
      '.....oHSssso....',
      '.....occcco.....',
      '....occcccco....',
      '....occsscco....',
      '....occxxxco....',
      '.....oppppo.....',
      '.....obbobbo....',
      '......oo.oo.....'],
    side2: [
      '................',
      '......ooooo.....',
      '.....ohhhhho....',
      '....ohhhhhhho...',
      '....ohhhhhhho...',
      '....ohhhhssso...',
      '....ohhhsssseo..',
      '....ohhssssso...',
      '.....oHSssso....',
      '.....occcco.....',
      '....occcccco....',
      '....occsscco....',
      '....occxxxco....',
      '....oppoopo.....',
      '...obbo..obbo...',
      '...oo.....oo....']
  };
  // battle stance, facing right (flipped at draw time so heroes face left)
  var BATTLE = {
    stand: [
      '................',
      '................',
      '......ooooo.....',
      '.....ohhhhho....',
      '....ohhhhhhho...',
      '....ohhhhhhho...',
      '....ohhhhssso...',
      '....ohhhsssseo..',
      '....ohhssssso...',
      '.....oHSssso....',
      '......oSSSo.....',
      '.....occccco....',
      '....occcccccо...',
      '....occcccccso..',
      '....oCcccccCso..',
      '....oCxxxxxCo...',
      '.....occcccо....',
      '.....opppppo....',
      '.....opp.ppo....',
      '.....opo.opo....',
      '.....opo.opo....',
      '.....obbo.obbo..',
      '.....obbo.obbo..',
      '......oo...oo...'],
    act: [
      '................',
      '................',
      '.......ooooo....',
      '......ohhhhho...',
      '.....ohhhhhhho..',
      '.....ohhhhhhho..',
      '.....ohhhhssso..',
      '.....ohhhsssseo.',
      '.....ohhssssso..',
      '......oHSssso...',
      '.......oSSSo....',
      '......occccco...',
      '.....occcccccso.',
      '.....occcccccss.',
      '.....oCccccccoo.',
      '.....oCxxxxxCo..',
      '......occcccо...',
      '.....oppppppo...',
      '....opp...ppo...',
      '...opo.....opo..',
      '...opo.....opo..',
      '..obbo.....obbo.',
      '..obbo.....obbo.',
      '...oo.......oo..'],
    cast: [
      '...........ss...',
      '...........so...',
      '......ooooocs...',
      '.....ohhhhhc....',
      '....ohhhhhhhc...',
      '....ohhhhhhho...',
      '....ohhhhssso...',
      '....ohhhsssseo..',
      '....ohhssssso...',
      '.....oHSssso....',
      '......oSSSo.....',
      '.....occccco....',
      '....occcccccо...',
      '....occcccccо...',
      '....oCcccccCo...',
      '....oCxxxxxCo...',
      '.....occcccо....',
      '.....opppppo....',
      '.....opp.ppo....',
      '.....opo.opo....',
      '.....opo.opo....',
      '.....obbo.obbo..',
      '.....obbo.obbo..',
      '......oo...oo...'],
    hurt: [
      '................',
      '................',
      '................',
      '....ooooo.......',
      '...ohhhhho......',
      '..ohhhhhhho.....',
      '..ohhhhhhho.....',
      '..ohhhhssso.....',
      '..ohhhsSSSeo....',
      '..ohhssssso.....',
      '...oHSssso......',
      '....oSSSo.......',
      '...occccco......',
      '..occcccccо.....',
      '..occcccccso....',
      '..oCcccccCso....',
      '...oCxxxxxCo....',
      '....occcccо.....',
      '....opppppo.....',
      '....opp.ppo.....',
      '....opo..opo....',
      '....obbo..obbo..',
      '....obbo..obbo..',
      '.....oo....oo...'],
    ko: [ // 24 wide x 16 tall, lying down
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '..ooooo.................',
      '.ohhhhhoooooooooooooo...',
      'ohhhhhhhsocccccccxpppbo.',
      'ohhhssssSoccccccCxpppbo.',
      'ohhhsesssoCCCCCCCxpppbo.',
      '.ohhsssssooooooooooooo..',
      '..ooooo.................',
      '........................',
      '........................']
  };

  function pad(rows, w) { return rows.map(function (r) { r = r.replace(/о/g, 'o'); while (r.length < w) r += '.'; return r.slice(0, w); }); }
  // hairstyles post-process the character grid
  function styleGrid(rows, style, view) {
    var g = rows.map(function (r) { return r.split(''); });
    function sub(from, to, y0, y1) { for (var y = y0 || 0; y <= (y1 == null ? g.length - 1 : y1); y++) for (var x = 0; x < g[y].length; x++) if (g[y][x] === from) g[y][x] = to; }
    var H = g.length;
    var hy1 = H === 16 ? 8 : 10; // last head row
    if (style.bald) { sub('h', 's', 0, hy1); sub('H', 'S', 0, hy1); }
    if (style.hood) { sub('h', 'c', 0, hy1); sub('H', 'C', 0, hy1); }
    if (style.hat) { // brimmed cap over the crown
      var top = H === 16 ? 1 : 2;
      for (var x = 0; x < g[top].length; x++) if (g[top][x] === 'o' || g[top + 1][x] === 'h') { g[top + 1][x] = g[top + 1][x] === '.' ? '.' : 'x'; }
      for (var x2 = 0; x2 < g[top + 2].length; x2++) if (g[top + 2][x2] === 'h' || g[top + 2][x2] === 'o') g[top + 2][x2] = 'x';
    }
    if (style.long && view !== 'up') { // hair down past the shoulders
      var y0 = H === 16 ? 8 : 10;
      for (var y = y0; y < y0 + 3 && y < H; y++) {
        if (view === 'down') { g[y][3] = 'h'; g[y][12] = 'h'; g[y][2] = g[y][2] === '.' ? 'o' : g[y][2]; g[y][13] = g[y][13] === '.' ? 'o' : g[y][13]; }
        if (view === 'side') { g[y][5] = 'h'; g[y][4] = 'o'; }
      }
    }
    if (style.long && view === 'up') { for (var yy = 9; yy < 12; yy++) for (var xx = 4; xx < 12; xx++) if (g[yy][xx] === 'c') g[yy][xx] = 'h'; }
    if (style.beard && view !== 'up') {
      var by = H === 16 ? 7 : 8;
      for (var y3 = by; y3 <= by + 2 && y3 < H; y3++) for (var x3 = 0; x3 < g[y3].length; x3++) if (g[y3][x3] === 's' || g[y3][x3] === 'S') g[y3][x3] = 'H';
    }
    if (style.tusks && view !== 'up') {
      var ty = H === 16 ? 7 : 8;
      if (view === 'down') { g[ty][6] = 't'; g[ty][9] = 't'; } else { for (var x4 = g[ty].length - 1; x4 >= 0; x4--) if (g[ty][x4] === 's') { g[ty][x4] = 't'; break; } }
    }
    if (style.robe) { // cloth down to the feet
      for (var y5 = 0; y5 < H; y5++) for (var x5 = 0; x5 < g[y5].length; x5++) if (g[y5][x5] === 'p') g[y5][x5] = 'C';
    }
    if (style.apron && view !== 'up') {
      for (var y6 = H === 16 ? 10 : 13; y6 < (H === 16 ? 13 : 17); y6++) for (var x6 = 0; x6 < g[y6].length; x6++) if (g[y6][x6] === 'c' && (view === 'side' ? x6 > 5 : (x6 > 4 && x6 < 11))) g[y6][x6] = 'a';
    }
    return g.map(function (r) { return r.join(''); });
  }
  function palFor(look) {
    var skin = look.skin || '#F0C8A0';
    return {
      o: look.outline || '#101018', h: look.hair || '#6a4020', H: look.hairD || DS.mix(look.hair || '#6a4020', '#000000', 0.35),
      s: skin, S: look.skinD || DS.mix(skin, '#6a3020', 0.3), e: '#101018', c: look.cloth || '#4060a0', C: look.clothD || DS.mix(look.cloth || '#4060a0', '#000000', 0.35),
      x: look.trim || '#c0a040', p: look.pants || '#503020', b: look.boots || '#2a1a10', t: '#f8f8e8', a: look.apron || '#d8d0c0'
    };
  }
  var cache = {};
  // field walker: returns {down:[c0,c1], up:[c0,c1], left:[c0,c1], right:[c0,c1]}
  DS.walker = function (look) {
    var key = 'w:' + JSON.stringify(look);
    if (cache[key]) return cache[key];
    var pal = palFor(look), st = look.style || {};
    function mk(tpl, view) { return DS.fromRows(styleGrid(pad(tpl, 16), st, view), pal); }
    var down = mk(FIELD.down, 'down'), up = mk(FIELD.up, 'up'), side = mk(FIELD.side, 'side'), side2 = mk(FIELD.side2, 'side');
    if (look.extra) look.extra(down, 'down', pal), look.extra(up, 'up', pal), look.extra(side, 'side', pal), look.extra(side2, 'side', pal);
    var out = {
      down: [down.canvas(), down.flipH().canvas()],
      up: [up.canvas(), up.flipH().canvas()],
      right: [side.canvas(), side2.canvas()],
      left: [side.flipH().canvas(), side2.flipH().canvas()]
    };
    return (cache[key] = out);
  };
  // battle figure (faces LEFT): {stand, act, cast, hurt, ko, win}
  DS.fighter = function (look, weapon) {
    var key = 'b:' + JSON.stringify(look) + ':' + weapon;
    if (cache[key]) return cache[key];
    var pal = palFor(look), st = look.style || {};
    var out = {};
    ['stand', 'act', 'cast', 'hurt', 'ko'].forEach(function (pose) {
      var w = pose === 'ko' ? 24 : 16;
      var p = DS.fromRows(styleGrid(pad(BATTLE[pose], w), st, 'side'), pal);
      if (pose !== 'ko') drawWeapon(p, weapon, pose, pal);
      if (look.bextra) look.bextra(p, pose, pal);
      out[pose] = p.flipH().canvas();
    });
    out.win = out.cast;
    return (cache[key] = out);
  };
  function drawWeapon(p, weapon, pose, pal) {
    var steel = '#d8d8e8', steelD = '#8888a0', wood = '#8a5a2a', woodD = '#5a3a1a';
    if (weapon === 'flail') {
      if (pose === 'act') { p.line(13, 13, 15, 6, wood); p.line(15, 6, 15, 3, '#6a6a6a'); p.rect(14, 1, 2, 3, wood); }
      else if (pose === 'cast') { p.line(12, 2, 12, 10, wood); }
      else { p.line(12, 13, 14, 20, wood); p.line(14, 20, 15, 22, '#6a6a6a'); p.rect(14, 21, 2, 3, wood); }
    } else if (weapon === 'sword') {
      if (pose === 'act') { p.line(14, 13, 15, 3, steel); p.set(14, 12, '#c0a040'); p.set(15, 12, '#c0a040'); }
      else if (pose !== 'cast') { p.line(13, 14, 15, 21, steel); p.set(13, 14, '#c0a040'); }
      // shield on the near arm
      p.rect(3, 12, 4, 6, pal.k || '#6a7a8a'); p.frame(3, 12, 4, 6, '#101018'); p.set(4, 14, '#c8c8d8'); p.set(5, 15, '#4a8a4a');
    } else if (weapon === 'dagger') {
      if (pose === 'act') { p.line(14, 13, 15, 10, steel); }
      else if (pose !== 'cast') { p.line(13, 14, 14, 16, steel); }
      if (pose === 'cast' || pose === 'stand') { p.set(3, 13, '#f8d878'); p.set(3, 12, '#fca044'); } // the candle
    } else if (weapon === 'staff') {
      if (pose === 'act') { p.line(10, 22, 15, 4, wood); p.set(15, 3, '#fca044'); }
      else if (pose === 'cast') { p.line(12, 0, 12, 12, wood); p.set(12, 0, '#f8d878'); }
      else { p.line(13, 5, 13, 23, wood); p.set(13, 4, '#fca044'); }
    }
  }

  // ------------------------------------------------------------------ the looks
  DS.LOOKS = {
    barley: { hair: '#d8b060', skin: '#e8b890', cloth: '#6a7a3a', trim: '#8a5a2a', pants: '#5a4028', boots: '#3a2818' },
    aurdin: { hair: '#8a5a30', skin: '#f0c8a0', cloth: '#a06a38', clothD: '#6a4020', trim: '#f8d040', pants: '#6a4020', style: { robe: true } },
    vivian: { hair: '#6a2818', skin: '#f0c8a8', cloth: '#2a5a5a', trim: '#f8d878', pants: '#2a2a38', boots: '#1a1a24', style: { long: true } },
    lymen: { hair: '#1a2418', skin: '#7aa06a', skinD: '#4a7040', cloth: '#9aa0a8', clothD: '#5a6068', trim: '#4aa04a', pants: '#6a6048', style: { tusks: true } },
    // townsfolk
    winters: { hair: '#e0e0e0', skin: '#e0c0a0', cloth: '#2a2a38', trim: '#c0c0d0', pants: '#1a1a24' },
    aldwin: { hair: '#8a8a8a', skin: '#e0b890', cloth: '#7a7a70', trim: '#c0a040', style: { robe: true } },
    marko: { hair: '#9a8a7a', skin: '#e8b890', cloth: '#3a4a6a', trim: '#9a7a4a', style: { beard: true } },
    calla: { hair: '#1a1a1a', skin: '#f0c8a8', cloth: '#3a3a44', apron: '#d8d0c0', style: { apron: true } },
    smith: { hair: '#3a2a1a', skin: '#d8a078', cloth: '#6a4a3a', apron: '#4a3a30', style: { apron: true, beard: true } },
    merchant: { hair: '#6a4a2a', skin: '#f0c8a0', cloth: '#7a2a2a', trim: '#f8d040' },
    percy: { hair: '#9a7a5a', skin: '#f0c8a0', cloth: '#e8e0d0', apron: '#6a5a4a', style: { apron: true } },
    marta: { hair: '#c8c0b0', skin: '#e8b890', cloth: '#3a3a4a', apron: '#b0a080', style: { apron: true, hood: true } },
    hessle: { hair: '#c0c0c0', skin: '#e8c0a0', cloth: '#5a5a60', apron: '#6a5a40', style: { apron: true } },
    kessler: { hair: '#1a1a1a', skin: '#f0c8a0', cloth: '#1a1a24', trim: '#c0a040' },
    guard: { hair: '#4a3a2a', skin: '#e8b890', cloth: '#6a6a78', trim: '#a0a0b0', style: { hat: true } },
    dwarf: { hair: '#a04a2a', skin: '#e0a080', cloth: '#5a5a6a', trim: '#c0a040', style: { beard: true } },
    orc: { hair: '#2a3020', skin: '#6a8a5a', cloth: '#6a4a3a', style: { bald: true, tusks: true } },
    papa: { hair: '#2a3020', skin: '#8a9a80', cloth: '#5a4a3a', style: { bald: true, tusks: true } },
    lucia: { hair: '#e8e8e8', skin: '#f0c8a8', cloth: '#2a3a2a', trim: '#c0a040', style: { robe: true } },
    warda: { hair: '#2a2a2a', skin: '#8aa07a', cloth: '#2a2a3a', trim: '#c0a040', style: { tusks: true } },
    worker: { hair: '#5a3a1a', skin: '#e0a880', cloth: '#7a6a4a', pants: '#4a3a2a' },
    worker2: { hair: '#2a1a0a', skin: '#b07850', cloth: '#5a6a4a', pants: '#3a3a2a' },
    girl: { hair: '#c08040', skin: '#f0c8a8', cloth: '#8a4a6a', style: { long: true, robe: true } },
    boy: { hair: '#4a2a1a', skin: '#f0c8a0', cloth: '#4a7a9a', pants: '#3a3a4a' },
    noble: { hair: '#2a1a0a', skin: '#f0c8a8', cloth: '#5a2a6a', trim: '#f8d040', pants: '#2a1a3a' },
    rogue: { hair: '#1a1a1a', skin: '#e0b890', cloth: '#2a2a2a', trim: '#6a6a6a', style: { hood: true } },
    skarn: { hair: '#1a1a1a', skin: '#8a9a6a', cloth: '#6a5a4a', trim: '#b0b0b0', style: { bald: true, tusks: true } },
    oldhand: { hair: '#d0d0d0', skin: '#d8a880', cloth: '#5a4a3a', style: { beard: true } },
    clerk: { hair: '#4a3a2a', skin: '#f0c8a0', cloth: '#4a4a5a', trim: '#c0c0c0' },
    innlady: { hair: '#7a5a3a', skin: '#f0c8a0', cloth: '#5a6a4a', apron: '#d8d0c0', style: { apron: true, robe: true } },
    kid: { hair: '#c09050', skin: '#f0c8a0', cloth: '#9a7a5a', pants: '#5a4a3a' },
    elsbeth: { hair: '#9a6a3a', skin: '#f0c8a8', cloth: '#4a5a7a', style: { long: true, robe: true } },
    gnoll: { hair: '#8a6a3a', skin: '#b08a50', cloth: '#5a3a2a', style: { hood: false } },
    sylvia: { hair: '#6a6a7a', skin: '#f0c8a8', cloth: '#4a3a6a', trim: '#c0c0e0', style: { long: true, robe: true } },
    priest: { hair: '#6a6a6a', skin: '#e8b890', cloth: '#d8d0b8', trim: '#c0a040', style: { robe: true } },
    sailor: { hair: '#8a6a4a', skin: '#d8a070', cloth: '#6a8aa8', pants: '#3a3a4a' },
    cutter: { hair: '#c8b8a0', skin: '#d8b080', cloth: '#7a6a5a', style: { robe: true, hat: true } },
    // the wagon night
    goblin: { hair: '#2a3020', skin: '#7aa04a', cloth: '#6a5a3a', pants: '#4a3a2a', style: { bald: true } },
    amara: { hair: '#2a1a2a', skin: '#e8c0a0', cloth: '#3a2048', trim: '#b8a0d8', style: { robe: true, hood: true } },
    willem: { hair: '#e8d8a0', skin: '#f0c8a8', cloth: '#2a4a7a', trim: '#d8d8f0', style: { robe: true } },
    kat: { hair: '#6a4a2a', skin: '#f0c8a8', cloth: '#6a4a2a', trim: '#c8b890', style: { long: true, robe: true } },
    percy: { hair: '#9a7a5a', skin: '#f0c8a0', cloth: '#e8e0d0', apron: '#6a5a4a', style: { apron: true, beard: true } },
    ned: { hair: '#4a3a2a', skin: '#f0c8a0', cloth: '#3a3a6a', trim: '#c0c0e0', style: { robe: true } }
  };
})();
