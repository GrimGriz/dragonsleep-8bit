// The DEEP16 poser (10-04): a figure's skeleton and skin in the browser, each frame of a row its numbers (tools/blender_pose.py: a frame P), the
// feet, wrists, knees and elbows dragged by hand. The math here is blender_pose.py's, line for line (bends, aim, the two-bone solve, solve),
// and the skin is linear blend with the artist's weights, as Blender's armature does it -- on load the page proves its bone matrices against
// the ones Blender wrote (`check`). What he sets lives in this browser (localStorage) and is taken back as {row: {frame: P}}.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const qs = new URLSearchParams(location.search);
const FIG = qs.get('fig') || 'troll';
const DATA_URL = qs.get('data') || `../deep16/_src/${FIG}/poser.json`;
const KEY = 'deep16-poser-' + FIG;
const $ = (id) => document.getElementById(id);

// ------------------------------------------------------------------ the math (blender_pose.py's)
const PX = new THREE.Vector3(1, 0, 0), PY = new THREE.Vector3(0, 1, 0), PZ = new THREE.Vector3(0, 0, 1);
const I = () => new THREE.Quaternion();
const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
function Q(axis, deg) {
  const ax = axis.clone();
  return ax.length() > 1e-6 && deg ? new THREE.Quaternion().setFromAxisAngle(ax.normalize(), deg * Math.PI / 180) : I();
}
const M4 = (r) => new THREE.Matrix4().set(...r);              // (row-major, as Blender wrote it)
function frame3(a, n) {
  a = a.clone().normalize(); n = n.clone().sub(a.clone().multiplyScalar(n.dot(a))).normalize();
  return new THREE.Matrix4().makeBasis(a, n, a.clone().cross(n));
}
const posOf = (m) => new THREE.Vector3().setFromMatrixPosition(m);

