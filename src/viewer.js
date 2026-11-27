// Renwick 3D jersey viewer.
// Source file. Build with:  npx esbuild src/viewer.js --bundle --minify --format=iife --outfile=assets/js/viewer.min.js
//
// Markup it expects:
// <div data-jersey-viewer
//      data-front="assets/3d/front.webp" data-back="assets/3d/back.webp" data-height="assets/3d/height.png"
//      data-model="">                         <- optional: path to a real .glb jersey model (not included)
//   <canvas> is created inside [data-stage]; buttons use [data-view="front|side|back"], [data-act="reset|zoom-in|zoom-out|spin"]
// </div>
//
// With no data-model, the jersey is built from a heightmap: two sculpted surfaces (front + back)
// shaped from the real jersey silhouette and wrapped with the real front and back artwork.

import {
  WebGLRenderer, Scene, PerspectiveCamera, BufferGeometry, Float32BufferAttribute, Mesh, MeshStandardMaterial,
  TextureLoader, LoadingManager, SRGBColorSpace, HemisphereLight, DirectionalLight, Group, PlaneGeometry,
  MeshBasicMaterial, CanvasTexture, Vector3, Box3, Spherical, MathUtils, FrontSide, LinearMipmapLinearFilter
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const VIEWS = { front: 0, side: Math.PI / 2, back: Math.PI };
const DEFAULT_POLAR = Math.PI / 2 - 0.06;

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

function loadImageData(url, onDone, onErr) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    onDone(x.getImageData(0, 0, img.width, img.height));
  };
  img.onerror = onErr;
  img.src = url;
}

