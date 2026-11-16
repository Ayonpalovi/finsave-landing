/* Hero wave: ribbed green hills that roll continuously (sine-driven, so it never
   "restarts"), plus a white light that follows the cursor. Canvas 2D, no libraries. */
(function () {
  var canvas = document.getElementById("hero-wave");
  var hero = document.getElementById("home");
  var spot = document.getElementById("hero-spot");
  if (!canvas || !hero || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var W = 0, H = 0, dpr = 1;
  function resize() {
    var r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Two layers of hills. Every term is a sine of time, so motion is an endless wave.
  var TAU = Math.PI * 2;
  var layers = [
    { base: 0.42, amp: [0.13, 0.07, 0.03], freq: [0.9, 2.1, 3.7], speed: [0.22, -0.31, 0.47], phase: [0.6, 2.2, 4.1], alpha: 0.38, spread: 1.15, gap: 12, width: 4 },
    { base: 0.56, amp: [0.17, 0.09, 0.04], freq: [1.1, 2.4, 4.3], speed: [-0.27, 0.38, -0.55], phase: [3.1, 0.4, 1.7], alpha: 1.0,  spread: 1.45, gap: 10, width: 6 }
  ];
  function crest(L, u, t) {
    var y = L.base;
    for (var k = 0; k < 3; k++) y -= L.amp[k] * Math.sin(u * TAU * L.freq[k] + t * L.speed[k] + L.phase[k]);
    return y; // 0 = top of canvas, 1 = bottom
  }

  // Cursor light (canvas coordinates), eased so it glides
  var mouse = { x: 0, y: 0, tx: 0, ty: 0, a: 0, ta: 0 };
  function onMove(e) {
    var cr = canvas.getBoundingClientRect();
    mouse.tx = e.clientX - cr.left; mouse.ty = e.clientY - cr.top; mouse.ta = 1;
    if (mouse.a < 0.02) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
    if (spot) {   // page-wide light follows the cursor everywhere
      spot.style.setProperty("--mx", e.clientX + "px");
      spot.style.setProperty("--my", e.clientY + "px");
      spot.classList.add("is-on");
    }
  }
  function onLeave() { mouse.ta = 0; if (spot) spot.classList.remove("is-on"); }
  if (window.matchMedia("(hover: hover)").matches) {
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = "round";
    for (var li = 0; li < layers.length; li++) {
      var L = layers[li];
      var n = Math.ceil((W * 1.3) / L.gap);
      ctx.lineWidth = L.width;
      for (var i = 0; i <= n; i++) {
        var u = -0.15 + 1.3 * (i / n);
        var x = u * W;
        var y = crest(L, u, t) * H;
        // Light from the upper left: slopes facing it are brighter
        var slope = (crest(L, u + 0.01, t) - crest(L, u - 0.01, t)) * 22;
        var light = Math.max(0.25, Math.min(1, 0.62 + slope));
        var bx = W / 2 + (x - W / 2) * L.spread;   // strands fan out toward the viewer
        var g = ctx.createLinearGradient(0, y, 0, H);
        g.addColorStop(0, "rgba(150,255,200," + (light * L.alpha).toFixed(3) + ")");
        g.addColorStop(0.12, "rgba(40,220,140," + (0.95 * light * L.alpha).toFixed(3) + ")");
        g.addColorStop(0.55, "rgba(0,140,100," + (0.6 * light * L.alpha).toFixed(3) + ")");
        g.addColorStop(1, "rgba(0,70,55," + (0.12 * L.alpha).toFixed(3) + ")");
        ctx.strokeStyle = g;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + (bx - x) * 0.12, y + (H - y) * 0.55, bx, H + 4);
        ctx.stroke();
      }
    }
    // White light on the strands near the cursor
    mouse.x += (mouse.tx - mouse.x) * 0.14; mouse.y += (mouse.ty - mouse.y) * 0.14;
    mouse.a += (mouse.ta - mouse.a) * 0.08;
    if (mouse.a > 0.01) {
      var R = 240;
      var rg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, R);
      rg.addColorStop(0, "rgba(255,255,255," + (0.95 * mouse.a).toFixed(3) + ")");
      rg.addColorStop(0.5, "rgba(255,255,255," + (0.4 * mouse.a).toFixed(3) + ")");
      rg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = rg;
      ctx.fillRect(mouse.x - R, mouse.y - R, R * 2, R * 2);
      ctx.globalCompositeOperation = "source-over";
    }
  }

  var running = false, visible = true, raf = 0, start = performance.now();
  function frame(now) {
    if (!running) return;
    draw((now - start) / 1000);
    raf = requestAnimationFrame(frame);
  }
  function setRunning(on) {
    if (reduce) return;
    if (on && !running) { running = true; raf = requestAnimationFrame(frame); }
    else if (!on && running) { running = false; cancelAnimationFrame(raf); }
  }

  resize();
  draw(reduce ? 4 : 0);
  window.addEventListener("resize", function () { resize(); if (!running) draw(4); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; setRunning(visible && !document.hidden); }).observe(hero);
  }
  document.addEventListener("visibilitychange", function () { setRunning(visible && !document.hidden); });
  setRunning(true);
})();
