import React, { useEffect, useState } from 'react';
import api from '../api';

const EMPTY_FORM = { name: '', limit: '', window: '', algorithm: 'token_bucket' };

export default function RulesPage() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadRules() {
    try {
      const { data } = await api.get('/rules');
      setRules(data.rules);
    } catch (e) { console.error(e); }
  }

  useEffect(() => { loadRules(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/rules/${editingId}`, form);
      } else {
        await api.post('/rules', form);
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      loadRules();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save rule');
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(rule) {
    setEditingId(rule.id);
    setForm({
      name: rule.name,
      limit: rule.limit_count,
      window: `${rule.window_seconds}s`,
      algorithm: rule.algorithm,
    });
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this rule?')) return;
    try {
      await api.delete(`/rules/${id}`);
      loadRules();
    } catch (e) { console.error(e); }
  }

  function formatWindow(seconds) {
    if (seconds >= 86400) return `${seconds / 86400}d`;
    if (seconds >= 3600) return `${seconds / 3600}h`;
    if (seconds >= 60) return `${seconds / 60}m`;
    return `${seconds}s`;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Rules</h1>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>{editingId ? 'Edit Rule' : 'Create Rule'}</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Rule name (e.g. free-tier-api)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            style={{ ...styles.input, width: '100px' }}
            placeholder="Limit"
            type="number"
            min="1"
            value={form.limit}
            onChange={(e) => setForm({ ...form, limit: e.target.value })}
            required
          />
          <input
            style={{ ...styles.input, width: '100px' }}
            placeholder="Window"
            value={form.window}
            onChange={(e) => setForm({ ...form, window: e.target.value })}
            required
          />
          <select
            style={styles.select}
            value={form.algorithm}
            onChange={(e) => setForm({ ...form, algorithm: e.target.value })}
          >
            <option value="token_bucket">Token Bucket</option>
          </select>
          <button style={loading ? styles.btnDisabled : styles.btn} type="submit" disabled={loading}>
            {loading ? 'Saving...' : (editingId ? 'Update' : 'Create')}
          </button>
          {editingId && (
            <button
              type="button"
              style={styles.cancelBtn}
              onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}
            >
              Cancel
            </button>
          )}
        </form>
        <div style={styles.hint}>Window format: 30s, 5m, 1h, 1d</div>
        {error && <div style={styles.error}>{error}</div>}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Your Rules ({rules.length})</h2>
        {rules.length === 0 ? (
          <div style={styles.empty}>No rules yet. Create one above to get started.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {['Name', 'Limit', 'Window', 'Algorithm', 'Created', ''].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} style={styles.tr}>
                  <td style={styles.td}><strong style={{ color: '#e2e8f0' }}>{r.name}</strong></td>
                  <td style={styles.td}><span style={styles.pill}>{r.limit_count} req</span></td>
                  <td style={styles.td}><span style={styles.pill}>{formatWindow(r.window_seconds)}</span></td>
                  <td style={styles.td}><span style={styles.algoPill}>{r.algorithm}</span></td>
                  <td style={styles.td}>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={styles.editBtn} onClick={() => handleEdit(r)}>Edit</button>
                      <button style={styles.deleteBtn} onClick={() => handleDelete(r.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '32px' },
  header: { marginBottom: '28px' },
  title: { fontSize: '22px', fontWeight: '700', color: '#f1f5f9' },
  section: { background: '#1a1d2e', border: '1px solid #1e2235', borderRadius: '12px', padding: '24px', marginBottom: '20px' },
  sectionTitle: { fontSize: '15px', fontWeight: '600', color: '#e2e8f0', marginBottom: '16px' },
  form: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' },
  input: {
    background: '#0f1117', border: '1px solid #2d3148', borderRadius: '8px',
    padding: '10px 14px', color: '#f1f5f9', fontSize: '14px',
    outline: 'none', flex: 1, minWidth: '140px',
  },
  select: {
    background: '#0f1117', border: '1px solid #2d3148', borderRadius: '8px',
    padding: '10px 14px', color: '#f1f5f9', fontSize: '14px',
    outline: 'none', cursor: 'pointer',
  },
  hint: { fontSize: '12px', color: '#475569', marginTop: '8px' },
  btn: {
    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff',
    border: 'none', borderRadius: '8px', padding: '10px 20px',
    fontSize: '14px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  btnDisabled: {
    background: '#2d3148', color: '#64748b', border: 'none', borderRadius: '8px',
    padding: '10px 20px', fontSize: '14px', fontWeight: '600',
    cursor: 'not-allowed', whiteSpace: 'nowrap',
  },
  cancelBtn: {
    background: 'none', border: '1px solid #2d3148', color: '#94a3b8',
    borderRadius: '8px', padding: '10px 16px', fontSize: '14px',
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  error: { marginTop: '12px', color: '#f87171', fontSize: '13px' },
  empty: { color: '#475569', fontSize: '14px', padding: '20px 0' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 12px', fontSize: '12px', color: '#64748b', fontWeight: '600', borderBottom: '1px solid #1e2235' },
  tr: { borderBottom: '1px solid #1e2235' },
  td: { padding: '12px', fontSize: '13px', color: '#94a3b8' },
  pill: { background: 'rgba(124,58,237,0.15)', color: '#a78bfa', padding: '3px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  algoPill: { background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '3px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  editBtn: {
    background: 'none', border: '1px solid #2d3148', color: '#94a3b8',
    borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px',
  },
  deleteBtn: {
    background: 'none', border: '1px solid rgba(239,68,68,0.3)',
    color: '#f87171', borderRadius: '6px', padding: '4px 10px',
    cursor: 'pointer', fontSize: '12px',
  },
};
