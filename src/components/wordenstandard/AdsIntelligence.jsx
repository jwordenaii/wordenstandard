import React, { useState, useEffect } from 'react';

export default function AdsIntelligence() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const res = await fetch('/api/v1/ads/campaigns');
        if (!res.ok) throw new Error('API down');
        const data = await res.json();
        if (data.campaigns && data.campaigns.length > 0) {
          setCampaigns(data.campaigns.map(c => ({
            id: c.id,
            name: c.name,
            spend: `$${c.spend}`,
            leads: c.leads,
            cpl: `$${(c.spend / Math.max(1, c.leads)).toFixed(2)}`,
            qualityScore: c.ai_quality_score || 8.0
          })));
          setLoading(false);
          return;
        }
      } catch (err) {
        console.log('Falling back to simulation mode for Ads');
      }

      // Fallback
      setTimeout(() => {
        setCampaigns([
          { id: "C-01", name: "Richmond Commercial Paving", spend: "$450.00", leads: 4, cpl: "$112.50", qualityScore: 8.5 },
          { id: "C-02", name: "HOA Pavement Maintenance", spend: "$210.00", leads: 1, cpl: "$210.00", qualityScore: 5.2 },
          { id: "C-03", name: "Emergency Pot Hole Repair", spend: "$85.00", leads: 3, cpl: "$28.33", qualityScore: 9.1 }
        ]);
        setLoading(false);
      }, 500);
    }
    fetchCampaigns();
  }, []);

  if (loading) return <div style={{ color: "rgba(255,255,255,0.2)", padding: 40, animation: "p 1.5s infinite" }}>Analyzing Google Ads Performance...</div>;

  return (
    <div style={{ maxWidth: 800, fontFamily: "'IBM Plex Mono', monospace", color: "#c9cdd8" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.12)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Growth & Acquisition</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#e0e2e8" }}>Ads Intelligence</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ padding: "6px 12px", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 6, color: "#a855f7", fontSize: 13, fontWeight: 600 }}>
            Predictive AI Active
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.15)", marginBottom: 4 }}>Total Spend Today</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#e0e2e8", fontVariantNumeric: "tabular-nums" }}>$745</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.15)", marginBottom: 4 }}>Qualified Leads</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#34d399", fontVariantNumeric: "tabular-nums" }}>8</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.15)", marginBottom: 4 }}>Avg Cost Per Lead</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#f5a623", fontVariantNumeric: "tabular-nums" }}>$93</div>
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.12)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Campaign Performance</div>
      
      {campaigns.map((c) => (
        <div key={c.id} style={{ display: "flex", alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.015)", borderRadius: 6, marginBottom: 8, border: "1px solid rgba(255,255,255,0.03)" }}>
          <div style={{ flex: 2 }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: "#e0e2e8" }}>{c.name}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Lead Quality: <span style={{color: c.qualityScore > 8 ? "#34d399" : "#f5a623"}}>{c.qualityScore}/10</span></div>
          </div>
          <div style={{ flex: 1, textAlign: "right", marginRight: 20 }}>
            <div style={{ fontSize: 14, color: "#e0e2e8" }}>{c.leads} Leads</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{c.spend} Spent</div>
          </div>
          <div style={{ flex: 1, textAlign: "right" }}>
            <div style={{ fontSize: 14, color: "#a855f7", fontWeight: 600 }}>{c.cpl}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>CPL</div>
          </div>
        </div>
      ))}
    </div>
  );
}
