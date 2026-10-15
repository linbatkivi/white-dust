/* ==========================================================================
   WHITE_DUST — skrå scroll
   Når man scroller ned, glider siden skråt: indholdet kommer ind nede fra højre
   og forsvinder op mod venstre, så det føles som at bevæge sig skråt ned ad siden.
   Indholdet er det samme – hver blok forskydes bare vandret i forhold til, hvor
   langt den er fra midten af skærmen.

   Ydelse:
   - Hvor browseren kan (animation-timeline: view()), klarer CSS selve glidningen
     på grafikkortet (se diagonal.css) – her sætter JS kun hver bloks højde ved resize.
   - Ellers gør JS det, men skriver kun `translate` (ingen layout, ingen omtegning).
   - Baggrundsgitteret er et fast lag, der flyttes med transform i stedet for at
     blive tegnet forfra ved hvert billede.
   ========================================================================== */
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Blokkene der glider skråt (rækker af kort glider sammen, da de har samme højde på siden)
  const SELECTOR = [
    ".hero__inner",
    ".head", ".intro > *", ".versus > *", ".feat", ".shots > *",
    ".pool__list", ".pool__view", ".cta .container",
    ".plat", ".browser", ".step", ".reqs", ".news", ".faq__item",
    ".footer .container", "[data-diag]"
  ].join(",");
  // De sidste blokke lander lige, så siden ender pænt (CTA + footer)
  const LAST = ".cta .container, .footer .container";

  const root = document.documentElement;
  const SDA = window.CSS && CSS.supports("animation-timeline: view()");
  let items = [], slope = 0.6, ticking = false;

  const slopeFor = () => (innerWidth < 760 ? 0.4 : 0.6);   // lidt mindre skråt på mobil

  // Gitteret: ét fast lag, der kun flyttes (compositor) – aldrig tegnes forfra
  const grid = document.createElement("div");
  grid.className = "diag-grid";
  grid.setAttribute("aria-hidden", "true");
  document.body.prepend(grid);

  function measure() {
    slope = slopeFor();
    root.style.setProperty("--diag-k", slope);
    const els = [...document.querySelectorAll(SELECTOR)];
    if (SDA) {
      // CSS regner forskydningen ud; den skal bare kende hver bloks højde
      for (const el of els) el.style.setProperty("--diag-h", el.offsetHeight + "px");
    } else {
      els.forEach((el) => (el.style.translate = "none"));
      items = els.map((el) => {
        const r = el.getBoundingClientRect();
        return { el, y: r.top + scrollY + r.height / 2, h: r.height, last: el.matches(LAST) };
      });
    }
    update();
  }

  function update() {
    ticking = false;
    const y = scrollY;
    // hele pixels, ellers bliver gitterets 1px-streger utydelige
    grid.style.transform = `translate3d(${-Math.round(y * slope) % 48}px, ${-Math.round(y) % 48}px, 0)`;
    if (SDA) return;
    const ref = y + innerHeight / 2, lim = innerWidth * 1.3;
    for (const it of items) {
      let dx = (it.y - ref) * slope;
      // sidste blokke: glider ind fra højre og står lige, når de er helt inde
      if (it.last) dx = Math.max(0, (it.y + it.h / 2 - (y + innerHeight)) * slope);
      it.el.style.translate = `${Math.max(-lim, Math.min(lim, dx)).toFixed(1)}px 0`;
    }
  }

  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  let rt;
  const remeasure = () => { clearTimeout(rt); rt = setTimeout(measure, 150); };

  root.classList.add("diag", SDA ? "diag-sda" : "diag-js");
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", remeasure);
  addEventListener("load", measure);
  if (document.fonts) document.fonts.ready.then(measure);
  new ResizeObserver(remeasure).observe(document.body);
  measure();
})();