class Rig {
  constructor(D) {
    this.D = D; this.order = D.bones.map((b) => b.n);
    this.parent = {}; this.len = {}; this.REST = {}; this.RESTinv = {}; this.POSE0 = {}; this.P0rot = {}; this.P0t = {};
    for (const b of D.bones) {
      this.parent[b.n] = b.p >= 0 ? D.bones[b.p].n : null; this.len[b.n] = b.len;
      this.REST[b.n] = M4(b.rest); this.RESTinv[b.n] = M4(b.rest).invert();
      this.POSE0[b.n] = M4(b.pose0); this.P0t[b.n] = posOf(this.POSE0[b.n]);
      this.P0rot[b.n] = M4(b.pose0).setPosition(0, 0, 0);
    }
    const r = D.roles; Object.assign(this, { SPINE: r.spine, NECK: r.neck, HEAD: r.head, JAW: r.jaw, ARM: r.arm, LEG: r.leg, ROOTS: r.roots, FOOT: r.foot, FING: r.fing, KPOLE: r.kpole, EPOLE: r.epole });
  }
  dir0(n) { return new THREE.Vector3(0, this.len[n], 0).applyMatrix4(this.POSE0[n]).sub(this.P0t[n]); }
  accG(d, name) {
    const up = []; let b = name;
    while (b) { up.push(b); b = this.parent[b]; }
    const G = I();
    for (const n of up.reverse()) G.multiply(d[n] || I());
    return G;
  }
  bends(P) {
    const d = {}, g = (k) => P[k] || 0;
    const add = (n, q) => { d[n] = q.multiply(d[n] || I()); };
    for (const r of this.ROOTS) { add(r, Q(PX, g('body'))); add(r, Q(PZ, g('bodyyaw'))); }
    const sp = this.SPINE;
    for (const n of sp) { add(n, Q(PX, g('lean') / sp.length)); add(n, Q(PZ, g('twist') / sp.length)); add(n, Q(PY, g('tilt') / sp.length)); }
    const k = this.NECK.length + 1;
    for (const n of [...this.NECK, this.HEAD]) { add(n, Q(PX, g('head') / k)); add(n, Q(PZ, g('hyaw') / k)); add(n, Q(PY, g('hroll') / k)); }
    if (this.JAW) add(this.JAW, Q(PX, g('jaw')));
    for (const s of 'ab') {
      const A = this.ARM[s], L = this.LEG[s], sg = s === 'a' ? 1 : -1;
      add(A[0], Q(PX, g('shr' + s)));
      add(A[0], Q(PY, -sg * g('shup' + s))); add(A[0], Q(PZ, -sg * g('shfw' + s)));
      add(A[1], Q(PX, g('sw' + s))); add(A[1], Q(PZ, g('out' + s)));
      add(A[2], Q(PX, g('el' + s))); add(A[2], Q(PZ, g('elz' + s)));
      add(A[3], Q(PX, g('wr' + s)));
      for (const ch of this.FING[s]) for (const n of ch) add(n, Q(PX, g('fing' + s)));
      add(L[1], Q(PX, g('th' + s))); add(L[1], Q(PZ, g('thz' + s)));
      add(L[2], Q(PX, g('kn' + s)));
      add(L[3], Q(PX, g('ft' + s)));
    }
    return d;
  }
  aim(d, names, targets) {
    const first = this.parent[names[0]];
    let G = first ? this.accG(d, first) : I();
    names.forEach((n, i) => {
      const pd = this.dir0(n).normalize();
      const T = V(targets[i]).normalize().applyQuaternion(G.clone().invert());
      const dq = new THREE.Quaternion().setFromUnitVectors(pd, T);
      d[n] = dq; G = G.clone().multiply(dq);
    });
  }
  solve(d, lift = 0, shift = 0, sway = 0) {
    const G = {}, M = {};
    for (const n of this.order) {
      const p = this.parent[n];
      const g = (p ? G[p].clone() : I()).multiply(d[n] || I()); G[n] = g;
      const R = new THREE.Matrix4().makeRotationFromQuaternion(g).multiply(this.P0rot[n]);
      const head = p ? posOf(M[p].clone().multiply(this.RESTinv[p]).multiply(this.REST[n])) : this.P0t[n].clone().add(new THREE.Vector3(sway, shift, lift));
      M[n] = R.setPosition(head);
    }
    return M;
  }
  orient(d, name, Rw) {
    const p = this.parent[name];
    d[name] = (p ? this.accG(d, p) : I()).invert().multiply(Rw);
  }
  ik2(d, M, upper, lower, target, pole) {
    const root = posOf(M[upper]), L1 = this.len[upper], L2 = this.len[lower];
    const D = target.clone().sub(root), Dn = D.clone().normalize();
    const dist = Math.min(Math.max(D.length(), Math.abs(L1 - L2) + 0.05), L1 + L2 - 0.05);
    const x = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(L1 * L1 - x * x, 0));
    const p = V(pole); p.sub(Dn.clone().multiplyScalar(p.dot(Dn))).normalize();
    const knee = root.clone().addScaledVector(Dn, x).addScaledVector(p, h), tip = root.clone().addScaledVector(Dn, dist);
    const u0 = this.dir0(upper), l0 = this.dir0(lower), n0 = u0.clone().cross(l0), n1 = p.clone().cross(Dn);
    const q = (a, a0) => new THREE.Quaternion().setFromRotationMatrix(frame3(a, n1).multiply(frame3(a0, n0).transpose()));
    this.orient(d, upper, q(knee.clone().sub(root), u0));
    this.orient(d, lower, q(tip.clone().sub(knee), l0));
    return knee;
  }
  footTurn(s, yaw, pitch) {
    const sg = s === 'a' ? 1 : -1;
    const fw = this.dir0(this.FOOT[s][1]); fw.z = 0; fw.normalize();
    const qy = Q(PZ, yaw * sg); fw.applyQuaternion(qy);
    return Q(PZ.clone().cross(fw), pitch).multiply(qy);
  }
  footRaise(s, R) {
    const F = this.FOOT[s], a = this.P0t[F[0]];
    const pts = [this.P0t[F[1]].clone().sub(a), this.P0t[F[2]].clone().add(this.dir0(F[2])).sub(a)];
    return Math.max(0, Math.min(...pts.map((v) => v.z)) - Math.min(...pts.map((v) => v.clone().applyQuaternion(R).z)));
  }
  pose(P) {
    // frame P -> every bone's posed matrix (blender_pose.py Rig.pose_d then solve), and where the limbs' joints landed (for the handles)
    const d = this.bends(P), lift = P.lift || 0, shift = P.shift || 0, sway = P.sway || 0, J = {};
    if (P.legs || P.arms || P.hands) {
      const M = this.solve(d, lift, shift, sway);
      for (const [s, l] of Object.entries(P.legs || {})) {
        const R = this.footTurn(s, l[3], l[4]), up = this.footRaise(s, R);
        J['ank' + s] = new THREE.Vector3(l[0], l[1], l[2] + up); J['raise' + s] = up;
        J['knee' + s] = this.ik2(d, M, this.LEG[s][1], this.LEG[s][2], J['ank' + s], P['kpole' + s] || this.KPOLE[s]);
        this.orient(d, this.FOOT[s][0], R);
      }
      for (const [s, w] of Object.entries(P.arms || {})) {
        const sh = posOf(M[this.ARM[s][1]]); J['sh' + s] = sh; J['wr' + s] = sh.clone().add(V(w));
        J['elb' + s] = this.ik2(d, M, this.ARM[s][1], this.ARM[s][2], J['wr' + s], P['epole' + s] || this.EPOLE[s]);
      }
      for (const [s, v] of Object.entries(P.hands || {})) this.aim(d, [this.ARM[s][3]], [v]);
      if (P.grip2) {     // two hands on one held thing (blender_pose.py's grip2): this hand's wrist onto the other hand's club, f of the way from its grip to its head
        const M2 = this.solve(d, lift, shift, sway);
        for (const [s, f] of Object.entries(P.grip2)) {
          const h = (this.HELD || {})[s === 'a' ? 'b' : 'a']; if (!h) continue;
          const K = M2[h.bone].clone().multiply(this.RESTinv[h.bone]);
          const p = h.g.clone().add(h.h.clone().sub(h.g).multiplyScalar(f)).applyMatrix4(K), sh = posOf(M2[this.ARM[s][1]]);
          p.add(sh.clone().sub(p).normalize().multiplyScalar(h.back || 2));
          J['wr' + s] = p; J['elb' + s] = this.ik2(d, M2, this.ARM[s][1], this.ARM[s][2], p, P['epole' + s] || this.EPOLE[s]);
        }
      }
    }
    const M = this.solve(d, lift, shift, sway);
    for (const s of 'ab') J['sh' + s] = posOf(M[this.ARM[s][1]]);
    J.head = posOf(M[this.HEAD]); J.face = this.face(M); J.neck = posOf(M[this.NECK[0]]);
    return { M, J };
  }
  face(M) {
    // which way the face looks: the artist's front (-Y) carried by the head's whole turn
    const g = new THREE.Quaternion().setFromRotationMatrix(M[this.HEAD].clone().setPosition(0, 0, 0).multiply(this.P0rot[this.HEAD].clone().transpose()));
    return new THREE.Vector3(0, -1, 0).applyQuaternion(g);
  }
}