// Two sculpted surfaces from a heightmap. Width 2 units, depth = puff * height value.
function buildJersey(hm, texFront, texBack) {
  const GW = hm.width, GH = hm.height, d = hm.data;
  const W = 2, H = 2 * GH / GW, PUFF = 0.3;
  const h = new Float32Array(GW * GH), m = new Uint8Array(GW * GH);
  for (let i = 0; i < GW * GH; i++) { h[i] = d[i * 4] / 255; m[i] = d[i * 4 + 1] > 0 ? 1 : 0; }

  function surface(sign) {
    const pos = [], uv = [], idx = [];
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      const u = i / (GW - 1), v = j / (GH - 1), k = j * GW + i;
      pos.push((u - 0.5) * W, (0.5 - v) * H, sign * h[k] * PUFF);
      uv.push(sign > 0 ? u : 1 - u, 1 - v);
    }
    for (let j = 0; j < GH - 1; j++) for (let i = 0; i < GW - 1; i++) {
      const a = j * GW + i, b = a + 1, c = a + GW, e = c + 1;
      if (!(m[a] | m[b] | m[c] | m[e])) continue; // outside the silhouette
      if (sign > 0) idx.push(a, c, b, b, c, e); else idx.push(a, b, c, b, e, c);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  const mat = (map) => new MeshStandardMaterial({ map, alphaTest: 0.5, roughness: 0.82, metalness: 0, side: FrontSide });
  const grp = new Group();
  grp.add(new Mesh(surface(1), mat(texFront)));
  grp.add(new Mesh(surface(-1), mat(texBack)));
  grp.userData.size = new Vector3(W, H, PUFF * 2);
  return grp;
}

function shadowPlane() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 2, 64, 64, 62);
  g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const m = new Mesh(new PlaneGeometry(2.4, 0.9), new MeshBasicMaterial({ map: new CanvasTexture(c), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

function init(root) {
  const stage = root.querySelector('[data-stage]');
  const bar = root.querySelector('[data-progress]');
  const pct = root.querySelector('[data-pct]');
  const say = (state) => { root.dataset.state = state; };
  const views = root.querySelectorAll('[data-view]');
  const mark = (name) => views.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === name)));

  // ---------- fallback: flat photos, buttons still switch views
  function fallback(reason) {
    say('fallback');
    root.dataset.reason = reason || '';
    const img = root.querySelector('[data-fallback] img');
    const src = { front: root.dataset.fbFront, side: root.dataset.fbSide, back: root.dataset.fbBack };
    views.forEach((b) => b.onclick = () => { if (img && src[b.dataset.view]) img.src = src[b.dataset.view]; mark(b.dataset.view); });
    mark('front');
  }
  if (!webglOK()) return fallback('no-webgl');

  say('loading');
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  let renderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: small ? 'low-power' : 'high-performance' });
  } catch (e) { return fallback('context'); }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.75 : 2));
  renderer.outputColorSpace = SRGBColorSpace;
  stage.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D jersey. Drag to rotate.');
  renderer.domElement.setAttribute('role', 'img');

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 100);
  scene.add(new HemisphereLight(0xffffff, 0x1b1f33, 1.25));
  const key = new DirectionalLight(0xffd2b3, 2.2); key.position.set(3, 4, 5); scene.add(key);
  const rim = new DirectionalLight(0x3d66ff, 1.7); rim.position.set(-5, 2, -1.5); scene.add(rim);
  const fill = new DirectionalLight(0xffffff, 0.8); fill.position.set(-3, 1, 4); scene.add(fill);
  const backKey = new DirectionalLight(0xffe2cc, 1.2); backKey.position.set(2, 3, -5); scene.add(backKey);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false; controls.rotateSpeed = 0.85; controls.zoomSpeed = 0.9;
  controls.minPolarAngle = Math.PI / 2 - 0.55; controls.maxPolarAngle = Math.PI / 2 + 0.45;
  controls.autoRotate = true; controls.autoRotateSpeed = 1.6;

  // wheel zoom only once the viewer is "active" (clicked), so page scrolling never gets trapped
  let active = false;
  const setActive = (v) => { active = v; root.classList.toggle('is-active', v); };
  renderer.domElement.addEventListener('wheel', (e) => { if (!active) e.stopImmediatePropagation(); }, { capture: true });
  renderer.domElement.addEventListener('pointerdown', () => setActive(true));
  document.addEventListener('pointerdown', (e) => { if (!root.contains(e.target)) setActive(false); });

  let dirty = true, anim = null, firstTouch = false;
  controls.addEventListener('change', () => { dirty = true; });
  controls.addEventListener('start', () => {
    anim = null; controls.autoRotate = false;
    if (!firstTouch) { firstTouch = true; root.classList.add('touched'); }
    syncSpin();
  });

  const target = new Vector3();
  let baseDist = 7;
  function fit(obj) {
    const box = new Box3().setFromObject(obj), size = box.getSize(new Vector3()), c = box.getCenter(new Vector3());
    obj.position.sub(c); // centre on origin
    const fov = MathUtils.degToRad(camera.fov);
    const fitH = size.y / 2 / Math.tan(fov / 2), fitW = size.x / 2 / Math.tan(fov / 2) / camera.aspect;
    baseDist = Math.max(fitH, fitW) * 1.18 + size.z / 2;
    controls.minDistance = baseDist * 0.5; controls.maxDistance = baseDist * 1.5;
    const sh = shadowPlane(); sh.scale.setScalar(size.x / 2); sh.position.y = -size.y / 2 - 0.05; scene.add(sh);
  }
  function setCam(theta, polar, dist) {
    const s = new Spherical(dist, polar, theta);
    camera.position.setFromSpherical(s).add(target); camera.lookAt(target); dirty = true;
  }
  function goTo(theta, dist) {
    const s = new Spherical().setFromVector3(camera.position.clone().sub(target));
    let dT = theta - s.theta; dT = Math.atan2(Math.sin(dT), Math.cos(dT));
    anim = { t0: performance.now(), dur: 650, from: { th: s.theta, ph: s.phi, r: s.radius }, to: { th: s.theta + dT, ph: DEFAULT_POLAR, r: dist ?? s.radius } };
  }
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  function resize() {
    const r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); dirty = true;
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) loop(); }, { threshold: 0.01 }).observe(stage);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });

  let raf = 0;
  function loop() {
    if (raf) return;
    const tick = () => {
      raf = 0;
      if (!visible || document.hidden) return;
      if (anim) {
        const t = Math.min(1, (performance.now() - anim.t0) / anim.dur), k = ease(t);
        setCam(anim.from.th + (anim.to.th - anim.from.th) * k, anim.from.ph + (anim.to.ph - anim.from.ph) * k, anim.from.r + (anim.to.r - anim.from.r) * k);
        if (t >= 1) anim = null;
      }
      controls.update();
      if (dirty) { renderer.render(scene, camera); dirty = false; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  // ---------- controls UI
  function syncSpin() {
    const b = root.querySelector('[data-act="spin"]');
    if (b) b.setAttribute('aria-pressed', String(controls.autoRotate));
  }
  views.forEach((b) => b.addEventListener('click', () => { controls.autoRotate = false; syncSpin(); goTo(VIEWS[b.dataset.view]); mark(b.dataset.view); root.classList.add('touched'); }));
  root.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
    const a = b.dataset.act, s = new Spherical().setFromVector3(camera.position.clone().sub(target));
    if (a === 'reset') { controls.autoRotate = false; goTo(0, baseDist); mark('front'); }
    if (a === 'zoom-in') goTo(s.theta, Math.max(controls.minDistance, s.radius * 0.8));
    if (a === 'zoom-out') goTo(s.theta, Math.min(controls.maxDistance, s.radius * 1.25));
    if (a === 'spin') controls.autoRotate = !controls.autoRotate;
    syncSpin(); root.classList.add('touched'); dirty = true;
  }));
  // which view are we closest to? (keeps the FRONT/SIDE/BACK labels honest while dragging)
  controls.addEventListener('change', () => {
    const th = new Spherical().setFromVector3(camera.position.clone().sub(target)).theta;
    const a = Math.abs(Math.atan2(Math.sin(th), Math.cos(th)));
    mark(a < 0.6 ? 'front' : a > 2.5 ? 'back' : 'side');
  });

  // ---------- load
  const mgr = new LoadingManager();
  mgr.onProgress = (_, done, total) => { const p = Math.round(done / total * 100); if (bar) bar.style.transform = `scaleX(${p / 100})`; if (pct) pct.textContent = p + '%'; };
  const ready = (obj) => {
    scene.add(obj); fit(obj); setCam(-0.5, DEFAULT_POLAR, baseDist * 1.06); goTo(0, baseDist);
    say('ready'); mark('front'); syncSpin(); loop();
  };
  const procedural = () => {
    const tl = new TextureLoader(mgr);
    const prep = (t) => { t.colorSpace = SRGBColorSpace; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); t.minFilter = LinearMipmapLinearFilter; return t; };
    let front, back, hm, failed = false;
    const fail = () => { if (!failed) { failed = true; renderer.dispose(); renderer.domElement.remove(); fallback('load'); } };
    const go = () => { if (front && back && hm && !failed) ready(buildJersey(hm, front, back)); };
    mgr.itemStart('height');
    loadImageData(root.dataset.height, (d) => { hm = d; mgr.itemEnd('height'); go(); }, () => { mgr.itemError('height'); fail(); });
    tl.load(root.dataset.front, (t) => { front = prep(t); go(); }, undefined, fail);
    tl.load(root.dataset.back, (t) => { back = prep(t); go(); }, undefined, fail);
  };
  if (root.dataset.model) {
    new GLTFLoader(mgr).load(root.dataset.model, (g) => {
      const box = new Box3().setFromObject(g.scene), s = 2 / Math.max(...box.getSize(new Vector3()).toArray());
      g.scene.scale.setScalar(s); ready(g.scene);
    }, undefined, () => { console.warn('[renwick] model failed, using built-in jersey'); procedural(); });
  } else procedural();
}

function boot() {
  document.querySelectorAll('[data-jersey-viewer]').forEach((root) => {
    // start loading only when the viewer is about to come on screen
    const io = new IntersectionObserver((es) => {
      if (es[0].isIntersecting) { io.disconnect(); init(root); }
    }, { rootMargin: '400px 0px' });
    io.observe(root);
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
