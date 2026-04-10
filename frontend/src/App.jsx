import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import Dashboard from "./Dashboard.jsx";
import "./App.css";

// ── Parse AI output into sections ─────────────
function parseAnalysis(text) {
  const result = { score: null, strengths: [], gaps: [], realityCheck: "", recommendation: { verdict: "", detail: "" }, actionPlan: [], raw: text };
  const scoreMatch = text.match(/Overall Fit Score:\s*(\d{1,3})\s*%/i);
  if (scoreMatch) result.score = parseInt(scoreMatch[1], 10);
  const section = (startLabel, endLabels) => {
    const startRe = new RegExp(`${startLabel}[:\\s*\\n]+`, "i");
    const startIdx = text.search(startRe);
    if (startIdx === -1) return "";
    const afterStart = text.slice(startIdx).replace(startRe, "").trim();
    let endIdx = afterStart.length;
    for (const lbl of endLabels) {
      const re = new RegExp(`\\n\\**${lbl}\\**[:\\s*\\n]`, "i");
      const m = afterStart.search(re);
      if (m !== -1 && m < endIdx) endIdx = m;
    }
    return afterStart.slice(0, endIdx).trim();
  };
  const bullets = (block) => block.split("\n").map((l) => l.replace(/^[\*\-•]\s*/, "").replace(/\*\*/g, "").trim()).filter((l) => l.length > 4 && !l.match(/^(Strengths|Critical|Reality|Recommendation|Action|Overall)/i));
  result.strengths = bullets(section("Strengths Alignment", ["Critical Gaps", "Reality Check", "Recommendation", "Action Plan"]));
  result.gaps = bullets(section("Critical Gaps", ["Reality Check", "Recommendation", "Action Plan"]));
  result.realityCheck = section("Reality Check", ["Recommendation", "Action Plan"]).replace(/\*\*/g, "").trim();
  const recBlock = section("Recommendation", ["Action Plan"]);
  const verdictMatch = recBlock.match(/\**(APPLY NOW|UPSKILL FIRST|LOOK ELSEWHERE)\**/i);
  if (verdictMatch) { result.recommendation.verdict = verdictMatch[1].toUpperCase(); result.recommendation.detail = recBlock.replace(verdictMatch[0], "").replace(/\*\*/g, "").trim(); }
  else { result.recommendation.detail = recBlock.replace(/\*\*/g, "").trim(); }
  result.actionPlan = bullets(section("Action Plan", ["$$$END$$$"]));
  return result;
}

// ── Score Arc ──────────────────────────────────
function ScoreArc({ score }) {
  const radius = 70, stroke = 10, circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? "#00e5b0" : score >= 60 ? "#f59e0b" : score >= 40 ? "#fb923c" : "#ff4f6d";
  const label = score >= 75 ? "Strong Fit" : score >= 60 ? "Moderate Fit" : score >= 40 ? "Weak Fit" : "Poor Fit";
  return (
    <div className="score-arc-wrap">
      <svg width="170" height="170" viewBox="0 0 170 170">
        <circle cx="85" cy="85" r={radius} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle cx="85" cy="85" r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 85 85)" style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)", filter: `drop-shadow(0 0 8px ${color}55)` }} />
      </svg>
      <div className="score-arc-inner">
        <span className="score-pct" style={{ color }}>{score}<span className="score-pct-sym">%</span></span>
        <span className="score-fit-label" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}

