/* =========================================================
   BLACK CIGAR FESTIVAL — interactions
   Journey: SMOKE → LIT END → WRAPPER → BINDER → FILLER
   • scroll-driven pinned stage (igloo.inc-style)
   • smoke + ember particle canvases
   • auto-upgrades to AI-generated images in ./images/ if present
   ========================================================= */
(function () {
  "use strict";

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- nav ---------- */
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.querySelector(".nav__links");
  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 40);
  }, { passive: true });
  if (navToggle) {
    navToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      navToggle.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", String(open));
    });
    navLinks.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        navLinks.classList.remove("open");
        navToggle.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    },
    { threshold: 0.16 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ---------- AI image auto-wiring ----------
     Drop generated files into ./images/ and they take over:
       smoke.png     → smoke overlay
       lit-end.png   → ember disc face
       wrapper.png   → wrapper ring texture
       binder.png    → binder ring texture
       filler.png    → filler core photo
  ------------------------------------------------ */
  function wireImage(src, apply) {
    const img = new Image();
    img.onload = () => apply(src);
    img.src = src;
  }
  wireImage("images/smoke.png", (s) => {
    const el = document.getElementById("smokeImg");
    el.style.backgroundImage = `url(${s})`; el.classList.add("has-img");
  });
  wireImage("images/lit-end.png", (s) => {
    const el = document.querySelector(".emberdisc__coal");
    el.style.backgroundImage = `url(${s})`; el.classList.add("has-img");
  });
  wireImage("images/wrapper.png", (s) => {
    const el = document.querySelector(".ring--wrapper");
    el.style.backgroundImage = `url(${s})`; el.classList.add("has-img");
  });
  wireImage("images/binder.png", (s) => {
    const el = document.querySelector(".ring--binder");
    el.style.backgroundImage = `url(${s})`; el.classList.add("has-img");
  });
  wireImage("images/filler.png", (s) => {
    const scene = document.querySelector(".scene--filler");
    document.getElementById("fillerPhoto").style.backgroundImage = `url(${s})`;
    scene.classList.add("has-img");
  });
  let footFrac = 0.925; // where the lit foot sits (x-fraction) — SVG default
  wireImage("images/hero-cigar.png", (s) => {
    const scene = document.querySelector(".scene--cigar");
    document.getElementById("cigarPhoto").style.backgroundImage = `url(${s})`;
    scene.classList.add("has-img");
    footFrac = 0.82; // lit foot position in the generated photo
  });
  // lounge cards: images/lounge-1.png … lounge-3.png
  document.querySelectorAll(".lounge__img").forEach((el, i) => {
    wireImage(`images/lounge-${i + 1}.png`, (s) => {
      el.style.background = `center / cover no-repeat url(${s})`;
      el.classList.add("has-img");
      el.style.setProperty("--hide-label", "1");
    });
  });

  /* ---------- build filler leaves (procedural fallback) ---------- */
  const bundle = document.getElementById("fillerBundle");
  if (bundle) {
    const N = 48;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < N; i++) {
      const leaf = document.createElement("span");
      leaf.className = "leaf";
      const w = 26 + Math.random() * 26;
      const h = w * (2.4 + Math.random() * 1.2);
      leaf.style.setProperty("--w", w + "px");
      leaf.style.setProperty("--h", h + "px");
      leaf.style.setProperty("--r", Math.random() * 360 + "deg");
      leaf.style.setProperty("--d", Math.random() * 130 + "px");
      leaf.style.filter = `brightness(${0.75 + Math.random() * 0.25})`;
      frag.appendChild(leaf);
    }
    bundle.appendChild(frag);
  }

  /* =========================================================
     SMOKE CANVAS (phase 0)
     ========================================================= */
  const smokeCanvas = document.getElementById("smokeCanvas");
  let smokeDensity = 1; // driven by scroll (fades as we approach the cigar)
  if (smokeCanvas && !prefersReduced) {
    const ctx = smokeCanvas.getContext("2d");
    let W, H, plumes;
    function resize() {
      W = smokeCanvas.width = smokeCanvas.offsetWidth;
      H = smokeCanvas.height = smokeCanvas.offsetHeight;
    }
    function makePlume() {
      return {
        x: W * (0.3 + Math.random() * 0.4),
        y: H + 60 + Math.random() * H * 0.5,
        r: 40 + Math.random() * 110,
        vy: 0.25 + Math.random() * 0.55,
        vx: (Math.random() - 0.5) * 0.35,
        wob: Math.random() * Math.PI * 2,
        wobSpeed: 0.004 + Math.random() * 0.008,
        a: 0.05 + Math.random() * 0.1
      };
    }
    function initSmoke() { plumes = Array.from({ length: 26 }, makePlume); }
    function tickSmoke() {
      ctx.clearRect(0, 0, W, H);
      for (const p of plumes) {
        p.wob += p.wobSpeed;
        p.y -= p.vy;
        p.x += p.vx + Math.sin(p.wob) * 0.5;
        p.r += 0.16;
        if (p.y < -p.r * 1.5) Object.assign(p, makePlume(), { y: H + p.r });
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        const alpha = p.a * smokeDensity;
        g.addColorStop(0, `rgba(216,206,190,${alpha})`);
        g.addColorStop(0.6, `rgba(180,170,155,${alpha * 0.5})`);
        g.addColorStop(1, "rgba(160,150,135,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(tickSmoke);
    }
    resize(); initSmoke(); tickSmoke();
    window.addEventListener("resize", () => { resize(); });
  }

  /* =========================================================
     SCROLL STAGE ENGINE — five phases
       p 0.00–0.16  SMOKE      (drift; cigar emerges through it)
       p 0.12–0.34  LIT END    (zoom to the glowing foot, pass through)
       p 0.32–0.56  WRAPPER    (ring fly-through)
       p 0.54–0.78  BINDER     (ring fly-through)
       p 0.74–1.00  FILLER     (arrive at the core)
     ========================================================= */
  const track = document.querySelector(".scrolltrack");
  const sceneSmoke = document.querySelector(".scene--smoke");
  const sceneEmber = document.querySelector(".scene--ember");
  const sceneCigar = document.querySelector(".scene--cigar");
  const ringWrap = document.querySelector(".ring--wrapper");
  const ringBind = document.querySelector(".ring--binder");
  const sceneFill = document.querySelector(".scene--filler");
  const captions = Array.from(document.querySelectorAll(".caption"));
  const dots = Array.from(document.querySelectorAll(".progress__dot"));
  const scrollHint = document.getElementById("scrollHint");

  let targetP = 0;
  let renderP = 0;

  function computeProgress() {
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const scrollable = track.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    return clamp(-rect.top / scrollable, 0, 1);
  }

  function envelope(t, fadeIn, fadeOut) {
    if (t <= 0 || t >= 1) return 0;
    if (t < fadeIn) return t / fadeIn;
    if (t > fadeOut) return 1 - (t - fadeOut) / (1 - fadeOut);
    return 1;
  }

  const CENTER = "translate(-50%, -50%)";

  function apply(p) {
    if (!sceneCigar) return;

    /* ---- PHASE 0: smoke ---- */
    // dense at start, thins out as the cigar approaches, gone by the ember
    smokeDensity = 1 - seg(p, 0.06, 0.18);
    const smokeOp = 1 - seg(p, 0.1, 0.2);
    sceneSmoke.style.opacity = smokeOp.toFixed(3);
    sceneSmoke.style.transform = `${CENTER} scale(${(1 + seg(p, 0, 0.2) * 0.35).toFixed(3)})`;

    /* ---- cigar: emerges through smoke, then we dive at its lit foot ---- */
    const emerge = seg(p, 0.02, 0.12);           // fade/scale in through smoke
    const dive = seg(p, 0.12, 0.3);              // zoom toward the foot
    const W = sceneCigar.offsetWidth || 1000;
    const cigScale = lerp(0.72, 1, emerge) + dive * 5.2;
    // steer the lit foot toward screen center as we zoom
    const footShift = (footFrac - 0.5) * W * dive * cigScale * 0.42;
    const cigOpacity = emerge * (1 - seg(p, 0.18, 0.26));
    sceneCigar.style.transform =
      `translate(calc(-50% - ${footShift.toFixed(1)}px), -50%) scale(${cigScale.toFixed(3)})`;
    sceneCigar.style.opacity = clamp(cigOpacity, 0, 1).toFixed(3);

    /* ---- PHASE 1: lit end (ember disc) ---- */
    const eT = seg(p, 0.2, 0.4);
    const eScale = 0.1 + eT * 3.6;
    sceneEmber.style.transform = `${CENTER} scale(${eScale.toFixed(3)}) rotate(${(eT * 20).toFixed(1)}deg)`;
    sceneEmber.style.opacity = envelope(eT, 0.22, 0.72).toFixed(3);

    /* ---- PHASE 2: wrapper ring ---- */
    const wT = seg(p, 0.34, 0.58);
    ringWrap.style.transform = `${CENTER} scale(${(0.12 + wT * 3.4).toFixed(3)})`;
    ringWrap.style.opacity = envelope(wT, 0.18, 0.7).toFixed(3);

    /* ---- PHASE 3: binder ring ---- */
    const bT = seg(p, 0.56, 0.8);
    ringBind.style.transform = `${CENTER} scale(${(0.12 + bT * 3.4).toFixed(3)})`;
    ringBind.style.opacity = envelope(bT, 0.18, 0.72).toFixed(3);

    /* ---- PHASE 4: filler core ---- */
    const fT = seg(p, 0.76, 1.0);
    sceneFill.style.transform = `${CENTER} scale(${(0.35 + fT * 1.9).toFixed(3)}) rotate(${(fT * 12).toFixed(2)}deg)`;
    sceneFill.style.opacity = clamp(seg(p, 0.74, 0.86), 0, 1).toFixed(3);

    /* ---- captions ---- */
    let active = -1;
    if (p < 0.1) active = 0;
    else if (p >= 0.16 && p < 0.32) active = 1;
    else if (p >= 0.37 && p < 0.54) active = 2;
    else if (p >= 0.58 && p < 0.76) active = 3;
    else if (p >= 0.8) active = 4;
    captions.forEach((c, i) => c.classList.toggle("is-active", i === active));

    /* ---- progress dots ---- */
    let phase = 0;
    if (p >= 0.8) phase = 4;
    else if (p >= 0.58) phase = 3;
    else if (p >= 0.37) phase = 2;
    else if (p >= 0.16) phase = 1;
    dots.forEach((d, i) => d.classList.toggle("on", i === phase));

    if (scrollHint) scrollHint.classList.toggle("hide", p > 0.02);
  }

  function onScroll() { targetP = computeProgress(); }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  if (prefersReduced) {
    smokeDensity = 0;
    apply(0);
  } else {
    targetP = computeProgress();
    renderP = targetP;
    (function raf() {
      renderP = lerp(renderP, targetP, 0.09);
      if (Math.abs(renderP - targetP) < 0.0002) renderP = targetP;
      apply(renderP);
      requestAnimationFrame(raf);
    })();
  }

  /* =========================================================
     SIGNUP (front-end only — wire to your provider later)
     ========================================================= */
  const form = document.getElementById("signupForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("email");
      const msg = document.getElementById("signupMsg");
      const val = (input.value || "").trim();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      if (!ok) { msg.textContent = "Please enter a valid email."; msg.style.color = "#e07b3c"; return; }
      // {{ EDIT: send `val` to your email service / form endpoint }}
      msg.textContent = "You're on the list — we'll be in touch. 🔥";
      msg.style.color = "#e6c877";
      form.reset();
    });
  }

  /* =========================================================
     EMBER PARTICLES (floating sparks, whole page)
     ========================================================= */
  const canvas = document.getElementById("embers");
  if (canvas && !prefersReduced) {
    const ctx = canvas.getContext("2d");
    let W, H, particles;
    const COUNT = 60;
    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    function make() {
      return {
        x: Math.random() * W,
        y: H + Math.random() * H,
        r: 0.6 + Math.random() * 1.8,
        vy: 0.2 + Math.random() * 0.7,
        vx: (Math.random() - 0.5) * 0.3,
        a: 0.2 + Math.random() * 0.5,
        hue: Math.random() > 0.5 ? "201,162,75" : "224,123,60"
      };
    }
    function init() { particles = Array.from({ length: COUNT }, make); }
    function tick() {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        p.y -= p.vy;
        p.x += p.vx;
        p.a -= 0.0009;
        if (p.y < -10 || p.a <= 0) Object.assign(p, make(), { y: H + 10 });
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.hue},${p.a})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgba(${p.hue},${p.a})`;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      requestAnimationFrame(tick);
    }
    resize(); init(); tick();
    window.addEventListener("resize", () => { resize(); init(); });
  }
})();
