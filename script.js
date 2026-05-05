(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const marquee = document.querySelector(".marquee-track");
  if (marquee) {
    marquee.innerHTML += marquee.innerHTML;
  }

  initTestimonialCards();

  const revealItems = Array.from(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window && !reduceMotion) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("in-view"));
  }

  initRingCopy();

  if (!reduceMotion) {
    initAlteringFan();
  }

  const parallaxItems = Array.from(document.querySelectorAll("[data-parallax]"));
  if (!parallaxItems.length || reduceMotion) {
    return;
  }

  let ticking = false;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function updateScrollMotion() {
    const viewportCenter = window.innerHeight / 2;

    parallaxItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const itemCenter = rect.top + rect.height / 2;
      const progress = clamp((viewportCenter - itemCenter) / window.innerHeight, -1, 1);
      item.style.setProperty("--scroll-p", progress.toFixed(3));
    });

    ticking = false;
  }

  function requestUpdate() {
    if (!ticking) {
      window.requestAnimationFrame(updateScrollMotion);
      ticking = true;
    }
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  requestUpdate();
})();

function initAlteringFan() {
  const fanCards = Array.from(document.querySelectorAll(".fan-card"));

  if (!fanCards.length) {
    return;
  }

  const baseRotations = [-18, -9, 0, 9, 18];

  function animate(timestamp) {
    const time = timestamp * 0.001;

    fanCards.forEach((card, index) => {
      const phase = index * ((Math.PI * 2) / fanCards.length);
      const baseRotation = baseRotations[index] ?? 0;

      const deltaX = Math.sin(time * 0.23 + phase) * 9 + Math.sin(time * 0.41 + phase * 1.7) * 4;
      const deltaY = Math.sin(time * 0.31 + phase * 0.8) * 14 + Math.cos(time * 0.19 + phase * 1.3) * 7;
      const deltaRotation =
        Math.sin(time * 0.27 + phase * 1.1) * 2.8 +
        Math.sin(time * 0.53 + phase * 0.6) * 1.4;

      card.style.transform = `translate(${deltaX.toFixed(2)}px, ${deltaY.toFixed(2)}px) rotate(${(
        baseRotation + deltaRotation
      ).toFixed(3)}deg)`;
    });

    window.requestAnimationFrame(animate);
  }

  window.requestAnimationFrame(animate);
}

function initTestimonialCards() {
  const cards = Array.from(document.querySelectorAll(".testimonial-card"));

  if (!cards.length) {
    return;
  }

  const sampleQuote = cards[0].querySelector("blockquote");

  if (!sampleQuote) {
    return;
  }

  const styles = window.getComputedStyle(sampleQuote);
  const lineHeight = parseFloat(styles.lineHeight);
  const minQuoteWidth = 232;
  const maxCardWidth = 670;
  const cardChromeWidth = 118 + 22 + 56;
  const maxQuoteWidth = maxCardWidth - cardChromeWidth;
  const measure = document.createElement("blockquote");
  let resizeFrame = 0;

  measure.setAttribute("aria-hidden", "true");
  measure.style.position = "absolute";
  measure.style.top = "0";
  measure.style.left = "-9999px";
  measure.style.visibility = "hidden";
  measure.style.pointerEvents = "none";
  measure.style.whiteSpace = "normal";
  measure.style.margin = "0";
  measure.style.padding = "0";
  measure.style.fontFamily = styles.fontFamily;
  measure.style.fontSize = styles.fontSize;
  measure.style.fontWeight = styles.fontWeight;
  measure.style.lineHeight = styles.lineHeight;
  measure.style.letterSpacing = styles.letterSpacing;
  document.body.appendChild(measure);

  function countLines(text, width) {
    measure.textContent = text;
    measure.style.width = `${width}px`;
    return Math.max(1, Math.ceil(measure.getBoundingClientRect().height / lineHeight));
  }

  function sizeCards() {
    cards.forEach((card) => {
      const quote = card.querySelector("blockquote");

      if (!quote) {
        return;
      }

      const text = quote.textContent?.trim() ?? "";
      let low = minQuoteWidth;
      let high = maxQuoteWidth;
      let fittedQuoteWidth = maxQuoteWidth;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const lines = countLines(text, mid);

        if (lines <= 4) {
          fittedQuoteWidth = mid;
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      }

      const cardWidth = Math.min(maxCardWidth, fittedQuoteWidth + cardChromeWidth);
      card.style.setProperty("--testimonial-width", `${cardWidth}px`);
    });
  }

  function requestSize() {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(sizeCards);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(sizeCards);
  } else {
    sizeCards();
  }

  window.addEventListener("resize", requestSize);
}

