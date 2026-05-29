// app.js — Vega-Lite embedding + premium scroll effects

const CACHE_BUST = "v12";
const CHARTS = [
  ["chart-01", "01_team_map.vg.json"],
  ["chart-02", "02_premiership_timeline.vg.json"],
  ["chart-03", "03_premiership_count.vg.json"],
  ["chart-04", "04_brownlow_count.vg.json"],
  ["chart-05", "05_grand_final_scores.vg.json"],
  ["chart-06", "06_ladder_evolution.vg.json"],
  ["chart-07", "07_head_to_head.vg.json"],
  ["chart-08", "08_travel_map.vg.json"],
  ["chart-09", "09_travel_vs_ladder.vg.json"],
  ["chart-10", "10_venue_state_stream.vg.json"],
  ["chart-11", "11_avg_margin_trend.vg.json"],
  ["chart-12", "12_home_advantage.vg.json"],
  ["chart-13", "13_margin_distribution.vg.json"],
].map(([id, url]) => [id, url + "?" + CACHE_BUST]);

const EMBED_OPTS = {
  actions: false,
  renderer: "canvas",
  config: {
    background: null,
    view: { stroke: null },
    axis: { labelColor: "#11151C", titleColor: "#11151C", titleFontWeight: 600 },
    legend: { labelColor: "#11151C", titleColor: "#11151C", titleFontWeight: 600 }
  }
};

// ------------------ chart embedding ------------------
function embedCharts() {
  CHARTS.forEach(([id, url]) => {
    const el = document.getElementById(id);
    if (!el) return;
    vegaEmbed("#" + id, url, EMBED_OPTS)
      .then(() => el.classList.add("loaded"))
      .catch(err => {
        console.error("chart failed:", id, err);
        el.classList.add("loaded");
        el.innerHTML = '<p style="color:#7A1F1F;font-size:13px;padding:10px;">'
          + 'Could not load this chart. (' + err.message + ')</p>';
      });
  });
}

// ------------------ reading progress bar ------------------
function initProgressBar() {
  const bar = document.getElementById("progress-bar");
  if (!bar) return;
  function update() {
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (scrolled / max) * 100 : 0;
    bar.style.width = pct + "%";
  }
  window.addEventListener("scroll", update, { passive: true });
  update();
}

// ------------------ count-up stats ------------------
function animateCount(el, target, duration) {
  const start = performance.now();
  const startVal = 0;
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    // easeOutCubic
    const eased = 1 - Math.pow(1 - t, 3);
    const val = Math.round(startVal + (target - startVal) * eased);
    el.textContent = val.toLocaleString();
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function initStatsCounters() {
  const stats = document.querySelectorAll(".stat-num");
  if (!stats.length) return;

  function trigger(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = "1";
    const target = parseInt(el.dataset.count, 10) || 0;
    animateCount(el, target, 1500);
  }

  if (!("IntersectionObserver" in window)) {
    stats.forEach(trigger);
    return;
  }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) trigger(entry.target);
    });
  }, { threshold: 0.05 });
  stats.forEach(el => obs.observe(el));

  // Safety net: trigger anything still uncounted after 2s on load
  setTimeout(() => stats.forEach(el => {
    const rect = el.getBoundingClientRect();
    const inView = rect.top < (window.innerHeight || 0) && rect.bottom > 0;
    if (inView) trigger(el);
  }), 2000);
}

// ------------------ scrollspy + chart fade-in ------------------
function initScrollSpy() {
  const links = Array.from(document.querySelectorAll(".dot-link"));
  const sections = links
    .map(l => document.querySelector(l.getAttribute("href")))
    .filter(Boolean);
  if (!sections.length) return;

  function setActive(id) {
    links.forEach(l => {
      l.classList.toggle("active", l.getAttribute("href") === "#" + id);
    });
  }

  function update() {
    // pick the section whose top is closest to the 20% line of viewport
    const anchor = window.innerHeight * 0.2;
    let bestIdx = 0;
    let bestDist = Infinity;
    sections.forEach((sec, i) => {
      const rect = sec.getBoundingClientRect();
      // distance from anchor — prefer sections that have started (top above anchor)
      const top = rect.top;
      const bottom = rect.bottom;
      // section must overlap viewport at all
      if (bottom < 0 || top > window.innerHeight) return;
      const dist = Math.abs(top - anchor);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    });
    setActive(sections[bestIdx].id);
  }

  let scheduled = false;
  function onScroll() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; update(); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  update();
}

function initChartFadeIn() {
  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".chart").forEach(el => el.classList.add("in-view"));
    return;
  }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll(".chart").forEach(el => obs.observe(el));
}

function initContentFade() {
  const targets = document.querySelectorAll(
    ".section-eyebrow, .section-title, .sub-title, .lede, .caption"
  );
  if (!targets.length) return;
  if (!("IntersectionObserver" in window)) {
    targets.forEach(t => t.classList.add("in-view"));
    return;
  }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const el = entry.target;
      if (entry.isIntersecting) {
        el.classList.add("in-view");
        el.classList.remove("fade-out");
      } else {
        // Only fade-out if it has been seen at least once and exited upward
        if (el.classList.contains("in-view")) {
          const rect = entry.boundingClientRect;
          if (rect.top < 0) {
            el.classList.add("fade-out");
          } else {
            // exited downward (rare): reset to initial hidden
            el.classList.remove("in-view");
            el.classList.remove("fade-out");
          }
        }
      }
    });
  }, { threshold: 0.2, rootMargin: "0px 0px -10% 0px" });
  targets.forEach(t => obs.observe(t));
}

// ------------------ smooth anchor scrolling ------------------
function initSmoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", e => {
      const id = a.getAttribute("href");
      if (id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });
}

window.addEventListener("DOMContentLoaded", () => {
  embedCharts();
  initProgressBar();
  initStatsCounters();
  initScrollSpy();
  initChartFadeIn();
  initContentFade();
  initSmoothAnchors();
});