function fit(P, keys, point, T, lim) {
  // a drag that has no limb of its own to solve (the head's aim, a shoulder): turn `keys` (degrees) till point(P) sits on T, a few damped steps
  for (let it = 0; it < 10; it++) {
    const p0 = point(P), e = T.clone().sub(p0);
    if (e.length() < 0.05) break;
    const J = keys.map((k) => point({ ...P, [k]: (P[k] || 0) + 1 }).sub(p0));
    const A = keys.map((_, i) => keys.map((_, j) => J[i].dot(J[j]) + (i === j ? 0.02 : 0))), b = keys.map((_, i) => J[i].dot(e));
    const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
    if (Math.abs(det) < 1e-9) break;
    const dl = [(b[0] * A[1][1] - b[1] * A[0][1]) / det, (A[0][0] * b[1] - A[1][0] * b[0]) / det];
    keys.forEach((k, i) => { P[k] = Math.max(-lim, Math.min(lim, (P[k] || 0) + Math.max(-12, Math.min(12, dl[i])))); });
  }
  keys.forEach((k) => { P[k] = Math.round(P[k] * 10) / 10; });
  return P;
}

// ------------------------------------------------------------------ the data
function b64(s, T) {
  const bin = atob(s), u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return new T(u8.buffer);
}
const clone = (o) => JSON.parse(JSON.stringify(o));

const D = await (await fetch(DATA_URL, { cache: 'no-store' })).json().catch(() => null);
if (!D) { document.body.innerHTML = `<p style="padding:20px">No poser data at ${DATA_URL}. Write it: blender -b --disable-autoexec --python tools/${FIG}-blend.py -- poser</p>`; throw new Error('no data'); }
const rig = new Rig(D);
const FLOOR = D.floor;
const mesh = { n: D.mesh.n, pos: b64(D.mesh.pos, Float32Array), tri: b64(D.mesh.tri, Uint32Array), col: b64(D.mesh.col, Uint8Array),
  wofs: b64(D.mesh.wofs, Uint32Array), widx: b64(D.mesh.widx, Uint16Array), wval: b64(D.mesh.wval, Float32Array) };
const BI = {}; rig.order.forEach((n, i) => { BI[n] = i; });

rig.HELD = {};       // (the held thing's grip and head where they sit at rest, for grip2: the same points blender_pose.py's hold() picks)
for (const h of D.held || []) rig.HELD[h.side] = { bone: h.bone, back: h.back || 2, g: new THREE.Vector3(mesh.pos[h.grip * 3], mesh.pos[h.grip * 3 + 1], mesh.pos[h.grip * 3 + 2]), h: new THREE.Vector3(mesh.pos[h.head * 3], mesh.pos[h.head * 3 + 1], mesh.pos[h.head * 3 + 2]) };
// the proof: this page's bone matrices against Blender's, for the frames Blender wrote down
let parity = 0;
for (const [k, mats] of Object.entries(D.check)) {
  const [row, i] = k.split(' '); const P = D.rows.find((r) => r.name === row).frames[+i];
  const { M } = rig.pose(P);
  for (const [n, m] of Object.entries(mats)) {
    const e = M[n].clone().transpose().elements;          // (three keeps columns; Blender wrote rows)
    for (let j = 0; j < 16; j++) parity = Math.max(parity, Math.abs(e[j] - m[j]));
  }
}

