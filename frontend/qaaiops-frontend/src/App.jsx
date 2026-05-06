import { useState, useRef, useCallback } from "react";

const API_URL = "https://qaaiops-production.up.railway.app";

const COLORS = {
  normal: "#1D9E75",
  anomaly: "#E24B4A",
  amber: "#BA7517",
  bg: "var(--color-background-primary)",
  bgSecondary: "var(--color-background-secondary)",
  border: "var(--color-border-tertiary)",
  text: "var(--color-text-primary)",
  textMuted: "var(--color-text-secondary)",
};

function MetricCard({ label, value, unit = "", color, icon, big = false }) {
  return (
    <div style={{
      background: COLORS.bgSecondary,
      borderRadius: "var(--border-radius-lg)",
      padding: big ? "1.25rem 1.5rem" : "1rem 1.25rem",
      display: "flex",
      flexDirection: "column",
      gap: 4,
      border: color ? `1.5px solid ${color}22` : `0.5px solid ${COLORS.border}`,
      position: "relative",
      overflow: "hidden",
    }}>
      {color && (
        <div style={{
          position: "absolute", top: 0, left: 0,
          width: 3, height: "100%", background: color,
          borderRadius: "4px 0 0 4px"
        }} />
      )}
      <span style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", paddingLeft: color ? 8 : 0 }}>
        {icon && <i className={`ti ${icon}`} style={{ marginRight: 5, fontSize: 12 }} aria-hidden="true" />}
        {label}
      </span>
      <span style={{ fontSize: big ? 32 : 24, fontWeight: 500, color: color || COLORS.text, lineHeight: 1.1, paddingLeft: color ? 8 : 0 }}>
        {value}<span style={{ fontSize: big ? 16 : 13, fontWeight: 400, color: COLORS.textMuted, marginLeft: 3 }}>{unit}</span>
      </span>
    </div>
  );
}

function AlertBanner({ pct, threshold = 5 }) {
  const isAlert = pct > threshold;
  const bgColor = isAlert ? "#FCEBEB" : "#EAF3DE";
  const textColor = isAlert ? "#A32D2D" : "#3B6D11";
  const borderColor = isAlert ? "#F09595" : "#97C459";
  const icon = isAlert ? "ti-alert-triangle" : "ti-circle-check";
  return (
    <div style={{
      background: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: "var(--border-radius-lg)",
      padding: "1rem 1.25rem",
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}>
      <i className={`ti ${icon}`} style={{ fontSize: 24, color: textColor, flexShrink: 0 }} aria-hidden="true" />
      <div>
        <p style={{ margin: 0, fontWeight: 500, color: textColor, fontSize: 15 }}>
          {isAlert ? "⚠ Alerta de anomalias detectado" : "✓ Sistema operando normalmente"}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 13, color: textColor, opacity: 0.8 }}>
          {isAlert
            ? `${pct.toFixed(2)}% das requisições classificadas como anomalia (limite: ${threshold}%)`
            : `${pct.toFixed(2)}% de anomalias — abaixo do limite de ${threshold}%`}
        </p>
      </div>
    </div>
  );
}

function UploadZone({ onFile, loading }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) onFile(file);
  }, [onFile]);

  return (
    <div
      onClick={() => !loading && inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `1.5px dashed ${dragging ? "#1D9E75" : COLORS.border}`,
        borderRadius: "var(--border-radius-lg)",
        padding: "2.5rem 1.5rem",
        textAlign: "center",
        cursor: loading ? "wait" : "pointer",
        background: dragging ? "#E1F5EE" : COLORS.bgSecondary,
        transition: "all 0.15s",
        opacity: loading ? 0.6 : 1,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
      />
      <i className="ti ti-upload" style={{ fontSize: 32, color: dragging ? "#1D9E75" : COLORS.textMuted, marginBottom: 8, display: "block" }} aria-hidden="true" />
      <p style={{ margin: 0, fontWeight: 500, color: COLORS.text, fontSize: 15 }}>
        {loading ? "Analisando..." : "Enviar CSV do JMeter"}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.textMuted }}>
        Arraste o arquivo ou clique para selecionar
      </p>
    </div>
  );
}

