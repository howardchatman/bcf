/* =========================================================
   BLACK CIGAR FESTIVAL — interactions
   • scroll-driven "fly into the cigar" stage
   • ember particle canvas
   • nav, reveals, signup
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

  /* ---------- build filler leaves ---------- */
  const bundle = document.getElementById("fillerBundle");
  if (bundle) {
    const N = 48;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < N; i++) {
      const leaf = document.createElement("span");
      leaf.className = "leaf";
      const w = 26 + Math.random() * 26;
      const h = w * (2.4 + Math.random() * 1.2);
      const r = Math.random() * 360;
      const d = Math.random() * (bundle ? 130 : 130); // radial distance
      leaf.style.setProperty("--w", w + "px");
      leaf.style.setProperty("--h", h + "px");
      leaf.style.setProperty("--r", r + "deg");
      leaf.style.setProperty("--d", d + "px");
      const shade = 0.75 + Math.random() * 0.25;
      leaf.style.filter = `brightness(${shade})`;
      frag.appendChild(leaf);
    }
    bundle.appendChild(frag);
  }

  /* =========================================================
     SCROLL STAGE ENGINE
     ========================================================= */
  const track = document.querySelector(".scrolltrack");
  const sceneCigar = document.querySelector(".scene--cigar");
  const ringWrap = document.querySelector(".ring--wrapper");
  const ringBind = document.querySelector(".ring--binder");
  const sceneFill = document.querySelector(".scene--filler");
  const captions = Array.from(document.querySelectorAll(".caption"));
  const dots = Array.from(document.querySelectorAll(".progress__dot"));
  const scrollHint = document.getElementById("scrollHint");

  let targetP = 0;   // raw scroll progress 0..1
  let renderP = 0;   // smoothed

  function computeProgress() {
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const scrollable = track.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    return clamp(-rect.top / scrollable, 0, 1);
  }

  // envelope: fade in, hold, fade out across a window
  function envelope(t, fadeIn, fadeOut) {
    if (t <= 0 || t >= 1) return 0;
    if (t < fadeIn) return t / fadeIn;
    if (t > fadeOut) return 1 - (t - fadeOut) / (1 - fadeOut);
    return 1;
  }

  const CENTER = "translate(-50%, -50%)";

  function apply(p) {
    if (!sceneCigar) return;

    /* ---- Layer 0: whole cigar ---- */
    const cigT = seg(p, 0.03, 0.22);
    const cigScale = 1 + cigT * 3.0;
    const cigOpacity = 1 - seg(p, 0.11, 0.24);
    const cigRot = -8 * seg(p, 0, 0.22);         // slight turn toward the foot
    sceneCigar.style.transform =
      `${CENTER} rotateY(${cigRot}deg) scale(${cigScale.toFixed(3)})`;
    sceneCigar.style.opacity = clamp(cigOpacity, 0, 1).toFixed(3);

    /* ---- Layer 1: wrapper ring (fly through) ---- */
    const wT = seg(p, 0.15, 0.46);
    const wScale = 0.12 + wT * 3.4;
    ringWrap.style.transform = `${CENTER} scale(${wScale.toFixed(3)})`;
    ringWrap.style.opacity = envelope(wT, 0.18, 0.7).toFixed(3);

    /* ---- Layer 2: binder ring (fly through) ---- */
    const bT = seg(p, 0.43, 0.73);
    const bScale = 0.12 + bT * 3.4;
    ringBind.style.transform = `${CENTER} scale(${bScale.toFixed(3)})`;
    ringBind.style.opacity = envelope(bT, 0.18, 0.72).toFixed(3);

    /* ---- Layer 3: filler core (arrive & settle) ---- */
    const fT = seg(p, 0.68, 1.0);
    const fScale = 0.35 + fT * 1.9;
    // gentle rotation of the bundle as we settle in
    sceneFill.style.transform = `${CENTER} scale(${fScale.toFixed(3)}) rotate(${(fT * 12).toFixed(2)}deg)`;
    // fade in and stay
    sceneFill.style.opacity = clamp(seg(p, 0.66, 0.8), 0, 1).toFixed(3);

    /* ---- captions ---- */
    let active = -1;
    if (p < 0.13) active = 0;
    else if (p >= 0.18 && p < 0.42) active = 1;
    else if (p >= 0.47 && p < 0.66) active = 2;
    else if (p >= 0.72) active = 3;
    captions.forEach((c, i) => c.classList.toggle("is-active", i === active));

    /* ---- progress dots ---- */
    let phase = 0;
    if (p >= 0.72) phase = 3;
    else if (p >= 0.47) phase = 2;
    else if (p >= 0.18) phase = 1;
    dots.forEach((d, i) => d.classList.toggle("on", i === phase));

    /* ---- scroll hint ---- */
    if (scrollHint) scrollHint.classList.toggle("hide", p > 0.02);
  }

  function onScroll() { targetP = computeProgress(); }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  if (prefersReduced) {
    // static, readable intro — no rAF loop
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
     EMBER PARTICLES
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