// ------------------------------------------------------------------ the edits (his), kept in this browser
let EDITS = {};
try { EDITS = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { EDITS = {}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(EDITS)); } catch (e) { /* (private window: edits last the page) */ } };
let rowI = 0, frameI = 0;
const row = () => D.rows[rowI];
const edited = (r, i) => !!(EDITS[r.name] && EDITS[r.name][i]);
const frameP = (r, i) => (edited(r, i) ? EDITS[r.name][i] : r.frames[i]);
function setP(P) { (EDITS[row().name] = EDITS[row().name] || {})[frameI] = P; save(); }
const curP = () => clone(frameP(row(), frameI));

// ------------------------------------------------------------------ the scene (Z up, as Blender)
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x15171c);
const cam = new THREE.OrthographicCamera(-50, 50, 50, -50, -1000, 1000); cam.up.set(0, 0, 1);
const controls = new OrbitControls(cam, canvas);
// (the view fitted to the figure: the troll stands ~60 high, the stone giant ~95)
let HMAX = -Infinity; for (let i = 2; i < mesh.pos.length; i += 3) HMAX = Math.max(HMAX, mesh.pos[i]);
const FIGH = Math.max(40, HMAX - FLOOR), VIEW_S = Math.max(52, FIGH * 0.62);
const TGT = new THREE.Vector3(0, 0, FLOOR + FIGH * 0.45); controls.target.copy(TGT);
scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x3a3326, 1.6));
const sun = new THREE.DirectionalLight(0xfff2dc, 2.2); sun.position.set(-40, -60, 120); scene.add(sun);
// the floor: solid, so a body lying on it reads as lying on it (10-04, Griz: "she looked like she was floating off the floor of the poser"), a shadow cast
// straight down onto it from overhead (touching or not, at a glance), and a little see-through so what sinks under it shows, in red
const ground = new THREE.Mesh(new THREE.PlaneGeometry(FIGH * 6, FIGH * 6), new THREE.MeshLambertMaterial({ color: 0x2a2f38, transparent: true, opacity: 0.82 }));
ground.position.z = FLOOR; ground.receiveShadow = true; ground.renderOrder = 2; scene.add(ground);
const grid = new THREE.GridHelper(FIGH * 3, 30, 0x4a5466, 0x353b46); grid.rotation.x = Math.PI / 2; grid.position.z = FLOOR + 0.03; grid.renderOrder = 3; scene.add(grid);
const disc = new THREE.Mesh(new THREE.CircleGeometry(25.2, 48), new THREE.MeshBasicMaterial({ color: 0x3a4a60, transparent: true, opacity: 0.35, depthWrite: false }));
disc.position.z = FLOOR + 0.05; disc.renderOrder = 4; scene.add(disc);         // (the troll's footprint: the print base, two squares)
const top = new THREE.DirectionalLight(0xffffff, 0.7); top.position.set(TGT.x - FIGH * 1.1, TGT.y - FIGH * 1.6, FLOOR + FIGH * 3.2); top.target.position.set(TGT.x, TGT.y, FLOOR);     // (from the front-left and high, as the sprites' key light: a body off the floor shows its shadow come away from it)
top.castShadow = true; top.shadow.mapSize.set(2048, 2048); top.shadow.bias = -0.0008;
Object.assign(top.shadow.camera, { left: -FIGH * 1.6, right: FIGH * 1.6, top: FIGH * 1.6, bottom: -FIGH * 1.6, near: 1, far: FIGH * 9 });
scene.add(top); scene.add(top.target);

function makeMesh(material) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(mesh.pos), 3));
  g.setIndex(new THREE.BufferAttribute(mesh.tri, 1));
  const c = new Float32Array(mesh.n * 3);
  for (let i = 0; i < mesh.n * 3; i++) { const v = mesh.col[i] / 255; c[i] = v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  const m = new THREE.Mesh(g, material); scene.add(m); return m;
}
const body = makeMesh(new THREE.MeshLambertMaterial({ vertexColors: true })); body.castShadow = true;
const COL0 = body.geometry.attributes.color.array.slice();
const ghost = makeMesh(new THREE.MeshBasicMaterial({ color: 0xbfd0ff, transparent: true, opacity: 0.18, depthWrite: false }));
ghost.visible = false;

