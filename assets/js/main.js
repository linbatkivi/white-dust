/* ==========================================================================
   WHITE_DUST — hjemmeside: animationer og interaktion
   ========================================================================== */
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const cfg = window.WD_CONFIG || {};

  /* ---------- boot-intro (én gang pr. besøg) ---------- */
  const boot = $(".boot");
  const ready = () => document.body.classList.add("ready");
  let seen = false;
  try { seen = sessionStorage.getItem("wd-boot") === "1"; sessionStorage.setItem("wd-boot", "1"); } catch (e) {}
  if (boot && !seen && !reduced) {
    const logo = $(".boot__logo", boot);
    logo.innerHTML = [..."WHITE_DUST"].map((c, i) =>
      `<span style="--i:${i}"${c === "_" ? ' class="u"' : ""}>${c}</span>`).join("");
    requestAnimationFrame(() => boot.classList.add("go"));
    setTimeout(() => { boot.classList.add("out"); ready(); }, 1050);
    setTimeout(() => boot.remove(), 1600);
  } else {
    boot?.remove();
    ready();
  }

  /* ---------- svævende skår (rød/sort, som i spillets menu) ---------- */
  const mouse = { x: -1e4, y: -1e4 };
  addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });

  $$(".shards").forEach((cv) => {
    const ctx = cv.getContext("2d");
    let w, h, list = [], bits = [], vis = true;
    const make = () => {
      const s = 8 + Math.random() * 34;
      const pts = Array.from({ length: 3 }, (_, i) => {
        const a = (i / 3) * Math.PI * 2 + Math.random() * 0.9;
        const r = s * (0.55 + Math.random() * 0.6);
        return [Math.cos(a) * r, Math.sin(a) * r];
      });
      const t = Math.random();
      return {
        x: Math.random() * w, y: Math.random() * h, pts,
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.012,
        vx: (Math.random() - 0.5) * 0.25, vy: -0.08 - Math.random() * 0.25,
        ox: 0, oy: 0, s,
        col: t < 0.55 ? "#ff2b1f" : t < 0.85 ? "#0a0a0a" : "#c21c13",
        a: 0.55 + Math.random() * 0.45
      };
    };
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const r = cv.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(46, (w * h) / 26000) * Number(cv.dataset.density || 1));
      list = Array.from({ length: n }, make);
    };
    size();
    addEventListener("resize", size);
    new IntersectionObserver(([e]) => (vis = e.isIntersecting)).observe(cv);

    // klik = skårene i nærheden splintres (SUPERHOT-stil)
    cv.parentElement.addEventListener("pointerdown", (e) => {
      if (e.target.closest("a, button, .frame")) return;
      const r = cv.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      list.forEach((p, i) => {
        if (Math.hypot(p.x - mx, p.y - my) > 180) return;
        for (let k = 0; k < 7; k++) {
          const a = Math.random() * 6.28, sp = 2 + Math.random() * 6;
          bits.push({ x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2, rot: a, vr: (Math.random() - 0.5) * 0.4, s: p.s * 0.35, col: p.col, life: 1 });
        }
        list[i] = make();
        list[i].y = h + 40;
      });
    });

    const tri = (x, y, rot, pts, col, a) => {
      ctx.save();
      ctx.translate(x, y); ctx.rotate(rot);
      ctx.globalAlpha = a; ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); ctx.lineTo(pts[2][0], pts[2][1]);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    };
    const BIT = [[-1, -0.6], [1, -0.2], [-0.2, 1]];

    const loop = () => {
      requestAnimationFrame(loop);
      if (!vis) return;
      const r = cv.getBoundingClientRect();
      const mx = mouse.x - r.left, my = mouse.y - r.top;
      ctx.clearRect(0, 0, w, h);
      const k = reduced ? 0.1 : 1;
      for (const p of list) {
        p.x += p.vx * k; p.y += p.vy * k; p.rot += p.vr * k;
        const dx = p.x + p.ox - mx, dy = p.y + p.oy - my, d = Math.hypot(dx, dy);
        if (d < 150) { const f = (150 - d) / 150; p.ox += (dx / (d || 1)) * f * 6; p.oy += (dy / (d || 1)) * f * 6; p.rot += f * 0.05; }
        p.ox *= 0.92; p.oy *= 0.92;
        if (p.y < -60) { Object.assign(p, make()); p.y = h + 40; }
        if (p.x < -60) p.x = w + 40; else if (p.x > w + 60) p.x = -40;
        tri(p.x + p.ox, p.y + p.oy, p.rot, p.pts, p.col, p.a);
      }
      bits = bits.filter((b) => (b.life -= 0.018) > 0);
      for (const b of bits) {
        b.x += b.vx; b.y += b.vy; b.vy += 0.18; b.vx *= 0.98; b.rot += b.vr;
        tri(b.x, b.y, b.rot, BIT.map(([x, y]) => [x * b.s, y * b.s]), b.col, b.life);
      }
    };
    requestAnimationFrame(loop);
  });

  /* ---------- crosshair-cursor ---------- */
  if (fine && !reduced) {
    const x = document.createElement("div");
    x.className = "xhair";
    x.innerHTML = "<i></i><i></i><i></i><i></i><b></b>";
    document.body.appendChild(x);
    document.documentElement.classList.add("has-xhair");
    addEventListener("pointermove", (e) => { x.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; }, { passive: true });
    document.addEventListener("pointerover", (e) => x.classList.toggle("hot", !!e.target.closest("a, button, .feat, .frame")));
    document.addEventListener("mouseleave", () => (x.style.opacity = "0"));
    document.addEventListener("mouseenter", () => (x.style.opacity = ""));
  }

  /* ---------- nav ---------- */
  const nav = $(".nav");
  if (nav) {
    let last = 0;
    const onScroll = () => {
      const y = scrollY;
      nav.classList.toggle("is-scrolled", y > 20);
      nav.classList.toggle("is-hidden", y > last && y > 300 && !nav.classList.contains("is-open"));
      last = y;
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    $(".nav__toggle", nav).addEventListener("click", () => nav.classList.toggle("is-open"));
    $$(".nav__links a", nav).forEach((a) => a.addEventListener("click", () => nav.classList.remove("is-open")));
  }

  /* ---------- scramble-tekst på hover ---------- */
  const G = "▮▯_/\\#01XØÆ";
  $$("[data-scramble]").forEach((el) => {
    const orig = el.textContent;
    let raf;
    el.addEventListener("mouseenter", () => {
      let f = 0;
      cancelAnimationFrame(raf);
      const run = () => {
        el.textContent = [...orig].map((c, i) => (i < f / 2 || c === " " ? c : G[(Math.random() * G.length) | 0])).join("");
        if (f++ < orig.length * 2) raf = requestAnimationFrame(run); else el.textContent = orig;
      };
      run();
    });
  });

  /* ---------- reveal ved scroll ---------- */
  $$(".wipe").forEach((el) => { el.innerHTML = `<span class="t">${el.innerHTML}</span>`; });
  const io = new IntersectionObserver((ents) => ents.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    io.unobserve(e.target);
    if (e.target.dataset.count) count(e.target);
  }), { threshold: 0.2, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal, .wipe, [data-count]").forEach((el) => io.observe(el));

  function count(el) {
    const to = Number(el.dataset.count), t0 = performance.now(), dur = reduced ? 1 : 1400;
    const node = el.firstChild;
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      node.nodeValue = String(Math.round(to * (1 - Math.pow(1 - t, 3)))).padStart(String(to).length, "0");
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- tilt på rammer ---------- */
  if (fine && !reduced) {
    $$("[data-tilt]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--ty", ((e.clientX - r.left) / r.width - 0.5) * 8 + "deg");
        el.style.setProperty("--tx", ((e.clientY - r.top) / r.height - 0.5) * -8 + "deg");
      });
      el.addEventListener("pointerleave", () => { el.style.setProperty("--tx", "0deg"); el.style.setProperty("--ty", "0deg"); });
    });
  }

  /* ---------- map pool (skifter med scanner-glitch) ---------- */
  const pool = $(".pool");
  if (pool) {
    const btns = $$(".pool__btn", pool);
    const frame = $(".pool__view .frame", pool);
    const img = $("[data-pool-img]", pool), radar = $("[data-pool-radar]", pool);
    const name = $("[data-pool-name]", pool), desc = $("[data-pool-desc]", pool), idx = $("[data-pool-idx]", pool);
    const bar = $(".pool__bar i", pool);
    let cur = 0, timer, auto = true;
    btns.forEach((b) => { new Image().src = b.dataset.img; });
    const show = (i) => {
      cur = (i + btns.length) % btns.length;
      const b = btns[cur];
      btns.forEach((x) => x.classList.toggle("on", x === b));
      frame.classList.remove("swap"); void frame.offsetWidth; frame.classList.add("swap");
      setTimeout(() => {
        img.src = b.dataset.img; radar.src = b.dataset.radar;
        name.textContent = b.dataset.name; desc.textContent = b.dataset.desc;
        idx.textContent = String(cur + 1).padStart(2, "0") + " / " + String(btns.length).padStart(2, "0");
      }, 120);
      bar.classList.remove("run"); void bar.offsetWidth;
      clearTimeout(timer);
      if (auto && !reduced) { bar.classList.add("run"); timer = setTimeout(() => show(cur + 1), 6000); }
    };
    btns.forEach((b, i) => b.addEventListener("click", () => { auto = false; show(i); }));
    frame.addEventListener("click", () => { auto = false; show(cur + 1); });
    new IntersectionObserver(([e]) => { if (e.isIntersecting && auto) show(cur); else clearTimeout(timer); }, { threshold: 0.3 }).observe(pool);
  }

  /* ---------- år i footer ---------- */
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- downloads ---------- */
  const NAMES = { windows: "Windows", mac: "macOS", linux: "Linux" };
  const ua = navigator.userAgent.toLowerCase();
  const os = /windows/.test(ua) ? "windows" : /mac/.test(ua) ? "mac" : /linux|x11/.test(ua) && !/android/.test(ua) ? "linux" : null;
  const dl = (key) => cfg.repo && cfg.downloads?.[key]?.file
    ? `https://github.com/${cfg.repo}/releases/latest/download/${cfg.downloads[key].file}` : "";

  $$("[data-version]").forEach((el) => (el.textContent = cfg.appVersion || ""));
  $$("[data-platform]").forEach((card) => {
    const key = card.dataset.platform, d = cfg.downloads?.[key];
    if (!d) return;
    $("[data-size]", card).textContent = d.size;
    $("[data-ext]", card).textContent = "." + d.file.split(".").pop().toUpperCase();
    $("[data-req]", card).textContent = d.req;
    const btn = $("[data-dl]", card), url = dl(key);
    if (url && d.ready !== false) {
      btn.href = url;
      btn.addEventListener("click", () => toast(`Download startet ▮ ${d.file}`));
    } else {
      btn.classList.add("is-disabled");
      $("span", btn).textContent = "Kommer snart";
      btn.removeAttribute("href");
    }
    if (key === os) card.classList.add("is-you");
  });
  $$("[data-main-dl]").forEach((a) => {
    const key = os && dl(os) && cfg.downloads[os].ready !== false ? os : null;
    if (!key) return;
    a.href = dl(key);
    $("span", a).textContent = `Download til ${NAMES[key]}`;
    a.addEventListener("click", () => toast(`Download startet ▮ ${cfg.downloads[key].file}`));
  });

  $$(".faq__item").forEach((it) => $(".faq__q", it).addEventListener("click", () => {
    const open = it.classList.contains("open");
    $$(".faq__item.open").forEach((x) => x.classList.remove("open"));
    if (!open) it.classList.add("open");
  }));

  let tEl, tT;
  function toast(msg) {
    if (!tEl) { tEl = document.createElement("div"); tEl.className = "toast"; document.body.appendChild(tEl); }
    tEl.textContent = msg; tEl.classList.add("show");
    clearTimeout(tT); tT = setTimeout(() => tEl.classList.remove("show"), 3000);
  }
})();
