import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../api';

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ ...styles.card, borderTop: `3px solid ${color}` }}>
      <div style={styles.cardLabel}>{label}</div>
      <div style={{ ...styles.cardValue, color }}>{value}</div>
      {sub && <div style={styles.cardSub}>{sub}</div>}
    </div>
  );
}

export default function OverviewPage() {
  const [summary, setSummary] = useState(null);
  const [timeSeries, setTimeSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, t] = await Promise.all([
          api.get('/stats'),
          api.get('/stats/timeseries'),
        ]);
        setSummary(s.data);
        setTimeSeries(
          t.data.data.map((row) => ({
            hour: new Date(row.hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            Allowed: parseInt(row.allowed),
            Blocked: parseInt(row.blocked),
          }))
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Overview</h1>
        <span style={styles.badge}>Last 24 hours</span>
      </div>

      <div style={styles.grid}>
        <StatCard
          label="Total Requests"
          value={summary?.totalRequests?.toLocaleString() ?? '0'}
          color="#7c3aed"
        />
        <StatCard
          label="Allowed"
          value={summary?.allowedRequests?.toLocaleString() ?? '0'}
          color="#10b981"
        />
        <StatCard
          label="Blocked"
          value={summary?.blockedRequests?.toLocaleString() ?? '0'}
          color="#ef4444"
        />
        <StatCard
          label="Block Rate"
          value={summary?.blockRate ?? '0%'}
          sub="of total traffic"
          color="#f59e0b"
        />
      </div>

      <div style={styles.chartCard}>
        <h2 style={styles.chartTitle}>Request Traffic (24h)</h2>
        {timeSeries.length === 0 ? (
          <div style={styles.empty}>
            No traffic data yet. Start making requests to <code style={styles.code}>/api/v1/check</code>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={timeSeries} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2235" />
              <XAxis dataKey="hour" stroke="#475569" tick={{ fontSize: 12 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: 'var(--tooltip-bg)', border: '1px solid var(--border2)', borderRadius: '8px' }}
                labelStyle={{ color: 'var(--text3)' }}
              />
              <Legend wrapperStyle={{ fontSize: '13px' }} />
              <Line type="monotone" dataKey="Allowed" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Blocked" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '32px' },
  header: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' },
  title: { fontSize: '22px', fontWeight: '700', color: 'var(--text)' },
  badge: {
    background: 'rgba(124,58,237,0.15)', color: '#a78bfa',
    borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '500',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '20px',
  },
  cardLabel: { fontSize: '13px', color: 'var(--text4)', marginBottom: '8px', fontWeight: '500' },
  cardValue: { fontSize: '28px', fontWeight: '700' },
  cardSub: { fontSize: '12px', color: 'var(--text5)', marginTop: '4px' },
  chartCard: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '24px',
  },
  chartTitle: { fontSize: '15px', fontWeight: '600', color: 'var(--text2)', marginBottom: '20px' },
  empty: { color: 'var(--text5)', fontSize: '14px', textAlign: 'center', padding: '40px 0' },
  code: { background: 'var(--input-bg)', padding: '2px 6px', borderRadius: '4px', color: '#a78bfa' },
  loading: { padding: '60px', textAlign: 'center', color: 'var(--text5)' },
};