function skin(target, M) {
  // linear blend: each point by its bones' (posed x rest^-1), weighted and over the weights' sum (Blender's armature, vertex groups only)
  const K = rig.order.map((n) => M[n].clone().multiply(rig.RESTinv[n]).elements);
  const src = mesh.pos, out = target.geometry.attributes.position.array;
  let low = Infinity;
  for (let v = 0; v < mesh.n; v++) {
    const x = src[v * 3], y = src[v * 3 + 1], z = src[v * 3 + 2];
    let ox = 0, oy = 0, oz = 0, sw = 0;
    for (let j = mesh.wofs[v]; j < mesh.wofs[v + 1]; j++) {
      const e = K[mesh.widx[j]], w = mesh.wval[j];
      ox += w * (e[0] * x + e[4] * y + e[8] * z + e[12]); oy += w * (e[1] * x + e[5] * y + e[9] * z + e[13]); oz += w * (e[2] * x + e[6] * y + e[10] * z + e[14]); sw += w;
    }
    if (sw > 0.0001) { ox /= sw; oy /= sw; oz /= sw; } else { ox = x; oy = y; oz = z; }
    out[v * 3] = ox; out[v * 3 + 1] = oy; out[v * 3 + 2] = oz;
    if (oz < low) low = oz;
  }
  if (target === body) {        // (under the floor: red, seen through it)
    const c = body.geometry.attributes.color.array;
    for (let v = 0; v < mesh.n; v++) {
      const u = out[v * 3 + 2] < FLOOR - 0.3;
      c[v * 3] = u ? 0.9 : COL0[v * 3]; c[v * 3 + 1] = u ? 0.05 : COL0[v * 3 + 1]; c[v * 3 + 2] = u ? 0.03 : COL0[v * 3 + 2];
    }
    body.geometry.attributes.color.needsUpdate = true;
  }
  target.geometry.attributes.position.needsUpdate = true; target.geometry.computeVertexNormals(); target.geometry.computeBoundingSphere();
  return low;
}

// ------------------------------------------------------------------ the handles
const HANDLES = [];
function handle(key, color, r, shape) {
  const geo = shape === 'diamond' ? new THREE.OctahedronGeometry(r) : shape === 'box' ? new THREE.BoxGeometry(r * 1.6, r * 1.6, r * 1.6) : new THREE.SphereGeometry(r, 16, 12);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.9 }));
  m.renderOrder = 10; m.userData.key = key; scene.add(m); HANDLES.push(m); return m;
}
const CA = 0xff9a3c, CB = 0x3cc8ff;
const H = {
  anka: handle('anka', CA, 2.2), ankb: handle('ankb', CB, 2.2), wra: handle('wra', CA, 2.2), wrb: handle('wrb', CB, 2.2),
  kpa: handle('kpa', CA, 1.3), kpb: handle('kpb', CB, 1.3), epa: handle('epa', CA, 1.3), epb: handle('epb', CB, 1.3),
  hda: handle('hda', CA, 1.6, 'diamond'), hdb: handle('hdb', CB, 1.6, 'diamond'), hip: handle('hip', 0xffffff, 2.0),
  sha: handle('sha', CA, 1.7, 'box'), shb: handle('shb', CB, 1.7, 'box'), look: handle('look', 0xffe066, 1.9, 'diamond'), neck: handle('neck', 0xffffff, 1.7),
};
const lineMat = new THREE.LineBasicMaterial({ color: 0x8890a0, depthTest: false, transparent: true, opacity: 0.6 });
const poleLines = new THREE.LineSegments(new THREE.BufferGeometry(), lineMat); poleLines.renderOrder = 9; scene.add(poleLines);
const POLE_R = 10, HAND_R = 9, LOOK_R = 14;

let last = null, LOW = 0;     // (the last solve: the joints, for the handles and the drag; the lowest point)
function refresh() {
  const P = curP(); const { M, J } = rig.pose(P); last = { P, M, J };
  const low = skin(body, M); LOW = low;
  if (ghost.visible) {
    const r = row(), pi = r.loop ? (frameI - 1 + r.n) % r.n : frameI - 1;
    if (pi >= 0) { skin(ghost, rig.pose(frameP(r, pi)).M); } else ghost.geometry.attributes.position.array.fill(0);
  }
  const lines = [];
  for (const s of 'ab') {
    const ok = !!J['ank' + s];
    H['ank' + s].visible = H['kp' + s].visible = ok;
    if (ok) {
      H['ank' + s].position.copy(J['ank' + s]);
      const kp = V(P['kpole' + s] || rig.KPOLE[s]).normalize().multiplyScalar(POLE_R).add(J['knee' + s]);
      H['kp' + s].position.copy(kp); lines.push(J['knee' + s], kp);
    }
    const okw = !!J['wr' + s];
    H['wr' + s].visible = H['ep' + s].visible = H['hd' + s].visible = okw;
    if (okw) {
      H['wr' + s].position.copy(J['wr' + s]);
      const ep = V(P['epole' + s] || rig.EPOLE[s]).normalize().multiplyScalar(POLE_R).add(J['elb' + s]);
      H['ep' + s].position.copy(ep); lines.push(J['elb' + s], ep);
      const hb = rig.ARM[s][3], hm = M[hb], hd = HELD[s];
      const hdir = new THREE.Vector3(0, rig.len[hb], 0).applyMatrix4(hm).sub(posOf(hm)).normalize();
      const pa = body.geometry.attributes.position.array, at3 = (k) => new THREE.Vector3(pa[k * 3], pa[k * 3 + 1], pa[k * 3 + 2]);
      const from = hd ? at3(hd.grip) : J['wr' + s], hp = hd ? at3(hd.head) : J['wr' + s].clone().addScaledVector(hdir, HAND_R);     // (a hand that holds something: the diamond is on its head)
      H['hd' + s].position.copy(hp); H['hd' + s].material.opacity = (P.hands && P.hands[s]) ? 0.95 : 0.45; lines.push(from, hp);
    }
  }
  H.hip.position.copy(rig.P0t[rig.ROOTS[0]].clone().add(new THREE.Vector3(P.sway || 0, P.shift || 0, P.lift || 0)));
  H.sha.position.copy(J.sha); H.shb.position.copy(J.shb); H.neck.position.copy(J.neck); lines.push(H.hip.position.clone(), J.neck);
  const lk = J.head.clone().addScaledVector(J.face, LOOK_R); H.look.position.copy(lk); lines.push(J.head, lk);
  poleLines.geometry.setFromPoints(lines);
  syncSliders(P); syncFrames(); status(low);
}

