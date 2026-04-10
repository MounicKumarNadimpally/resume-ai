import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "./Dashboard.css";

// ── D3 Bar Chart — Score Distribution ─────────
function ScoreDistributionChart({ data }) {
  const ref = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;
    const el = ref.current;
    d3.select(el).selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const width = el.clientWidth - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const svg = d3.select(el)
      .append("svg").attr("width", "100%").attr("height", 200)
      .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(data.map(d => d.range)).range([0, width]).padding(0.3);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.count) || 1]).nice().range([height, 0]);

    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.range))
      .range(["#ff4f6d", "#fb923c", "#f59e0b", "#00b389", "#00e5b0"]);

    // Bars
    svg.selectAll(".bar")
      .data(data).enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.range))
      .attr("width", x.bandwidth())
      .attr("y", height).attr("height", 0)
      .attr("fill", d => color(d.range))
      .attr("rx", 4)
      .transition().duration(800).delay((_, i) => i * 100)
      .attr("y", d => y(d.count))
      .attr("height", d => height - y(d.count));

    // Value labels
    svg.selectAll(".label")
      .data(data).enter().append("text")
      .attr("x", d => x(d.range) + x.bandwidth() / 2)
      .attr("y", d => y(d.count) - 6)
      .attr("text-anchor", "middle")
      .attr("fill", "#6a6a8a")
      .attr("font-size", "11px")
      .text(d => d.count > 0 ? d.count : "");

    // X axis
    svg.append("g").attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text").attr("fill", "#6a6a8a").attr("font-size", "11px");
    svg.select(".domain").attr("stroke", "#2a2a45");
    svg.selectAll(".tick line").attr("stroke", "#2a2a45");

    // Y axis
    svg.append("g").call(d3.axisLeft(y).ticks(4))
      .selectAll("text").attr("fill", "#6a6a8a").attr("font-size", "11px");
    svg.select(".domain").attr("stroke", "#2a2a45");
    svg.selectAll(".tick line").attr("stroke", "#2a2a45");

  }, [data]);

  return <div ref={ref} style={{ width: "100%" }} />;
}

// ── D3 Horizontal Bar — Top Gaps ──────────────
function HorizontalBarChart({ data, color }) {
  const ref = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;
    const el = ref.current;
    d3.select(el).selectAll("*").remove();

    const margin = { top: 10, right: 50, bottom: 10, left: 280 };
    const height = data.length * 40;
    const width = el.clientWidth - margin.left - margin.right;

    const svg = d3.select(el)
      .append("svg").attr("width", "100%").attr("height", height + margin.top + margin.bottom)
      .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, d3.max(data, d => d.count) || 1]).range([0, width]);
    const y = d3.scaleBand().domain(data.map(d => d.skill.substring(0, 45))).range([0, height]).padding(0.3);

    // Bars
    svg.selectAll(".bar")
      .data(data).enter().append("rect")
      .attr("y", d => y(d.skill.substring(0, 45)))
      .attr("height", y.bandwidth())
      .attr("x", 0).attr("width", 0)
      .attr("fill", color).attr("rx", 4).attr("opacity", 0.85)
      .transition().duration(800).delay((_, i) => i * 80)
      .attr("width", d => x(d.count));

    // Count labels
    svg.selectAll(".label")
      .data(data).enter().append("text")
      .attr("y", d => y(d.skill.substring(0, 45)) + y.bandwidth() / 2)
      .attr("x", d => x(d.count) + 6)
      .attr("dominant-baseline", "central")
      .attr("fill", "#6a6a8a").attr("font-size", "11px")
      .text(d => d.count);

    // Y axis (skill names)
    svg.append("g").call(d3.axisLeft(y).tickSize(0))
      .selectAll("text")
      .attr("fill", "#c0c0d8")
      .attr("font-size", "12px")
      .style("text-anchor", "end");
    svg.select(".domain").remove();

  }, [data, color]);

  return <div ref={ref} style={{ width: "100%" }} />;
}