// ── Verdict badge ──────────────────────────────
function VerdictBadge({ verdict }) {
  const config = { "APPLY NOW": { bg: "rgba(0,229,176,0.12)", border: "rgba(0,229,176,0.4)", color: "#00e5b0", icon: "🚀" }, "UPSKILL FIRST": { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.4)", color: "#f59e0b", icon: "📚" }, "LOOK ELSEWHERE": { bg: "rgba(255,79,109,0.12)", border: "rgba(255,79,109,0.4)", color: "#ff4f6d", icon: "🔍" } };
  const c = config[verdict] || config["UPSKILL FIRST"];
  return <span className="verdict-badge" style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>{c.icon} {verdict}</span>;
}

// ── Section card ───────────────────────────────
function SectionCard({ icon, title, accent, children }) {
  return (
    <div className="section-card" style={{ "--accent-c": accent }}>
      <div className="section-card-header"><span className="section-icon">{icon}</span><h3 className="section-title">{title}</h3><div className="section-line" /></div>
      <div className="section-body">{children}</div>
    </div>
  );
}

function BulletList({ items, color }) {
  return (
    <ul className="bullet-list">
      {items.map((item, i) => (
        <li key={i} className="bullet-item"><span className="bullet-dot" style={{ background: color }} /><span>{item}</span></li>
      ))}
    </ul>
  );
}

// ── File drop zone ─────────────────────────────
function FileDropZone({ file, onFile }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();
  const handleDrop = useCallback((e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }, [onFile]);
  return (
    <div className={`drop-zone ${dragging ? "drag-over" : ""} ${file ? "has-file" : ""}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop} onClick={() => inputRef.current.click()}>
      <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" onChange={(e) => { if (e.target.files[0]) onFile(e.target.files[0]); }} hidden />
      {file ? (
        <div className="file-info"><span className="file-icon-lg">📄</span><div className="file-meta"><span className="file-name">{file.name}</span><span className="file-size">{(file.size / 1024).toFixed(1)} KB</span></div><button className="file-remove" onClick={(e) => { e.stopPropagation(); onFile(null); }}>✕</button></div>
      ) : (
        <div className="drop-content"><div className="drop-icon">⬆</div><p className="drop-text">Drop your resume here</p><p className="drop-sub">PDF or Word • Max 10MB</p></div>
      )}
    </div>
  );
}

// ── Main App ───────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState("analyzer");
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [rawResult, setRawResult] = useState(null);
  const [error, setError] = useState("");
  const [showRaw, setShowRaw] = useState(false);
  const resultRef = useRef();
  const canSubmit = resumeFile && jobDesc.trim().length >= 50 && !loading;

  const handleAnalyze = async () => {
    if (!canSubmit) return;
    setLoading(true); setError(""); setParsed(null); setRawResult(null);
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobDescription", jobDesc);
    try {
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Analysis failed");
      const p = parseAnalysis(data.analysis);
      setParsed(p); setRawResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleReset = () => { setParsed(null); setRawResult(null); setResumeFile(null); setJobDesc(""); setShowRaw(false); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="app">
      <header className="header">
        <div className="logo"><span className="logo-icon">◈</span><span className="logo-text">ResumeAI</span></div>
        <nav className="nav">
          <button className={`nav-btn ${activeTab === "analyzer" ? "active" : ""}`} onClick={() => setActiveTab("analyzer")}>Analyzer</button>
          <button className={`nav-btn ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        </nav>
        <p className="header-tagline">Brutally Honest Job Fit Analyzer</p>
        <div className="header-glow" />
      </header>

      <main className="main">
        {activeTab === "dashboard" ? (
          <Dashboard />
        ) : (
          <>
            <section className="hero">
              <div className="hero-eyebrow">No fluff. No sugar-coating. Just the truth.</div>
              <h1 className="hero-title">Know your real<br /><em>chances.</em></h1>
              <p className="hero-sub">Upload your resume and paste the job description — get a brutally honest fit score, gap analysis, and a clear verdict.</p>
            </section>

            <section className="input-panel">
              <div className="input-grid">
                <div className="input-card">
                  <div className="input-label"><span className="label-num">01</span>Your Resume</div>
                  <FileDropZone file={resumeFile} onFile={setResumeFile} />
                </div>
                <div className="input-card">
                  <div className="input-label"><span className="label-num">02</span>Job Description<span className="char-count">{jobDesc.length} chars</span></div>
                  <textarea className="jd-textarea" value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} placeholder="Paste the full job description here..." rows={12} />
                </div>
              </div>
              {error && <div className="error-bar"><span>⚠</span> {error}</div>}
              <div className="analyze-row">
                <button className={`analyze-btn ${loading ? "loading" : ""}`} onClick={handleAnalyze} disabled={!canSubmit}>
                  {loading ? <><span className="spinner" /> Analyzing your fit…</> : <><span className="btn-icon">◈</span> Analyze My Fit</>}
                </button>
                {!resumeFile && <p className="hint">← Upload your resume to get started</p>}
                {resumeFile && jobDesc.length < 50 && <p className="hint">Add more job description text</p>}
              </div>
            </section>

            {parsed && (
              <section className="results" ref={resultRef}>
                <div className="results-topbar">
                  <div><h2 className="results-heading">Job Fit Analysis</h2><p className="results-meta">📄 {rawResult?.meta?.resumeFileName} · {new Date(rawResult?.meta?.analyzedAt).toLocaleTimeString()}</p></div>
                  <button className="toggle-raw-btn" onClick={() => setShowRaw(!showRaw)}>{showRaw ? "◈ Sections View" : "≡ Raw Output"}</button>
                </div>
                {showRaw ? (
                  <div className="raw-output"><pre>{parsed.raw}</pre></div>
                ) : (
                  <div className="sections-grid">
                    <div className="top-row">
                      <div className="score-card">
                        <div className="section-card-header"><span className="section-icon">🎯</span><h3 className="section-title">Overall Fit Score</h3><div className="section-line" /></div>
                        <div className="score-card-body">{parsed.score !== null ? <ScoreArc score={parsed.score} /> : <p className="muted">Score not detected</p>}</div>
                      </div>
                      <div className="rec-card">
                        <div className="section-card-header"><span className="section-icon">📌</span><h3 className="section-title">Recommendation</h3><div className="section-line" /></div>
                        <div className="rec-card-body">{parsed.recommendation.verdict && <VerdictBadge verdict={parsed.recommendation.verdict} />}{parsed.recommendation.detail && <p className="rec-detail">{parsed.recommendation.detail}</p>}</div>
                      </div>
                    </div>
                    {parsed.realityCheck && (<SectionCard icon="👁" title="Reality Check" accent="#a78bfa"><p className="reality-text">{parsed.realityCheck}</p></SectionCard>)}
                    <div className="two-col-row">
                      <SectionCard icon="✅" title="Strengths Alignment" accent="#00e5b0">{parsed.strengths.length > 0 ? <BulletList items={parsed.strengths} color="#00e5b0" /> : <p className="muted-sm">No strengths detected</p>}</SectionCard>
                      <SectionCard icon="⚠️" title="Critical Gaps" accent="#ff4f6d">{parsed.gaps.length > 0 ? <BulletList items={parsed.gaps} color="#ff4f6d" /> : <p className="muted-sm">No critical gaps detected</p>}</SectionCard>
                    </div>
                    {parsed.actionPlan.length > 0 && (
                      <SectionCard icon="🗺" title="Action Plan" accent="#f59e0b">
                        <div className="action-steps">{parsed.actionPlan.map((step, i) => (<div className="action-step" key={i}><span className="action-num">{String(i + 1).padStart(2, "0")}</span><span className="action-text">{step}</span></div>))}</div>
                      </SectionCard>
                    )}
                  </div>
                )}
                <div className="results-footer">
                  <button className="reset-btn" onClick={handleReset}>↩ New Analysis</button>
                  <button className="copy-btn" onClick={() => navigator.clipboard.writeText(parsed.raw).then(() => alert("Copied!"))}>⎘ Copy Report</button>
                  <button className="dashboard-btn" onClick={() => setActiveTab("dashboard")}>📊 View Dashboard</button>
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <footer className="footer">
        <p className="footer-brand">ResumeAI</p>
        <p className="footer-disclaimer">⚠ This tool provides AI-generated suggestions only and does not constitute professional career or recruitment advice.</p>
      </footer>
    </div>
  );
}