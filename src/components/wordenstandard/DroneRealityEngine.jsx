import React, { useState, useEffect } from 'react';

export default function DroneRealityEngine() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeScan, setActiveScan] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Mock initial data load since backend might not have real data yet
  useEffect(() => {
    setTimeout(() => {
      setScans([
        { id: "DS-8842", site: "Midlothian Plaza", type: "LiDAR", status: "Processed", timestamp: "2026-05-16 14:30", alerts: 0 },
        { id: "DS-8843", site: "Richmond Civic Center", type: "Photogrammetry", status: "Requires Review", timestamp: "2026-05-17 08:15", alerts: 2 },
        { id: "DS-8844", site: "Chester Residential Sub", type: "Thermal", status: "Active Flight", timestamp: "2026-05-17 09:40", alerts: 0 }
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const analyzeScan = (scanId) => {
    setProcessing(true);
    // Simulate AI processing of the spatial point cloud
    setTimeout(() => {
      alert(`Spatial AI Analysis Complete for ${scanId}.\nDeviation from plan: 0.02 inches.\nAsphalt volume required: +12 Tons.`);
      setProcessing(false);
    }, 1500);
  };

  if (loading) {
    return <div style={{ color: "rgba(255,255,255,0.2)", padding: 40, animation: "p 1.5s infinite" }}>Connecting to DJI Fleet...</div>;
  }

  return (
    <div style={{ maxWidth: 800, fontFamily: "'IBM Plex Mono', monospace", color: "#c9cdd8" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.12)", letterSpacing: "0.08em", textTransform: "uppercase" }}>UAV Telemetry</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#e0e2e8" }}>Reality Engine</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ padding: "6px 12px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 6, color: "#22c55e", fontSize: 13, fontWeight: 600 }}>
            ● 2 Drones Airborne
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.15)", marginBottom: 4 }}>Total Point Cloud Area</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#f5a623", fontVariantNumeric: "tabular-nums" }}>14.2M sqft</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.15)", marginBottom: 4 }}>Spatial Deviations</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#ef4444", fontVariantNumeric: "tabular-nums" }}>2</div>
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.12)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Flight Logs & Data Cubes</div>
      
      {scans.map((scan) => (
        <div key={scan.id} style={{ display: "flex", alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.015)", borderRadius: 6, marginBottom: 8, border: "1px solid rgba(255,255,255,0.03)" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: scan.status === "Active Flight" ? "#3b82f6" : scan.alerts > 0 ? "#ef4444" : "#22c55e", marginRight: 14 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: "#e0e2e8" }}>{scan.site}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.15)", marginTop: 2 }}>{scan.id} • {scan.type} • {scan.timestamp}</div>
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", marginRight: 16 }}>{scan.status}</div>
          <button 
            onClick={() => analyzeScan(scan.id)}
            disabled={processing}
            style={{ padding: "6px 14px", background: "#f5a623", color: "#08090e", border: "none", borderRadius: 4, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: processing ? "wait" : "pointer" }}>
            {processing ? "..." : "AI Analyze"}
          </button>
        </div>
      ))}
    </div>
  );
}
