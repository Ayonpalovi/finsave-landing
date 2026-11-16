/* Features section: a glowing 3D piggy bank on a hologram platform (three.js).
   A coin drops into the slot on a loop; the scene "opens up" when scrolled into view.
   Also draws the connector lines from each card to the pig and triggers the card entrance. */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const stage = document.getElementById("feat-stage");
const canvas = document.getElementById("feat-canvas");
const linesSvg = document.getElementById("feat-lines");
if (stage && canvas) init();

function init() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Renderer ---------- */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) {
    stage.classList.add("no-webgl");
    setupEntrance(null);
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0.9, 8.2);
  camera.lookAt(0, 0.05, 0);

  /* ---------- Lights ---------- */
  scene.add(new THREE.AmbientLight(0x2fe0b0, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 5, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x8fffe0, 2.2);
  rim.position.set(-5, 3, -4);
  scene.add(rim);
  const up = new THREE.PointLight(0x2fe0b0, 18, 8, 1.6);
  up.position.set(0, -1.4, 0.6);
  scene.add(up);

  /* ---------- Piggy bank ---------- */
  const pigMat = new THREE.MeshPhysicalMaterial({
    color: 0x22c99a, emissive: 0x00523f, emissiveIntensity: 0.55,
    roughness: 0.3, metalness: 0.05, clearcoat: 0.7, clearcoatRoughness: 0.2
  });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x062019, roughness: 0.6 });

  const pig = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), pigMat);
  body.scale.set(1.35, 1.05, 1.05);
  pig.add(body);

  // Fresnel rim glow around the body (hologram feel)
  const glowMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(0x2fe0b0) }, uStrength: { value: 0 } },
    vertexShader: `
      varying float vRim;
      void main() {
        vec3 n = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vRim = pow(1.0 - abs(dot(n, normalize(-mv.xyz))), 2.4);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor; uniform float uStrength; varying float vRim;
      void main() { gl_FragColor = vec4(uColor, vRim * uStrength); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide
  });
  const glow = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), glowMat);
  glow.scale.set(1.35 * 1.12, 1.05 * 1.12, 1.05 * 1.12);
  pig.add(glow);

  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.37, 0.32, 40), pigMat);
  snout.rotation.z = Math.PI / 2;
  snout.position.set(1.36, 0.02, 0);
  pig.add(snout);
  [-0.11, 0.11].forEach((z) => {
    const n = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), darkMat);
    n.scale.set(0.5, 1.2, 1);
    n.position.set(1.525, 0.02, z);
    pig.add(n);
  });
  [-0.43, 0.43].forEach((z) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 16), darkMat);
    eye.position.set(1.0, 0.4, z);
    pig.add(eye);
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.32, 28), pigMat);
    ear.scale.set(1, 1, 0.45);
    ear.position.set(0.72, 0.9, z * 0.92);
    ear.rotation.set(z > 0 ? 0.45 : -0.45, 0, -0.5);
    pig.add(ear);
  });
  [[0.68, 0.45], [0.68, -0.45], [-0.68, 0.45], [-0.68, -0.45]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.48, 28), pigMat);
    leg.position.set(x, -0.9, z);
    pig.add(leg);
  });
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.04, 12, 32, Math.PI * 1.6), pigMat);
  tail.position.set(-1.42, 0.22, 0);
  tail.rotation.y = Math.PI / 2;
  pig.add(tail);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.13), darkMat);
  slot.position.set(-0.05, 1.035, 0);
  pig.add(slot);

  // Coin (pale mint metal, like the white coin in the logo)
  const coinMat = new THREE.MeshStandardMaterial({ color: 0xe9fff7, metalness: 0.75, roughness: 0.22, emissive: 0x1a5f50, emissiveIntensity: 0.35 });
  const coin = new THREE.Group();
  const coinBody = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.07, 56), coinMat);
  coinBody.rotation.x = Math.PI / 2;
  coin.add(coinBody);
  const coinRim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.018, 10, 48), coinMat);
  coinRim.position.z = 0.04;
  coin.add(coinRim);
  coin.position.set(-0.05, 2.2, 0);
  pig.add(coin);

  const pigRoot = new THREE.Group();   // handles intro rise + mouse tilt
  pigRoot.add(pig);
  pig.rotation.y = -0.5;               // 3/4 view, snout toward the viewer
  scene.add(pigRoot);

  /* ---------- Hologram platform ---------- */
  const PLATFORM_Y = -1.45;
  const platform = new THREE.Group();
  platform.position.y = PLATFORM_Y;
  scene.add(platform);

  function radialTexture(stops) {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    stops.forEach(([o, col]) => grd.addColorStop(o, col));
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const add = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide };

  const disc = new THREE.Mesh(new THREE.CircleGeometry(2.2, 64), new THREE.MeshBasicMaterial({
    map: radialTexture([[0, "rgba(140,255,215,0.95)"], [0.25, "rgba(47,224,176,0.55)"], [0.6, "rgba(0,125,108,0.18)"], [1, "rgba(0,0,0,0)"]]), ...add
  }));
  disc.rotation.x = -Math.PI / 2;
  platform.add(disc);

  const rings = [];
  [[0.9, 0.025, 0.9], [1.35, 0.02, 0.6], [1.85, 0.015, 0.4], [2.3, 0.01, 0.25]].forEach(([r, w, o], i) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(r - w, r + w, 128), new THREE.MeshBasicMaterial({ color: 0x5dffd0, opacity: o, ...add }));
    m.rotation.x = -Math.PI / 2;
    m.userData = { base: o, i };
    platform.add(m); rings.push(m);
  });

  // Vertical light beam from the platform
  const beamTex = (() => {
    const c = document.createElement("canvas"); c.width = 4; c.height = 256;
    const g = c.getContext("2d"); const grd = g.createLinearGradient(0, 256, 0, 0);
    grd.addColorStop(0, "rgba(90,255,210,0.35)"); grd.addColorStop(0.35, "rgba(47,224,176,0.08)"); grd.addColorStop(0.75, "rgba(47,224,176,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.55, 2.4, 64, 1, true), new THREE.MeshBasicMaterial({ map: beamTex, opacity: 0.8, ...add }));
  beam.position.y = 1.2;
  platform.add(beam);

  // Rising particles
  const P = 180;
  const pPos = new Float32Array(P * 3), pSpeed = new Float32Array(P);
  for (let i = 0; i < P; i++) {
    const a = Math.random() * Math.PI * 2, r = 0.3 + Math.random() * 1.7;
    pPos[i * 3] = Math.cos(a) * r; pPos[i * 3 + 1] = Math.random() * 3.6; pPos[i * 3 + 2] = Math.sin(a) * r;
    pSpeed[i] = 0.15 + Math.random() * 0.45;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    size: 0.05, map: radialTexture([[0, "rgba(255,255,255,1)"], [0.3, "rgba(140,255,215,0.8)"], [1, "rgba(0,0,0,0)"]]),
    color: 0xbfffee, opacity: 0.9, ...add
  });
  const particles = new THREE.Points(pGeo, pMat);
  platform.add(particles);

  /* ---------- Sizing ---------- */
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep the whole pig + platform in frame whatever the canvas shape
    camera.position.z = Math.max(9, 7.4 / Math.min(1, camera.aspect));
    camera.position.y = 1.0;
    camera.lookAt(0, -0.1, 0);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(() => { resize(); drawLines(); render(lastT); }).observe(canvas);
  resize();

  /* ---------- Interaction ---------- */
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  if (window.matchMedia("(hover: hover)").matches) {
    stage.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect();
      tilt.ty = ((e.clientX - r.left) / r.width - 0.5) * 0.6;
      tilt.tx = ((e.clientY - r.top) / r.height - 0.5) * 0.25;
    });
    stage.addEventListener("pointerleave", () => { tilt.tx = 0; tilt.ty = 0; });
  }

  /* ---------- Animation ---------- */
  const easeOutBack = (x) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  let introStart = -1, lastT = 0;

  function render(t) {
    lastT = t;
    const k = introStart < 0 ? 0 : clamp01((t - introStart) / 1.6);       // overall intro 0..1
    const kPlat = easeOut(clamp01(k / 0.55));                               // platform first
    const kPig = easeOutBack(clamp01((k - 0.2) / 0.8));                     // then the pig pops up

    platform.scale.setScalar(0.001 + kPlat);
    disc.material.opacity = kPlat;
    beam.material.opacity = 0.4 * kPlat * (0.85 + 0.15 * Math.sin(t * 2.1));
    pMat.opacity = 0.9 * kPlat;
    rings.forEach((m) => {
      const pulse = 0.75 + 0.25 * Math.sin(t * 1.6 - m.userData.i * 0.9);
      m.material.opacity = m.userData.base * pulse * kPlat;
      m.rotation.z = t * (m.userData.i % 2 ? -0.15 : 0.2);
    });
    const pos = pGeo.attributes.position.array;
    for (let i = 0; i < P; i++) {
      pos[i * 3 + 1] += pSpeed[i] * 0.012;
      if (pos[i * 3 + 1] > 3.6) pos[i * 3 + 1] = 0;
    }
    pGeo.attributes.position.needsUpdate = true;

    tilt.x += (tilt.tx - tilt.x) * 0.06; tilt.y += (tilt.ty - tilt.y) * 0.06;
    pigRoot.scale.setScalar(Math.max(0.001, kPig) * 0.8);
    pigRoot.position.y = -0.55 * (1 - Math.min(1, kPig)) + 0.08 * Math.sin(t * 1.3) * Math.min(1, kPig) + 0.12;
    pigRoot.rotation.y = 0.18 * Math.sin(t * 0.5) + tilt.y;
    pigRoot.rotation.x = tilt.x;
    glowMat.uniforms.uStrength.value = 1.1 * Math.min(1, kPig) * (0.85 + 0.15 * Math.sin(t * 2.4));
    up.intensity = 18 * kPlat;

    // Coin drop loop (3.4 s): appear above, fall into the slot, disappear inside
    const c = ((t - (introStart < 0 ? 0 : introStart) - 1.4) % 3.4 + 3.4) % 3.4;
    if (k < 1) { coin.visible = false; }
    else {
      coin.visible = true;
      if (c < 0.6) {            // appear + hover
        const a = easeOut(c / 0.6);
        coin.scale.setScalar(a); coin.position.y = 2.05 + 0.1 * (1 - a);
      } else if (c < 1.6) {     // hover, slight wobble
        coin.scale.setScalar(1); coin.position.y = 2.05 + 0.04 * Math.sin((c - 0.6) * 6);
      } else if (c < 2.2) {     // fall into slot
        const f = (c - 1.6) / 0.6;
        coin.position.y = 2.05 - (2.05 - 0.75) * f * f;
      } else {                  // inside the pig
        coin.visible = false;
      }
      coin.rotation.z = 0.12 * Math.sin(t * 3);
    }

    renderer.render(scene, camera);
  }

  /* ---------- Loop, only while visible ---------- */
  let running = false, raf = 0;
  const t0 = performance.now();
  function frame(now) {
    if (!running) return;
    render((now - t0) / 1000);
    raf = requestAnimationFrame(frame);
  }
  function setRunning(on) {
    if (on && !running && !reduce) { running = true; raf = requestAnimationFrame(frame); }
    else if (!on && running) { running = false; cancelAnimationFrame(raf); }
  }
  let inView = false;
  new IntersectionObserver((entries) => {
    inView = entries[0].isIntersecting;
    setRunning(inView && !document.hidden);
  }, { threshold: 0.05 }).observe(stage);
  document.addEventListener("visibilitychange", () => setRunning(inView && !document.hidden));

  setupEntrance(() => {
    if (introStart < 0) introStart = (performance.now() - t0) / 1000;
    if (reduce) { introStart = -100; render(4); }
  });
  render(0);
}

/* ---------- Card entrance + connector lines ---------- */
function setupEntrance(onEnter) {
  const fire = () => {
    stage.classList.add("is-in");
    drawLines();
    if (onEnter) onEnter();
  };
  if (!("IntersectionObserver" in window)) { fire(); return; }
  const io = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) { fire(); io.disconnect(); }
  }, { threshold: 0.3 });
  io.observe(stage);
  window.addEventListener("resize", drawLines);
}

function drawLines() {
  if (!linesSvg) return;
  const sr = stage.getBoundingClientRect();
  linesSvg.setAttribute("viewBox", `0 0 ${sr.width} ${sr.height}`);
  if (window.innerWidth < 960) { linesSvg.innerHTML = ""; return; }
  const cx = sr.width / 2, cy = sr.height * 0.46;
  let html = "";
  stage.querySelectorAll(".feat-card").forEach((card, i) => {
    // Layout position (offset*), so the entrance transform doesn't skew the lines
    const left = card.dataset.side === "left";
    const sx = left ? card.offsetLeft + card.offsetWidth : card.offsetLeft;
    const sy = card.offsetTop + card.offsetHeight / 2;
    const elbow = sx + (left ? 46 : -46);
    const ex = cx + (left ? -1 : 1) * Math.min(150, sr.width * 0.11);
    const ey = cy + (sy < cy ? -60 : 70);
    const d = `M ${sx} ${sy} H ${elbow} L ${ex} ${ey}`;
    const delay = (0.35 + i * 0.1).toFixed(2);
    html += `<path class="feat-line" d="${d}" pathLength="1" style="--d:${delay}s"/>` +
            `<circle class="feat-dot" cx="${sx}" cy="${sy}" r="3.5" style="--d:${delay}s"/>` +
            `<circle class="feat-dot feat-dot-end" cx="${ex}" cy="${ey}" r="2.5" style="--d:${(+delay + 0.6).toFixed(2)}s"/>`;
  });
  linesSvg.innerHTML = html;
}
