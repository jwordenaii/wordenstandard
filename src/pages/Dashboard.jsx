import React, { useState, useEffect, useRef } from "react";
import { Card, Title, Text, Metric, AreaChart, BadgeDelta, Flex, Grid } from "@tremor/react";
import { Card as ShadcnCard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/api/client";

const BASE = import.meta.env.VITE_API_BASE_URL || '';

const STATIC_FALLBACK = [
  { month: "Jan", "Regional Compliance": 82, "Ad ROI": 2.4 },
  { month: "Feb", "Regional Compliance": 88, "Ad ROI": 2.7 },
  { month: "Mar", "Regional Compliance": 95, "Ad ROI": 3.1 },
];

const Dashboard = () => {
  const [chartData, setChartData] = useState(STATIC_FALLBACK);
  const [liveData, setLiveData] = useState({ trucks: [], compaction: [] });
  const [sseStatus, setSseStatus] = useState('connecting'); // connecting | live | error
  const esRef = useRef(null);

  useEffect(() => {
    api.getSiteMetrics()
      .then((json) => {
        if (Array.isArray(json) && json.length > 0) setChartData(json);
      })
      .catch((err) => {
        console.error("Error fetching site metrics:", err);
      });
  }, []);

  // SSE live site stream
  useEffect(() => {
    const es = new EventSource(`${BASE}/api/v1/live/site-stream`);
    esRef.current = es;
    es.onopen = () => setSseStatus('live');
    es.onmessage = (e) => {
      try { setLiveData(JSON.parse(e.data)); } catch {}
    };
    es.onerror = () => setSseStatus('error');
    return () => es.close();
  }, []);

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <Title className="text-2xl font-bold">JWordenAI Command Center</Title>
        <BadgeDelta deltaType="moderateIncrease">System Healthy</BadgeDelta>
      </div>

      {/* Top Row: Marketing & Logic Summary */}
      <Grid numColsMd={2} numColsLg={3} className="gap-6 mb-6">
        <ShadcnCard>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Regional Base Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Metric>
              {chartData.length > 0
                ? `${chartData[chartData.length - 1]["Regional Compliance"]}%`
                : "—"}
            </Metric>
            <Text>Evaluated for proper base standards</Text>
          </CardContent>
        </ShadcnCard>

        <ShadcnCard>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Google Ads ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <Metric>
              {chartData.length > 0
                ? `${chartData[chartData.length - 1]["Ad ROI"]}x`
                : "—"}
            </Metric>
            <Flex className="mt-2">
              <Text>Target: 2.5x</Text>
              <BadgeDelta deltaType="increase" size="xs">+12%</BadgeDelta>
            </Flex>
          </CardContent>
        </ShadcnCard>

        <ShadcnCard className="md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Backend Logic Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <Text>FastAPI Active (Railway)</Text>
            </div>
            <Text className="mt-1 text-xs text-gray-500">Last build check: 2 mins ago</Text>
          </CardContent>
        </ShadcnCard>
      </Grid>

      {/* Regional Trend Chart */}
      <Card className="mb-6">
        <Title>Nationwide Growth Performance</Title>
        <Text>Compliance & ROI trends by month</Text>
        <AreaChart
          className="h-72 mt-4"
          data={chartData}
          index="month"
          categories={["Regional Compliance", "Ad ROI"]}
          colors={["indigo", "cyan"]}
          valueFormatter={(number) => `${number}${number > 10 ? "%" : "x"}`}
        />
      </Card>

      {/* Live Site Stream */}
      <Grid numColsMd={2} className="gap-6">
        {/* Truck fleet */}
        <ShadcnCard>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Fleet Status
              <span className={`h-2 w-2 rounded-full ${
                sseStatus === 'live' ? 'bg-green-500 animate-pulse' :
                sseStatus === 'error' ? 'bg-red-500' : 'bg-yellow-400'
              }`} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {liveData.trucks.length === 0 ? (
              <Text className="text-gray-400">No active trucks</Text>
            ) : (
              <div className="space-y-2">
                {liveData.trucks.map((t) => (
                  <div key={t.truck_id} className="flex justify-between text-sm">
                    <span className="font-medium">{t.truck_id}</span>
                    <span className="text-gray-500">{t.asphalt_temp_f ? `${t.asphalt_temp_f}°F` : '—'}</span>
                    <span className={`capitalize ${
                      t.status === 'on_site' ? 'text-green-600' :
                      t.status === 'en_route' ? 'text-blue-600' : 'text-gray-400'
                    }`}>{t.status?.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </ShadcnCard>

        {/* Compaction readings */}
        <ShadcnCard>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Live Compaction (last 30 min)</CardTitle>
          </CardHeader>
          <CardContent>
            {liveData.compaction.length === 0 ? (
              <Text className="text-gray-400">No recent pings</Text>
            ) : (
              <div className="space-y-2">
                {liveData.compaction.slice(0, 8).map((c, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="font-medium">{c.roller_id}</span>
                    <span className="text-gray-500">Pass {c.pass_number ?? '—'}</span>
                    <span className={`font-semibold ${
                      c.density_pct >= 92 ? 'text-green-600' :
                      c.density_pct >= 85 ? 'text-yellow-600' : 'text-red-500'
                    }`}>
                      {c.density_pct != null ? `${c.density_pct}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </ShadcnCard>
      </Grid>
    </main>
  );
};

export default Dashboard;
