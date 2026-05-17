import React, { useState, useEffect } from 'react';

export default function CrewWearables() {
  const [crew, setCrew] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching from crew_wearables_router
    setTimeout(() => {
      setCrew([
        { id: "W-01", name: "Tyler M.", hr: 112, heatIndex: 88, status: "Normal", lastDrink: "45 mins ago" },
        { id: "W-02", name: "James K.", hr: 135, heatIndex: 92, status: "Elevated HR", lastDrink: "90 mins ago" },
        { id: "W-03", name: "Steve R.", hr: 98, heatIndex: 88, status: "Normal", lastDrink: "20 mins ago" }
      ]);
      setLoading(false);
    }, 400);
  }, []);

  if (loading) return <div style={{ color: "rgba(255,255,255,0.2)", padding: 40, animation: "p 1.5s infinite" }}>Connecting to Crew Wearables...</div>;

  return (
    <div style={{ maxWidth: 800, fontFamily: "'IBM Plex Mono', monospace", color: "#c9cdd8" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.12)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Health & Safety</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#e0e2e8" }}>Biometric Wearables</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ padding: "6px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, color: "#ef4444", fontSize: 13, fontWeight: 600 }}>
            1 Alert Active
          </div>
        </div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 14, color: "#e0e2e8", marginBottom: 12 }}>OSHA Heat Stress Prevention</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
          Site temperature is currently 88°F. Jarvis recommends a mandatory 10-minute water break in the shade within the next 15 minutes to comply with OSHA heat exposure thresholds.
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.12)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Crew Telemetry</div>
      
      {crew.map((c) => (
        <div key={c.id} style={{ display: "flex", alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.015)", borderRadius: 6, marginBottom: 8, border: "1px solid rgba(255,255,255,0.03)" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.status === "Normal" ? "#22c55e" : "#ef4444", marginRight: 14 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: "#e0e2e8" }}>{c.name}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Last Hydration: {c.lastDrink}</div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>Heart Rate</div>
            <div style={{ fontSize: 18, color: c.hr > 120 ? "#ef4444" : "#e0e2e8", fontWeight: 600 }}>{c.hr} <span style={{fontSize:10, color:"rgba(255,255,255,0.2)"}}>BPM</span></div>
          </div>
          <div style={{ flex: 1, textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>Core Temp Estimate</div>
            <div style={{ fontSize: 16, color: "#f5a623", fontWeight: 600 }}>{c.heatIndex}°F</div>
          </div>
        </div>
      ))}
    </div>
  );
}