function BarChart({ data, colorFn, labelKey, valueKey, title }) {
  const max = Math.max(...data.map(d => d[valueKey]));
  return (
    <div>
      {title && <p style={{ margin: "0 0 10px", fontSize: 12, color: COLORS.textMuted, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{title}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: COLORS.textMuted, minWidth: 30, textAlign: "right", fontFamily: "var(--font-mono)" }}>{d[labelKey]}</span>
            <div style={{ flex: 1, background: COLORS.bgSecondary, borderRadius: 3, height: 16, overflow: "hidden" }}>
              <div style={{
                width: max > 0 ? `${(d[valueKey] / max) * 100}%` : "0%",
                height: "100%",
                background: colorFn(d),
                borderRadius: 3,
                transition: "width 0.4s ease",
              }} />
            </div>
            <span style={{ fontSize: 11, color: COLORS.text, minWidth: 36, fontFamily: "var(--font-mono)", fontWeight: 500 }}>{d[valueKey]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecordsTable({ records }) {
  const [page, setPage] = useState(0);
  const perPage = 15;
  const total = records.length;
  const paged = records.slice(page * perPage, (page + 1) * perPage);
  const pages = Math.ceil(total / perPage);

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, tableLayout: "fixed" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              {["#", "Elapsed (ms)", "Latency (ms)", "Bytes", "Sucesso", "Resultado"].map(h => (
                <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: COLORS.textMuted, fontWeight: 500, fontSize: 11, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((r) => {
              const isAnomaly = r.resultado === "Anomalia";
              return (
                <tr key={r.index} style={{ borderBottom: `0.5px solid ${COLORS.border}`, background: isAnomaly ? "#FCEBEB" : "transparent" }}>
                  <td style={{ padding: "5px 8px", fontFamily: "var(--font-mono)", color: COLORS.textMuted }}>{r.index}</td>
                  <td style={{ padding: "5px 8px", fontFamily: "var(--font-mono)" }}>{r.elapsed}</td>
                  <td style={{ padding: "5px 8px", fontFamily: "var(--font-mono)" }}>{r.Latency}</td>
                  <td style={{ padding: "5px 8px", fontFamily: "var(--font-mono)" }}>{r.bytes}</td>
                  <td style={{ padding: "5px 8px" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 500, padding: "2px 6px", borderRadius: 4,
                      background: r.success ? "#EAF3DE" : "#FCEBEB",
                      color: r.success ? "#3B6D11" : "#A32D2D",
                    }}>{r.success ? "OK" : "FAIL"}</span>
                  </td>
                  <td style={{ padding: "5px 8px" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 500, padding: "2px 6px", borderRadius: 4,
                      background: isAnomaly ? "#F7C1C1" : "#C0DD97",
                      color: isAnomaly ? "#791F1F" : "#27500A",
                    }}>{r.resultado}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ fontSize: 12, padding: "3px 10px" }}>← Ant</button>
          <span style={{ fontSize: 12, color: COLORS.textMuted }}>{page + 1} / {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page === pages - 1} style={{ fontSize: 12, padding: "3px 10px" }}>Próx →</button>
        </div>
      )}
    </div>
  );
}

function LatencySparkline({ records }) {
  const w = 640, h = 80;
  const vals = records.map(r => r.elapsed);
  const max = Math.max(...vals, 1);
  const min = Math.min(...vals);
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 8) - 4;
    return `${x},${y}`;
  });
  const anomalyIdxs = records.map((r, i) => r.resultado === "Anomalia" ? i : null).filter(i => i !== null);

  return (
    <div>
      <p style={{ margin: "0 0 6px", fontSize: 11, color: COLORS.textMuted, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Latência por requisição (ms)</p>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 80 }}>
        <polyline points={pts.join(" ")} fill="none" stroke="#1D9E75" strokeWidth={1.5} />
        {anomalyIdxs.map(i => {
          const x = (i / (vals.length - 1)) * w;
          const y = h - ((vals[i] - min) / (max - min || 1)) * (h - 8) - 4;
          return <circle key={i} cx={x} cy={y} r={3} fill="#E24B4A" />;
        })}
      </svg>
      <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 11 }}>
        <span style={{ color: "#1D9E75" }}>— Normal</span>
        <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#E24B4A", verticalAlign: "middle", marginRight: 4 }} />Anomalia</span>
      </div>
    </div>
  );
}