// ── Verdict donut chart ────────────────────────
function VerdictDonut({ data }) {
  const ref = useRef();

  useEffect(() => {
    const el = ref.current;
    d3.select(el).selectAll("*").remove();

    const size = 180;
    const radius = size / 2;
    const innerRadius = radius * 0.58;

    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (total === 0) return;

    const pieData = [
      { label: "Apply Now", value: data["APPLY NOW"], color: "#00e5b0" },
      { label: "Upskill First", value: data["UPSKILL FIRST"], color: "#f59e0b" },
      { label: "Look Elsewhere", value: data["LOOK ELSEWHERE"], color: "#ff4f6d" },
    ].filter(d => d.value > 0);

    const svg = d3.select(el)
      .append("svg").attr("width", size).attr("height", size)
      .append("g").attr("transform", `translate(${radius},${radius})`);

    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(innerRadius).outerRadius(radius - 4);

    svg.selectAll(".arc")
      .data(pie(pieData)).enter().append("path")
      .attr("fill", d => d.data.color)
      .attr("opacity", 0.9)
      .attr("d", arc)
      .transition().duration(800).attrTween("d", function(d) {
        const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return t => arc(i(t));
      });

    svg.append("text").attr("text-anchor", "middle").attr("dy", "-0.2em")
      .attr("fill", "#e4e4f0").attr("font-size", "22px").attr("font-weight", "700")
      .text(total);
    svg.append("text").attr("text-anchor", "middle").attr("dy", "1.2em")
      .attr("fill", "#6a6a8a").attr("font-size", "11px").text("total");

  }, [data]);

  return <div ref={ref} />;
}

// ── Stat card ──────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value" style={{ color }}>{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  );
}

