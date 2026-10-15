/* ==========================================================================
   WHITE_DUST — skrå scroll
   Når man scroller ned, glider siden skråt: indholdet kommer ind nede fra højre
   og forsvinder op mod venstre, så det føles som at bevæge sig skråt ned ad siden.
   Indholdet er det samme – hver blok forskydes bare vandret i forhold til, hvor
   langt den er fra midten af skærmen. Bruger CSS-egenskaben `translate`, så det
   ikke kolliderer med de andre animationer (der bruger `transform`).
   ========================================================================== */
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Blokkene der glider skråt (rækker af kort glider sammen, da de har samme højde på siden)
  const SELECTOR = [
    ".hero__inner > *",
    ".head", ".intro > *", ".versus > *", ".feat", ".shots > *",
    ".pool__list", ".pool__view", ".cta .container",
    ".plat", ".browser", ".step", ".reqs", ".news", ".faq__item",
    ".footer .container", "[data-diag]"
  ].join(",");

  let items = [], slope = 0.6, ticking = false;

  const slopeFor = () => (innerWidth < 760 ? 0.4 : 0.6);   // lidt mindre skråt på mobil

  // Find hver bloks midtpunkt på siden (uden forskydningen)
  function measure() {
    slope = slopeFor();
    const els = [...document.querySelectorAll(SELECTOR)];
    els.forEach((el) => (el.style.translate = "none"));
    items = els.map((el) => {
      const r = el.getBoundingClientRect();
      return { el, y: r.top + scrollY + r.height / 2 };
    });
    update();
  }

  function update() {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    // På den sidste skærm retter skråningen sig ud, så slutningen (CTA + footer) står lige
    const t = max > 0 ? Math.min(1, Math.max(0, 1 - (max - scrollY) / innerHeight)) : 0;
    const k = slope * (1 - t * t * (3 - 2 * t));
    const ref = scrollY + innerHeight / 2;
    const lim = innerWidth * 1.3;
    for (const it of items) {
      const dx = Math.max(-lim, Math.min(lim, (it.y - ref) * k));
      it.el.style.translate = `${dx.toFixed(1)}px 0`;
    }
    // Gitteret i baggrunden glider med, så hele siden bevæger sig skråt
    document.body.style.setProperty("--diag-x", `${(-scrollY * slope).toFixed(1)}px`);
  }

  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  let rt;
  const remeasure = () => { clearTimeout(rt); rt = setTimeout(measure, 120); };

  document.documentElement.classList.add("diag");
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", remeasure);
  addEventListener("load", measure);
  if (document.fonts) document.fonts.ready.then(measure);
  new ResizeObserver(remeasure).observe(document.body);
  measure();
})();
