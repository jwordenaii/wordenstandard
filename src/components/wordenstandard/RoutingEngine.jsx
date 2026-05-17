import React, { useState, useEffect } from 'react';

export default function RoutingEngine() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching from kickserv_router / dispatch_router
    setTimeout(() => {
      setRoutes([
        { id: "R-102", truck: "Tri-Axle 04", driver: "Mike S.", status: "En Route to Plant", eta: "14 mins", distance: "8.2 mi", payload: "Empty" },
        { id: "R-103", truck: "Lowboy 01", driver: "Dave R.", status: "At Jobsite", eta: "Arrived", distance: "0 mi", payload: "Milling Machine" },
        { id: "R-104", truck: "Tri-Axle 07", driver: "John D.", status: "En Route to Job", eta: "22 mins", distance: "14.5 mi", payload: "18 Tons SM-12.5A" },
      ]);
      setLoading(false);
    }, 600);
  }, []);

  if (loading) return <div style={{ color: "rgba(255,255,255,0.2)", padding: 40, animation: "p 1.5s infinite" }}>Calculating Nearest-Neighbor Routes...</div>;

  return (
    <div style={{ maxWidth: 800, fontFamily: "'IBM Plex Mono', monospace", color: "#c9cdd8" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.12)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Logistics Control</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#e0e2e8" }}>Fleet Routing Engine</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ padding: "6px 12px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 6, color: "#3b82f6", fontSize: 13, fontWeight: 600 }}>
            3 Active Assets
          </div>
        </div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 14, color: "#e0e2e8", marginBottom: 12 }}>Nearest-Neighbor Optimization</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
          AI route optimization is active. Saving an estimated 14% on diesel costs today by avoiding I-95 congestion zones and rerouting Tri-Axles through Route 1.
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.12)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Live Dispatch Board</div>
      
      {routes.map((r) => (
        <div key={r.id} style={{ display: "flex", alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.015)", borderRadius: 6, marginBottom: 8, border: "1px solid rgba(255,255,255,0.03)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: "#e0e2e8" }}>{r.truck} <span style={{fontSize: 12, color: "rgba(255,255,255,0.3)"}}>• {r.driver}</span></div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Payload: <span style={{color: "#f5a623"}}>{r.payload}</span></div>
          </div>
          <div style={{ textAlign: "right", marginRight: 20 }}>
            <div style={{ fontSize: 14, color: r.status.includes("En Route") ? "#3b82f6" : "#22c55e" }}>{r.status}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>ETA: {r.eta} ({r.distance})</div>
          </div>
          <button style={{ padding: "6px 14px", background: "rgba(255,255,255,0.05)", color: "#e0e2e8", border: "none", borderRadius: 4, fontFamily: "inherit", fontSize: 12, cursor: "pointer" }}>
            Re-Route
          </button>
        </div>
      ))}
    </div>
  );
}