// ------------------------------------------------------------------ dragging
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let drag = null;
function pick(ev) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, cam);
}
canvas.addEventListener('pointerdown', (ev) => {
  if (ev.button !== 0) return;
  pick(ev);
  const hit = ray.intersectObjects(HANDLES.filter((h) => h.visible), false)[0];
  if (!hit) return;
  const h = hit.object, n = new THREE.Vector3();
  if (ev.shiftKey) n.copy(PZ); else cam.getWorldDirection(n);
  drag = { key: h.userData.key, plane: new THREE.Plane().setFromNormalAndCoplanarPoint(n, h.position.clone()), off: h.position.clone().sub(hit.point) };
  controls.enabled = false; canvas.setPointerCapture(ev.pointerId); ev.preventDefault();
});
canvas.addEventListener('pointermove', (ev) => {
  if (!drag) return;
  pick(ev);
  const at = new THREE.Vector3();
  if (!ray.ray.intersectPlane(drag.plane, at)) return;
  at.add(drag.off); moveHandle(drag.key, at);
});
const endDrag = () => { if (drag) { drag = null; controls.enabled = true; } };
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);

const r2 = (x) => Math.round(x * 100) / 100;
function moveHandle(key, at) {
  const P = curP(), J = last.J, s = key.slice(-1);
  if (key.startsWith('ank')) {
    const l = P.legs[s]; P.legs[s] = [r2(at.x), r2(at.y), r2(at.z - (J['raise' + s] || 0)), l[3], l[4]];
  } else if (key.startsWith('wr')) {
    const d = at.clone().sub(J['sh' + s]); P.arms[s] = [r2(d.x), r2(d.y), r2(d.z)];
  } else if (key.startsWith('kp')) {
    const d = at.clone().sub(J['knee' + s]).normalize(); P['kpole' + s] = [r2(d.x), r2(d.y), r2(d.z)];
  } else if (key.startsWith('ep')) {
    const d = at.clone().sub(J['elb' + s]).normalize(); P['epole' + s] = [r2(d.x), r2(d.y), r2(d.z)];
  } else if (key.startsWith('hd') && HELD[s]) {     // the held thing aimed: the fist turned till it points where the diamond was dropped
    const pa = body.geometry.attributes.position.array, g = HELD[s].grip;
    heldAim(P, s, at.clone().sub(new THREE.Vector3(pa[g * 3], pa[g * 3 + 1], pa[g * 3 + 2])).normalize());
  } else if (key.startsWith('hd')) {
    const d = at.clone().sub(J['wr' + s]).normalize(); P.hands = P.hands || {}; P.hands[s] = [r2(d.x), r2(d.y), r2(d.z)];
  } else if (key === 'neck') {     // the top of the spine (10-04, Griz: "another white dot at the base of the skull"): the back bent forward or back (lean) and to the side (tilt), the hips where they are
    fit(P, ['lean', 'tilt'], (Q_) => rig.pose(Q_).J.neck, at, 85);
  } else if (key === 'look') {     // the head's aim: its pitch and turn (spread down the neck, as the sliders do)
    fit(P, ['head', 'hyaw'], (Q_) => { const r = rig.pose(Q_).J; return r.head.clone().addScaledVector(r.face, LOOK_R); }, at, 85);
  } else if (key.startsWith('sh')) {   // a shoulder: the collarbone up or down, forward or back (the arm rides it: its wrist is set from the shoulder)
    fit(P, ['shup' + s, 'shfw' + s], (Q_) => rig.pose(Q_).J['sh' + s], at, 45);
  } else if (key === 'hip') {
    const d = at.clone().sub(rig.P0t[rig.ROOTS[0]]); P.sway = r2(d.x); P.shift = r2(d.y); P.lift = r2(d.z);
  }
  setP(P); refresh();
}

