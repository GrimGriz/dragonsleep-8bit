/* THE SNOOT -- the notes box (10-14, the Snoot mode seat). His word 10-14: "a direct link to the snoot-mode play with a notes box pop-up he
   can open during play that opens automatically at the end of the mini-game". The Chef plays on his own machine, so the notes come back
   to Griz two ways (RULED 10-14, lean 7: both) -- COPY, a plain text for Discord; SAVE, a file (snoot-notes-<UTC>.json) with every note,
   the day it was written, the whole turn log, every day's orders and the battle's seed, so the battle can be read back. The house's
   pattern is the SITUATIONS ear file (situations.html's Save and copy). Every note is kept on his machine as he types (localStorage,
   'snoot.notes.v1'); a new battle keeps them; each carries the battle's seed and the day. */
'use strict';
(function () {
  var SN = window.SN, N = SN.Notes = {}, KEY = 'snoot.notes.v1';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || { name: '', notes: [], draft: '' }; } catch (e) { return { name: '', notes: [], draft: '' }; } }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function stamp() { return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z'); }
  N.data = load;
  N.isOpen = function () { return document.getElementById('notesM').classList.contains('open'); };
  N.open = function (st, end) {
    var d = load(), box = document.getElementById('notesBox'), T = st && st.tally;
    var head = end ? '<h1>THE BATTLE IS OVER</h1><p>' + (T ? SN.UI.tallyLine(st) : '') + '</p><p><b>How did it play?</b> Anything at all: what confused you, what felt right, what the rules should do, what you would change. Then SEND it to Griz.</p>'
      : '<h1>NOTES FOR GRIZ</h1><p class="small">Write anything, any time: what confused you, what felt right, what the rules should do. Each note is kept on this machine as you write it, with the day it was written. When you are done, COPY it for Discord or SAVE it as a file and send that.</p>';
    box.innerHTML = head +
      '<p>Your name: <input id="nName" size="18" placeholder="(optional)" value="' + esc(d.name || '') + '"></p>' +
      '<textarea id="nText" placeholder="' + (end ? 'How did it play?' : 'A note about Day ' + (st ? st.day : '') + '...') + '">' + esc(d.draft || '') + '</textarea>' +
      '<div class="row" style="justify-content:flex-start;margin-top:6px"><button id="nAdd">ADD THIS NOTE</button><span class="small" id="nCount"></span></div>' +
      '<div class="past" id="nPast"></div>' +
      '<h2>Send to Griz</h2><p class="small">COPY puts your notes on the clipboard for Discord. SAVE downloads a file with your notes and the whole battle (every roll, every order) -- send that file if you can.</p>' +
      '<div class="row"><button id="nCopy">COPY FOR DISCORD</button><button id="nSave">SAVE FILE</button><button id="nClose" class="go">' + (end ? 'DONE' : 'BACK TO THE BATTLE') + '</button></div>';
    document.getElementById('notesM').classList.add('open');
    var ta = document.getElementById('nText');
    function past() {
      var dd = load(); document.getElementById('nCount').textContent = dd.notes.length ? dd.notes.length + ' note' + (dd.notes.length > 1 ? 's' : '') + ' kept' : '';
      document.getElementById('nPast').innerHTML = dd.notes.slice().reverse().map(function (n) { return '<div><span class="small">' + (n.day ? 'Day ' + n.day + (n.end ? ', the end' : '') : '') + ' &middot; ' + esc(n.at.slice(0, 16).replace('T', ' ')) + '</span><br>' + esc(n.text).replace(/\n/g, '<br>') + '</div>'; }).join('');
    }
    past();
    ta.addEventListener('input', function () { var dd = load(); dd.draft = ta.value; save(dd); });
    document.getElementById('nName').addEventListener('input', function (e) { var dd = load(); dd.name = e.target.value; save(dd); });
    document.getElementById('nAdd').onclick = function () { N.add(st, end); past(); ta.value = ''; ta.focus(); };
    document.getElementById('nCopy').onclick = function () { N.add(st, end); past(); ta.value = ''; N.copy(st); };
    document.getElementById('nSave').onclick = function () { N.add(st, end); past(); ta.value = ''; N.file(st); };
    document.getElementById('nClose').onclick = function () { N.add(st, end); N.close(); };
    setTimeout(function () { try { ta.focus(); } catch (e) { } }, 0);
  };
  // the draft becomes a note (kept on this machine); an empty draft adds nothing
  N.add = function (st, end) {
    var d = load(), ta = document.getElementById('nText'), txt = ta ? ta.value.trim() : (d.draft || '').trim();
    if (!txt) return;
    d.notes.push({ at: new Date().toISOString(), day: st ? st.day : null, seed: st ? st.seed : null, end: !!end, text: txt }); d.draft = ''; save(d);
  };
  N.close = function () { document.getElementById('notesM').classList.remove('open'); if (SN.UI && SN.UI.focus) SN.UI.focus(); };
  N.text = function (st) {
    var d = load(), T = st && st.tally;
    var lines = ['THE SNOOT -- notes' + (d.name ? ' from ' + d.name : '') + ' (' + new Date().toISOString().slice(0, 10) + (st ? ', battle ' + st.seed + ', Day ' + st.day : '') + ')'];
    if (T) lines.push('Result: ' + SN.UI.tallyLine(st).replace(/<[^>]+>/g, ''));
    d.notes.forEach(function (n) { lines.push('- ' + (n.day ? '(Day ' + n.day + (n.end ? ', the end' : '') + ') ' : '') + n.text); });
    if (!d.notes.length) lines.push('(no notes yet)');
    return lines.join('\n');
  };
  N.copy = function (st) {
    var t = N.text(st);
    var warn = t.length > 1900 ? ' (it is long: Discord may want it in two pieces -- or send the SAVE file)' : '';
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { SN.UI.toast('Copied' + warn + '. Paste it to Griz in Discord.'); }, function () { window.prompt('Copy this and paste it to Griz:', t); });
  };
  N.file = function (st) {
    var d = load(), prev = null;
    try { prev = localStorage.getItem('snoot.notes.saved') || null; } catch (e) { }
    var now = new Date().toISOString();
    var out = { kind: 'snoot-notes', mode: 'THE SNOOT (DRAGONSLEEP, snoot-mode/)', saved_at: now, previous_save: prev, name: d.name || '',
      battle: st ? { seed: st.seed, day: st.day, over: !!st.over, tally: st.tally || null, head: st.head || null, pitFell: st.pitFell || false } : null,
      notes: d.notes.map(function (n) { return Object.assign({ new_since_last_save: !prev || n.at > prev }, n); }),
      orders: st ? st.rec : [], log: st ? st.log : [], page: location.href.split('#')[0] };
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' }));
    a.download = 'snoot-notes-' + stamp() + '.json'; document.body.appendChild(a); a.click(); a.remove();
    try { localStorage.setItem('snoot.notes.saved', now); } catch (e) { }
    SN.UI.toast('Saved: snoot-notes-' + stamp() + '.json -- send that file to Griz.');
  };
})();
