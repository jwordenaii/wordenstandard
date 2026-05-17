import React, { useState, useEffect } from 'react';

export default function ThermalCompaction() {
  const [rollers, setRollers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching from compaction_router
    setTimeout(() => {
      setRollers([
        { id: "CB-54", status: "Active Compaction", temp: "285°F", passes: 4, targetDensity: "94%", currentDensity: "92.5%" },
        { id: "DD-110", status: "Waiting on laydown", temp: "Ambient", passes: 0, targetDensity: "96%", currentDensity: "N/A" }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) return <div style={{ color: "rgba(255,255,255,0.2)", padding: 40, animation: "p 1.5s infinite" }}>Syncing Roller Telemetry...</div>;

  return (
    <div style={{ maxWidth: 800, fontFamily: "'IBM Plex Mono', monospace", color: "#c9cdd8" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.12)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Quality Assurance</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#e0e2e8" }}>Intelligent Compaction</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ padding: "6px 12px", background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 6, color: "#f5a623", fontSize: 13, fontWeight: 600 }}>
            Thermal Map Active
          </div>
        </div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 14, color: "#e0e2e8", marginBottom: 12 }}>Mat Temperature Delta</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
          Live thermal imaging indicates the breakdown roller is operating within the optimal 280-300°F temperature window. No cold spots detected in the last 400 linear feet.
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.12)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Roller Telemetry Feed</div>
      
      {rollers.map((r) => (
        <div key={r.id} style={{ display: "flex", alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.015)", borderRadius: 6, marginBottom: 8, border: "1px solid rgba(255,255,255,0.03)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: "#e0e2e8" }}>Roller {r.id}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Status: <span style={{color: r.status.includes("Active") ? "#22c55e" : "#f5a623"}}>{r.status}</span></div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>Surface Temp</div>
            <div style={{ fontSize: 18, color: r.temp === "Ambient" ? "#e0e2e8" : "#ef4444", fontWeight: 600 }}>{r.temp}</div>
          </div>
          <div style={{ flex: 1, textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>Pass {r.passes} Density</div>
            <div style={{ fontSize: 16, color: "#34d399", fontWeight: 600 }}>{r.currentDensity} <span style={{fontSize: 12, color: "rgba(255,255,255,0.2)"}}>/ {r.targetDensity}</span></div>
          </div>
        </div>
      ))}
    </div>
  );
}