// a held thing (the stone giant's club, 10-04): its grip and head in the mesh, so its diamond aims the thing itself, not the hand's bone it rides at an
// angle (Griz, 10-04: "I tried to use poser to communicate intent more than canon" -- the seat had to work out which way he meant the club to point)
const HELD = {}; for (const h of D.held || []) HELD[h.side] = h;
function heldAim(P, s, c) {
  const h = HELD[s], b = h.bone, hb = rig.ARM[s][3];
  const ax = new THREE.Vector3(mesh.pos[h.head * 3] - mesh.pos[h.grip * 3], mesh.pos[h.head * 3 + 1] - mesh.pos[h.grip * 3 + 1], mesh.pos[h.head * 3 + 2] - mesh.pos[h.grip * 3 + 2]);
  const along = (P_) => { const M = rig.pose(P_).M; return ax.clone().transformDirection(M[b].clone().multiply(rig.RESTinv[b])); };
  const M0 = rig.pose(P).M; let T = new THREE.Vector3(0, rig.len[hb], 0).applyMatrix4(M0[hb]).sub(posOf(M0[hb])).normalize(), best = null;
  for (let it = 0; it < 40; it++) {
    const cur = along({ ...P, hands: { ...(P.hands || {}), [s]: T.toArray() } }), e = cur.angleTo(c);
    if (!best || e < best.e) best = { e, T: T.clone() };
    if (e < 0.004) break;
    T.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(cur, c)).normalize();
  }
  P.hands = { ...(P.hands || {}), [s]: best.T.toArray().map((x) => Math.round(x * 1e4) / 1e4) };
  return best.e;
}

// ------------------------------------------------------------------ the panel
const SL = [['lift', -30, 30, 0.5], ['shift', -30, 30, 0.5], ['sway', -15, 15, 0.5], ['body', -100, 100, 1], ['bodyyaw', -60, 60, 1], ['lean', -50, 60, 1],
  ['twist', -60, 60, 1], ['tilt', -40, 40, 1], ['head', -60, 60, 1], ['hyaw', -80, 80, 1], ['hroll', -90, 90, 1], ['jaw', -40, 40, 1],
  ['finga', -30, 40, 1], ['fingb', -30, 40, 1], ['shupa', -45, 45, 1], ['shfwa', -45, 45, 1], ['shupb', -45, 45, 1], ['shfwb', -45, 45, 1], ['yawa', -40, 60, 1], ['pitcha', -40, 80, 1], ['yawb', -40, 60, 1], ['pitchb', -40, 80, 1]];
const SLN = { shupa: 'shoulder L up', shfwa: 'shoulder L fwd', shupb: 'shoulder R up', shfwb: 'shoulder R fwd', yawa: 'foot L yaw', pitcha: 'foot L pitch', yawb: 'foot R yaw', pitchb: 'foot R pitch', finga: 'fingers L', fingb: 'fingers R' };
const sliders = {};
for (const [k, lo, hi, st] of SL) {
  const div = document.createElement('div'); div.className = 'sl';
  div.innerHTML = `<label title="${k}">${SLN[k] || k}</label><input type="range" min="${lo}" max="${hi}" step="${st}"><span></span>`;
  const inp = div.querySelector('input'), sp = div.querySelector('span');
  inp.addEventListener('input', () => {
    const P = curP(), v = +inp.value;
    if (k.startsWith('yaw') || k.startsWith('pitch')) {
      const s = k.slice(-1), l = P.legs && P.legs[s]; if (!l) return;
      l[k.startsWith('yaw') ? 3 : 4] = v;
    } else P[k] = v;
    setP(P); refresh();
  });
  $('sliders').appendChild(div); sliders[k] = { inp, sp };
}
function syncSliders(P) {
  for (const [k] of SL) {
    let v = P[k] || 0;
    if (k.startsWith('yaw') || k.startsWith('pitch')) { const l = P.legs && P.legs[k.slice(-1)]; v = l ? l[k.startsWith('yaw') ? 3 : 4] : 0; }
    if (document.activeElement !== sliders[k].inp) sliders[k].inp.value = v;
    sliders[k].sp.textContent = (Math.round(v * 10) / 10).toString();
  }
}
for (const [i, r] of D.rows.entries()) { const o = document.createElement('option'); o.value = i; o.textContent = `${r.name} (${r.engine}, ${r.n})`; $('rowsel').appendChild(o); }
$('rowsel').addEventListener('change', () => { rowI = +$('rowsel').value; frameI = 0; stop(); refresh(); });
function syncFrames() {
  const f = $('frames'), r = row();
  if (f.dataset.row !== r.name || f.children.length !== r.n) {
    f.innerHTML = ''; f.dataset.row = r.name;
    for (let i = 0; i < r.n; i++) { const b = document.createElement('button'); b.textContent = i; b.onclick = () => { stop(); frameI = i; refresh(); }; f.appendChild(b); }
  }
  [...f.children].forEach((b, i) => { b.classList.toggle('on', i === frameI); b.classList.toggle('ed', edited(r, i)); });
}
const step = (k) => { const n = row().n; frameI = (frameI + k + n) % n; refresh(); };
$('prev').onclick = () => { stop(); step(-1); }; $('next').onclick = () => { stop(); step(1); };
$('copyprev').onclick = () => { const r = row(); if (frameI === 0 && !r.loop) return; setP(clone(frameP(r, (frameI - 1 + r.n) % r.n))); refresh(); };
$('tofloor').onclick = () => { const P = curP(); P.lift = r2((P.lift || 0) + FLOOR - LOW);
  if (P.legs) for (const s of Object.keys(P.legs)) P.legs[s][2] = r2(P.legs[s][2] + FLOOR - LOW);     // (placed ankles are world positions: they go with it)
  setP(P); refresh(); };
