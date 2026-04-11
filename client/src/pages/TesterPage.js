import React, { useState } from 'react';
import axios from 'axios';

const INIT = { apiKey: '', identifier: 'user_123', resource: 'login', limit: '5', window: '1m' };

export default function TesterPage() {
  const [form, setForm] = useState(INIT);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleCheck(e) {
    e.preventDefault();
    setLoading(true);
    const start = Date.now();
    try {
      const { data, status } = await axios.post(
        '/api/v1/check',
        {
          identifier: form.identifier,
          resource: form.resource,
          limit: parseInt(form.limit),
          window: form.window,
        },
        { headers: { 'X-API-Key': form.apiKey } }
      );
      const latency = Date.now() - start;
      setResults((prev) => [{ ...data, status, latency, ts: new Date().toLocaleTimeString() }, ...prev.slice(0, 19)]);
    } catch (err) {
      const latency = Date.now() - start;
      const data = err.response?.data || { allowed: false };
      const status = err.response?.status || 0;
      setResults((prev) => [{ ...data, status, latency, ts: new Date().toLocaleTimeString() }, ...prev.slice(0, 19)]);
    } finally {
      setLoading(false);
    }
  }

  async function handleBurst() {
    setResults([]);
    for (let i = 0; i < 8; i++) {
      const start = Date.now();
      try {
        const { data, status } = await axios.post(
          '/api/v1/check',
          { identifier: form.identifier, resource: form.resource, limit: parseInt(form.limit), window: form.window },
          { headers: { 'X-API-Key': form.apiKey } }
        );
        const latency = Date.now() - start;
        setResults((prev) => [{ ...data, status, latency, ts: new Date().toLocaleTimeString() }, ...prev]);
      } catch (err) {
        const latency = Date.now() - start;
        const data = err.response?.data || { allowed: false };
        const status = err.response?.status || 0;
        setResults((prev) => [{ ...data, status, latency, ts: new Date().toLocaleTimeString() }, ...prev]);
      }
      await new Promise((r) => setTimeout(r, 80));
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Live Tester</h1>
        <p style={styles.subtitle}>Fire requests against the rate limiter and watch it respond in real time</p>
      </div>

      <div style={styles.layout}>
        <div style={styles.formCard}>
          <h2 style={styles.sectionTitle}>Request Config</h2>
          <form onSubmit={handleCheck} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>API Key</label>
              <input
                style={styles.input}
                placeholder="rlaas_..."
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                required
              />
            </div>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Identifier</label>
                <input style={styles.input} value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Resource</label>
                <input style={styles.input} value={form.resource} onChange={(e) => setForm({ ...form, resource: e.target.value })} />
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Limit</label>
                <input style={styles.input} type="number" min="1" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Window</label>
                <input style={styles.input} placeholder="1m" value={form.window} onChange={(e) => setForm({ ...form, window: e.target.value })} />
              </div>
            </div>
            <div style={styles.actions}>
              <button style={loading ? styles.btnDisabled : styles.btn} type="submit" disabled={loading}>
                Send Request
              </button>
              <button type="button" style={styles.burstBtn} onClick={handleBurst} disabled={loading}>
                🔥 Burst x8
              </button>
              <button type="button" style={styles.clearBtn} onClick={() => setResults([])}>
                Clear
              </button>
            </div>
          </form>
        </div>

        <div style={styles.resultsCard}>
          <h2 style={styles.sectionTitle}>Results <span style={styles.count}>{results.length} requests</span></h2>
          {results.length === 0 ? (
            <div style={styles.empty}>Results will appear here. Press "Send Request" or "Burst x8".</div>
          ) : (
            <div style={styles.resultsList}>
              {results.map((r, i) => (
                <div key={i} style={r.allowed ? styles.resultAllowed : styles.resultBlocked}>
                  <div style={styles.resultTop}>
                    <span style={r.allowed ? styles.statusAllowed : styles.statusBlocked}>
                      {r.allowed ? '✅ Allowed' : '❌ Blocked'}
                    </span>
                    <span style={styles.statusCode}>HTTP {r.status}</span>
                    <span style={styles.latency}>{r.latency}ms</span>
                    <span style={styles.ts}>{r.ts}</span>
                  </div>
                  <div style={styles.resultMeta}>
                    <span>Remaining: <strong style={{ color: '#e2e8f0' }}>{r.remaining ?? '—'}</strong></span>
                    <span>Limit: <strong style={{ color: '#e2e8f0' }}>{r.limit ?? '—'}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '32px' },
  header: { marginBottom: '28px' },
  title: { fontSize: '22px', fontWeight: '700', color: '#f1f5f9' },
  subtitle: { fontSize: '14px', color: '#64748b', marginTop: '4px' },
  layout: { display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px' },
  formCard: { background: '#1a1d2e', border: '1px solid #1e2235', borderRadius: '12px', padding: '24px' },
  resultsCard: { background: '#1a1d2e', border: '1px solid #1e2235', borderRadius: '12px', padding: '24px' },
  sectionTitle: { fontSize: '15px', fontWeight: '600', color: '#e2e8f0', marginBottom: '16px' },
  count: { fontSize: '12px', color: '#64748b', fontWeight: '400', marginLeft: '8px' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: '500', color: '#64748b' },
  input: {
    background: '#0f1117', border: '1px solid #2d3148', borderRadius: '8px',
    padding: '9px 12px', color: '#f1f5f9', fontSize: '13px', outline: 'none',
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  actions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  btn: {
    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff',
    border: 'none', borderRadius: '8px', padding: '10px 18px',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  btnDisabled: {
    background: '#2d3148', color: '#64748b', border: 'none', borderRadius: '8px',
    padding: '10px 18px', fontSize: '13px', fontWeight: '600', cursor: 'not-allowed',
  },
  burstBtn: {
    background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)',
    borderRadius: '8px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  clearBtn: {
    background: 'none', border: '1px solid #2d3148', color: '#64748b',
    borderRadius: '8px', padding: '10px 14px', fontSize: '13px', cursor: 'pointer',
  },
  empty: { color: '#475569', fontSize: '14px', padding: '30px 0', textAlign: 'center' },
  resultsList: { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '520px', overflowY: 'auto' },
  resultAllowed: {
    background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)',
    borderRadius: '8px', padding: '10px 14px',
  },
  resultBlocked: {
    background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: '8px', padding: '10px 14px',
  },
  resultTop: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' },
  statusAllowed: { fontSize: '13px', fontWeight: '600', color: '#10b981' },
  statusBlocked: { fontSize: '13px', fontWeight: '600', color: '#ef4444' },
  statusCode: { fontSize: '12px', color: '#64748b' },
  latency: { fontSize: '12px', color: '#7c3aed', background: 'rgba(124,58,237,0.1)', padding: '2px 6px', borderRadius: '4px' },
  ts: { fontSize: '11px', color: '#475569', marginLeft: 'auto' },
  resultMeta: { display: 'flex', gap: '16px', fontSize: '12px', color: '#64748b' },
};
