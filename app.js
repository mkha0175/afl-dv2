// app.js — load every Vega-Lite spec and embed it into its container.

const CHARTS = [
  ["chart-01", "charts/01_team_map.vg.json"],
  ["chart-02", "charts/02_premiership_timeline.vg.json"],
  ["chart-03", "charts/03_premiership_count.vg.json"],
  ["chart-04", "charts/04_brownlow_count.vg.json"],
  ["chart-05", "charts/05_grand_final_scores.vg.json"],
  ["chart-06", "charts/06_ladder_evolution.vg.json"],
  ["chart-07", "charts/07_head_to_head.vg.json"],
  ["chart-08", "charts/08_travel_map.vg.json"],
  ["chart-09", "charts/09_travel_vs_ladder.vg.json"],
  ["chart-10", "charts/10_venue_state_stream.vg.json"],
  ["chart-11", "charts/11_avg_margin_trend.vg.json"],
  ["chart-12", "charts/12_home_advantage.vg.json"],
  ["chart-13", "charts/13_margin_distribution.vg.json"],
];

const EMBED_OPTS = {
  actions: false,
  renderer: "canvas",
  config: {
    background: null,
    view: { stroke: null },
    axis: { labelColor: "#1B1B1E", titleColor: "#1B1B1E", titleFontWeight: 600 },
    legend: { labelColor: "#1B1B1E", titleColor: "#1B1B1E", titleFontWeight: 600 }
  }
};

window.addEventListener("DOMContentLoaded", () => {
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
});