$('reset').onclick = () => { const r = row(); if (EDITS[r.name]) { delete EDITS[r.name][frameI]; save(); } refresh(); };
$('clearrow').onclick = () => { if (confirm(`Reset every frame of ${row().name} to the script's?`)) { delete EDITS[row().name]; save(); refresh(); } };
for (const s of 'ab') $('free' + s).onclick = () => { const P = curP(); if (P.hands) { delete P.hands[s]; if (!Object.keys(P.hands).length) delete P.hands; } setP(P); refresh(); };
let timer = null;
function stop() { if (timer) { clearInterval(timer); timer = null; $('play').classList.remove('on'); } }
$('play').onclick = () => { if (timer) return stop(); $('play').classList.add('on'); timer = setInterval(() => step(1), 1000 / (row().fps || 10)); };
$('onion').onclick = () => { ghost.visible = !ghost.visible; $('onion').classList.toggle('on', ghost.visible); refresh(); };
$('download').onclick = () => {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(EDITS, null, 1)], { type: 'application/json' }));
  a.download = `${FIG}-poses.json`; a.click();
};
addEventListener('keydown', (ev) => {
  if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'SELECT') return;
  if (ev.key === 'ArrowLeft') { stop(); step(-1); } else if (ev.key === 'ArrowRight') { stop(); step(1); } else if (ev.key === ' ') { ev.preventDefault(); $('play').click(); } else if (ev.key === 'o' || ev.key === 'O') $('onion').click();
});

// views: flat ones to pose by, and the sprite's own angle (its eight facings: the camera goes round instead of the figure)
const VIEWS = { side: [-1, 0, 0], front: [0, -1, 0], 'other side': [1, 0, 0], back: [0, 1, 0], top: [0, -0.001, 1] };
function look(dir) { const d = new THREE.Vector3(...dir).normalize(); cam.position.copy(TGT).addScaledVector(d, 300); controls.target.copy(TGT); cam.lookAt(TGT); controls.update(); }
function sprite(f) {
  const a60 = Math.PI / 3, a45 = Math.PI / 4;
  const back = new THREE.Vector3(Math.sin(a60) * Math.sin(a45), -Math.sin(a60) * Math.cos(a45), Math.cos(a60));
  back.applyAxisAngle(PZ, -(45 - 45 * f) * Math.PI / 180); look(back.toArray());
}
for (const k of Object.keys(VIEWS)) { const b = document.createElement('button'); b.textContent = k; b.onclick = () => look(VIEWS[k]); $('views').appendChild(b); }
['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'].forEach((nm, f) => { const b = document.createElement('button'); b.textContent = nm; b.title = 'the sprite camera, facing ' + nm; b.onclick = () => sprite(f); $('facings').appendChild(b); });

function status(low) {
  const under = FLOOR - low, nE = Object.values(EDITS).reduce((a, r) => a + Object.keys(r).length, 0);
  $('status').innerHTML = `${row().name} ${frameI}/${row().n - 1}${edited(row(), frameI) ? '  (yours)' : ''}   ` +
    (under > 0.6 ? `<b class="warn">${under.toFixed(1)} under the floor</b>` : 'on the floor') +
    `   parity with Blender ${parity < 1e-3 ? '<b class="ok">' + parity.toExponential(1) + '</b>' : '<b class="warn">' + parity.toExponential(1) + '</b>'}   frames set: ${nE}`;
}
$('fig').textContent = FIG;
$('msg').textContent = 'What you set stays in this browser. When a row looks right, say so: the seat reads it from this page (or download it), writes tools/' + FIG + '-poses.json, and renders.';

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight, s = VIEW_S, a = w / h;
  renderer.setSize(w, h, false); cam.left = -s * a; cam.right = s * a; cam.top = s; cam.bottom = -s; cam.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();
look(VIEWS.side);
(function loop() { renderer.render(scene, cam); requestAnimationFrame(loop); })();
refresh();
window.POSER = { D, rig, edits: () => EDITS, parity: () => parity, frameP: (r, i) => frameP(D.rows.find((x) => x.name === r), i), take: () => JSON.stringify(EDITS) };