function initRingCopy() {
  const rings = Array.from(document.querySelectorAll(".ring-copy[data-ring-text]"));

  if (!rings.length) {
    return;
  }

  let resizeFrame = 0;

  function fitAll() {
    rings.forEach((ring) => fitRingCopy(ring));
  }

  function requestFit() {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(fitAll);
  }

  if (document.fonts && document.fonts.ready && document.fonts.load) {
    Promise.all([
      document.fonts.ready,
      document.fonts.load('900 16px "Inter Ring"'),
    ]).then(fitAll);
  } else {
    fitAll();
  }

  window.addEventListener("resize", requestFit);
}

function fitRingCopy(ring) {
  const source = ring.dataset.ringText?.trim();
  const size = Math.min(ring.clientWidth, ring.clientHeight);

  if (!source || !size) {
    return;
  }

  const content = `${source} ✦ `;
  const radius = size * 0.372;
  const targetLength = 2 * Math.PI * radius;
  const chars = Array.from(content);
  let low = 1;
  let high = size * 0.32;
  let best = low;
  let bestWidths = [];
  let bestLength = 0;

  for (let i = 0; i < 20; i += 1) {
    const mid = (low + high) / 2;
    const measuredWidths = measureRingText(chars, mid);
    const measured = measuredWidths.reduce((sum, width) => sum + width, 0);

    if (measured <= targetLength) {
      best = mid;
      bestWidths = measuredWidths;
      bestLength = measured;
      low = mid;
    } else {
      high = mid;
    }
  }

  if (!bestWidths.length || !bestLength) {
    bestWidths = measureRingText(chars, best);
    bestLength = bestWidths.reduce((sum, width) => sum + width, 0);
  }

  const fittedSize = bestLength ? best * (targetLength / bestLength) : best;
  const fittedWidths = measureRingText(chars, fittedSize);
  const track = document.createDocumentFragment();
  let distance = 0;

  ring.style.setProperty("--ring-font-size", `${fittedSize.toFixed(3)}px`);

  fittedWidths.forEach((width, index) => {
    const angle = ((distance + (width / 2)) / targetLength) * 360;
    const char = document.createElement("span");

    char.className = "ring-copy__char";
    char.textContent = chars[index] === " " ? "\u00a0" : chars[index];
    char.style.transform = `translate(-50%, -50%) rotate(${angle.toFixed(3)}deg) translateY(-${radius.toFixed(3)}px)`;
    track.append(char);
    distance += width;
  });

  ring.replaceChildren(track);
}

const ringMeasureCanvas = document.createElement("canvas");
const ringMeasureContext = ringMeasureCanvas.getContext("2d");

function measureRingText(chars, fontSize) {
  if (!ringMeasureContext) {
    return [];
  }

  ringMeasureContext.font = `900 ${fontSize}px "Inter Ring", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

  let prefix = "";
  let previousWidth = 0;

  return chars.map((char) => {
    prefix += char;

    const currentWidth = ringMeasureContext.measureText(prefix).width;
    const advance = currentWidth - previousWidth;

    previousWidth = currentWidth;
    return advance;
  });
}
