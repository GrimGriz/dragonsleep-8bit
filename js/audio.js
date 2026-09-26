/* DRAGONSLEEP — a four-voice chip synth (2 pulse, triangle, noise) and the game's music.
   Every tune here is an original composition written for this game. */
'use strict';
(function () {
  var DS = window.DS;
  var AU = DS.audio = { ctx: null, on: true, musicVol: 0.55, sfxVol: 0.7, song: null, songId: null };
  var pref = DS.store.get('ds8-audio');
  if (pref) { AU.musicVol = pref.m != null ? pref.m : AU.musicVol; AU.sfxVol = pref.s != null ? pref.s : AU.sfxVol; }
  AU.savePrefs = function () { DS.store.set('ds8-audio', { m: AU.musicVol, s: AU.sfxVol }); };

  var waves = {}, noiseBuf = null, master, musicBus, sfxBus;
  AU.unlock = function () {
    if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { AU.ctx = new AC(); } catch (e) { return; }
    var c = AU.ctx;
    master = c.createGain(); master.gain.value = 0.9; master.connect(c.destination);
    musicBus = c.createGain(); musicBus.gain.value = AU.musicVol; musicBus.connect(master);
    sfxBus = c.createGain(); sfxBus.gain.value = AU.sfxVol; sfxBus.connect(master);
    [0.125, 0.25, 0.5].forEach(function (duty) {
      var n = 64, re = new Float32Array(n), im = new Float32Array(n);
      for (var k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty) * 1.0, re[k] = 0;
      // build a band-limited pulse via cosine terms
      for (var j = 1; j < n; j++) { re[j] = (2 / (j * Math.PI)) * Math.sin(j * Math.PI * duty); im[j] = 0; }
      waves[duty] = c.createPeriodicWave(re, im);
    });
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    var d = noiseBuf.getChannelData(0), reg = 1;
    for (var i = 0; i < d.length; i++) { // LFSR-flavoured noise
      var bit = ((reg >> 0) ^ (reg >> 1)) & 1; reg = (reg >> 1) | (bit << 14);
      d[i] = (reg & 1) ? 0.8 : -0.8;
    }
    if (AU.pending) { var p = AU.pending; AU.pending = null; AU.play(p); }
  };
  AU.setVolumes = function () {
    if (musicBus) musicBus.gain.value = AU.musicVol;
    if (sfxBus) sfxBus.gain.value = AU.sfxVol;
    AU.savePrefs();
  };
  // the buses, for scenes that build their own sounds (the cradle); null until the first press unlocks audio
  AU.buses = function () { return AU.ctx ? { ctx: AU.ctx, sfx: sfxBus, music: musicBus, master: master } : null; };

  function freq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
  var SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function noteMidi(tok) { // "C#5" / "Bb4"
    var m = /^([A-G])([#b]?)(-?\d)$/.exec(tok);
    if (!m) return null;
    return 12 * (parseInt(m[3], 10) + 1) + SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  }
  // voices ------------------------------------------------------------------
  function tone(bus, type, midi, t, dur, vol, duty, slide) {
    var c = AU.ctx, o = c.createOscillator(), g = c.createGain();
    if (type === 'pulse') o.setPeriodicWave(waves[duty || 0.5]); else o.type = type;
    o.frequency.setValueAtTime(freq(midi), t);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq(midi + slide), t + dur);
    var a = Math.min(0.01, dur / 4);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    if (type === 'pulse') g.gain.linearRampToValueAtTime(vol * 0.62, t + Math.min(dur * 0.6, 0.12));
    g.gain.setValueAtTime(type === 'pulse' ? vol * 0.62 : vol, t + Math.max(a, dur - 0.025));
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(bus, t, dur, vol, hp, lp) {
    var c = AU.ctx, s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
    s.buffer = noiseBuf; s.loop = true;
    f.type = 'bandpass'; f.frequency.value = hp || 3000; f.Q.value = lp || 0.8;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(f); f.connect(g); g.connect(bus);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  // chords → bass/pad patterns ------------------------------------------------
  var QUAL = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], dim: [0, 3, 6], sus: [0, 5, 7], maj7: [0, 4, 7, 11] };
  function chord(name) {
    var m = /^([A-G])([#b]?)(.*)$/.exec(name);
    var root = SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return { root: (root + 12) % 12, iv: QUAL[m[3]] || QUAL[''] };
  }
  function at(ch, deg, oct) { return 12 * (oct + 1) + ch.root + ch.iv[deg % ch.iv.length] + 12 * Math.floor(deg / ch.iv.length); }
  var BASS = {
    walk: function (c) { return [[at(c, 0, 2), 4], [at(c, 2, 2), 4], [at(c, 0, 3), 4], [at(c, 2, 2), 4]]; },
    pump: function (c) { var r = []; for (var i = 0; i < 8; i++) r.push([at(c, 0, i % 4 === 3 ? 3 : 2), 2]); return r; },
    arp: function (c) { return [[at(c, 0, 2), 2], [at(c, 2, 2), 2], [at(c, 0, 3), 2], [at(c, 1, 3), 2], [at(c, 2, 3), 2], [at(c, 1, 3), 2], [at(c, 0, 3), 2], [at(c, 2, 2), 2]]; },
    halves: function (c) { return [[at(c, 0, 2), 8], [at(c, 2, 2), 8]]; },
    whole: function (c) { return [[at(c, 0, 2), 16]]; },
    gallop: function (c) { return [[at(c, 0, 2), 3], [at(c, 0, 2), 1], [at(c, 0, 3), 4], [at(c, 2, 2), 3], [at(c, 2, 2), 1], [at(c, 0, 3), 4]]; }
  };
  var PAD = {
    hold: function (c) { return [[at(c, 1, 4), 16]]; },
    stab: function (c) { return [[null, 4], [at(c, 1, 4), 2], [null, 2], [null, 4], [at(c, 1, 4), 2], [null, 2]]; },
    arp16: function (c) { var r = [], seq = [0, 1, 2, 3, 2, 1]; for (var i = 0; i < 16; i++) r.push([at(c, seq[i % seq.length], 4), 1]); return r; },
    arp8: function (c) { var r = []; for (var i = 0; i < 8; i++) r.push([at(c, [0, 1, 2, 1][i % 4], 4), 2]); return r; },
    none: function () { return [[null, 16]]; }
  };
  var DRUM = { // k kick, s snare, h hat, - rest (each char = one 16th)
    rock: 'k-h-s-h-k-k-s-h-', battle: 'k-hkshk-k-hksh-h', battle2: 'khhkshkhkkhkshsh', march: 'k---s---k-k-s---',
    light: 'k-------s---h---', drip: '--------h-------', none: '----------------',
    anvil: 'k-----h-k-----hh' // Solskaft: a hammer somewhere below, always
  };
  function parseMel(str) {
    var out = [];
    str.trim().split(/\s+/).forEach(function (tok) {
      if (!tok || tok === '|') return;
      var parts = tok.split('.');
      var len = parseInt(parts[1], 10) || 1;
      out.push([parts[0] === 'r' ? null : noteMidi(parts[0]), len]);
    });
    return out;
  }
  function buildSong(def) {
    var chords = def.chords.split(/\s+/).map(chord);
    var bass = [], pad = [], drums = [];
    chords.forEach(function (c) {
      bass = bass.concat((BASS[def.bass] || BASS.walk)(c));
      pad = pad.concat((PAD[def.pad] || PAD.none)(c));
      var pat = DRUM[def.drums || 'none'];
      for (var i = 0; i < 16; i++) drums.push([pat[i] === '-' ? null : pat[i], 1]);
    });
    var mel = parseMel(def.melody);
    var tot = mel.reduce(function (s, n) { return s + n[1]; }, 0);
    if (tot !== chords.length * 16) console.warn('song length mismatch', def.id, tot, chords.length * 16);
    return {
      id: def.id, step: 60 / def.bpm / 4, loop: def.loop !== false,
      tracks: [
        { kind: 'pulse', duty: def.duty || 0.25, vol: def.melVol || 0.16, notes: mel },
        { kind: 'pulse', duty: 0.5, vol: def.padVol || 0.07, notes: pad },
        { kind: 'triangle', vol: def.bassVol || 0.22, notes: bass },
        { kind: 'noise', vol: def.drumVol || 0.1, notes: drums }
      ]
    };
  }
  // the songs ------------------------------------------------------------------
  var DEFS = {
    title: {
      bpm: 80, bass: 'walk', pad: 'hold', drums: 'none', duty: 0.25, melVol: 0.15,
      chords: 'Dm Dm Bb Bb C Dm Gm A Dm Bb C A Dm Gm A Dm',
      melody: 'A4.4 D5.4 E5.4 F5.4 | E5.6 D5.2 C5.8 | D5.4 F5.4 A5.4 G5.4 | F5.12 r.4 | C5.4 E5.4 G5.4 F5.4 | E5.6 F5.2 D5.8 | D5.4 C5.4 Bb4.4 A4.4 | A4.12 r.4 |' +
        ' D5.4 A5.4 G5.2 F5.2 E5.4 | F5.4 D5.4 Bb4.8 | C5.4 G5.4 F5.2 E5.2 D5.4 | E5.16 | F5.4 E5.4 D5.4 A5.4 | Bb5.6 A5.2 G5.8 | F5.4 E5.4 C#5.4 E5.4 | D5.16'
    },
    town: {
      bpm: 128, bass: 'walk', pad: 'stab', drums: 'light', duty: 0.5, melVol: 0.12,
      chords: 'G G C D G Em C D Em C G D C D G G',
      melody: 'D5.2 G5.2 B5.4 A5.2 G5.2 D5.4 | E5.2 G5.2 A5.4 B5.8 | C6.4 B5.2 A5.2 G5.4 E5.4 | F#5.4 G5.2 A5.2 D5.8 | D5.2 G5.2 B5.4 D6.4 B5.4 | E6.4 D6.2 B5.2 G5.8 | A5.2 B5.2 C6.4 B5.2 A5.2 G5.4 | A5.12 r.4 |' +
        ' B5.4 G5.4 E5.4 G5.4 | A5.4 G5.4 E5.8 | D5.4 G5.4 B5.4 D6.4 | C6.4 B5.4 A5.8 | E6.4 D6.4 C6.4 A5.4 | B5.4 A5.4 F#5.8 | G5.2 A5.2 B5.4 A5.2 F#5.2 D5.4 | G5.12 r.4'
    },
    field: {
      bpm: 116, bass: 'arp', pad: 'hold', drums: 'march', duty: 0.25,
      chords: 'Am Am F G Am Am F E C G Am Am F G E E',
      melody: 'E5.4 A5.4 B5.2 C6.2 B5.4 | A5.6 E5.2 A4.8 | F5.4 A5.4 C6.4 A5.4 | G5.6 F5.2 D5.8 | E5.4 A5.4 B5.2 C6.2 D6.4 | E6.8 D6.4 C6.4 | C6.4 A5.4 F5.4 A5.4 | G#5.12 r.4 |' +
        ' G5.4 C6.4 E6.4 D6.2 C6.2 | B5.8 G5.4 D5.4 | C6.4 B5.4 A5.4 E5.4 | A5.12 r.4 | F5.4 G5.4 A5.4 C6.4 | B5.4 A5.4 G5.4 D6.4 | B5.4 G#5.4 E5.4 G#5.4 | B5.12 r.4'
    },
    dungeon: {
      bpm: 84, bass: 'halves', pad: 'hold', drums: 'drip', duty: 0.125, melVol: 0.14, padVol: 0.05,
      chords: 'Em F Em F Dm Em F Em',
      melody: 'E5.6 r.2 G5.4 F5.4 | E5.8 r.4 C5.4 | B4.6 r.2 E5.4 G5.4 | A5.4 G5.4 F5.8 | D5.6 r.2 F5.4 A5.4 | G5.4 F5.4 E5.8 | F5.4 E5.4 C5.4 D5.4 | E5.12 r.4'
    },
    battle: {
      bpm: 150, bass: 'pump', pad: 'arp16', drums: 'battle', duty: 0.25, padVol: 0.05,
      chords: 'Em Em C D Em Em C B Am Am Em Em C D B B',
      melody: 'E5.2 E5.2 G5.2 E5.2 B5.4 A5.4 | G5.2 F#5.2 E5.2 D5.2 E5.8 | C6.2 B5.2 A5.2 G5.2 E5.4 G5.4 | F#5.4 D5.4 A5.4 F#5.4 | E5.2 E5.2 G5.2 E5.2 B5.4 C6.4 | D6.2 C6.2 B5.2 A5.2 B5.8 | E6.4 D6.4 C6.4 G5.4 | F#5.4 A5.4 D#6.8 |' +
        ' A5.4 C6.4 E6.4 C6.4 | B5.2 A5.2 G5.2 A5.2 E5.8 | G5.4 B5.4 E6.4 B5.4 | D6.2 B5.2 G5.2 B5.2 E5.8 | C6.4 E6.4 G6.4 E6.4 | F#6.4 D6.4 A5.4 F#5.4 | D#6.8 B5.8 | F#5.8 D#5.8'
    },
    boss: {
      bpm: 164, bass: 'pump', pad: 'arp16', drums: 'battle2', duty: 0.125, padVol: 0.05, melVol: 0.17,
      chords: 'Cm Cm Ab G Cm Cm Db G Fm Fm Cm Cm Ab Db G G',
      melody: 'C5.2 D#5.2 G5.2 C6.2 B5.4 G5.4 | C6.2 D6.2 D#6.4 D6.2 C6.2 G5.4 | G#5.4 C6.4 D#6.4 C6.4 | B5.4 D6.4 G6.8 | G5.2 G5.2 D#5.2 C5.2 G5.4 F#5.4 | G5.8 D#5.4 C5.4 | C#6.4 F6.4 G#6.4 F6.4 | F#6.4 G6.4 D6.8 |' +
        ' F5.4 G#5.4 C6.4 G#5.4 | G5.2 G#5.2 G5.2 F5.2 C5.8 | D#5.4 G5.4 C6.4 D#6.4 | D6.4 C6.4 G5.8 | G#5.4 C6.4 D#6.4 G#6.4 | F6.4 C#6.4 G#5.4 F5.4 | G5.4 B5.4 D6.4 F6.4 | G6.12 r.4'
    },
    victory: {
      bpm: 132, bass: 'walk', pad: 'none', drums: 'none', duty: 0.5, loop: false, melVol: 0.16,
      chords: 'C C', melody: 'G5.2 C6.2 E6.2 G6.6 r.2 F6.2 | E6.2 D6.2 E6.4 C6.8'
    },
    inn: {
      bpm: 96, bass: 'halves', pad: 'hold', drums: 'none', duty: 0.25, loop: false,
      chords: 'F Bb C F', melody: 'F5.4 A5.4 C6.4 A5.4 | Bb5.4 G5.4 E5.4 C5.4 | G5.4 E5.4 C5.4 E5.4 | F5.12 r.4'
    },
    lake: {
      bpm: 66, bass: 'whole', pad: 'hold', drums: 'none', duty: 0.125, melVol: 0.12,
      chords: 'Dm Dm Bb Bb Gm Gm A A',
      melody: 'r.4 A5.8 F5.4 | E5.12 r.4 | r.4 D5.8 F5.4 | A5.12 r.4 | r.4 G5.8 Bb5.4 | A5.8 G5.8 | C#5.16 | E5.12 r.4'
    },
    hex: {
      bpm: 140, bass: 'gallop', pad: 'stab', drums: 'rock', duty: 0.25,
      chords: 'G F G F C C G G G F G F C D G G',
      melody: 'G5.2 G5.2 B5.2 D6.2 F6.4 D6.4 | C6.2 A5.2 F5.2 A5.2 C6.8 | B5.2 B5.2 D6.2 G6.2 F6.4 D6.4 | C6.4 A5.4 F5.8 | E5.2 G5.2 C6.2 E6.2 D6.4 C6.4 | G5.4 E5.4 C5.8 | D5.2 G5.2 B5.2 D6.2 C6.2 B5.2 A5.4 | G5.12 r.4 |' +
        ' D6.4 D6.2 F6.2 G6.8 | F6.4 C6.2 A5.2 C6.8 | B5.4 D6.4 G6.4 D6.4 | C6.4 A5.4 F5.8 | E6.4 C6.4 G5.4 E5.4 | F#5.4 A5.4 D6.4 C6.4 | B5.4 G5.4 D5.4 B4.4 | G5.12 r.4'
    },
    gameover: {
      bpm: 70, bass: 'whole', pad: 'hold', drums: 'none', duty: 0.25, loop: false,
      chords: 'Am E Am', melody: 'E5.4 D5.4 C5.4 B4.4 | A4.8 G#4.8 | A4.16'
    },
    ending: {
      bpm: 88, bass: 'arp', pad: 'hold', drums: 'light', duty: 0.25,
      chords: 'D D G G A D Em A D G A A D Em A D',
      melody: 'A4.4 D5.4 E5.4 F#5.4 | E5.6 D5.2 C#5.8 | D5.4 G5.4 B5.4 A5.4 | G5.12 r.4 | C#5.4 E5.4 A5.4 G5.4 | F#5.6 G5.2 D5.8 | E5.4 D5.4 B4.4 A4.4 | A4.12 r.4 |' +
        ' D5.4 A5.4 G5.2 F#5.2 E5.4 | G5.4 D5.4 B4.8 | C#5.4 A5.4 G5.2 F#5.2 E5.4 | E5.16 | F#5.4 E5.4 D5.4 A5.4 | B5.6 A5.2 G5.8 | F#5.4 E5.4 C#5.4 E5.4 | D5.16'
    },
    solskaft: { // the halls behind the fountains: D dorian, a garrison's slow pride
      bpm: 92, bass: 'halves', pad: 'hold', drums: 'anvil', duty: 0.25, melVol: 0.13, padVol: 0.05,
      chords: 'Dm C Dm Am Bb C Dm Dm',
      melody: 'D5.4 F5.4 A5.6 G5.2 | E5.4 G5.4 C5.8 | D5.4 A5.4 B5.4 A5.4 | G5.4 E5.4 A4.8 | F5.4 D5.4 Bb4.4 D5.4 | E5.4 G5.4 C6.6 Bb5.2 | A5.4 G5.2 F5.2 E5.4 C5.4 | D5.12 r.4'
    },
    highway: { // three days under the mountain, lamp to lamp
      bpm: 100, bass: 'halves', pad: 'arp8', drums: 'drip', duty: 0.125, melVol: 0.12, padVol: 0.035,
      chords: 'Am G F E Am G F E',
      melody: 'A4.4 C5.4 E5.4 D5.4 | B4.4 D5.4 G4.8 | A4.4 C5.4 F5.6 E5.2 | G#4.8 B4.8 | E5.4 D5.4 C5.4 B4.4 | D5.6 C5.2 B4.8 | C5.4 A4.4 F4.4 A4.4 | E4.12 r.4'
    },
    burial: { // everyone here is waiting for one old dwarf upstairs
      bpm: 60, bass: 'whole', pad: 'hold', drums: 'none', duty: 0.125, melVol: 0.1, padVol: 0.045,
      chords: 'Am Am F E',
      melody: 'r.8 E5.8 | A5.12 r.4 | r.4 C6.8 A5.4 | G#5.16'
    },
    glow: {
      bpm: 76, bass: 'halves', pad: 'arp8', drums: 'none', duty: 0.125, melVol: 0.11, padVol: 0.04,
      chords: 'Am F Am F Dm Am E E',
      melody: 'r.4 E6.4 D6.4 C6.4 | A5.12 r.4 | r.4 E6.4 F6.4 E6.4 | C6.12 r.4 | r.4 D6.4 F6.4 A6.4 | E6.12 r.4 | G#5.4 B5.4 E6.4 D6.4 | B5.12 r.4'
    }
  };
  var SONGS = {};
  Object.keys(DEFS).forEach(function (k) { DEFS[k].id = k; SONGS[k] = buildSong(DEFS[k]); });
  AU.SONGS = SONGS;

  AU.play = function (id, force) {
    if (!id) { AU.stop(); return; }
    if (AU.songId === id && !force) return;
    if (!AU.ctx) { AU.pending = id; AU.songId = id; return; }
    AU.stop();
    var s = SONGS[id]; if (!s) return;
    AU.songId = id;
    var t0 = AU.ctx.currentTime + 0.06;
    AU.song = { s: s, cursors: s.tracks.map(function () { return { i: 0, t: t0 }; }), done: false };
  };
  AU.stop = function () { AU.song = null; AU.songId = null; };
  AU.update = function () {
    var S = AU.song;
    if (!S || !AU.ctx || AU.ctx.state !== 'running') return;
    var horizon = AU.ctx.currentTime + 0.15, song = S.s, allDone = true;
    song.tracks.forEach(function (tr, ti) {
      var cur = S.cursors[ti];
      while (cur.t < horizon) {
        if (cur.i >= tr.notes.length) { if (!song.loop) { cur.done = true; break; } cur.i = 0; }
        var n = tr.notes[cur.i], dur = n[1] * song.step;
        if (n[0] != null) {
          if (tr.kind === 'noise') {
            if (n[0] === 'k') { tone(musicBus, 'triangle', 36, cur.t, 0.09, tr.vol * 2.2, null, -12); }
            else if (n[0] === 's') noise(musicBus, cur.t, 0.12, tr.vol, 1800, 0.7);
            else noise(musicBus, cur.t, 0.04, tr.vol * 0.6, 7000, 1.2);
          } else tone(musicBus, tr.kind, n[0], cur.t, dur * 0.95, tr.vol, tr.duty);
        }
        cur.t += dur; cur.i++;
      }
      if (!cur.done) allDone = false;
    });
    if (allDone) { AU.song = null; }
  };

  // ------------------------------------------------------------------ sfx
  function now() { return AU.ctx.currentTime + 0.005; }
  var SFX = {
    cursor: function (t) { tone(sfxBus, 'pulse', 84, t, 0.03, 0.12, 0.5); },
    confirm: function (t) { tone(sfxBus, 'pulse', 79, t, 0.04, 0.13, 0.5); tone(sfxBus, 'pulse', 86, t + 0.04, 0.06, 0.13, 0.5); },
    cancel: function (t) { tone(sfxBus, 'pulse', 79, t, 0.04, 0.12, 0.5); tone(sfxBus, 'pulse', 72, t + 0.04, 0.06, 0.12, 0.5); },
    bump: function (t) { tone(sfxBus, 'triangle', 40, t, 0.06, 0.25); },
    door: function (t) { noise(sfxBus, t, 0.18, 0.25, 900, 1); tone(sfxBus, 'triangle', 45, t, 0.1, 0.2, null, -5); },
    stairs: function (t) { for (var i = 0; i < 4; i++) tone(sfxBus, 'triangle', 60 - i * 3, t + i * 0.06, 0.05, 0.2); },
    chest: function (t) { [72, 76, 79, 84].forEach(function (m, i) { tone(sfxBus, 'pulse', m, t + i * 0.06, 0.08, 0.12, 0.25); }); },
    hit: function (t) { noise(sfxBus, t, 0.12, 0.45, 1400, 0.6); tone(sfxBus, 'pulse', 50, t, 0.08, 0.15, 0.5, -10); },
    crit: function (t) { noise(sfxBus, t, 0.2, 0.55, 1000, 0.5); tone(sfxBus, 'pulse', 88, t, 0.06, 0.14, 0.25); tone(sfxBus, 'pulse', 48, t + 0.02, 0.14, 0.18, 0.5, -12); },
    miss: function (t) { noise(sfxBus, t, 0.14, 0.18, 5000, 2); },
    magic: function (t) { [67, 71, 74, 79, 83, 86].forEach(function (m, i) { tone(sfxBus, 'pulse', m, t + i * 0.035, 0.05, 0.1, 0.125); }); },
    fire: function (t) { noise(sfxBus, t, 0.45, 0.4, 600, 0.5); noise(sfxBus, t + 0.1, 0.3, 0.25, 1500, 0.5); },
    frost: function (t) { [96, 91, 94, 89].forEach(function (m, i) { tone(sfxBus, 'triangle', m, t + i * 0.04, 0.08, 0.12); }); },
    zap: function (t) { for (var i = 0; i < 6; i++) tone(sfxBus, 'pulse', 70 + (i % 2) * 12, t + i * 0.025, 0.025, 0.12, 0.125); },
    heal: function (t) { [72, 76, 79, 84, 88].forEach(function (m, i) { tone(sfxBus, 'triangle', m, t + i * 0.05, 0.12, 0.2); }); },
    buff: function (t) { [67, 72, 79].forEach(function (m, i) { tone(sfxBus, 'pulse', m, t + i * 0.07, 0.1, 0.1, 0.25); }); },
    encounter: function (t) { for (var i = 0; i < 10; i++) tone(sfxBus, 'pulse', 90 - i * 3, t + i * 0.03, 0.04, 0.12, 0.25); },
    run: function (t) { noise(sfxBus, t, 0.25, 0.2, 3000, 1); },
    levelup: function (t) { [72, 76, 79, 84, 79, 84, 88].forEach(function (m, i) { tone(sfxBus, 'pulse', m, t + i * 0.08, 0.1, 0.13, 0.25); }); },
    die: function (t) { noise(sfxBus, t, 0.4, 0.3, 500, 0.5); tone(sfxBus, 'pulse', 55, t, 0.3, 0.12, 0.5, -20); },
    ko: function (t) { [64, 60, 57, 52].forEach(function (m, i) { tone(sfxBus, 'pulse', m, t + i * 0.08, 0.09, 0.12, 0.5); }); },
    coin: function (t) { tone(sfxBus, 'pulse', 88, t, 0.05, 0.12, 0.25); tone(sfxBus, 'pulse', 93, t + 0.05, 0.12, 0.12, 0.25); },
    save: function (t) { [79, 84, 91].forEach(function (m, i) { tone(sfxBus, 'triangle', m, t + i * 0.09, 0.14, 0.2); }); },
    ring: function (t) { [84, 91, 96, 91, 96, 103].forEach(function (m, i) { tone(sfxBus, 'triangle', m, t + i * 0.05, 0.1, 0.18); }); },
    splash: function (t) { noise(sfxBus, t, 0.5, 0.35, 700, 0.4); },
    grab: function (t) { tone(sfxBus, 'pulse', 43, t, 0.12, 0.2, 0.5, 5); noise(sfxBus, t, 0.1, 0.3, 800, 0.6); },
    poison: function (t) { [60, 61, 60, 59].forEach(function (m, i) { tone(sfxBus, 'pulse', m, t + i * 0.06, 0.06, 0.1, 0.125); }); },
    error: function (t) { tone(sfxBus, 'pulse', 50, t, 0.12, 0.14, 0.5); },
    popup: function (t) { [76, 83, 88].forEach(function (m, i) { tone(sfxBus, 'pulse', m, t + i * 0.05, 0.08, 0.12, 0.25); }); }
  };
  AU.sfx = function (id) {
    if (!AU.ctx || AU.ctx.state !== 'running' || !SFX[id]) return;
    try { SFX[id](now()); } catch (e) { }
  };
})();
