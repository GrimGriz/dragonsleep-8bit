/* DEEP16 -- THE COUNTER: a Silverton keeper's talking portrait, their words, and their shelves (10-21, the Winters seat, started by the lanes desk). Griz, to the
   desk: "There's a handful of vendor art in Fresh, start a seat to get Winters set up for giving the starter mission and doing sales"; of the sheets, 10-20: "Those
   are for the new silverton buy/sell etc. interfaces - can wait until 16 bit silverton map gets made" (it is made: js/town.js).

   The screen (C.Counter): the keeper's portrait on the left over a counter -- the art desk's waist-up sheets, cut by tools/portrait-sheet.py into deep16/art/pt_<id>
   (idle, the four dialogue stills, the work) -- their words on the right, and every choice a button: a click, or the arrows and E, X back (his aim for every second-
   game screen, 10-21: "playable by mouse only as well as our other options"). One screen for every keeper, driven by a script (a generator yielding sc.say, sc.ask,
   sc.shelves); a keeper whose sales come later gets the same screen with their words only.

   Ambrose Winters (C.winters): the first game's scene (js/events.js S.winters, S.wintersWork) on the grid -- WORK, THE SHELVES, LEAVE; Winters' Errands, the first
   game's opener (content/quests.json `errands`), its two errands walked to Androit and Casper Venn (their rooms) and to Mical and Brennan (their doors), each
   person's own first-game words (content/npcs.json) with what they do (set, take: C.effects); his shelves by the first game's shop rules (js/scenes.js Shop:
   content/shops.json `winters`, buysNoSell -- he buys what any shop buys and what a quest gave; open after the first errand, as his words say). Held: his Ring of
   Binding and the copper scraping (the first game's lake story -- the second game's story pass decides).

   The flags, the pack and the purse are the floor's (js/roam.js B.roam.flags, B.inv, B.roam.silver), which the house writes into its save (js/house.js H.fromFloor);
   the renown is the save's (H.cur.renown). C.journal is the house's JOURNAL (the one menu, js/menu.js JournalPage), C.paintPin the pinned step's marker on the floor. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, I = D.input, C = D.counter = {};
  // THE VENDORS, one shape for every keeper (RULED 10-21, Griz: "Winters should only buy magic items - art for all the vendors like this should come in at some
  // point"): by their door's name (js/town.js T.DOORS), each `sheet` its talking portrait (tools/portrait-sheet.py); `shop` the first game's shop it sells from
  // (content/shops.json: its stock, prices, greeting, thanks) -- a counter with no shop speaks only; `buys` what it takes in (default the first game's rule for that
  // shop, js/scenes.js Shop; 'magic' only magic items, C.magic); `script` a scene of its own (Winters'); `own` Griz's own, waiting on his word. A new vendor is a line
  C.VENDORS = {
    winters: { sheet: 'pt_winters', shop: 'winters', buys: 'magic', script: 'winters' }, // (his errands, then his shelves; he buys magic items only -- his word above)
    casper: { sheet: 'pt_casper' }, androit: { sheet: 'pt_androit' }, aldric: { sheet: 'pt_aldric' },
    hessle: { sheet: 'pt_hessle', script: 'hessle' }, // (the Weigh-House board's bounties, the first game's S.hessle: C.hessle, 10-22)
    kessler: { sheet: 'pt_kessler', shop: 'kessler' }, calla: { sheet: 'pt_calla', shop: 'calla' }, // (the pawnbroker and the apothecary sell and buy by their first-game shops -- 10-21, Griz: "Yes, open Kessler's and Calla Voss's counters with their first-game shops")
    barber: { sheet: 'pt_barber' },
    marin: { sheet: 'pt_marin' }, kasten: { sheet: 'pt_kasten', shop: 'kasten' }, // (10-21, Griz: "is the marin voss lack the zip file I just put in Fresh? Lucia and 88 should be in there now"; Kasten Wheal the chandler sells by his first-game shop since 10-22, his 10-21 close: "shops and the rest of NPC portraits next session")
    lucia: { sheet: 'pt_lucia', name: 'Lucia', shop: 'lucia' }, // (Mama's Pharmakaiea's keeper -- the first game's shop names her; the town's keeper table says "Mama"; her first-game shelf since 10-22, Griz: "yes", on "Lucia also sells in 8 bit, dome whorls and calling herbs maybe?")
    sylvia: { sheet: 'pt_sylvia', own: true }, // (Griz's own: her portrait at her booth, her particulars on his word -- js/town.js T.TRADE `own`)
    // the last six of art-wanted section 20, each on its first-game shop (10-21 evening, Griz to the lanes desk: "we have shopkeep NPCs in Fresh"; his "shops and the rest
    // of NPC portraits next session"): the show-armorer, the provisioner, charms and chalk, Percy's Particulars (a fifth for road harvest, rendered: its buyRate)
    vilar: { sheet: 'pt_vilar', shop: 'vilar' }, marko: { sheet: 'pt_marko', shop: 'marko' }, lisbet: { sheet: 'pt_lisbet', shop: 'lisbet' }, percy: { sheet: 'pt_percy', shop: 'percy' },
    cassia: { sheet: 'pt_cassia', script: 'inn' }, // (the coaching inn: her rooms, the first game's S.inn -- C.inn, 10-22)
    // the chapel and the leech-house (10-22, the services seat): no portrait yet, so the counter screen's plain shape where the face will go, as the keepers had before their art;
    // Davos Kren's came the same night (the art desk's ART-98; the desk's relay of Griz's "4 should be in fresh"): his scene as it was, on his face; Aldwin's on 10-28
    // (the art desk's ART-114, on Griz's 10-22 "we need for Aldwin of the free rest" -- the mission almoner, pin 30, not Aldwyn Androit the notary)
    aldwin: { sheet: 'pt_aldwin', script: 'chapel' }, davos: { sheet: 'pt_davos', name: 'Davos Kren', script: 'leech' },
    ned: { sheet: 'pt_ned', script: 'ned' }, // (Percy's partner, behind the same counter -- C.BESIDE; Percy's counter is Percy's face, Ned's own word his scene: C.ned)
    // two of the non-shop folk at their doors (10-21 night, Griz to the lanes desk: "non shop folk also have art in Fresh"): Mela Sorris of the Stew, and Mical of the
    // riverside warehouse, whose door signs Winters' crate off her books (her first-game talk, its `set` done by C.words); Mical sells nothing, so no line for a counter to come
    mela: { sheet: 'pt_mela' }, mical: { sheet: 'pt_mical', wait: '' },
    merrick: { sheet: 'pt_merrick', wait: 'His window -- the sendings -- is to come.' }, // (the message-lantern house, behind its grille: he sells nothing on a shelf, his window sends)
    // three more (10-22, Griz to the lanes desk: "more NPC art is in", then "one cutter for all 3"): Brennan the smith at his forge's door, his first-game talk (the
    // Pryor purse taken when Mical has signed: C.words) and no first-game shop, so his counter is to come; Venn Hale at the fighters' stables' door, her word and its
    // rumour (the Hex's card), selling nothing; Korvin of the Hex's betting slate, his portrait for the Hex seat to place (his slate and card are its scene)
    brennan: { sheet: 'pt_brennan' }, venhale: { sheet: 'pt_venhale', wait: '' }, korvin: { sheet: 'pt_korvin', name: 'Korvin', words: 'hex.korvin' }, // (`words`: his first-game line, content/text.json, for the portraits' show -- his own talk is the slate's)
    // two more (10-22, the desk's relay of Griz's "more NPC in fresh"): Marta Venn at her cook-stalls on the street, her first-game talk and her bat-wing pies (the first
    // game's S.marta: C.marta, 10-22); Madame Ondine Vess of the School, whose door neither game has yet -- her portrait for the show till it comes. (Tam Vere's, ART-100,
    // was held 10-22: drawn a man, and Tam is a woman; the re-roll came 10-28, below)
    marta: { sheet: 'pt_marta', script: 'marta' }, ondine: { sheet: 'pt_ondine', name: 'Madame Ondine Vess', wait: '' },
    // Tam Vere of the dream-smoke den (10-28, the second cutter seat: the art desk's re-roll of ART-100, a woman): her first-game word on her face; her couch and her
    // pipe come after the lake in the first game (js/deep.js S.tam), which the second game has not built -- so no counter line
    tam: { sheet: 'pt_tam', wait: '' },
    // the night crews' five on the shaft rows (10-28, the second cutter seat: the art desk's ART-104 to ART-108, new identities from their original briefs): Gull of
    // the day-labor corner, Kael of the timber yard, Brennock the renderer-knacker (not Brennan), Vera the rag-and-bone (not Venn Hale), on the street where they stood;
    // Kess of the flop-cellars (not Kessler) beside her door. None has a first-game shop: their first-game word on their faces, as their cards said it, no counter line
    gull: { sheet: 'pt_gull', wait: '' }, kael: { sheet: 'pt_kael', wait: '' }, brennock: { sheet: 'pt_brennock', wait: '' }, vera: { sheet: 'pt_vera', wait: '' }, kess: { sheet: 'pt_kess', wait: '' }
  };
  C.BESIDE = { percy: ['ned'] }; // (who stands behind a counter beside its keeper: js/town.js T.goIn)
  C.PETS = { ned: 'rat' }; // (a keeper's familiar on the counter in front of them: Ned's rat -- js/rules.js R.FAMILIARS, js/town.js T.goIn)
  // the keepers' own figures on the town floor (10-21, Griz: "Got south idles for several existing shopkeeps in Fresh"): the art desk's south idles, cut by
  // tools/keeper-town-sheet.py, drawn facing south only -- every other facing falls back on the stand-in (the sheet's `under`), so a keeper in one stays facing
  // south (C.dress; js/town.js T.fire turns no one who holds it). Behind their counters (js/town.js T.goIn), and beside their doors where they have no room
  C.FIG = { winters: 'winters_p1', casper: 'casper_p1', androit: 'androit_p1', hessle: 'hessle_p1', aldric: 'aldric_p1', kessler: 'kessler_p1', calla: 'calla_p1', barber: 'barber_p1', marin: 'marin_p1', kasten: 'kasten_p1', lucia: 'lucia_p1',
    cassia: 'cassia_p1', lisbet: 'lisbet_p1', marko: 'marko_p1', vilar: 'vilar_p1', percy: 'percy_p1', ned: 'ned_p1',
    sylvia: 'sylvia_p1', // (Sylvia Swann at her booth, her owl on her shoulder -- 10-21 night, Griz: "I got sylvia's - let's put it together as best we can and push it to live")
    mela: 'mela_p1', mical: 'mical_p1', merrick: 'merrick_p1', // (10-21 night, Griz: "got 3 more south idles in Fresh too": Mela and Mical beside their doors, Merrick behind his grille)
    brennan: 'brennan_p1', venhale: 'venhale_p1', korvin: 'korvin_p1', // (10-22: Brennan and Venn Hale beside their doors; Korvin's for the Hex seat, his waistcoat slate as on his portrait)
    davos: 'davos_p1', // (10-22: Davos Kren behind the leech-house's counter)
    marta: 'marta_p1', ondine: 'ondine_p1', // (10-22: Marta Venn at her stalls on the street -- js/town.js T.PLACE; Madame Ondine Vess's for a door to come)
    aldwin: 'aldwin_p1', tam: 'tam_p1', // (10-28: Aldwin behind the mission chapel's counter; Tam Vere beside her den's door)
    gull: 'gull_p1', kael: 'kael_p1', brennock: 'brennock_p1', vera: 'vera_p1', kess: 'kess_p1' }; // (10-28: the night crews' five, four on the shaft rows' street, Kess at her door)
  C.AT_DOOR = [{ id: 'marin', door: 'keeper:marin' }, { id: 'barber', door: 'keeper:barber' }, { id: 'mela', door: 'keeper:mela' }, { id: 'mical', door: 'keeper:mical' },
    { id: 'brennan', door: 'keeper:brennan' }, { id: 'venhale', door: 'keeper:venhale' }, { id: 'tam', door: 'keeper:tam' }, { id: 'kess', door: 'keeper:kess' }]; // (Tam Vere and Kess 10-28: their doors have no room behind them)
  C.dress = function (u, id) {
    var f = C.FIG[id]; if (!u || !f || !D.SHEETS || !D.SHEETS[f]) return false;
    u.sheet = f; u.holdFacing = true; u.facing = 0; // (0: south, on the town's north-up floor and on the diamonds alike)
    if (D.spr.prefetch) D.spr.prefetch([f]);
    return true;
  };
  C.PT = {}; C.OWN = {}; C.SHOPS = {};
  Object.keys(C.VENDORS).forEach(function (id) { var v = C.VENDORS[id]; if (v.sheet) C.PT[id] = v.sheet; if (v.own) C.OWN[id] = 1; if (v.shop) C.SHOPS[id] = v.shop; });
  C.takes = function (id) { var v = C.VENDORS[id]; return !!v && (!!v.script || !!v.shop || !!(v.sheet && D.SHEETS && D.SHEETS[v.sheet])); };
  // a magic item, by the SRD's: a weapon or armour +N, a thing that takes attunement or gives a resistance, an immunity or advantage (a ring, the boots, the
  // periapt), and the SRD's potions and elixir by name -- not the Charm (Lisbet's trinket), plain plate, antitoxin or a diamond
  C.MAGIC_USE = ['potion', 'greaterpotion', 'superiorpotion', 'elixir'];
  C.magic = function (id, it) {
    it = it || DS.DATA.items[id]; if (!it) return false;
    return ((it.weapon && it.weapon.bonus) || (it.armor && it.armor.bonus) || 0) > 0 || !!(it.attune || it.resist || it.immune || it.condImmune || it.adv || it.aura) || C.MAGIC_USE.indexOf(id) >= 0;
  };

  // the grid's own lines: the JOURNAL's hint (invented.json winters-journal-grid), the first game's winters.journalHint with the grid's menu key (RULED 10-21, Griz,
  // on the JOURNAL and its marker: "should function the same as the 8-bit unless we add a feature"); and Winters' word when his work is put off (invented.json
  // winters-not-now: the first game has no NOT NOW -- his 10-21 "Need to 'not now' option the work/mission 'offers'")
  C.LINES = { journalGrid: 'Winters\' errand is in your JOURNAL now (M, then JOURNAL), and pinned: the gold arrow marks who is next, and the NEXT line says it in words.',
    notNow: '"The dead keep. Come back when your hands are free."' };
  function L(k, o) { var r = (DS.DATA.text || {})[k], s = r ? r.t : k; var sub = function (x) { Object.keys(o || {}).forEach(function (n) { x = x.split('{' + n + '}').join(o[n]); }); return x; }; return Array.isArray(s) ? s.map(sub) : sub(s); }
  C.L = L;
  function pick(a) { return a[Math.floor(D.rand() * a.length)]; }

  // ---------------------------------------------------------------- what the party holds: on a floor the floor's own (js/roam.js), else the house's save
  C.state = function (B) {
    var H = D.house, R0 = B && B.roam;
    if (R0) { B.inv = B.inv || []; return { B: B, flags: R0.flags, inv: B.inv, party: R0.members.map(function (u) { return u.src || u; }).filter(function (h) { return h && h.equip; }), silver: function (d) { if (d) R0.silver = (R0.silver || 0) + d; return R0.silver || 0; } }; }
    var rec = H && H.playing && H.cur; if (!rec) return null;
    return { B: null, flags: rec.flags, inv: rec.inv, party: rec.party, silver: function (d) { if (d) rec.silver += d; return rec.silver; } };
  };
  function count(st, id) { var s = st.inv.filter(function (x) { return x.id === id; })[0]; return s ? s.n : 0; }
  function give(st, id, n) { n = n || 1; var s = st.inv.filter(function (x) { return x.id === id; })[0]; if (s) s.n += n; else st.inv.push({ id: id, n: n }); }
  function take(st, id, n) { n = n || 1; var s = st.inv.filter(function (x) { return x.id === id; })[0]; if (!s) return false; s.n -= n; if (s.n <= 0) st.inv.splice(st.inv.indexOf(s), 1); return true; }
  C.count = count; C.give = give; C.take = take;
  // the 8-bit's conditions (flag:, has:, hired:, lead:, &, |, !) on what the party holds -- js/town.js T.cond's reading; in the house, hired: and lead: read its save
  // as the first game's do (G.hired, ever hired; G.lead, the one who leads -- js/house.js H.fresh)
  C.cond = function (c, st) {
    var names = st.party.map(function (h) { return h.key || h.id; }), rec = D.house && D.house.playing && D.house.cur, hired = rec && rec.hired || names, lead = rec && rec.lead || names[0];
    return D.town.cond(c, st.flags, function (k, v) { return k === 'has' ? count(st, v) > 0 || st.party.some(function (h) { return h.equip && Object.keys(h.equip).some(function (s) { return h.equip[s] === v; }); }) : k === 'hired' ? hired.indexOf(v) >= 0 : k === 'lead' ? lead === v : false; });
  };
  // renown (the first game's js/events.js EV.renown): a point on the save, and the milestone XP -- 250 a point to everyone standing -- banked for the long rest (the
  // house's way, js/house.js H.bank). Returns the lines
  C.renown = function (st, n, why) {
    var H = D.house, cfg = DS.DATA.config || {}, titles = cfg.renownTitles || ['a stranger'], r;
    if (H && H.playing && H.cur) r = H.cur.renown = (H.cur.renown || 0) + n; else r = C.testRenown = (C.testRenown || 0) + n; // (a test floor, no house: kept for the page's life)
    D.sfx('levelup');
    var lines = [L('g.renown', { n: n, why: why ? L(why) : '', title: titles[Math.min(r, titles.length - 1)] })];
    var standing = st.party.filter(function (h) { return h.hp > 0 && !h.dead; });
    if (H && H.bank && standing.length) { var bk = H.bank(250 * n * standing.length, standing); if (bk.line) lines.push(bk.line); }
    return lines;
  };
  C.renownOf = function () { var H = D.house; return H && H.playing && H.cur ? H.cur.renown || 0 : C.testRenown || 0; };
  // a talk entry's doing (js/events.js EV.dialog): its flags set, a rumour heard, an item taken or given, silver, renown. Returns the lines it adds
  C.effects = function (st, br) {
    var out = [];
    [].concat(br.set || []).forEach(function (f) { st.flags[f] = 1; });
    [].concat(br.rumor || []).forEach(function (rid) { st.flags['heard:' + rid] = 1; });
    if (br.take) take(st, br.take, 1);
    if (br.give) { give(st, br.give, 1); D.sfx('chest'); out.push(L('g.got', { item: DS.DATA.items[br.give].name })); }
    if (br.silver) { st.silver(br.silver); D.sfx('coin'); out.push(L('g.foundSilver', { n: br.silver })); }
    if (br.renown) out = out.concat(C.renown(st, br.renown, br.renownWhy));
    return out;
  };
  // a person's word: their first talk whose condition holds, done (js/town.js T.say's choice, with its doing -- the errands' seals and signatures)
  C.words = function (B, id) {
    var st = C.state(B), N = ((DS.DATA || {}).npcs || {})[id] || {};
    var t = st && (N.talk || []).filter(function (e) { return C.cond(e['if'], st); })[0];
    if (t && t.say) return t.say.slice().concat(C.effects(st, t));
    return D.town.say(B, id);
  };

  // ---------------------------------------------------------------- the portrait: the sheet's own rows (tools/portrait-sheet.py), drawn on its anchor -- the head's
  // middle over the hands' line, where the screen's counter is
  C.drawPortrait = function (ctx, name, anim, frame, x, y) {
    var sh = D.SHEETS && D.SHEETS[name]; if (!sh) return false;
    if (!D.spr.has(name)) { if (!D.spr.offline) D.spr.load(sh.image); return false; }
    var a = sh.anims[anim] || sh.anims.idle, im = D.images[sh.image];
    ctx.drawImage(im, (frame % a.frames) * sh.fw, a.y, sh.fw, sh.fh, Math.round(x - sh.ax), Math.round(y - sh.ay), sh.fw, sh.fh);
    return true;
  };
  // which frame plays: the idle -- its six once in two seconds, then the first held three -- or a still held a while, or the work once through
  C.IDLE = { fps: 3, rest: 180 }; C.HOLD = 150; C.WORK = { fps: 4, hold: 60 };
  C.frameAt = function (sh, face, t) {
    var a = sh && sh.anims;
    if (face && a && a[face.anim]) {
      var dt = t - face.t0, an = a[face.anim];
      if (face.anim === 'work' || face.anim === 'stretch') { var per = 60 / C.WORK.fps, f = Math.floor(dt / per); if (f < an.frames + C.WORK.hold / per) return { anim: face.anim, frame: Math.min(an.frames - 1, f) }; }
      else if (dt < (face.hold || C.HOLD)) return { anim: face.anim, frame: 0 };
    }
    var n = a && a.idle ? a.idle.frames : 1, run = n * 60 / C.IDLE.fps, c = t % (run + C.IDLE.rest);
    return { anim: 'idle', frame: c < run ? Math.floor(c / (60 / C.IDLE.fps)) : 0 };
  };

  // ---------------------------------------------------------------- the screen
  // the portrait on the right, the words and buttons on the left (10-21, Griz: "looks like all the portraits are facing left - can we put them on the right side of the
  // screen instead?" -- every keeper is drawn looking screen left, so from the right they look at the conversation)
  var PW = 190, PX = D.W - 8 - PW, PY = 8, PH = 214, CY = PY + PH - 26, RX = 8, RW = PX - 8 - RX, WY = 34, WH = 100;
  // a hero in the talk (10-22, Griz, at Ned's counter: "Can we put Aurdin's portrait in the bottom left and have his text choices be in his speech bubble? / Such that
  // when Aurdin is choosing what to say, his line it answers "I decided to stick around" is still on the screen"): a script that sets sc.hero has that hero's portrait
  // bottom left (HB) and every question's answers in the hero's bubble beside it (BB), the keeper's words paged in their box as a say's, the answers up on the last page
  var HB = { x: 8, y: 146, w: 86, h: 104 }, BB = { x: 104, y: 142, w: RX + RW - 104, h: 108 };
  function Counter(B, o) {
    this.kind = 'counter'; this.opaque = true; this.t = 0; this.B = B; this.o = o; this.st = C.state(B);
    this.id = o.id; this.sheet = C.PT[o.id] || null; this.face = null; this.wait = null; this.msg = ''; this.hov = -1; this.i = 0; this.done = false; this.regear = false;
    this.co = o.script(this);
    this.step();
  }
  C.Counter = Counter;
  C.LAYOUT = { portrait: [PX, PY, PW, PH], words: [RX, WY, RW, WH], hero: [HB.x, HB.y, HB.w, HB.h], bubble: [BB.x, BB.y, BB.w, BB.h] };
  Counter.prototype.say = function (lines, face) { return { say: [].concat(lines), face: face }; };
  Counter.prototype.ask = function (prompt, opts, face) { return { ask: [].concat(prompt), opts: opts, face: face }; };
  Counter.prototype.shelves = function (shop) { return { shelves: shop }; };
  Counter.prototype.setFace = function (f) { if (f) this.face = { anim: f, t0: this.t }; };
  Counter.prototype.step = function (v) {
    var r = this.co.next(v);
    if (r.done) { this.close(); return; }
    this.wait = r.value; this.i = 0; this.hov = this.wait.ask ? 0 : -1; this.page = 0;
    if (this.wait.face) this.setFace(this.wait.face);
    if (this.wait.say) this.pages = this.paginate(this.wait.say);
    if (this.wait.ask && this.hero) { this.pages = this.paginate(this.wait.ask); this.echo = null; } // (a hero's question: the keeper's words paged, the answers in the bubble)
    if (this.wait.shelves) this.openShelves(this.wait.shelves);
  };
  // the hero's answers up: a question in a hero's talk, on its last page of the keeper's words
  Counter.prototype.bubbling = function () { var w = this.wait || {}; return !!(this.hero && w.ask && this.page >= this.pages.length - 1); };
  Counter.prototype.paging = function () { var w = this.wait || {}; return !!(w.say || (this.hero && w.ask && !this.bubbling())); };
  Counter.prototype.close = function () { if (this.done) return; this.done = true; if (D.top() === this) D.pop(); };
  // the words in the box: each line wrapped, and as many boxes as they need (a page a box)
  Counter.prototype.paginate = function (lines) {
    var rows = [], per = Math.floor((WH - 26) / 10), out = [];
    lines.forEach(function (l, k) { if (k) rows.push(''); rows = rows.concat(D.wrap(l, RW - 18)); });
    for (var i = 0; i < rows.length; i += per) out.push(rows.slice(i, i + per));
    return out.length ? out : [[]];
  };
  // the buttons on the screen now: [{ x, y, w, h, label, go, off }]
  Counter.prototype.buttons = function () {
    var w = this.wait || {}, out = [], self = this;
    if (this.sub) return this.subButtons();
    if (this.paging()) { var last = this.page >= this.pages.length - 1; out.push({ x: RX + RW - 70, y: WY + WH - 20, w: 62, h: 15, label: w.say && last ? 'OK' : 'NEXT', go: 'next' }); }
    if (this.bubbling()) return this.bubbleButtons();
    var yo = 0; // (an option may be { label, color }: Ned's Insight, his "insight text a different color"; one too long for its box wraps onto two lines in a taller one)
    if (w.ask && !this.hero) w.opts.forEach(function (lb, k) { var o = typeof lb === 'object' ? lb : { label: lb }, ls = D.textWidth(o.label) > RW - 28 ? D.wrap(o.label, RW - 28) : null, h = ls ? 6 + ls.length * 10 : 16; out.push({ x: RX + 8, y: WY + WH + 8 + k * 19 + yo, w: RW - 16, h: h, label: o.label, lines: ls, color: o.color, go: 'opt', k: k }); yo += h - 16; });
    if (w.shelves) {
      var tw = 76;
      out.push({ x: RX, y: 86, w: tw, h: 15, label: 'BUY', go: 'tab', tab: 'buy', on: this.tab === 'buy', off: !this.shop.items || !this.shop.items.length });
      out.push({ x: RX + tw + 6, y: 86, w: tw, h: 15, label: 'SELL', go: 'tab', tab: 'sell', on: this.tab === 'sell', off: this.shop.buys === false });
      out.push({ x: RX + RW - tw, y: 86, w: tw, h: 15, label: 'BACK', go: 'back' });
      var rows = this.rows(), vis = 7;
      this.scroll = Math.max(0, Math.min(this.scroll || 0, rows.length - vis));
      rows.slice(this.scroll, this.scroll + vis).forEach(function (r, k) { out.push({ x: RX, y: 106 + k * 13, w: RW - (rows.length > vis ? 14 : 0), h: 12, label: r.label, right: r.right, go: 'row', k: self.scroll + k, off: r.off, row: true }); });
      if (rows.length > vis) { out.push({ x: RX + RW - 12, y: 106, w: 12, h: 12, label: '▲', go: 'up', off: !this.scroll }); out.push({ x: RX + RW - 12, y: 106 + (vis - 1) * 13, w: 12, h: 12, label: '▼', go: 'down', off: this.scroll + vis >= rows.length }); }
    }
    return out;
  };
  // the hero's answers, a line each in the bubble (wrapped to its width), hovered or picked as any choice
  Counter.prototype.bubbleButtons = function () {
    var out = [], y = BB.y + 6, tw = BB.w - 20;
    this.wait.opts.forEach(function (lb, k) { var o = typeof lb === 'object' ? lb : { label: lb }, ls = D.wrap(o.label, tw), h = 4 + ls.length * 10; out.push({ x: BB.x + 4, y: y, w: BB.w - 8, h: h, label: o.label, lines: ls, color: o.color, go: 'opt', k: k, bubble: true }); y += h + 3; });
    return out;
  };
  // a first-game shop's greeting said the second game's way, by the shop's id (the first game's content/shops.json left as it is): Marko hires out no guards
  // here (10-22, Griz: "change line for now", on his "Gonna have to let the players hire fighters if we keep Marko's dialogue...")
  C.GREET = { marko: 'Rope, tents, torches, lanterns. Arrows and bolts by the bundle.' };
  C.greeting = function (shopId) { var sh = (DS.DATA.shops || {})[shopId]; return C.GREET[shopId] || (sh && sh.greeting); };
  // the shelves: the first game's js/scenes.js Shop -- its prices, what it buys and at what (the half, or the shop's own rate), the thanks
  Counter.prototype.openShelves = function (id) {
    this.shop = (DS.DATA.shops || {})[id] || { items: [] }; this.shopId = id; this.tab = this.shop.items && this.shop.items.length ? 'buy' : 'sell'; this.scroll = 0; this.cur = 0;
    this.msg = C.greeting(id) || 'Welcome.'; this.setFace('welcoming');
  };
  Counter.prototype.price = function (id) { var o = this.shop.prices && this.shop.prices[id]; return o != null ? o : DS.DATA.items[id].price; };
  Counter.prototype.offer = function (it) { return Math.max(1, Math.floor(it.price * (this.shop.buyRate || 0.5))); };
  C.sellable = function (shop, it) { return it.kind !== 'key' && it.price > 0 && (!it.noSell || shop.buysNoSell) && (shop.buysKind ? shop.buysKind.indexOf(it.kind) >= 0 : it.kind !== 'part'); };
  // what a vendor takes in: its own rule (`buys`), else the first game's for its shop -- a quest's magic weapon is magic, so Winters takes it (the first game's buysNoSell)
  C.buys = function (v, shop, id, it) { if (v && v.buys === 'magic') return it.kind !== 'key' && it.price > 0 && C.magic(id, it); return C.sellable(shop, it); };
  Counter.prototype.rows = function () {
    var self = this, st = this.st, d = this.shop, v = C.VENDORS[this.id];
    if (this.tab === 'buy') return (d.items || []).map(function (id) { var it = DS.DATA.items[id], p = self.price(id); return { id: id, label: it.name, right: p + ' sp', off: p > st.silver() }; });
    return st.inv.filter(function (s) { var it = DS.DATA.items[s.id]; return it && s.n > 0 && C.buys(v, d, s.id, it); }).map(function (s) { var it = DS.DATA.items[s.id]; return { id: s.id, label: it.name + ' x' + s.n, right: self.offer(it) + ' sp' }; });
  };
  // what a keeper says, buying a thing a quest wants: Percy, sold a snake tongue while Ned's is asked for, says so -- and buys it anyway, at his fifth (RULED 10-21
  // night, Griz: "looks good - have percy 'Didn't Ned want one of those?' while the quest is active, but will buy them anyway after saying it"; the house lane's
  // THE SCENE item 12 -- the seat had held one back from his list)
  Counter.prototype.remark = function (id) { return this.shopId === 'percy' && id === C.NED.part && C.nedOpen(this.st) ? C.NED_LINES.percyTongue : null; };
  function stacks(it) { return it.kind === 'use' || !!it.stack; }
  function gear(it) { return it.kind === 'weapon' || it.kind === 'armor' || it.kind === 'shield'; }
  Counter.prototype.buy = function (id, n) {
    var st = this.st, it = DS.DATA.items[id], p = this.price(id);
    if (p * n > st.silver()) { D.sfx('error'); this.msg = L('g.poor'); this.setFace('concerned'); return; }
    st.silver(-p * n); give(st, id, n); D.sfx('coin');
    this.msg = pick(this.shop.thanks || ['A fair trade.', 'Yours.', 'Mind how you carry it.']); this.setFace('welcoming');
    if (gear(it)) { var fits = st.party.filter(function (h) { return !h.dead && DS.R.canEquip(h, it); }); if (fits.length) this.sub = { kind: 'equip', id: id, fits: fits }; }
  };
  Counter.prototype.sell = function (id, k) {
    var st = this.st, it = DS.DATA.items[id];
    take(st, id, k); st.silver(this.offer(it) * k); D.sfx('coin');
    this.msg = this.remark(id) || pick(this.shop.boughtText || ['Done.']); this.setFace('work'); // (his acquisition: unwrapped, looked over, set on the counter)
  };
  // the first game's equip-it-now (js/scenes.js Shop.go): a two-hander takes the shield off, a shield will not go on beside one, what was worn goes to the pack
  Counter.prototype.equip = function (h, id) {
    var st = this.st, it = DS.DATA.items[id], R = DS.R;
    if (it.kind === 'shield') { var w = R.item(h.equip.weapon); if (w && w.weapon && (w.weapon.props || []).indexOf('two-handed') >= 0) { this.msg = h.name + '\'s weapon needs both hands.'; D.sfx('error'); return; } }
    if (it.kind === 'weapon' && (it.weapon.props || []).indexOf('two-handed') >= 0 && h.equip.shield) { give(st, h.equip.shield, 1); h.equip.shield = null; }
    if (h.equip[it.kind]) give(st, h.equip[it.kind], 1);
    take(st, id, 1); h.equip[it.kind] = id; D.sfx('confirm'); this.regear = true;
  };
  function avg(expr) { var m = /^(\d+)d(\d+)$/.exec(String(expr || '')); return m ? +m[1] * (+m[2] + 1) / 2 : 0; }
  // ▲ ▼ = beside each hero who can use it: the first game's better() -- a weapon's average blow and half its to-hit, or the armour class
  C.better = function (h, it) {
    var R = DS.R, slot = it.kind, save = h.equip[slot];
    var score = function () { if (slot === 'weapon') { var d = R.damageExpr(h); return avg(d.dice) + d.mod + R.attackBonus(h) * 0.5; } return R.ac(h); };
    var b = score(); h.equip[slot] = it.id || null; var a = score(); h.equip[slot] = save;
    return a > b ? 1 : a < b ? -1 : 0;
  };
  Counter.prototype.subButtons = function () {
    var s = this.sub, out = [], bx = RX + 8, self = this;
    if (s.kind === 'qty') {
      out.push({ x: bx, y: 160, w: 26, h: 16, label: '-', go: 'qminus', off: s.n <= 1 }, { x: bx + 90, y: 160, w: 26, h: 16, label: '+', go: 'qplus', off: s.n >= s.max });
      out.push({ x: bx + 124, y: 160, w: 30, h: 16, label: 'MAX', go: 'qmax', off: s.n >= s.max });
      out.push({ x: bx, y: 186, w: 110, h: 16, label: s.sell ? 'SELL' : 'BUY', go: 'qok' }, { x: bx + 120, y: 186, w: 90, h: 16, label: 'BACK', go: 'qback' });
    }
    if (s.kind === 'equip') {
      s.fits.forEach(function (h, k) { out.push({ x: bx, y: 132 + k * 19, w: RW - 16, h: 16, label: h.name, go: 'who', hero: h, cmp: C.better(h, DS.R.item(s.id) || {}) }); });
      out.push({ x: bx, y: 132 + s.fits.length * 19, w: RW - 16, h: 16, label: 'NOT NOW', go: 'notnow' });
    }
    return out;
  };
  Counter.prototype.press = function (b) {
    var w = this.wait || {}, s = this.sub, self = this;
    if (!b || b.off) { D.sfx('error'); return; }
    D.sfx(b.go === 'back' || b.go === 'qback' || b.go === 'notnow' ? 'cancel' : 'cursor');
    if (b.go === 'next') { if (this.page < this.pages.length - 1) this.page++; else this.step(); return; }
    if (b.go === 'opt') { if (b.bubble) this.echo = D.wrap(b.label.replace(/ \(insight\)$/, ''), BB.w - 20); this.step(b.k); return; } // (the hero's line stays in the bubble while the keeper answers)
    if (b.go === 'tab') { this.tab = b.tab; this.scroll = 0; this.cur = 0; if (b.tab === 'sell') { this.setFace('skeptical'); if (!this.rows().length) this.msg = this.shop.nothingText || 'You have nothing I want.'; } return; }
    if (b.go === 'back') { this.shop = null; this.step(); return; }
    if (b.go === 'up') { this.scroll = Math.max(0, this.scroll - 1); return; }
    if (b.go === 'down') { this.scroll++; return; }
    if (b.go === 'row') {
      var r = this.rows()[b.k]; if (!r) return; this.cur = b.k;
      var it = DS.DATA.items[r.id];
      if (this.tab === 'buy') { var p = this.price(r.id); if (stacks(it)) { var mx = Math.min(99, Math.floor(this.st.silver() / p)); if (mx > 1) { this.sub = { kind: 'qty', id: r.id, n: 1, max: mx, price: p }; return; } } this.buy(r.id, 1); }
      else { var cnt = count(this.st, r.id); if (cnt > 1) { this.sub = { kind: 'qty', id: r.id, n: 1, max: cnt, price: this.offer(it), sell: true }; this.setFace('skeptical'); return; } this.sell(r.id, 1); }
      return;
    }
    if (s && b.go === 'qminus') { s.n--; return; }
    if (s && b.go === 'qplus') { s.n++; return; }
    if (s && b.go === 'qmax') { s.n = s.max; return; }
    if (s && b.go === 'qok') { this.sub = null; if (s.sell) this.sell(s.id, s.n); else this.buy(s.id, s.n); return; }
    if (s && b.go === 'qback') { this.sub = null; return; }
    if (s && b.go === 'who') { this.sub = null; this.equip(b.hero, s.id); return; }
    if (s && b.go === 'notnow') { this.sub = null; return; }
  };
  Counter.prototype.update = function () {
    this.t++;
    var m = I.mouse, bs = this.buttons(), self = this;
    var hit = m.inside ? bs.filter(function (q) { return m.x >= q.x && m.x < q.x + q.w && m.y >= q.y && m.y < q.y + q.h; })[0] : null;
    if (m.moved || m.click) this.hov = hit ? bs.indexOf(hit) : -1;
    var w = this.wait || {};
    if (m.click && m.inside) {
      if (hit) { this.press(hit); return; }
      if (this.paging() && !this.sub && m.x >= RX && m.x < RX + RW && m.y >= WY && m.y < WY + WH) { this.press(bs[0]); return; } // (a click on the words goes on)
    }
    if (m.wheel && this.shop && !this.sub) { this.scroll = Math.max(0, (this.scroll || 0) + (m.wheel > 0 ? 1 : -1)); m.wheel = 0; }
    var live = bs.filter(function (q) { return !q.off; });
    if (I.repeat('down') || I.repeat('right')) { var k0 = live.indexOf(bs[this.hov]); this.hov = bs.indexOf(live[(k0 + 1) % live.length]); D.sfx('cursor'); }
    if (I.repeat('up') || I.repeat('left')) { var k1 = live.indexOf(bs[this.hov]); this.hov = bs.indexOf(live[(k1 < 0 ? live.length - 1 : k1 - 1 + live.length) % live.length]); D.sfx('cursor'); }
    if (I.pressed('a')) { this.press(bs[this.hov] || (w.say ? bs[0] : null)); return; }
    if (I.pressed('b') || m.rclick) { // back: the words go on, a question takes its last answer (LEAVE), the shelves go back
      var back = this.sub ? bs.filter(function (q) { return q.go === 'qback' || q.go === 'notnow'; })[0] : w.say ? bs[0] : w.ask ? bs[bs.length - 1] : bs.filter(function (q) { return q.go === 'back'; })[0];
      this.press(back);
    }
  };
  Counter.prototype.draw = function (ctx) {
    var self = this, W8 = D.WIN8, st = this.st, w = this.wait || {};
    var g = ctx.createLinearGradient(0, 0, 0, D.H); g.addColorStop(0, '#0a0c22'); g.addColorStop(1, '#1a1426'); ctx.fillStyle = g; ctx.fillRect(0, 0, D.W, D.H);
    // the portrait over its counter
    D.win8(ctx, PX, PY, PW, PH, '#0b1430');
    ctx.save(); ctx.beginPath(); ctx.rect(PX + 3, PY + 3, PW - 6, PH - 6); ctx.clip();
    var sh = this.sheet && D.SHEETS[this.sheet], fr = C.frameAt(sh, this.face, this.t);
    if (this.o.pic) this.o.pic(ctx, PX + 3, PY + 3, PW - 6, PH - 6, this.t, CY); // (a place's own picture where a keeper's portrait stands: the Glowseep's crews' fire, js/mines.js M.firePic)
    else if (sh && C.drawPortrait(ctx, this.sheet, fr.anim, fr.frame, PX + PW / 2, CY + 1)) { if (this.id === 'ned') C.drawNedRat(ctx, PX + PW / 2, CY + 1, this.t); }
    else {
      ctx.fillStyle = '#1c2348'; ctx.beginPath(); ctx.arc(PX + PW / 2, CY - 92, 26, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(PX + PW / 2 - 48, CY - 60, 96, 60); // (no sheet yet, or a keeper with none: a shape)
    }
    ctx.fillStyle = '#4a2e1a'; ctx.fillRect(PX + 3, CY, PW - 6, PY + PH - 3 - CY); ctx.fillStyle = '#8a5e3a'; ctx.fillRect(PX + 3, CY, PW - 6, 2); ctx.fillStyle = '#2a1a10'; ctx.fillRect(PX + 3, CY + 2, PW - 6, 1);
    ctx.restore();
    D.text(ctx, '{y}' + this.o.name + '{/}', PX + PW / 2, CY + 9, W8.text, 'center');
    D.win8(ctx, PX, PY + PH + 4, PW, 22); D.text(ctx, '◆ ' + (st ? st.silver() : 0) + ' silver', PX + 10, PY + PH + 10, W8.text);
    // the words
    D.text(ctx, '{y}' + (this.o.place || this.o.name) + '{/}', RX, 10, W8.text);
    if (this.o.what) D.text(ctx, this.o.what, RX, 21, '#9c9cb4');
    if (this.shop) {
      D.win8(ctx, RX, WY, RW, 48);
      D.wrap(this.msg, RW - 18).slice(0, 4).forEach(function (l, i) { D.text(ctx, l, RX + 9, WY + 6 + i * 10, W8.text); });
    } else {
      D.win8(ctx, RX, WY, RW, WH);
      var rows = w.say || (this.hero && w.ask) ? this.pages[this.page] || [] : w.ask ? this.paginate(w.ask)[0] : [];
      rows.forEach(function (l, i) { D.text(ctx, l, RX + 9, WY + 6 + i * 10, W8.text); });
      if ((w.say || (this.hero && w.ask)) && this.pages.length > 1) D.text(ctx, (this.page + 1) + '/' + this.pages.length, RX + 10, WY + WH - 16, '#9c9cb4');
    }
    if (this.hero) this.drawHero(ctx);
    var bs = this.buttons();
    if (this.sub) {
      var s = this.sub, it = DS.DATA.items[s.id];
      D.win8(ctx, RX, 104, RW, 140);
      if (s.kind === 'qty') {
        D.text(ctx, '{y}' + (s.sell ? 'SELL' : 'BUY') + ' HOW MANY?{/}  ' + it.name, RX + 9, 112, W8.text);
        D.text(ctx, s.n + '', RX + 8 + 58, 164, W8.gold, 'center');
        D.text(ctx, s.n + ' x ' + s.price + ' = ' + (s.n * s.price) + ' sp', RX + 9, 132, W8.text);
      } else D.text(ctx, '{y}EQUIP IT NOW?{/}  ' + it.name + ' -- who takes it?', RX + 9, 112, W8.text);
    }
    bs.forEach(function (q, k) {
      var hov = k === self.hov, on = q.on;
      if (q.bubble) { // (a hero's answer: a line of the bubble, lit under the mouse)
        if (hov) { ctx.fillStyle = W8.sel; ctx.fillRect(q.x, q.y, q.w, q.h); }
        q.lines.forEach(function (l, i) { D.text(ctx, l, q.x + 6, q.y + 2 + i * 10, hov ? W8.gold : q.color || W8.text); });
        return;
      }
      if (q.row) {
        if (hov || (self.cur === q.k && !self.sub && !(bs[self.hov] && bs[self.hov].row))) { ctx.fillStyle = W8.sel; ctx.fillRect(q.x, q.y - 1, q.w, q.h); } // (the row under the mouse, else the last one picked)
        D.text(ctx, q.label, q.x + 6, q.y + 1, q.off ? '#6c6c84' : hov ? W8.gold : W8.text);
        D.text(ctx, q.right, q.x + q.w - 6, q.y + 1, q.off ? '#6c6c84' : W8.text, 'right');
        return;
      }
      ctx.fillStyle = hov ? W8.sel : on ? '#2c2470' : 'rgba(16,18,58,.92)'; ctx.fillRect(q.x, q.y, q.w, q.h);
      ctx.strokeStyle = hov || on ? W8.gold : W8.mid; ctx.strokeRect(q.x + 0.5, q.y + 0.5, q.w - 1, q.h - 1);
      (q.lines || [q.label]).forEach(function (l, i) { D.text(ctx, l, q.x + q.w / 2, q.y + 3 + i * 10, q.off ? '#6c6c84' : hov ? W8.gold : q.color || W8.text, 'center'); });
      if (q.cmp != null) D.text(ctx, q.cmp > 0 ? '▲' : q.cmp < 0 ? '▼' : '=', q.x + q.w - 12, q.y + 3, q.cmp > 0 ? '#58f898' : q.cmp < 0 ? '#f85838' : '#c8d0e8');
    });
    if (this.shop && !this.sub) { // what it is, and who could use it
      var rs = this.rows(), r = rs[Math.max(0, bs[this.hov] && bs[this.hov].row ? bs[this.hov].k : this.cur)], it2 = r && DS.DATA.items[r.id];
      D.win8(ctx, RX, 200, RW, 50);
      if (it2) {
        D.wrap(it2.desc || '', RW - 18).slice(0, 2).forEach(function (l, i) { D.text(ctx, l, RX + 9, 206 + i * 10, '#e0c8a0'); });
        if (gear(it2)) { var x = RX + 9; st.party.forEach(function (h) { var ok = !h.dead && DS.R.canEquip(h, it2), c = ok ? C.better(h, it2) : null, lb = h.name + (ok ? ' ' + (c > 0 ? '▲' : c < 0 ? '▼' : '=') : ''); D.text(ctx, lb, x, 228, !ok ? '#6c6c84' : c > 0 ? '#58f898' : c < 0 ? '#f85838' : '#c8d0e8'); x += D.textWidth(lb) + 10; }); }
        else if (!rs.length) D.text(ctx, this.tab === 'sell' ? (this.shop.nothingText || 'You have nothing I want.') : '', RX + 9, 206, '#9c9cb4');
      } else D.text(ctx, this.tab === 'sell' ? (this.shop.nothingText || 'You have nothing I want.') : 'The shelves are bare.', RX + 9, 206, '#9c9cb4');
    }
    ctx.fillStyle = 'rgba(4,3,10,.95)'; ctx.fillRect(0, D.H - 14, D.W, 14);
    D.hint(ctx, 'click a choice · arrows choose · E pick · X back', D.W / 2, D.H - 11, '#9a96a8', 'center');
  };
  // the hero bottom left, and the bubble beside: the answers while the hero chooses, the line chosen while the keeper answers it
  Counter.prototype.drawHero = function (ctx) {
    var W8 = D.WIN8, h = this.hero, w = this.wait || {}, bs = this.bubbling() ? this.bubbleButtons() : null;
    D.win8(ctx, HB.x, HB.y, HB.w, HB.h, '#0b1430');
    ctx.save(); ctx.beginPath(); ctx.rect(HB.x + 3, HB.y + 3, HB.w - 6, HB.h - 20); ctx.clip();
    var pt = C.heroPortrait(h);
    if (pt) C.drawPortrait(ctx, pt, 'idle', 0, HB.x + HB.w / 2, HB.y + HB.h - 17); // (his portrait, its cut edge on the name strip; nothing the frame it loads)
    else C.drawHeroFace(ctx, h, HB.x + 3, HB.y + 3, HB.w - 6, HB.h - 20, this.t);
    ctx.restore();
    D.text(ctx, '{y}' + h.name + '{/}', HB.x + HB.w / 2, HB.y + HB.h - 14, W8.text, 'center');
    var echo = !bs && w.say && this.echo, bh = bs ? bs[bs.length - 1].y + bs[bs.length - 1].h + 5 - BB.y : echo ? 8 + echo.length * 10 : 0;
    if (!bh) return;
    bubble(ctx, BB.x, BB.y, BB.w, Math.max(30, bh));
    if (echo) echo.forEach(function (l, i) { D.text(ctx, l, BB.x + 10, BB.y + 6 + i * 10, '#9c9cb4'); });
  };
  function bubble(ctx, x, y, w, h) { // (a speech bubble, its tail at the portrait)
    ctx.fillStyle = 'rgba(14,16,46,.96)'; ctx.strokeStyle = '#c8d0e8'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + 4, y + 0.5); ctx.lineTo(x + w - 4, y + 0.5); ctx.lineTo(x + w - 0.5, y + 4); ctx.lineTo(x + w - 0.5, y + h - 4); ctx.lineTo(x + w - 4, y + h - 0.5);
    ctx.lineTo(x + 4, y + h - 0.5); ctx.lineTo(x + 0.5, y + h - 4); ctx.lineTo(x + 0.5, y + 22); ctx.lineTo(x - 9, y + 15); ctx.lineTo(x + 0.5, y + 9); ctx.lineTo(x + 0.5, y + 4); ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
  // a hero's portrait by the figure the hero wears (js/save.js SV.look): the big bust on the first page of the art desk's package, a still (tools/hero-portrait.py;
  // 10-22, Griz: "The first page of the characters stuff was supposed to have a big one, if you can find that use the one based on the outfit he's in") --
  // Aurdin's Red Mantle out of robes, his Ochre in them
  C.HERO_PT = { aurdin_p3: 'pt_aurdin_red', aurdin_p2: 'pt_aurdin_ochre' };
  C.heroPortrait = function (h) { var pt = C.HERO_PT[C.heroSheet(h)]; return pt && D.SHEETS && D.SHEETS[pt] ? pt : null; };
  // a hero with no portrait: the figure the hero wears on the floor, turned to the keeper (south-east), head and shoulders at HERO_FACE.zoom, breathing in its idle
  C.HERO_FACE = { facing: 7, zoom: 3, anim: 'idle', above: 4 }; // (at 2 the whole figure shows small; at 3 the head and the mantle: the seat's eye, 10-22)
  C.heroSheet = function (h) { var id = h.key || h.id, L0 = D.save && D.save.look ? D.save.look(id, null, h) : null; return (L0 && L0.sheet) || id + '_p0'; };
  C.drawHeroFace = function (ctx, h, x, y, w, hh, t) {
    var F = C.HERO_FACE, name = C.heroSheet(h), sh = D.SHEETS && D.SHEETS[name]; if (!sh) return false;
    if (!D.spr.has(name)) { if (!D.spr.offline) D.spr.load(sh.image); return false; }
    var fr = D.spr.frameAt(name, F.anim, F.facing, t); if (!fr || !fr.img) return false;
    var sw = w / F.zoom, sht = hh / F.zoom, sx = fr.sx + fr.ax - sw / 2, sy = fr.sy + Math.max(0, fr.ay - (sh.top || 52) - F.above);
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(fr.img, Math.round(sx), Math.round(sy), sw, sht, x, y, w, hh); ctx.restore();
    return true;
  };

  // ---------------------------------------------------------------- at a counter or a door: the screen up, the floor waiting under it (js/town.js T.fire)
  C.talk = function* (B, id, door) {
    var N = ((DS.DATA || {}).npcs || {})[id] || {}, T = D.town, kp = B.roam && D.roam.def && D.roam.def.keeper && D.roam.def.keeper.id === id ? D.roam.def : null;
    var v = C.VENDORS[id] || {}, shop = (DS.DATA.shops || {})[v.shop];
    var nm = v.name || (door && door.name) || T.KEEPER['shop:' + id] || T.KEEPER['warp:' + id] || T.KEEPER['keeper:' + id] || T.KEEPER['inn:' + id] || N.name || id; // (inn: Cassia's)
    var rm = !kp && B.roam && D.roam.def && D.roam.def.room && (D.roam.def.beside || {})[id] ? D.roam.def : null; // (one who stands beside the keeper: Ned at Percy's)
    var o = { id: id, name: nm, place: kp ? kp.name : rm ? rm.name : (door && door.name) || nm, what: kp ? (kp.name !== nm ? nm + ' at the counter' : '') : rm ? nm + ', behind the counter' : (door && door.what) || '' };
    o.script = v.script === 'winters' ? function (sc) { return C.winters(sc); } : v.script === 'ned' ? function (sc) { return C.ned(sc, B); } : v.script && C.SCRIPTS[v.script] ? function (sc) { return C.SCRIPTS[v.script](sc, B, id); } : shop && !v.own ? function (sc) { return C.shopkeeper(sc, B, id); } : function (sc) { return C.keeper(sc, B, id); };
    if (shop) o.place = shop.name;
    var sc = new Counter(B, o); D.push(sc);
    while (!sc.done) yield 1;
    if (sc.regear && B.roam && D.roam.regear) D.roam.regear(B); // (bought and put on: the floor's figures wear it -- js/roam.js R.regear)
    if (sc.next) yield* sc.next(B); // (what the talk leads to once the screen is down: a night slept -- C.inn, C.chapel)
  };
  // a keeper whose sales are to come: their word (and its doing) -- a shopkeeper with no word of their own says their first-game shop's greeting -- then a line
  // for the counter (js/town.js T.fire's, as before the screen)
  C.keeper = function* (sc, B, id) {
    if (C.OWN[id]) { yield sc.say(['{g}Griz\'s own: the counter waits on his word.{/}'], 'welcoming'); return; }
    var said = C.words(B, id), wait = /^\{g\}\(Their scene/.test(said[0] || ''), shop = (DS.DATA.shops || {})[id], v = C.VENDORS[id] || {};
    if (wait && shop && shop.greeting) { said = [shop.greeting]; wait = false; }
    var tail = v.wait != null ? v.wait : 'The counter -- buying and selling -- is to come.'; // (a vendor's own `wait` line; '' for none)
    yield sc.say((wait ? [] : said).concat(wait ? ['{g}Their scene is the 8-bit\'s; on the grid it is to come.{/}'] : tail ? ['{g}' + tail + '{/}'] : []), wait ? 'attentive' : 'welcoming');
  };

  // a vendor with a shop and no scene of its own (one line in C.VENDORS opens it): their word, then THE SHELVES / LEAVE -- the first game's shop on this screen
  C.shopkeeper = function* (sc, B, id) {
    var said = C.words(B, id), shop = (DS.DATA.shops || {})[C.VENDORS[id].shop];
    if (/^\{g\}\(Their scene/.test(said[0] || '')) said = [C.greeting(C.VENDORS[id].shop) || 'Welcome.'];
    yield sc.say(said, 'welcoming');
    if (C.VENDORS[id].shop === 'percy' && count(sc.st, 'batwings') > 0) yield sc.say(L('percy.wings'), 'skeptical'); // (the wings he won't have, sent on to Marta: the first game's S.percyShop)
    while ((yield sc.ask(said[said.length - 1], ['THE SHELVES', 'LEAVE'])) === 0) yield sc.shelves(C.VENDORS[id].shop);
  };

  // ---------------------------------------------------------------- Ambrose Winters (the first game's js/events.js S.winters and S.wintersWork, on the grid). His words
  // are the first game's (content/text.json winters.*); the one new line is the JOURNAL's hint, the grid's menu named (invented.json winters-journal-grid)
  C.winters = function* (sc) {
    var st = sc.st, f = st.flags;
    if (!f.wintersMet) {
      f.wintersMet = 1;
      yield sc.say(L('winters.first'), 'attentive');
      yield sc.say(L('winters.words'), 'welcoming');
      if (st.party.some(function (h) { return (h.key || h.id) === 'vivian' && !h.dead; })) yield sc.say(L('winters.vivian'), 'skeptical');
    }
    // (an errand brought back closes as soon as you walk in, and the next one comes with it -- the first game's playtest 09-25 round four)
    var back = (f.wErrA && !f.wErrADone && f.wValued) || (f.wErrB && !f.wErrBDone && f.wPaid);
    if (back) {
      yield* C.wintersWork(sc);
      if (f.wErrADone && !f.wErrB && (yield* C.wintersWork(sc)) === 'leave') return;
    }
    while (true) {
      var a = yield sc.ask(L('winters.menu'), ['WORK', 'THE SHELVES', 'LEAVE']);
      if (a === 0) { if ((yield* C.wintersWork(sc)) === 'leave') break; }
      else if (a === 1) {
        if (!f.wErrADone) { yield sc.say(L('winters.shelvesShut'), 'concerned'); continue; }
        yield sc.shelves('winters');
      } else break;
    }
  };
  // an offer of work or a mission, any keeper's (10-21, Griz, on the counter: "Need to 'not now' option the work/mission 'offers'"): its words, the last as the
  // question, then TAKE IT or NOT NOW -- NOT NOW (a click, or X) closes it untaken, and it is offered again on a later visit. True when taken
  C.offerWork = function* (sc, lines, face) {
    lines = [].concat(lines);
    if (lines.length > 1) yield sc.say(lines.slice(0, -1), face);
    return (yield sc.ask(lines[lines.length - 1], ['TAKE IT', 'NOT NOW'], face)) === 0;
  };
  C.wintersWork = function* (sc) {
    var st = sc.st, f = st.flags, items = DS.DATA.items;
    if (!f.wErrA) {
      if (!(yield* C.offerWork(sc, L('winters.errandA'), 'attentive'))) { yield sc.say(C.LINES.notNow, 'attentive'); return; }
      f.wErrA = 1; give(st, 'estatepapers', 1); D.sfx('chest');
      yield sc.say(L('g.got', { item: items.estatepapers.name }));
      if (!f.pin) f.pin = 'errands'; // (the first errand teaches the journal: the first game's playtest 09-25)
      yield sc.say(D.keys(C.LINES.journalGrid));
      return 'leave';
    }
    if (!f.wErrADone) {
      if (!f.wValued) { yield sc.say(L(f.wSealed ? 'winters.errandAtoCasper' : 'winters.errandAtoAndroit'), 'skeptical'); return; }
      take(st, 'estatepapers', 1); f.wErrADone = 1;
      yield sc.say(L('winters.errandAdone'), 'welcoming');
      st.silver(12); D.sfx('coin'); yield sc.say(L('g.foundSilver', { n: 12 }));
      return;
    }
    if (!f.wErrB) {
      if (!(yield* C.offerWork(sc, L('winters.errandB'), 'attentive'))) { yield sc.say(C.LINES.notNow, 'attentive'); return; }
      f.wErrB = 1; give(st, 'debtpurse', 1); D.sfx('chest');
      yield sc.say(L('g.got', { item: items.debtpurse.name }));
      return 'leave';
    }
    if (!f.wErrBDone) {
      if (!f.wPaid) { yield sc.say(L(f.wSigned ? 'winters.errandBtoBrennan' : 'winters.errandBtoMical'), 'skeptical'); return; }
      f.wErrBDone = 1;
      yield sc.say(L('winters.errandBdone'), 'welcoming');
      st.silver(20); give(st, 'potion', 1); D.sfx('coin');
      yield sc.say([L('g.foundSilver', { n: 20 }), L('g.got', { item: items.potion.name })]);
      yield sc.say(C.renown(st, 1, 'renown.errandB'), 'welcoming');
      return;
    }
    yield sc.say(L('winters.noWork'), 'concerned');
  };

  // ---------------------------------------------------------------- SILVERTON'S SERVICES (10-22, the services seat, started by the lanes desk on his word: "do we have anyone
  // adding functionality to silverton NPCs (the Inn, the Free church sleep, etc?)", then "Start a seat on Silverton's services: Cassia's rooms, Aldwin's chapel sleep, Davos's
  // leech-house, Hessle's board, Merrick's sendings, from the first game's scenes"). The first game's own scenes (js/events.js S.inn, S.chapel, S.leech, S.hessle) on the
  // counter screen, in its words (content/text.json; content/shops.json cassia; content/npcs.json aldwin); a night slept wakes to the house's morning (js/house.js
  // H.sleepOnFloor: the night's bonds, the day's spells, the save). Merrick's window stays to come: the first game has no sendings -- his talk and a rumour only
  C.SCRIPTS = {};
  // a night slept on the floor once the screen is down (the first game's EV.rest('inn'): the inn's tune through the night, at the inn and on the chapel's floor)
  C.sleep = function* (B) { if (B && B.roam && D.house && D.house.sleepOnFloor) yield* D.house.sleepOnFloor(B, { music: 'inn' }); };
  // the inn (S.inn): STAY or LEAVE at her price -- the good bed for one, the long room for a company (content/shops.json cassia: price, partyPrice; RULED 09-24), then the night
  C.SCRIPTS.inn = C.inn = function* (sc, B, id) {
    var st = sc.st, inn = (DS.DATA.shops || {})[id] || {}, n = st.party.filter(function (h) { return !h.dead; }).length, cost = n > 1 && inn.partyPrice ? inn.partyPrice : inn.price * n;
    if ((yield sc.ask(inn.greeting + ' ' + L('g.innAsk', { n: cost }), ['STAY', 'LEAVE'], 'welcoming')) !== 0) return;
    if (st.silver() < cost) { D.sfx('error'); yield sc.say(L('g.poor'), 'concerned'); return; }
    st.silver(-cost); D.sfx('coin');
    sc.next = C.sleep;
  };
  // the mission chapel (S.chapel): Aldwin's word (his first talk whose condition holds, the first game's EV.dialog), then SLEEP or LEAVE -- the floor is free. On his
  // face (10-28): his "Bread at six" as he breaks a loaf and holds out half (his work), the floor offered welcoming (the art desk's brief for that still)
  C.SCRIPTS.chapel = C.chapel = function* (sc, B) {
    yield sc.say(C.words(B, 'aldwin'), 'work');
    if ((yield sc.ask(L('chapel.ask'), ['SLEEP', 'LEAVE'], 'welcoming')) !== 0) return;
    sc.next = C.sleep;
  };
  // the leech-house (S.leech): five silver a body for the fallen, stood up at half their hit points. On a floor the fallen are its figures, whose hit points are the floor's
  // (as the floor's own revive: js/roam.js R.menuAct)
  C.SCRIPTS.leech = C.leech = function* (sc, B) {
    var st = sc.st, R0 = B && B.roam, bodies = R0 ? R0.members.filter(function (u) { return u.src; }) : st.party.filter(function (h) { return !h.dead; }), down = bodies.filter(function (u) { return u.hp <= 0 || u.ko; });
    yield sc.say(L('leech.greet'));
    if (!down.length) { yield sc.say(L('leech.none')); return; }
    var cost = 5 * down.length;
    if ((yield sc.ask(L('leech.ask', { n: cost, names: down.map(function (u) { return u.name; }).join(', ') }), ['PAY', 'LEAVE'])) !== 0) return;
    if (st.silver() < cost) { D.sfx('error'); yield sc.say(L('g.poor')); return; }
    st.silver(-cost); D.sfx('coin');
    down.forEach(function (u) { u.ko = false; u.hp = Math.max(1, Math.floor(u.maxhp / 2)); if (u.hp > 0) u.dead = false; if (u.src) { u.src.ko = false; u.src.hp = u.hp; } });
    D.sfx('heal');
    yield sc.say(L('leech.done'));
  };
  // the Weigh-House (S.hessle): his word and the board heard; what is brought paid at the scales -- the ettercap's fangs (500 sp), the cloaker's tail (the drawer's 400), true
  // word on the Snoot (the anchor-pin, 500), Amara's order (500, "not for any board") -- renown and a weapon in kind for the two beasts (EV.renown's MAJOR); then what still
  // stands on the board, and the council's word on the five, once
  C.bounties = function (f) { var out = []; if (!f.ettercapDone) out.push(L('hessle.boardEttercap')); if (!f.cloakerDone) out.push(L('hessle.boardCloaker')); if (!f.snootWord) out.push(L('hessle.boardSnoot')); return out; };
  C.SCRIPTS.hessle = C.hessle = function* (sc) {
    var st = sc.st, f = st.flags, paid = false;
    var major = function* (why) { yield sc.say(C.renown(st, 1, why), 'welcoming'); var qw = C.questWeapons(st); if (qw.length) { sc.regear = true; yield sc.say(qw, 'welcoming'); } };
    yield sc.say(L('hessle.greet'), 'attentive');
    f.heardEttercap = 1; f.heardCloaker = 1; f['heard:r-ettercap'] = 1; f['heard:r-cloaker'] = 1;
    if (count(st, 'ettercapfangs') > 0) { take(st, 'ettercapfangs', 1); st.silver(500); f.ettercapDone = 1; D.sfx('coin'); paid = true; yield sc.say(L('hessle.ettercapPaid'), 'work'); yield* major('renown.ettercap'); }
    if (count(st, 'cloakertail') > 0) { take(st, 'cloakertail', 1); f.cloakerDone = 1; paid = true; yield sc.say(L('hessle.cloakerDrawer'), 'work'); st.silver(400); D.sfx('coin'); yield sc.say(L('g.foundSilver', { n: 400 }), 'welcoming'); yield* major('renown.cloaker'); }
    if (count(st, 'anchorpin') > 0) { take(st, 'anchorpin', 1); f.snootWord = 1; paid = true; yield sc.say(L('hessle.snootWord'), 'work'); st.silver(500); D.sfx('coin'); yield sc.say(L('g.foundSilver', { n: 500 }), 'welcoming'); }
    if (count(st, 'wagonorder') > 0) { take(st, 'wagonorder', 1); f.orderWord = 1; paid = true; yield sc.say(L('hessle.orderWord'), 'skeptical'); st.silver(500); D.sfx('coin'); yield sc.say(L('g.foundSilver', { n: 500 }), 'welcoming'); }
    var open = C.bounties(f);
    if (open.length) yield sc.say([L('hessle.boardRead')].concat(open), 'attentive');
    else if (!paid) yield sc.say(L('hessle.boardClear'), 'attentive');
    if (f.fiveDone && !f.fiveNotice) { f.fiveNotice = 1; yield sc.say(L(f.stockDead ? 'hessle.fiveDead' : 'hessle.fiveAlive'), 'concerned'); }
  };
  // major quests pay in kind (the first game's EV.questWeapons): a magic weapon for the lead (the save's, js/house.js H.fresh), and one for another of the four -- the
  // first two majors the +1 (content/heroes.json rewardWeapons), the rest the +2; what was in hand to the pack, a shield off for a two-hander. Returns the lines
  C.questWeapons = function (st) {
    var R = DS.R, f = st.flags, HD = DS.DATA.heroes || {}, lines = []; f.majors = (f.majors || 0) + 1;
    var tier = f.majors <= 2 ? 1 : 2;
    var bonus = function (h) { var w = R.item(h.equip.weapon); return (w && w.weapon && w.weapon.bonus) || 0; };
    var owns = function (h, b) { var ids = (HD[h.id] || {}).rewardWeapons || []; return ids.slice(b - 1).some(function (id) { return count(st, id) > 0 || h.equip.weapon === id; }); };
    var giveW = function (h) {
      var id = ((HD[h.id] || {}).rewardWeapons || [])[tier - 1]; if (!id || bonus(h) >= tier || owns(h, tier)) return false;
      var it = DS.DATA.items[id];
      if (h.equip.weapon && h.equip.weapon !== 'unarmed') give(st, h.equip.weapon, 1);
      if ((it.weapon.props || []).indexOf('two-handed') >= 0 && h.equip.shield) { give(st, h.equip.shield, 1); h.equip.shield = null; }
      h.equip.weapon = id; lines.push(L('g.rewardWeapon', { name: h.name, item: it.name }));
      return true;
    };
    var party = st.party.filter(function (h) { return !h.dead && h.equip; }), rec = D.house && D.house.playing && D.house.cur, lead = (rec && rec.lead) || (party[0] && (party[0].key || party[0].id));
    var main = party.filter(function (h) { return (h.key || h.id) === lead; })[0] || party[0]; if (!main) return [];
    var gotMain = giveW(main), hires = party.filter(function (h) { return h !== main; }).sort(function (a, b) { return bonus(a) - bonus(b); });
    for (var i = 0; i < hires.length; i++) if (giveW(hires[i])) break;
    if (!gotMain) for (var j = 0; j < hires.length; j++) if (lines.length < 2 && giveW(hires[j])) break;
    if (lines.length) { D.sfx('chest'); return [L('g.rewardKind')].concat(lines); }
    return [];
  };
  // MARTA VENN's bat-wing pies (10-22, the house seat, started by the lanes desk on Griz's "looks like its opens that weren't art is the bat wing cooking in silverton"): the
  // first game's js/events.js S.marta on her counter screen, in its words (content/text.json marta.*). Wings in the pack: COOK THEM or NOT NOW -- a silver a wing, free with
  // Vivian in the party (her daughter, RULED 09-24) -- and the pies into the pack (the floor's, which the house saves: C.state; the grid's fights eat them, js/battle.js
  // fortify). NOT NOW, or no wings: her word, as before
  C.SCRIPTS.marta = C.marta = function* (sc, B) {
    var st = sc.st, n = count(st, 'batwings');
    if (n > 0) {
      var free = st.party.some(function (h) { return (h.key || h.id) === 'vivian'; }), cost = free ? 0 : n;
      if ((yield sc.ask(L(free ? 'marta.wingsViv' : 'marta.wings', { n: n, cost: cost }), ['COOK THEM', 'NOT NOW'], 'attentive')) === 0) {
        if (cost > st.silver()) { D.sfx('error'); yield sc.say(L('g.poor'), 'concerned'); return; }
        if (cost) { st.silver(-cost); D.sfx('coin'); }
        take(st, 'batwings', n); give(st, 'batpie', n); D.sfx('chest');
        yield sc.say(L('marta.pies', { n: n }), 'work');
        return;
      }
    }
    yield sc.say(C.words(B, 'marta'), 'welcoming');
  };
  // the services, shown (deep16/?services -- the eyes row's door, 10-22): a NEW GAME staged by the beat -- the four hurt, a level banked, a ring that wants a bond, the
  // fallen, the bounties' proofs -- and stood at the door (the camp's on THE WORLD), the rest in the player's hands: a click on the door (or E), E at the counter.
  // &beat=<id> opens one; X back to the title
  C.SERVICE_BEATS = [
    { id: 'cassia', door: 'inn:cassia', label: 'CASSIA\'S ROOMS: a night at the inn, and the morning', note: 'The four hurt, the slots spent, Aurdin a level due, Vivian in a ring not yet bonded; 40 silver. STAY: the night, MORNING, the picks, the bonds, the spells, the save.', hurt: true, spent: true, level: true, ring: true, silver: 40 },
    { id: 'aldwin', door: 'chapel:aldwin', label: 'ALDWIN\'S FLOOR: the chapel\'s free sleep', note: 'The four hurt, no silver: Aldwin\'s word, SLEEP, the morning.', hurt: true, spent: true, silver: 0 },
    { id: 'davos', door: 'leech:davos', label: 'DAVOS KREN: the fallen stitched', note: 'Vivian and Lymen down, 20 silver: five silver a body, PAY, both up at half their hit points.', down: ['vivian', 'lymen'], silver: 20 },
    { id: 'hessle', door: 'keeper:hessle', label: 'HESSLE: the bounties paid at the scales', note: 'The ettercap\'s fangs, the cloaker\'s tail, the anchor-pin and Amara\'s order in the pack: paid, renown twice, weapons in kind, the board clear.', inv: [['ettercapfangs', 1], ['cloakertail', 1], ['anchorpin', 1], ['wagonorder', 1]] },
    { id: 'board', door: 'keeper:hessle', label: 'HESSLE: nothing brought', note: 'His word, and the board read through the glass: the three bounties standing.' },
    { id: 'camp', label: 'THE CAMP\'S MORNING, on THE WORLD', note: 'The four hurt at Silverton\'s hex, a quiet night: CAMP, THE NIGHT, BEGIN THE NIGHT -- the same morning as the inn\'s.', world: true, hurt: true, spent: true, level: true, ring: true }
  ];
  C.serviceStage = function (bt) { // a beat's NEW GAME: the second game's four (js/house.js H.fresh), the beat's own on top
    var H = D.house, R = DS.R, rec = H.fresh(), hero = function (id) { return rec.party.filter(function (h) { return h.id === id; })[0]; };
    if (bt.hurt) rec.party.forEach(function (h) { h.hp = Math.max(1, Math.round(h.maxhp * 0.45)); });
    if (bt.spent) rec.party.forEach(function (h) { h.slots = (h.slots || []).map(function () { return 0; }); });
    if (bt.level) { var a = hero('aurdin'); a.xp = R.XP_LEVEL[a.lvl + 1]; }
    if (bt.ring) hero('vivian').equip.ring = 'ringofprotection'; // (worn and not yet bonded: the night bonds it -- NEW on THE NIGHT'S BONDS)
    (bt.down || []).forEach(function (id) { var h = hero(id); h.hp = 0; h.ko = true; });
    (bt.inv || []).forEach(function (s) { H.add(rec.inv, s[0], s[1]); });
    if (bt.silver != null) rec.silver = bt.silver;
    if (bt.world) rec.at = { town: null };
    else if (bt.near) { // (beside a person on the street, facing them: Marta at her stalls -- the house seat's show, 10-22)
      var fl = D.town.floor('', rec.flags || {}), pp = fl.people.filter(function (p) { return p.id === bt.near; })[0], taken = {}; fl.people.forEach(function (p) { taken[p.at[0] + ',' + p.at[1]] = 1; });
      var o0 = [[0, 1], [-1, 0], [1, 0], [0, -1]].filter(function (o) { var x = pp.at[0] + o[0], y = pp.at[1] + o[1], r = fl.rows[y]; return r && '.,='.indexOf(r.charAt(x)) >= 0 && !taken[x + ',' + y]; })[0];
      rec.at = { town: 'silverton', gate: 'west', sq: [pp.at[0] + o0[0], pp.at[1] + o0[1]], dir: D.roam.DIR8[(-o0[0]) + ',' + (-o0[1])] };
    } else { var F = D.town.SCALE, Lt = (D.town.laidF = D.town.laidF || {})[F] || (D.town.laidF[F] = D.town.lay(null, F)), dq = Lt.marks.doors[bt.door]; rec.at = { town: 'silverton', gate: 'west', sq: dq.slice(), dir: D.roam.DIR8['0,-1'] }; } // (on the door's threshold, facing it)
    return rec;
  };
  C.servicePlay = function (bt) {
    var H = D.house, W = D.world; H.begin(C.serviceStage(bt), 0);
    if (bt.world) { var S = W.state(), e = W.M().hex[W.K(S.at[0], S.at[1])]; S.zone = W.zoneOf(e); S.count = 1e9; } // (a quiet night: nothing out of the dark on the watches' checks)
  };
  function ServicesShow(q, beats, title) { // (beats, title: another show of NEW GAMEs staged the same way -- C.houseShow, 10-22)
    this.kind = 'servicesshow'; this.opaque = true; this.t = 0; this.hov = 0; this.beats = beats || C.SERVICE_BEATS; this.title = title || '{y}SILVERTON\'S SERVICES{/} -- a NEW GAME staged at the door; the rest is yours (a show)';
    var b = /[?&]beat=([a-z0-9]+)/.exec(String(q || '')); if (b) this.pending = this.beats.filter(function (x) { return x.id === b[1]; })[0] || null;
  }
  ServicesShow.prototype.buttons = function () { var st = Math.min(34, Math.floor((D.H - 46) / this.beats.length)); return this.beats.map(function (bt, k) { return { x: 12, y: 26 + k * st, w: D.W - 24, h: st - 3, bt: bt }; }); }; // (more than six beats: tighter rows, the note one line)
  ServicesShow.prototype.update = function () {
    this.t++; var m = I.mouse;
    if (this.pending) { var p0 = this.pending; this.pending = null; C.servicePlay(p0); return; }
    var bs = this.buttons(), hit = m.inside ? bs.filter(function (q) { return m.x >= q.x && m.x < q.x + q.w && m.y >= q.y && m.y < q.y + q.h; })[0] : null;
    if (m.moved || m.click) this.hov = hit ? bs.indexOf(hit) : this.hov;
    if (I.repeat('down')) this.hov = (this.hov + 1) % bs.length; if (I.repeat('up')) this.hov = (this.hov - 1 + bs.length) % bs.length;
    if ((m.click && hit) || I.pressed('a')) { D.sfx('confirm'); C.servicePlay((hit || bs[this.hov]).bt); return; }
    if (I.pressed('b') || m.rclick) { D.scenes.length = 0; if (D.house && D.house.Title) D.push(new D.house.Title()); }
  };
  ServicesShow.prototype.draw = function (ctx) {
    var self = this, W8 = D.WIN8; ctx.fillStyle = '#0a0c22'; ctx.fillRect(0, 0, D.W, D.H);
    D.text(ctx, this.title, 10, 10, W8.text);
    this.buttons().forEach(function (q, k) {
      var on = k === self.hov; D.win8(ctx, q.x, q.y, q.w, q.h, on ? W8.sel : null);
      D.text(ctx, q.bt.label, q.x + 8, q.y + 3, on ? W8.gold : W8.text);
      D.wrap(q.bt.note, q.w - 16).slice(0, q.h >= 30 ? 2 : 1).forEach(function (l, i) { D.text(ctx, l, q.x + 8, q.y + 12 + i * 9, '#9c9cb4'); });
    });
    D.hint(ctx, 'click a beat · in town: click the square they stand on, E at the counter · X: the title', D.W / 2, D.H - 12, '#9a96a8', 'center');
  };
  C.servicesShow = function (q) { return new ServicesShow(q); };
  // the house seat's show (deep16/?houseshow -- its eyes rows' door, 10-22): a NEW GAME staged beside Marta with bat wings in the pack, at Percy's door with them, at Kasten's,
  // and on two thresholds of doors moved into a wall (js/town.js T.lay)
  C.HOUSE_BEATS = [
    { id: 'marta', near: 'marta', label: 'MARTA VENN\'S PIES: six bat wings, Vivian along', note: 'A click on Marta (or E beside her): COOK THEM, free for Viv\'s friends -- six pies into the pack, eaten in a fight. NOT NOW: her word, as before.', inv: [['batwings', 6]] },
    { id: 'percy', door: 'warp:percy', label: 'PERCY: the wings he won\'t have', note: 'Two bat wings in the pack. In at the door, E at the counter: his word, then "Wings? Not in my jars. Take them to Marta Venn..."', inv: [['batwings', 2]] },
    { id: 'kasten', door: 'shop:kasten', label: 'KASTEN WHEAL, THE CHANDLER: his shelves', note: 'In at his door, E at the counter: his greeting, THE SHELVES -- oil, torches, the hooded lantern, candles -- and he buys, at half.', silver: 60 },
    { id: 'cassia', door: 'inn:cassia', label: 'THE DOORS IN THE WALLS: Cassia\'s inn', note: 'On her threshold, her door in the inn\'s south wall -- the first card says "SILVERTON, at Cassia\'s door". A click on the door, E, or the arrow up into it: in.' },
    { id: 'davos', door: 'leech:davos', label: 'THE DOORS ON THEIR OWN HOUSES: Davos Kren\'s leech-house', note: 'Out in the Arena Plaza, where v6 has no house for him: the arena\'s own surgery, a small house round its cots, the door under the leech sign. The first card: "at Davos Kren\'s door".' },
    { id: 'vilar', door: 'shop:vilar', label: 'THE DOORS ON THEIR OWN HOUSES: Vilar\'s forge-booth, by Mama\'s', note: 'The show-armorer\'s pin is in the open plaza too: a forge-booth on Mama\'s pattern beside hers by the Hex, the sword sign over his door.' },
    { id: 'lisbet', door: 'shop:lisbet', label: 'THE DOORS ON THEIR OWN HOUSES: Lisbet\'s and Calla\'s, one house', note: 'Both pins name the one house: their doors side by side in its wall (Lisbet\'s had been four squares west, on the next house).' },
    { id: 'marin', door: 'keeper:marin', label: 'THE DOORS ON THEIR OWN HOUSES: Marin Voss, at the back', note: 'At the town\'s scale her house stands back to back with the next row: a lane cut through two squares of the house behind to her south wall. She stands at her front.' }
  ];
  C.houseShow = function (q) { return new ServicesShow(q, C.HOUSE_BEATS, '{y}THE HOUSE, 10-22{/} -- a NEW GAME staged; the rest is yours (a show)'); };

  // ---------------------------------------------------------------- NED HALLOWAY and Find Familiar (10-21 night, the keepers cutter seat, on the house lane's "Ned and
  // Find Familiar", THE SCENE, RULED). His design: "pick a school that isn't evocation and Ned tell story about how if you didn't have a familiar, they wouldn't accept
  // you as a student. He finally learned the spell, but decided to stay in town ... let aurdin ask 'can i copy it from you' (Ned will sell it for 50 silver) and also
  // have him make a silent insight check - if he makes it add dialog 'because the components are fascinating?' - he'll agree then offer quest for some component from
  // the glowseep - he wants a fresh one - and will trade the paper for that"; his flow: "You know that spell - back in, where no explains vision and touch spell
  // delivery - where yes goes 'can you cast it' - where yes = 'show me' bluff unless he knows the spell (this dialog doesn't happen if he does) - bluff caught = laugh
  // end of conversation, animal harvest message after until they leave and come back"; "1 conjuration", "4 - agreed, insight text a different color and (insight)
  // after it". Ned's words are the seat's drafts (invented.json ned-familiar-grid; his "Griz's words set them later"), his two first-game lines his own (content/npcs.json
  // `ned`). The save's flags (the floor's): nedStory his story heard, nedSaw the Insight made (its choice stays), nedQuest the tongue asked for, nedDone the page
  // given. A visit's own -- the bluff caught, the Insight rolled -- ride the room's visit (B.townAway, new at every door: "until they leave and come back")
  // His notes of 10-22 (his ear file, eyes-ned-familiar-1021e, "easy"): "Can we put Aurdin's portrait in the bottom left and have his text choices be in his speech
  // bubble? / Such that when Aurdin is choosing what to say, his line it answers "I decided to stick around" is still on the screen / where he'll say 'deal' instead of
  // player clicking 'take it' / with quest taken Aurdin "what did you want for that find familiar spell?" instead of 'can i copy it" again / text should be same as
  // fight end, where 'sheet: Find Familiar" or whatever is awarded, where player has to use it as an item to put it in spellbook (vs text saying he copied it into his
  // book) - some times Ned rips it out page (good) - hands him a copied page is good too, letting him copy out of book text is not" · "Not having harvester shouldn't
  // prevent quest acceptance" · "Aurdin knows it - no spell talk:  Looks like you're learning without the classes - only asks about familiar by type if Aurdin has one
  // with him". So Aurdin is the screen's hero (sc.hero: Counter.drawHero), his answers C.NED_REPLIES; the page is a sheet in the pack (C.nedPage), torn out for the
  // tongue or a fair copy for the silver, and nedDone is the page given either way
  C.NED = { price: 50, dc: 12, part: 'snaketongue', spell: 'findfamiliar', sheet: 'sheet_findfamiliar', insight: '#8ce0f8', harvest: ['Survival', 'Nature'], rat: { sheet: 'giantrat_p1', dx: 42, dy: -80, facing: 1, scale: 1 } };
  C.NED_LINES = {
    harvest: ['"Spell components? Half of them are walking around inside whatever comes at you on the road. A snake\'s tongue, a bat\'s fur, a spider\'s silk."',
      '"Take them off what attacks you, if one of you has the hands for it, and bring them here. Percy pays a fifth, once they\'re rendered."'],
    story: ['"I went up the mountain road to study with the Doorwardens. Conjuration. Their door is the cut beside the Great Door."',
      '"They read my letters, and looked at my hands, and then at my shoulder. No familiar. They won\'t take a student without one."'],
    know: '"You know that spell?"',
    explain: ['"Find Familiar. A spirit takes a small shape and stays with you -- an owl, a cat, a rat."',
      '"You see through its eyes and hear through its ears. And a spell that wants a touch, it carries the touch for you, to wherever it has to go."',
      '"A conjurer who has to walk up and lay hands on everything he works doesn\'t last long. That\'s their reasoning, anyway."'],
    cast: '"Can you cast it?"',
    showMe: ['"Show me."', '{g}Aurdin\'s hands go through the shapes. Nothing answers.{/}'],
    laugh: ['Ned laughs -- not unkindly, but it takes him a while to stop.', '"Fair. I said the same at the cut."'],
    rest: ['"I learned it in the end. Down here, out of a book I paid too much for."', 'The rat on his shoulder washes its face.',
      '"And then I didn\'t go back up. The road was still there in the morning. I decided to stick around."'],
    back: ['"Back again." Ned looks at Aurdin\'s book, then at the rat.'],
    copyPrice: '"I can let you copy it. Fifty silver -- the book cost me more than that, and the ink isn\'t free."',
    poor: ['"Fifty. I\'m sorry. Come back when the purse is heavier."'],
    copied: ['Ned counts the silver twice, then slides a loose page out from under the jar labels -- the ritual, copied out fair in his own hand.'],
    paid: ['"Feed it, whatever it turns out to be. They remember who feeds them."'],
    notNow: ['"It\'ll keep. So will I."'],
    copyQuest: ['"We said a snake\'s tongue from the Glowseep. A fresh one. I\'ll keep to that, if you will."'],
    owned: ['Ned stops, then smiles, caught out.', '"They are. The spell is the easy part. It\'s the components I can\'t get any more -- I don\'t go out past the gate."'],
    noHands: ['"It wants someone who can take a tongue off a snake without ruining it, though -- someone who knows animals, or the wild. Find one, and bring them along."'],
    quest: ['"Bring me a snake\'s tongue from the Glowseep. Fresh -- off the snake, not out of a jar."', '"Do that, and the page is yours. No silver."'],
    taken: ['"The bog, then. Mind the frogs."'],
    tongue: ['Ned turns the tongue over in the lamplight. "Fresh. Good."', 'He tears a page out of his book along a fold worn soft, and holds it out.'],
    page: ['"It was always going to be somebody\'s."'],
    pageWaits: ['"That page wants to be in your book, not your pack. The rat has opinions about loose paper."'],
    learning: '"Looks like you\'re learning without the classes."', // (his words, 10-22)
    famAsk: '"How\'s the {kind}? Mine eats better than I do."', // (only with Aurdin's familiar out with him: flags.familiar, js/familiar.js)
    bye: ['"Mind how you go."'],
    journal: '{g}Ned\'s page is in your JOURNAL now (M, then JOURNAL), pinned.{/}',
    percyTongue: '"Didn\'t Ned want one of those?"' // (Percy's, selling him a snake tongue while Ned's is asked for: his words, RULED 10-21 night -- Counter.remark)
  };
  // Aurdin's side, in his bubble: his words where he gave them ("Can I copy it from you?", "Because the components are fascinating?", "Deal.", "What did you want for
  // that Find Familiar spell?"), the rest the seat's drafts (invented.json ned-aurdin-replies-grid)
  C.NED_REPLIES = { yes: 'Yes.', no: 'No.', copy: 'Can I copy it from you?', whatFor: 'What did you want for that Find Familiar spell?', insight: 'Because the components are fascinating?',
    tongue: 'One snake\'s tongue. Fresh.', pay: 'Fifty it is.', deal: 'Deal.', notNow: 'Not now.', leave: 'We should get going.' };
  C.nedRoll = function () { return D.roll('1d20').total; }; // (the Insight's die: the bench and the show pin it)
  C.nedAurdin = function (st) { return st.party.filter(function (h) { return (h.key || h.id) === 'aurdin' && !h.dead; })[0] || null; };
  C.knowsFF = function (h) { return !!h && (h.known || []).indexOf(C.NED.spell) >= 0; };
  // who can take a tongue off a snake: the first game's harvest (js/rules.js R.spoils -- a part's skills, content/monsters.json `snake`: Survival or Nature)
  C.canHarvest = function (st) { return st.party.some(function (h) { return !h.dead && C.NED.harvest.some(function (s) { return h.skills && h.skills[s] != null; }); }); };
  C.nedOpen = function (st) { return !!(st && st.flags.nedQuest && !st.flags.nedDone); };
  C.nedVisit = function (B) { var o = B && B.townAway; if (!o) o = C.nedLoose = C.nedLoose || {}; return o.ned = o.ned || {}; };
  // the page into the pack, as a story's end gives a sheet (js/mines.js, Edric's page): "Received: Sheet: Find Familiar." -- used from the pack, the house's learn
  // copies it into the book (js/house.js FD.item `learn`). The page given: nedDone, by the tongue or the silver
  C.nedPage = function (st) { give(st, C.NED.sheet, 1); st.flags.nedDone = 1; D.sfx('chest'); return [L('g.got', { item: DS.DATA.items[C.NED.sheet].name })]; };
  // his familiar by its kind, if it is out with him (js/familiar.js: flags.familiar, by whom)
  C.nedFam = function (st, h) { var fm = st.flags.familiar, form = fm && fm.by === (h.key || h.id) && DS.R.FAMILIARS[fm.kind]; return form ? [C.NED_LINES.famAsk.split('{kind}').join(form.name)] : []; };
  C.ned = function* (sc, B) {
    var st = sc.st, f = st.flags, NL = C.NED_LINES, AS = C.NED_REPLIES, au = C.nedAurdin(st), vis = C.nedVisit(B);
    var school = ((((DS.DATA.npcs || {}).ned || {}).talk || []).filter(function (e) { return e['if'] === 'hired:aurdin'; })[0] || {}).say || [];
    sc.hero = au; // (Aurdin bottom left, his answers in his bubble; no one without him)
    if (!au || vis.laughed) { yield sc.say(NL.harvest, vis.laughed ? 'skeptical' : 'attentive'); return; } // (8: no Aurdin, or the bluff caught this visit)
    if (C.knowsFF(au)) { yield sc.say(school.concat([NL.learning], C.nedFam(st, au)), 'welcoming'); return; } // (2: he knows it -- none of the spell talk)
    if (f.nedDone) { yield sc.say(NL.pageWaits, 'welcoming'); return; } // (the page his and still in the pack)
    var said;
    if (!f.nedStory) {
      yield sc.say(school, 'attentive');
      yield sc.say(NL.story, 'concerned');
      if ((yield sc.ask(NL.know, [AS.yes, AS.no], 'attentive')) === 0) { // (4: YES, CAN YOU CAST IT? -- YES is the bluff, "Show me.")
        if ((yield sc.ask(NL.cast, [AS.yes, AS.no], 'skeptical')) === 0) { yield sc.say(NL.showMe, 'skeptical'); vis.laughed = 1; yield sc.say(NL.laugh, 'welcoming'); return; }
      } else yield sc.say(NL.explain, 'attentive'); // (3: NO -- what a familiar is for)
      said = NL.rest; f.nedStory = 1; // (5: the rest of his story, on the screen while Aurdin answers it)
    } else said = NL.back;
    // 6: the silent Insight -- Aurdin's, DC 12, once a visit; nothing on the screen but the choice it opens
    if (!vis.rolled && !f.nedSaw && !f.nedQuest) { vis.rolled = 1; var d20 = C.nedRoll(); vis.insight = { d20: d20, total: d20 + DS.R.skill(au, 'Insight', 'wis') }; if (vis.insight.total >= C.NED.dc) f.nedSaw = 1; }
    while (true) { // (each answer's reply stays in Ned's box under the next choice)
      var opts = [], acts = [];
      if (C.nedOpen(st) && C.count(st, C.NED.part) > 0) { opts.push(AS.tongue); acts.push('tongue'); }
      opts.push(f.nedQuest ? AS.whatFor : AS.copy); acts.push('copy');
      if (f.nedSaw && !f.nedQuest) { opts.push({ label: AS.insight + ' (insight)', color: C.NED.insight }); acts.push('insight'); }
      opts.push(AS.leave); acts.push('leave');
      var a = acts[yield sc.ask(said, opts, 'attentive')];
      if (a === 'leave') { yield sc.say(NL.bye, 'welcoming'); return; }
      if (a === 'copy') { // (5: the sale -- not while the quest he gave stands: his line names it)
        if (f.nedQuest) { said = NL.copyQuest; continue; }
        if ((yield sc.ask(NL.copyPrice, [AS.pay, AS.notNow], 'attentive')) !== 0) { said = NL.notNow; continue; }
        if (st.silver() < C.NED.price) { D.sfx('error'); said = NL.poor; continue; }
        st.silver(-C.NED.price); D.sfx('coin'); yield sc.say(NL.copied, 'work'); yield sc.say(C.nedPage(st).concat(NL.paid), 'welcoming'); return;
      }
      if (a === 'insight') { // (6, 7: he owns it, and offers the tongue -- with no one to take it he says so, and offers it all the same)
        if ((yield sc.ask(NL.owned.concat(C.canHarvest(st) ? [] : NL.noHands, NL.quest), [AS.deal, AS.notNow], 'welcoming')) !== 0) { said = NL.notNow; continue; } // (9: turned down, the choice stays)
        f.nedQuest = 1; var live = C.quests(st).filter(function (q) { return q.id === f.pin && !q.done; })[0];
        if (!live) f.pin = 'nedpage';
        said = NL.taken.concat(f.pin === 'nedpage' ? [NL.journal] : []); continue;
      }
      if (a === 'tongue') { // (9: the tongue handed in: the page torn out and given)
        C.take(st, C.NED.part, 1); if (f.pin === 'nedpage') delete f.pin;
        yield sc.say(NL.tongue, 'work'); yield sc.say(C.nedPage(st).concat(NL.page), 'welcoming'); return;
      }
    }
  };
  // his rat on his shoulder on the counter screen (10: "on neds shoulder on counter screen"): the grid's rat familiar's sheet (js/rules.js R.FAMILIARS.rat), at the
  // portrait's pixels, on the shoulder away from his gaze (measured on pt_ned: every row's shoulder line within a pixel or two of the idle's)
  C.drawNedRat = function (ctx, x, y, t) {
    var r = C.NED.rat; if (!D.SHEETS || !D.SHEETS[r.sheet] || !D.spr.has(r.sheet)) { if (D.SHEETS && D.SHEETS[r.sheet] && D.spr.load && !D.spr.offline) D.spr.load(D.SHEETS[r.sheet].image); return; }
    ctx.save(); ctx.translate(Math.round(x + r.dx), Math.round(y + r.dy)); if (r.scale !== 1) ctx.scale(r.scale, r.scale);
    D.spr.draw(ctx, r.sheet, 'idle', r.facing, t, 0, 0, {}); ctx.restore();
  };

  // ---------------------------------------------------------------- the house's JOURNAL (the one menu's JournalPage, js/menu.js): the quests the grid plays, by the
  // first game's own records (content/quests.json: show, done, steps' `if` and `where`), on what the party holds now. The rest of the first game's quests are its own
  C.QUESTS = ['errands', 'nedpage'];
  // the second game's own quests, in the first game's record shape (content/quests.json stays the first game's): Ned's page (C.ned)
  C.OWN_QUESTS = [{ id: 'nedpage', name: 'Ned\'s Page', show: 'flag:nedQuest', done: 'flag:nedDone',
    text: 'Ned Halloway, behind Percy\'s counter, will trade the page with Find Familiar on it for a snake\'s tongue from the Glowseep -- a fresh one, off the snake. Someone with Survival or Nature has to take it.',
    doneText: 'Ned has his tongue, and Aurdin the page: Sheet: Find Familiar, to copy into his book from the pack.',
    steps: [{ 'if': '!has:snaketongue', where: 'A fresh snake\'s tongue, off one of the Glowseep\'s snakes: the bog, out on THE WORLD.' },
      { 'if': 'has:snaketongue', door: 'percy', npc: 'ned', where: 'Ned Halloway, behind the counter at Percy\'s Particulars: the tongue for the page.' }] }];
  C.quests = function (st) {
    return (DS.DATA.quests || []).concat(C.OWN_QUESTS).filter(function (q) { return C.QUESTS.indexOf(q.id) >= 0 && C.cond(q.show, st); }).map(function (q) {
      var done = C.cond(q.done, st), step = !done && (q.steps || []).filter(function (s) { return C.cond(s['if'], st); })[0];
      return { id: q.id, name: q.name, text: q.text, doneText: q.doneText, done: done, where: step && step.where, step: step || null };
    });
  };
  C.journal = function (B) {
    var st = C.state(B); if (!st) return null;
    var titles = (DS.DATA.config || {}).renownTitles || ['a stranger'], r = C.renownOf(st);
    return {
      renown: r, title: titles[Math.min(r, titles.length - 1)], pin: st.flags.pin || null, quests: C.quests(st),
      rumors: (DS.DATA.rumors || []).filter(function (x) { return st.flags['heard:' + x.id]; }).map(function (x) { return x.t; }),
      setPin: function (id) { if (id) { st.flags.pin = id; D.sfx('confirm'); } else { delete st.flags.pin; D.sfx('cancel'); } }
    };
  };
  // the pinned quest's next step, as a door of the town (js/town.js T.DOORS) and the person behind it
  C.pinned = function (st) {
    var q = st && st.flags.pin && C.quests(st).filter(function (x) { return x.id === st.flags.pin && !x.done; })[0], s = q && q.step;
    if (!s) return null;
    var who = s.npc || s.door, dk = s.door || s.npc, door = D.town.DOORS.filter(function (d) { return d.id.split(':')[1] === dk; })[0]; // (a step's door and the one behind it: Ned at Percy's)
    return door ? { q: q, who: who, door: door.id } : null;
  };
  // on the town floor: a gold marker over the next door -- or, in a room, over the keeper it wants, else over the way out -- the first game's pinned marker (js/world.js
  // DS.pinnedQuest: "a marker bobs over whoever (or whatever) it wants next. On another map, the marker sits on the way there"), held at the screen's edge, pointing,
  // when the square is off it (the town is bigger than the screen); the step in words is the JOURNAL's NEXT line, as the first game's (RULED 10-21, Griz: "should
  // function the same as the 8-bit unless we add a feature")
  C.paintPin = function (ctx, B) {
    var R = D.roam, R0 = B && B.roam, def = R && R.def; if (!R0 || !def || !def.town || B.menu) return;
    var st = C.state(B), p = C.pinned(st); if (!p) return;
    var sq = null;
    if (def.room) sq = def.keeper && def.keeper.id === p.who ? def.keeper.at : def.room === p.door && (def.beside || {})[p.who] ? def.beside[p.who].at : (def.doors || [])[0];
    else sq = def.marks && def.marks.doors && def.marks.doors[p.door];
    if (!sq) return;
    var iso = D.iso, c = iso.center(sq[0], sq[1], (B.map && B.map.gz ? B.map.gz(sq[0], sq[1]) : 0) + 30), s = iso.toScreen(c.x, c.y);
    var m = 14, x = Math.max(m, Math.min(D.W - m, s.x)), y = Math.max(m + 14, Math.min(D.H - 40, s.y)), off = x !== s.x || y !== s.y, bob = Math.sin(B.t / 10) * 2;
    ctx.save(); ctx.translate(Math.round(x), Math.round(y + (off ? 0 : bob)));
    if (off) ctx.rotate(Math.atan2(s.y - y, s.x - x) - Math.PI / 2);
    ctx.fillStyle = '#1a1206'; ctx.beginPath(); ctx.moveTo(-7, -9); ctx.lineTo(7, -9); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = D.WIN8.gold; ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(5, -8); ctx.lineTo(0, 1); ctx.closePath(); ctx.fill();
    ctx.restore();
  };

  // ---------------------------------------------------------------- the keepers standing, shown (deep16/?keepers -- the eyes row's door, 10-21): every keeper's own
  // figure in its south idle, named, at twice the game's size, with Barley and Aurdin among them for the size; X or a right click back to the title. Two rows a page, at most
  // C.SHOW_PAGE keepers on one (seventeen since the last six of art-wanted section 20, 10-21 evening): the arrows or a click on either half turn the page; &page=N opens
  // on one, and &who=cassia,lisbet,... stands only those (an eyes row's door)
  C.SHOW_PAGE = 12;
  function KeepersShow(q) {
    this.kind = 'keepersshow'; this.opaque = true; this.t = 0; q = String(q || '');
    var who = /[?&]who=([a-z0-9_,]+)/.exec(q), ids = Object.keys(C.FIG).filter(function (k) { return !who || who[1].split(',').indexOf(k) >= 0; }), ks = ids.map(function (k) { return C.FIG[k]; });
    var np = Math.max(1, Math.ceil(ks.length / C.SHOW_PAGE)), per = Math.ceil(ks.length / np);
    this.pages = [];
    for (var p = 0; p < np; p++) { var pk = ks.slice(p * per, (p + 1) * per), half = Math.ceil(pk.length / 2); this.pages.push([['barley_p2'].concat(pk.slice(0, half)), ['aurdin_p2'].concat(pk.slice(half))]); }
    var pg = /[?&]page=(\d+)/.exec(q); this.page = Math.max(0, Math.min(np - 1, (pg ? +pg[1] : 1) - 1)); this.rows = this.pages[this.page];
    if (D.spr.prefetch) D.spr.prefetch(['barley_p2', 'aurdin_p2'].concat(ks, ['crewman_p1']));
  }
  KeepersShow.prototype.turn = function (d) { var n = this.pages.length; if (n < 2) return; this.page = (this.page + d + n) % n; this.rows = this.pages[this.page]; D.sfx('cursor'); };
  KeepersShow.prototype.update = function () {
    this.t++; var m = I.mouse;
    if (I.pressed('b') || m.rclick) { D.scenes.length = 0; if (D.house && D.house.Title) D.push(new D.house.Title()); return; }
    if (I.pressed('right') || I.pressed('down') || (m.click && m.inside && m.x >= D.W / 2)) this.turn(1);
    else if (I.pressed('left') || I.pressed('up') || (m.click && m.inside && m.x < D.W / 2)) this.turn(-1);
  };
  KeepersShow.prototype.draw = function (ctx) {
    var self = this, k = 2, names = {}; Object.keys(C.FIG).forEach(function (id) { names[C.FIG[id]] = ((C.VENDORS[id] || {}).name || D.town.KEEPER['shop:' + id] || D.town.KEEPER['warp:' + id] || D.town.KEEPER['keeper:' + id] || D.town.KEEPER['inn:' + id] || (((DS.DATA || {}).npcs || {})[id] || {}).name || id); });
    names.barley_p2 = 'Barley (hero)'; names.aurdin_p2 = 'Aurdin (hero)';
    ctx.fillStyle = '#0e1634'; ctx.fillRect(0, 0, D.W, D.H);
    D.text(ctx, '{y}SILVERTON\'S KEEPERS{/}, their town figures, facing south (x2; two heroes for size)', 8, 6, D.WIN8.text);
    this.rows.forEach(function (row, r) {
      var base = 118 + r * 122, gap = (D.W - 16) / row.length;
      ctx.fillStyle = '#2a2236'; ctx.fillRect(4, base + 1, D.W - 8, 2);
      row.forEach(function (name, i) {
        var x = 8 + gap * (i + 0.5);
        ctx.save(); ctx.translate(Math.round(x), base); ctx.scale(k, k); D.spr.draw(ctx, name, 'idle', 0, self.t, 0, 0, {}); ctx.restore();
        D.text(ctx, names[name] || name, Math.round(x), base + 6, name.indexOf('_p2') > 0 ? '#9c9cb4' : D.WIN8.gold, 'center');
      });
    });
    D.hint(ctx, (this.pages.length > 1 ? 'page ' + (this.page + 1) + ' of ' + this.pages.length + ' -- arrows or a click turn it   ' : '') + 'X back to the title', D.W / 2, D.H - 12, '#9a96a8', 'center');
  };
  C.keepersShow = function (q) { return new KeepersShow(q); }; // (q: the page's query -- &page=, &who=)

  // ---------------------------------------------------------------- the portraits, shown (deep16/?portraits&who=mela,mical -- an eyes row's door, 10-21 night): each
  // keeper's own counter screen as the game draws it, their first-game word on it, a face at a time -- the idle, the four stills, the work -- OK for the next face and
  // the next keeper; X back to the title
  C.FACES = ['idle', 'attentive', 'welcoming', 'skeptical', 'concerned', 'work'];
  function PortraitShow(q) {
    this.kind = 'portraitshow'; this.opaque = true; this.t = 0; this.k = -1; this.cur = null;
    var who = /[?&]who=([a-z0-9_,]+)/.exec(String(q || '')); this.ids = who ? who[1].split(',').filter(function (k) { return !!C.PT[k]; }) : Object.keys(C.PT); // (in the order asked)
  }
  C.wordsOf = function (id) { var N = ((DS.DATA || {}).npcs || {})[id] || {}, plain = (N.talk || []).filter(function (e) { return !e['if']; })[0], sh = C.greeting((C.VENDORS[id] || {}).shop || id), wd = (C.VENDORS[id] || {}).words; return plain ? plain.say.slice() : wd ? [].concat(L(wd)) : sh ? [sh] : ['(no first-game word)']; };
  PortraitShow.prototype.update = function () {
    this.t++;
    if (this.cur && !this.cur.done) return;
    if (++this.k >= this.ids.length) { D.scenes.length = 0; if (D.house && D.house.Title) D.push(new D.house.Title()); return; }
    var id = this.ids[this.k], n = this.ids.length, k = this.k, nm = (C.VENDORS[id] || {}).name || D.town.KEEPER['shop:' + id] || D.town.KEEPER['warp:' + id] || D.town.KEEPER['keeper:' + id] || D.town.KEEPER['inn:' + id] || (((DS.DATA || {}).npcs || {})[id] || {}).name || id, words = C.wordsOf(id);
    this.cur = new Counter(null, { id: id, name: nm, place: 'THE PORTRAITS (a show)', what: nm + ', ' + (k + 1) + ' of ' + n, script: function* (sc) {
      for (var i = 0; i < C.FACES.length; i++) yield sc.say(['{y}' + C.FACES[i].toUpperCase() + '{/}'].concat(words), C.FACES[i]);
    } });
    D.push(this.cur);
  };
  PortraitShow.prototype.draw = function (ctx) { ctx.fillStyle = '#0a0c22'; ctx.fillRect(0, 0, D.W, D.H); };
  C.portraitShow = function (q) { return new PortraitShow(q); };

  // ---------------------------------------------------------------- Ned's scene, shown (deep16/?nedshow -- the eyes row's door, 10-21 night): every branch of C.ned staged
  // on his own counter screen, the Insight's die pinned; pick a beat, play it by the mouse, X back to the beats. &beat=<id> opens one
  C.NED_BEATS = [
    { id: 'bluff', label: 'THE BLUFF: Yes., then Yes. -- "Show me."', note: 'Aurdin bottom left in his Red Mantle\'s portrait, his answers in his bubble. He laughs; talk again: the harvest line.', d20: 3, again: true },
    { id: 'robes', label: 'IN HIS ROBES: the Ochre Mantle\'s portrait', note: 'Wizard\'s Robes on: the portrait is the Ochre\'s, as his figure on the floor is.', d20: 3, robe: 'robes' },
    { id: 'no', label: 'NO: what a familiar is for, his story, the sale', note: '"I decided to stick around." stays up while Aurdin answers; Fifty it is.: a copied page, the sheet.', d20: 3, silver: 60 },
    { id: 'insight', label: 'THE INSIGHT MADE (the die 15)', note: 'Because the components are fascinating? (insight), in its own colour: the quest offered -- Deal.', d20: 15 },
    { id: 'stays', label: 'TURNED DOWN BEFORE: the choice stays', note: 'A later visit: his story heard, the Insight made once; no roll, the choice is there.', d20: 1, flags: { nedStory: 1, nedSaw: 1 } },
    { id: 'taken', label: 'THE QUEST TAKEN: no sale', note: 'What did you want for that Find Familiar spell? -- his line names the tongue you said you would bring.', d20: 1, flags: { nedStory: 1, nedSaw: 1, nedQuest: 1 } },
    { id: 'tongue', label: 'THE TONGUE BROUGHT: the page torn out', note: 'One snake\'s tongue. Fresh. -- the page torn out of his book: Received: Sheet: Find Familiar.', d20: 1, flags: { nedStory: 1, nedSaw: 1, nedQuest: 1 }, inv: [['snaketongue', 1]] },
    { id: 'nohands', label: 'NO ONE TO TAKE IT (no Survival, no Nature)', note: 'Barley away: Ned says the job wants someone with the hands for it, and offers it anyway -- Deal.', d20: 15, away: ['barley'] },
    { id: 'noaurdin', label: 'NO AURDIN: the harvest line', note: 'Aurdin away: Ned says where spell components come from.', d20: 1, away: ['aurdin'] },
    { id: 'pagewaits', label: 'THE PAGE IN THE PACK, NOT YET IN HIS BOOK', note: 'After the page: Ned says it wants to be in his book. Use it from the pack (M, then ITEMS).', d20: 1, flags: { nedStory: 1, nedSaw: 1, nedQuest: 1, nedDone: 1 }, inv: [['sheet_findfamiliar', 1]] },
    { id: 'knows', label: 'AURDIN KNOWS IT: no spell talk, no familiar out', note: '"Looks like you\'re learning without the classes." -- nothing of a familiar, with none out.', d20: 1, flags: { nedStory: 1, nedSaw: 1, nedQuest: 1, nedDone: 1 }, knows: true },
    { id: 'knowsowl', label: 'AURDIN KNOWS IT, HIS OWL WITH HIM', note: 'The same, and his familiar asked after by its kind: "How\'s the owl?"', d20: 1, flags: { nedStory: 1, nedSaw: 1, nedQuest: 1, nedDone: 1, familiar: { kind: 'owl', by: 'aurdin', hp: 1 } }, knows: true },
    { id: 'percy', label: 'PERCY, SOLD A SNAKE TONGUE WHILE NED WAITS', note: 'THE SHELVES, SELL a tongue: "Didn\'t Ned want one of those?" -- and he buys it anyway.', d20: 1, flags: { nedStory: 1, nedSaw: 1, nedQuest: 1 }, inv: [['snaketongue', 2]], who: 'percy' }
  ];
  C.beatTalk = function (bt, B) { return bt.who === 'percy' ? new Counter(B, { id: 'percy', name: 'Percy', place: 'Percy\'s Particulars', what: 'Percy at the counter', script: function (sc) { return C.shopkeeper(sc, B, 'percy'); } }) : C.nedTalk(B); };
  C.nedStage = function (bt) { // a beat's party, purse, pack and flags -- the second game's start (js/house.js H.start), the beat's own on top
    var R = DS.R, party = ['barley', 'aurdin', 'vivian', 'lymen'].filter(function (id) { return (bt.away || []).indexOf(id) < 0; }).map(function (id) { var h = R.makeHero(id); return D.house && D.house.start ? D.house.start(h) : h; });
    if (bt.knows) party.forEach(function (h) { if (h.id === 'aurdin') h.known.push(C.NED.spell); });
    if (bt.robe) party.forEach(function (h) { if (h.id === 'aurdin') h.equip.armor = bt.robe; }); // (the look by what he wears: js/save.js SV.look)
    return { roam: { flags: Object.assign({}, bt.flags || {}), members: party, silver: bt.silver != null ? bt.silver : 20 }, inv: (bt.inv || []).map(function (s) { return { id: s[0], n: s[1] }; }), townAway: {}, show: bt.id };
  };
  C.nedTalk = function (B) { return new Counter(B, { id: 'ned', name: 'Ned Halloway', place: 'Percy\'s Particulars', what: 'Ned Halloway, behind the counter', script: function (sc) { return C.ned(sc, B); } }); };
  function NedShow(q) {
    this.kind = 'nedshow'; this.opaque = true; this.t = 0; this.hov = 0; this.cur = null; this.B = null; this.bt = null; this.n = 0;
    var b = /[?&]beat=([a-z]+)/.exec(String(q || '')); if (b) { var bt = C.NED_BEATS.filter(function (x) { return x.id === b[1]; })[0]; if (bt) this.pending = bt; } // (played on the first update: the show is on the stack by then)
  }
  NedShow.prototype.play = function (bt) {
    var self = this; this.bt = bt; this.B = C.nedStage(bt); this.n = 0; this.roll0 = C.nedRoll; C.nedRoll = function () { return bt.d20; };
    this.cur = C.beatTalk(bt, this.B); D.push(this.cur);
  };
  NedShow.prototype.buttons = function () { var dy = Math.min(23, Math.floor((D.H - 42) / C.NED_BEATS.length)); return C.NED_BEATS.map(function (bt, k) { return { x: 12, y: 24 + k * dy, w: D.W - 24, h: dy - 2, bt: bt }; }); }; // (as many beats as fit the screen)
  NedShow.prototype.update = function () {
    this.t++; var m = I.mouse, self = this;
    if (this.pending) { var p0 = this.pending; this.pending = null; this.play(p0); return; }
    if (this.cur) {
      if (!this.cur.done) return;
      if (this.bt.again && ++this.n < 2) { this.cur = C.nedTalk(this.B); D.push(this.cur); return; } // (the bluff's beat: Ned again, the same visit)
      this.cur = null; C.nedRoll = this.roll0; return;
    }
    var bs = this.buttons(), hit = m.inside ? bs.filter(function (q) { return m.x >= q.x && m.x < q.x + q.w && m.y >= q.y && m.y < q.y + q.h; })[0] : null;
    if (m.moved || m.click) this.hov = hit ? bs.indexOf(hit) : this.hov;
    if (I.repeat('down')) this.hov = (this.hov + 1) % bs.length; if (I.repeat('up')) this.hov = (this.hov - 1 + bs.length) % bs.length;
    if ((m.click && hit) || I.pressed('a')) { D.sfx('confirm'); this.play((hit || bs[this.hov]).bt); return; }
    if (I.pressed('b') || m.rclick) { D.scenes.length = 0; if (D.house && D.house.Title) D.push(new D.house.Title()); }
  };
  NedShow.prototype.draw = function (ctx) {
    var self = this, W8 = D.WIN8; ctx.fillStyle = '#0a0c22'; ctx.fillRect(0, 0, D.W, D.H);
    D.text(ctx, '{y}NED HALLOWAY AND FIND FAMILIAR{/} -- a beat at a time, the Insight\'s die pinned (a show)', 10, 10, W8.text);
    this.buttons().forEach(function (q, k) {
      var on = k === self.hov; D.win8(ctx, q.x, q.y, q.w, q.h, on ? W8.sel : null);
      var tight = q.h < 21; D.text(ctx, q.bt.label, q.x + 8, q.y + (tight ? 1 : 2), on ? W8.gold : W8.text); D.text(ctx, q.bt.note, q.x + 8, q.y + (tight ? 9 : 11), '#9c9cb4');
    });
    D.hint(ctx, 'click a beat · arrows and E · X back to the title', D.W / 2, D.H - 12, '#9a96a8', 'center');
  };
  C.nedShow = function (q) { return new NedShow(q); };
})();