export default function App() {
  const [result, setResult] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiUrl, setApiUrl] = useState(API_URL);
  const [editingUrl, setEditingUrl] = useState(false);

  const fetchBaseline = async (url) => {
    try {
      const r = await fetch(`${url}/baseline`);
      const d = await r.json();
      if (d.disponivel) setBaseline(d);
    } catch {}
  };

  const handleFile = async (file) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const form = new FormData();
    form.append("arquivo", file);

    try {
      const r = await fetch(`${apiUrl}/analisar`, { method: "POST", body: form });
      if (!r.ok) throw new Error(`Erro ${r.status}: ${await r.text()}`);
      const d = await r.json();
      setResult(d);
      await fetchBaseline(apiUrl);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const anomalias = result?.registros?.filter(r => r.resultado === "Anomalia") || [];
  const normais = result?.registros?.filter(r => r.resultado === "Normal") || [];

  const latencyBuckets = result ? (() => {
    const buckets = [0, 500, 1000, 2000, 5000, Infinity];
    const labels = ["<500ms", "500-1s", "1-2s", "2-5s", ">5s"];
    return labels.map((label, i) => ({
      label,
      value: result.registros.filter(r => r.elapsed >= buckets[i] && r.elapsed < buckets[i + 1]).length
    }));
  })() : [];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "var(--font-sans)" }}>
      <h2 className="sr-only">QA_AIOps — Dashboard de Detecção de Anomalias</h2>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <i className="ti ti-activity" style={{ fontSize: 22, color: "#1D9E75" }} aria-hidden="true" />
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>QA_AIOps</h1>
            <span style={{ fontSize: 11, padding: "2px 8px", background: "#E1F5EE", color: "#0F6E56", borderRadius: 20, fontFamily: "var(--font-mono)" }}>v3.0</span>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: COLORS.textMuted }}>Dashboard de monitoramento e detecção de anomalias</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {editingUrl ? (
            <>
              <input
                defaultValue={apiUrl}
                onBlur={(e) => { setApiUrl(e.target.value.replace(/\/$/, "")); setEditingUrl(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") { setApiUrl(e.target.value.replace(/\/$/, "")); setEditingUrl(false); } }}
                style={{ fontSize: 12, width: 260, fontFamily: "var(--font-mono)", padding: "4px 8px" }}
                autoFocus
              />
            </>
          ) : (
            <span style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: "var(--font-mono)", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{apiUrl}</span>
          )}
          <button onClick={() => setEditingUrl(e => !e)} style={{ fontSize: 11, padding: "3px 10px" }}>
            <i className="ti ti-edit" aria-hidden="true" /> URL da API
          </button>
        </div>
      </div>

      {/* Upload */}
      <div style={{ marginBottom: "1.5rem" }}>
        <UploadZone onFile={handleFile} loading={loading} />
      </div>

      {error && (
        <div style={{ background: "#FCEBEB", border: "1px solid #F09595", borderRadius: "var(--border-radius-md)", padding: "0.75rem 1rem", marginBottom: "1.5rem", fontSize: 13, color: "#A32D2D" }}>
          <i className="ti ti-alert-circle" style={{ marginRight: 6 }} aria-hidden="true" />
          {error}
        </div>
      )}

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Alert Banner */}
          <AlertBanner pct={result.pct_anomalias} />

          {/* Metric Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <MetricCard label="Total de requisições" value={result.total} icon="ti-layers" />
            <MetricCard label="Normais" value={result.n_normais} color={COLORS.normal} icon="ti-circle-check" />
            <MetricCard label="Anomalias" value={result.n_anomalias} color={COLORS.anomaly} icon="ti-alert-triangle" />
            <MetricCard label="Taxa de anomalias" value={result.pct_anomalias.toFixed(1)} unit="%" color={result.alerta ? COLORS.anomaly : COLORS.normal} icon="ti-percentage" big />
          </div>

          {/* Baseline comparison */}
          {result.baseline && (
            <div style={{ background: COLORS.bgSecondary, borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem", border: `0.5px solid ${COLORS.border}` }}>
              <p style={{ margin: "0 0 10px", fontSize: 11, color: COLORS.textMuted, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                <i className="ti ti-chart-line" style={{ marginRight: 5 }} aria-hidden="true" />Linha de base (treinamento)
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: COLORS.textMuted }}>Elapsed médio</p>
                  <p style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 500 }}>{Math.round(result.baseline.elapsed_mean)} ms</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: COLORS.textMuted }}>P95 elapsed</p>
                  <p style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 500 }}>{Math.round(result.baseline.elapsed_p95)} ms</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: COLORS.textMuted }}>Taxa de sucesso</p>
                  <p style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 500 }}>{result.baseline.taxa_sucesso?.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Charts row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ background: COLORS.bgSecondary, borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem", border: `0.5px solid ${COLORS.border}` }}>
              <BarChart
                title="Distribuição de latência"
                data={latencyBuckets}
                labelKey="label"
                valueKey="value"
                colorFn={(d) => {
                  const labels = ["<500ms", "500-1s"];
                  return labels.includes(d.label) ? "#1D9E75" : d.label === ">5s" ? "#E24B4A" : "#BA7517";
                }}
              />
            </div>
            <div style={{ background: COLORS.bgSecondary, borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem", border: `0.5px solid ${COLORS.border}` }}>
              <BarChart
                title="Normal vs Anomalia"
                data={[
                  { label: "Normal", value: result.n_normais },
                  { label: "Anomalia", value: result.n_anomalias },
                ]}
                labelKey="label"
                valueKey="value"
                colorFn={(d) => d.label === "Normal" ? "#1D9E75" : "#E24B4A"}
              />
              <div style={{ marginTop: 16, display: "flex", gap: 16 }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 11, color: COLORS.textMuted }}>Sucesso</p>
                  <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 500, color: "#1D9E75" }}>
                    {result.registros.filter(r => r.success).length}
                  </p>
                </div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 11, color: COLORS.textMuted }}>Falha</p>
                  <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 500, color: "#E24B4A" }}>
                    {result.registros.filter(r => !r.success).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sparkline */}
          {result.registros.length > 1 && (
            <div style={{ background: COLORS.bgSecondary, borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem", border: `0.5px solid ${COLORS.border}` }}>
              <LatencySparkline records={result.registros} />
            </div>
          )}

          {/* Features usadas */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: COLORS.textMuted }}>
            <i className="ti ti-cpu" style={{ fontSize: 14 }} aria-hidden="true" />
            Features do modelo:
            {result.features_usadas?.map(f => (
              <span key={f} style={{ fontFamily: "var(--font-mono)", background: COLORS.bgSecondary, padding: "1px 6px", borderRadius: 4, border: `0.5px solid ${COLORS.border}`, color: COLORS.text }}>{f}</span>
            ))}
          </div>

          {/* Records table */}
          <div style={{ background: COLORS.bgSecondary, borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem", border: `0.5px solid ${COLORS.border}` }}>
            <p style={{ margin: "0 0 10px", fontSize: 11, color: COLORS.textMuted, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              <i className="ti ti-table" style={{ marginRight: 5 }} aria-hidden="true" />Registros analisados ({result.total})
            </p>
            <RecordsTable records={result.registros} />
          </div>

        </div>
      )}

      {!result && !loading && (
        <div style={{ textAlign: "center", padding: "3rem 0", color: COLORS.textMuted }}>
          <i className="ti ti-file-upload" style={{ fontSize: 40, display: "block", marginBottom: 12, opacity: 0.4 }} aria-hidden="true" />
          <p style={{ margin: 0, fontSize: 14 }}>Envie um CSV do JMeter para iniciar a análise</p>
        </div>
      )}
    </div>
  );
}