// ── Analysis Detail Modal ──────────────────────
function AnalysisModal({ id, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analysis/${id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const verdictColor = { "APPLY NOW": "#00e5b0", "UPSKILL FIRST": "#f59e0b", "LOOK ELSEWHERE": "#ff4f6d" };
  const verdictBg = { "APPLY NOW": "rgba(0,229,176,0.12)", "UPSKILL FIRST": "rgba(245,158,11,0.12)", "LOOK ELSEWHERE": "rgba(255,79,109,0.12)" };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Analysis Detail</h3>
            {data && <p className="modal-meta">📄 {data.resume_filename} · {new Date(data.created_at).toLocaleString()}</p>}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {loading && <div className="modal-loading"><span className="spinner" /> Loading…</div>}

        {data && (
          <div className="modal-body">
            {/* Score + Verdict */}
            <div className="modal-top-row">
              <div className="modal-score-wrap">
                <p className="modal-section-label">Fit Score</p>
                <p className="modal-score" style={{ color: data.fit_score >= 60 ? "#00e5b0" : data.fit_score >= 40 ? "#f59e0b" : "#ff4f6d" }}>
                  {data.fit_score != null ? `${data.fit_score}%` : "—"}
                </p>
              </div>
              {data.verdict && (
                <div className="modal-verdict-wrap">
                  <p className="modal-section-label">Verdict</p>
                  <span className="modal-verdict" style={{ background: verdictBg[data.verdict], border: `1px solid ${verdictColor[data.verdict]}40`, color: verdictColor[data.verdict] }}>
                    {data.verdict === "APPLY NOW" ? "🚀" : data.verdict === "UPSKILL FIRST" ? "📚" : "🔍"} {data.verdict}
                  </span>
                  {data.recommendation && <p className="modal-rec-detail">{data.recommendation}</p>}
                </div>
              )}
            </div>

            {/* Reality Check */}
            {data.reality_check && (
              <div className="modal-section">
                <p className="modal-section-label">👁 Reality Check</p>
                <p className="modal-reality">{data.reality_check}</p>
              </div>
            )}

            {/* Strengths + Gaps */}
            <div className="modal-two-col">
              <div className="modal-section">
                <p className="modal-section-label">✅ Strengths</p>
                <ul className="modal-list">
                  {(data.strengths || []).map((s, i) => (
                    <li key={i}><span className="modal-dot" style={{ background: "#00e5b0" }} />{s}</li>
                  ))}
                </ul>
              </div>
              <div className="modal-section">
                <p className="modal-section-label">⚠️ Critical Gaps</p>
                <ul className="modal-list">
                  {(data.gaps || []).map((g, i) => (
                    <li key={i}><span className="modal-dot" style={{ background: "#ff4f6d" }} />{g}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Plan */}
            {data.action_plan && data.action_plan.length > 0 && (
              <div className="modal-section">
                <p className="modal-section-label">🗺 Action Plan</p>
                <div className="modal-actions">
                  {data.action_plan.map((step, i) => (
                    <div key={i} className="modal-action-step">
                      <span className="modal-action-num">{String(i + 1).padStart(2, "0")}</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Job snippet */}
            {data.job_snippet && (
              <div className="modal-section">
                <p className="modal-section-label">💼 Job Description (preview)</p>
                <p className="modal-snippet">{data.job_snippet}{data.job_snippet.length >= 300 ? "…" : ""}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/history?limit=10")
        ]);
        const statsData = await statsRes.json();
        const historyData = await historyRes.json();
        setStats(statsData);
        setHistory(historyData);
      } catch (err) {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="dash-loading"><span className="spinner" /> Loading dashboard…</div>;
  if (error) return <div className="dash-error">⚠ {error}</div>;
  if (!stats || stats.total === 0) return (
    <div className="dash-empty">
      <p className="dash-empty-icon">📊</p>
      <p className="dash-empty-title">No analyses yet</p>
      <p className="dash-empty-sub">Run your first analysis to see insights here.</p>
    </div>
  );

  return (
    <div className="dashboard">
      <div className="dash-header">
        <h2 className="dash-title">Analytics Dashboard</h2>
        <p className="dash-sub">Insights from {stats.total} resume analyses</p>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        <StatCard label="Total Analyses" value={stats.total} color="#e4e4f0" />
        <StatCard label="Average Fit Score" value={`${stats.avg_score}%`} color={stats.avg_score >= 60 ? "#00e5b0" : "#f59e0b"} />
        <StatCard label="Apply Now" value={stats.verdict_counts["APPLY NOW"]} color="#00e5b0" sub="candidates ready" />
        <StatCard label="Upskill First" value={stats.verdict_counts["UPSKILL FIRST"]} color="#f59e0b" sub="need improvement" />
      </div>

      {/* Charts row */}
      <div className="chart-grid">
        {/* Score distribution */}
        <div className="chart-card">
          <div className="chart-header"><span className="chart-icon">📊</span><h3 className="chart-title">Fit Score Distribution</h3></div>
          <ScoreDistributionChart data={stats.score_distribution} />
        </div>

        {/* Verdict donut */}
        <div className="chart-card chart-card-sm">
          <div className="chart-header"><span className="chart-icon">🎯</span><h3 className="chart-title">Verdict Breakdown</h3></div>
          <div className="donut-wrap"><VerdictDonut data={stats.verdict_counts} /></div>
          <div className="donut-legend">
            <div className="legend-item"><span className="legend-dot" style={{ background: "#00e5b0" }} />Apply Now</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: "#f59e0b" }} />Upskill First</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: "#ff4f6d" }} />Look Elsewhere</div>
          </div>
        </div>
      </div>

      {/* Gaps + Strengths — full width each */}
      <div className="chart-single">
        <div className="chart-card">
          <div className="chart-header"><span className="chart-icon">⚠️</span><h3 className="chart-title">Top Skill Gaps</h3></div>
          {stats.top_gaps.length > 0 ? <HorizontalBarChart data={stats.top_gaps} color="#ff4f6d" /> : <p className="muted-sm">Not enough data yet</p>}
        </div>
      </div>
      <div className="chart-single">
        <div className="chart-card">
          <div className="chart-header"><span className="chart-icon">✅</span><h3 className="chart-title">Top Strengths</h3></div>
          {stats.top_strengths.length > 0 ? <HorizontalBarChart data={stats.top_strengths} color="#00e5b0" /> : <p className="muted-sm">Not enough data yet</p>}
        </div>
      </div>

      {/* History table */}
      <div className="chart-card">
        <div className="chart-header"><span className="chart-icon">🕐</span><h3 className="chart-title">Recent Analyses</h3></div>
        <div className="table-wrap">
          <table className="history-table">
            <thead>
              <tr><th>Date</th><th>Resume</th><th>Score</th><th>Verdict</th></tr>
            </thead>
            <tbody>
              {history.map(row => (
                <tr key={row.id}>
                  <td>{new Date(row.created_at).toLocaleDateString()}</td>
                  <td className="td-file">{row.resume_filename}</td>
                  <td>
                    <span className="score-pill" style={{ color: row.fit_score >= 60 ? "#00e5b0" : row.fit_score >= 40 ? "#f59e0b" : "#ff4f6d" }}>
                      {row.fit_score != null ? `${row.fit_score}%` : "—"}
                    </span>
                  </td>
                  <td>
                    <span className="verdict-pill" style={{
                      background: row.verdict === "APPLY NOW" ? "rgba(0,229,176,0.1)" : row.verdict === "UPSKILL FIRST" ? "rgba(245,158,11,0.1)" : "rgba(255,79,109,0.1)",
                      color: row.verdict === "APPLY NOW" ? "#00e5b0" : row.verdict === "UPSKILL FIRST" ? "#f59e0b" : "#ff4f6d",
                    }}>{row.verdict || "—"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
