/* DRAGONSLEEP — a four-voice chip synth (2 pulse, triangle, noise) and the game's music.
   Every tune here is an original composition written for this game, except the corridor's: that one is transcribed
   from a sheet Griz brought (09-29). */
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
    // the soft voice (09-29, the corridor: Griz asked for "a prettier instrument" under the flutes): a wavetable, the Famicom
    // Disk System's extra channel in spirit. Every harmonic, falling away fast, so it sings where a pulse buzzes.
    var sre = new Float32Array(32), sim = new Float32Array(32);
    for (var h = 1; h < 32; h++) sim[h] = Math.pow(h, -1.6) * (h > 8 ? Math.pow(0.8, h - 8) : 1);
    waves.soft = c.createPeriodicWave(sre, sim);
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
    if (type === 'soft') return softTone(bus, midi, t, dur, vol);
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
  // two soft oscillators a hair apart (a slow shimmer), a breath in rather than a click, and a vibrato that wakes on the
  // long notes
  function softTone(bus, midi, t, dur, vol) {
    var c = AU.ctx, g = c.createGain(), end = t + dur, f = freq(midi);
    var a = Math.min(0.04, dur / 3), rel = Math.min(0.08, dur / 3);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.linearRampToValueAtTime(vol * 0.8, t + Math.min(dur * 0.5, 0.3));
    g.gain.setValueAtTime(vol * 0.8, end - rel);
    g.gain.linearRampToValueAtTime(0.0001, end);
    g.connect(bus);
    var vib = null, depth = null;
    if (dur > 0.4) {
      vib = c.createOscillator(); depth = c.createGain(); vib.frequency.value = 5.2;
      depth.gain.setValueAtTime(0, t + 0.2); depth.gain.linearRampToValueAtTime(f * 0.006, t + Math.min(dur, 0.6));
      vib.connect(depth); vib.start(t); vib.stop(end + 0.02);
    }
    [-4, 4].forEach(function (cents) {
      var o = c.createOscillator(), half = c.createGain();
      o.setPeriodicWave(waves.soft); o.frequency.setValueAtTime(f, t); o.detune.value = cents; half.gain.value = 0.5;
      if (depth) depth.connect(o.frequency);
      o.connect(half); half.connect(g); o.start(t); o.stop(end + 0.02);
    });
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
    anvil: 'k-----h-k-----hh', // Solskaft: a hammer somewhere below, always
    footfall: 'k-----' // the corridor's 3/8: one soft step a bar (the hats went, 09-29: Griz didn't like them)
  };
  function parseMel(str, shift) {
    var out = [];
    str.trim().split(/\s+/).forEach(function (tok) {
      if (!tok || tok === '|') return;
      var parts = tok.split('.');
      var len = parseInt(parts[1], 10) || 1;
      out.push([parts[0] === 'r' ? null : noteMidi(parts[0]) + (shift || 0), len]);
    });
    return out;
  }
  function buildSong(def) {
    // def.bar: 16ths to a chord (16, a 4/4 bar, unless the song says; the corridor is 3/8, so 6). def.shift moves the melody
    // and def.second by semitones. def.second, a written line, takes the second pulse from the pad pattern; def.third takes
    // the triangle from the bass pattern and is written where it sounds (no shift).
    var chords = def.chords.split(/\s+/).map(chord), n = def.bar || 16;
    var bass = [], pad = [], drums = [];
    chords.forEach(function (c) {
      bass = bass.concat((BASS[def.bass] || BASS.walk)(c, n));
      pad = pad.concat((PAD[def.pad] || PAD.none)(c, n));
      var pat = DRUM[def.drums || 'none'];
      for (var i = 0; i < n; i++) drums.push([pat[i % pat.length] === '-' ? null : pat[i % pat.length], 1]);
    });
    var mel = parseMel(def.melody, def.shift);
    var tot = mel.reduce(function (s, n) { return s + n[1]; }, 0);
    if (tot !== chords.length * n) console.warn('song length mismatch', def.id, tot, chords.length * n);
    [['second', def.shift], ['third', 0]].forEach(function (w) {
      if (!def[w[0]]) return;
      var line = parseMel(def[w[0]], w[1]), t = line.reduce(function (s, n) { return s + n[1]; }, 0);
      if (t !== chords.length * n) console.warn('song length mismatch (' + w[0] + ' line)', def.id, t, chords.length * n);
      if (w[0] === 'second') pad = line; else bass = line;
    });
    return {
      id: def.id, step: 60 / def.bpm / 4, loop: def.loop !== false,
      tracks: [
        { kind: def.voice || 'pulse', duty: def.duty || 0.25, vol: def.melVol || 0.16, notes: mel },
        { kind: def.voice2 || 'pulse', duty: def.duty2 || 0.5, vol: def.padVol || 0.07, notes: pad },
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
    },
    corridor: { // the world map. Griz's sheet (09-29; a songscription transcription, 3/8, quarter = 79, B minor), its bars 19-55
      // as the loop: the tune twice, then its answer; bar 55's riff hands back to bar 19 the way bar 18's does. Written at the
      // sheet's pitch, played an octave down (shift -12; two was too deep, his word). The sheet's flats read strictly: Db = C#,
      // Gb = F#, Cb = B. The high line on the triangle is ours (09-29, on his ask for "higher note accompaniment in good places"):
      // bare the first time through but for an echo over the riff, sixths above the tune the second time and through the answer.
      // The tune and the riff sing in the soft voice (take 3: the pulse was too far from the flutes, his word).
      bpm: 79, bar: 6, shift: -12, drums: 'footfall', voice: 'soft', melVol: 0.26, voice2: 'soft', padVol: 0.24,
      bassVol: 0.07, drumVol: 0.06,
      chords: 'Em Bm Bm Bm Bm Em Em Em Em Em Bm Bm Bm Bm Em Em Em Em Em Em Bm Bm Bm Em Em Em Em Em Em Bm Bm Bm Em Em Em Em Em',
      melody: 'r.2 D4.2 C#4.2 | D4.6 | B3.2 B3.4 | r.6 | r.4 F#4.2 | F#4.2 E4.1 E4.3 | E4.2 D4.1 D4.2 D4.1 | D4.2 C#4.2 r.1 C#4.1 | C#4.1 C#4.3 r.2 |' +
        ' r.2 C#4.2 C#4.2 | C#4.2 D4.2 C#4.2 | B3.2 B3.4 | r.6 | r.4 F#4.2 | F#4.2 E4.1 E4.3 | E4.2 D4.2 r.2 | D4.2 C#4.1 D4.3 | C#4.2 r.4 |' +
        ' r.6 | r.2 G4.2 G4.2 | G4.4 F#4.2 | F#4.2 r.4 | r.2 F#4.1 F#4.3 | F#4.2 E4.2 E4.1 E4.3 E4.2 F#4.2 | F#4.1 E4.3 F#4.2 | G4.2 r.4 |' +
        ' r.6 | r.2 G3.2 G3.2 | G3.4 F#3.2 | F#3.2 r.4 | r.4 F#4.2 | F#4.4 E4.2 | E4.2 D4.1 D4.1 D4.2 | D4.2 C#4.2 D4.2 | D4.2 C#4.4 | r.6',
      second: 'r.18 | r.2 D3.1 C#3.1 D3.2 | r.24 | r.2 G3.1 F#3.1 G3.2 | r.18 | r.2 D3.1 C#3.1 D3.2 | r.24 | r.2 G3.1 F#3.1 G3.2 |' +
        ' r.2 G3.1 F#3.1 G3.2 | r.12 | r.2 D3.1 C#3.1 D3.2 | r.24 | r.2 G3.1 F#3.1 G3.2 | r.2 G3.1 F#3.1 G3.2 | r.12 |' +
        ' r.2 D3.1 C#3.1 D3.2 | r.30 | r.2 G3.1 F#3.1 G3.2',
      third: 'r.18 | r.2 F#5.2 D5.2 | C#5.2 B4.2 r.2 | r.24 |' +
        ' r.2 E5.4 | E5.2 F#5.2 E5.2 | D5.6 | r.2 F#5.2 D5.2 | C#5.2 B4.2 r.2 | D5.2 C#5.4 | C#5.2 B4.2 D5.2 | B4.2 A4.1 B4.3 | A4.2 r.4 |' +
        ' r.6 | r.2 B4.2 B4.2 | B4.4 A4.2 | A4.2 r.4 | r.2 D5.4 | D5.2 C#5.4 | B4.4 D5.2 | D5.1 C#5.3 D5.2 | E5.2 r.4 |' +
        ' r.6 | r.2 B4.2 B4.2 | B4.4 A4.2 | A4.2 r.4 | r.6 | D5.4 C#5.2 | C#5.2 B4.4 | B4.2 A4.2 B4.2 | B4.2 A4.4 | r.6'
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
    popup: function (t) { [76, 83, 88].forEach(function (m, i) { tone(sfxBus, 'pulse', m, t + i * 0.05, 0.08, 0.12, 0.25); }); },
    // ------------------------------------------------ the spells' voices (the spell animation pass, 09-28h; Griz: "one per element and
    // an additional alternate for special cases"): fire, frost and zap were here already; each element has its own now, and a
    // heavier second (…2) for the big ones and the signatures (a fireball's boom, the bolt's thunderclap, a sunburst's choir)
    fire2: function (t) { noise(sfxBus, t, 0.9, 0.55, 220, 0.5); noise(sfxBus, t + 0.04, 0.5, 0.35, 900, 0.5); tone(sfxBus, 'triangle', 40, t, 0.6, 0.28, null, -12); tone(sfxBus, 'pulse', 52, t, 0.25, 0.12, 0.5, -14); },
    frost2: function (t) { for (var i = 0; i < 5; i++) noise(sfxBus, t + i * 0.05, 0.08, 0.28, 6500 - i * 500, 2); [98, 93, 96, 91, 94].forEach(function (m, i) { tone(sfxBus, 'triangle', m, t + i * 0.045, 0.1, 0.12); }); },
    zap2: function (t) { noise(sfxBus, t, 0.08, 0.6, 3200, 0.6); for (var i = 0; i < 8; i++) tone(sfxBus, 'pulse', 74 + (i % 3) * 7, t + i * 0.02, 0.02, 0.13, 0.125); noise(sfxBus, t + 0.12, 1.0, 0.4, 160, 0.4); },
    thunder: function (t) { noise(sfxBus, t, 0.55, 0.5, 180, 0.5); tone(sfxBus, 'triangle', 38, t, 0.4, 0.25, null, -8); },
    thunder2: function (t) { noise(sfxBus, t, 0.8, 0.6, 140, 0.4); tone(sfxBus, 'triangle', 36, t, 0.6, 0.3, null, -10); noise(sfxBus, t + 0.3, 0.6, 0.3, 200, 0.5); },
    acid: function (t) { noise(sfxBus, t, 0.4, 0.3, 2600, 1.2); [62, 64, 61, 63].forEach(function (m, i) { tone(sfxBus, 'pulse', m, t + 0.05 + i * 0.07, 0.04, 0.08, 0.125); }); },
    acid2: function (t) { noise(sfxBus, t, 0.8, 0.35, 2200, 1); for (var i = 0; i < 7; i++) tone(sfxBus, 'pulse', 58 + (i * 5) % 9, t + i * 0.06, 0.04, 0.08, 0.125); },
    poison2: function (t) { noise(sfxBus, t, 0.8, 0.25, 900, 0.7); [60, 61, 59, 60, 58].forEach(function (m, i) { tone(sfxBus, 'pulse', m, t + i * 0.08, 0.07, 0.09, 0.125); }); },
    necrotic: function (t) { [55, 52, 49].forEach(function (m, i) { tone(sfxBus, 'pulse', m, t + i * 0.09, 0.12, 0.11, 0.125, -1); }); noise(sfxBus, t, 0.5, 0.15, 400, 0.6); },
    necrotic2: function (t) { tone(sfxBus, 'triangle', 36, t, 0.9, 0.25, null, -3); tone(sfxBus, 'pulse', 43, t, 0.7, 0.08, 0.125, -2); noise(sfxBus, t, 0.9, 0.2, 300, 0.5); },
    radiant: function (t) { [84, 88, 91, 96].forEach(function (m, i) { tone(sfxBus, 'triangle', m, t + i * 0.04, 0.22, 0.13); }); },
    radiant2: function (t) { [72, 76, 79, 84, 88].forEach(function (m, i) { tone(sfxBus, 'triangle', m, t + i * 0.03, 0.7, 0.1); }); tone(sfxBus, 'pulse', 96, t + 0.1, 0.4, 0.05, 0.125); },
    force: function (t) { tone(sfxBus, 'pulse', 91, t, 0.08, 0.13, 0.25, -24); tone(sfxBus, 'pulse', 86, t + 0.06, 0.08, 0.11, 0.25, -24); },
    force2: function (t) { tone(sfxBus, 'pulse', 50, t, 0.3, 0.16, 0.5, 12); tone(sfxBus, 'pulse', 62, t + 0.02, 0.3, 0.1, 0.25, -12); noise(sfxBus, t, 0.2, 0.2, 1200, 1); },
    psychic: function (t) { for (var i = 0; i < 8; i++) tone(sfxBus, 'triangle', i % 2 ? 77 : 76, t + i * 0.03, 0.03, 0.1); tone(sfxBus, 'triangle', 83, t + 0.24, 0.15, 0.1); },
    psychic2: function (t) { [76, 77, 82, 83].forEach(function (m) { tone(sfxBus, 'triangle', m, t, 0.6, 0.07); }); noise(sfxBus, t, 0.5, 0.12, 5000, 3); },
    heal2: function (t) { [72, 76, 79, 84, 88, 91, 96].forEach(function (m, i) { tone(sfxBus, 'triangle', m, t + i * 0.05, 0.2, 0.18); }); },
    holy2: function (t) { [67, 72, 76, 79].forEach(function (m, i) { tone(sfxBus, 'pulse', m, t + i * 0.09, 0.3, 0.1, 0.25); }); tone(sfxBus, 'triangle', 84, t + 0.36, 0.4, 0.12); },
    magic2: function (t) { [67, 71, 74, 79, 83, 86, 91, 95].forEach(function (m, i) { tone(sfxBus, 'pulse', m, t + i * 0.03, 0.08, 0.1, 0.125); }); noise(sfxBus, t, 0.3, 0.1, 7000, 2); },
    charm: function (t) { [86, 83, 79, 83].forEach(function (m, i) { tone(sfxBus, 'triangle', m, t + i * 0.07, 0.12, 0.12); }); },
    shadow: function (t) { noise(sfxBus, t, 0.6, 0.2, 250, 0.5); tone(sfxBus, 'triangle', 40, t, 0.5, 0.2, null, -5); tone(sfxBus, 'pulse', 47, t + 0.1, 0.3, 0.06, 0.125, -4); },
    nature: function (t) { noise(sfxBus, t, 0.4, 0.2, 1300, 0.8); [60, 67, 64].forEach(function (m, i) { tone(sfxBus, 'triangle', m, t + 0.05 + i * 0.06, 0.08, 0.14); }); },
    earth: function (t) { noise(sfxBus, t, 0.7, 0.5, 140, 0.5); tone(sfxBus, 'triangle', 33, t, 0.5, 0.3, null, -4); },
    // the frog familiar's warning (RULED 09-30, Griz: "EXCELLENT call on the frog. will need audible."): a two-note croak, rib-bit
    croak: function (t) { tone(sfxBus, 'pulse', 43, t, 0.09, 0.22, 0.125, -5); noise(sfxBus, t, 0.05, 0.12, 600, 0.6); tone(sfxBus, 'pulse', 50, t + 0.15, 0.13, 0.22, 0.125, -9); noise(sfxBus, t + 0.15, 0.06, 0.12, 700, 0.6); },
    // chitin: a hooked claw snapping shut (the landlord's picture of the clackers, deep16/js/wet.js W.SOUND -- 09-30e)
    clack: function (t) { noise(sfxBus, t, 0.03, 0.55, 3400, 5); noise(sfxBus, t + 0.012, 0.05, 0.3, 1500, 3); tone(sfxBus, 'pulse', 83, t, 0.018, 0.08, 0.125, -14); }
  };
  AU.sfx = function (id) {
    if (!AU.ctx || AU.ctx.state !== 'running' || !SFX[id]) return;
    try { SFX[id](now()); } catch (e) { }
  };
})();
