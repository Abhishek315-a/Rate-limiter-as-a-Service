import React, { useEffect, useState } from 'react';
import api from '../api';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState([]);
  const [name, setName] = useState('');
  const [newKey, setNewKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadKeys() {
    try {
      const { data } = await api.get('/auth/keys');
      setKeys(data.keys);
    } catch (e) { console.error(e); }
  }

  useEffect(() => { loadKeys(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/keys', { name });
      setNewKey(data.apiKey);
      setName('');
      loadKeys();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create key');
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(keyId) {
    if (!window.confirm('Revoke this API key? This cannot be undone.')) return;
    try {
      await api.delete(`/auth/keys/${keyId}`);
      loadKeys();
    } catch (e) { console.error(e); }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>API Keys</h1>
      </div>

      {newKey && (
        <div style={styles.newKeyBanner}>
          <div style={styles.newKeyTitle}>🎉 New API key created — copy it now!</div>
          <code style={styles.newKeyCode}>{newKey}</code>
          <div style={styles.newKeyNote}>This key will not be shown again.</div>
          <button style={styles.dismissBtn} onClick={() => setNewKey(null)}>Dismiss</button>
        </div>
      )}

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Create New Key</h2>
        <form onSubmit={handleCreate} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Key name (e.g. my-app)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button style={loading ? styles.btnDisabled : styles.btn} type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Generate Key'}
          </button>
        </form>
        {error && <div style={styles.error}>{error}</div>}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Your Keys ({keys.length})</h2>
        {keys.length === 0 ? (
          <div style={styles.empty}>No API keys yet. Create one above.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {['Name', 'Prefix', 'Created', 'Last Used', 'Status', ''].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} style={styles.tr}>
                  <td style={styles.td}>{k.name}</td>
                  <td style={styles.td}><code style={styles.prefix}>{k.key_prefix}...</code></td>
                  <td style={styles.td}>{new Date(k.created_at).toLocaleDateString()}</td>
                  <td style={styles.td}>{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : '—'}</td>
                  <td style={styles.td}>
                    <span style={k.is_active ? styles.active : styles.inactive}>
                      {k.is_active ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {k.is_active && (
                      <button style={styles.revokeBtn} onClick={() => handleRevoke(k.id)}>
                        Revoke
                      </button>
                    )}
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
  newKeyBanner: {
    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
    borderRadius: '12px', padding: '20px', marginBottom: '24px',
  },
  newKeyTitle: { fontSize: '14px', fontWeight: '600', color: '#10b981', marginBottom: '10px' },
  newKeyCode: {
    display: 'block', background: '#0f1117', padding: '10px 14px',
    borderRadius: '8px', fontSize: '13px', color: '#a78bfa',
    wordBreak: 'break-all', marginBottom: '8px',
  },
  newKeyNote: { fontSize: '12px', color: '#64748b', marginBottom: '12px' },
  dismissBtn: {
    background: 'none', border: '1px solid rgba(16,185,129,0.3)',
    color: '#10b981', borderRadius: '6px', padding: '6px 14px',
    cursor: 'pointer', fontSize: '13px',
  },
  section: { background: '#1a1d2e', border: '1px solid #1e2235', borderRadius: '12px', padding: '24px', marginBottom: '20px' },
  sectionTitle: { fontSize: '15px', fontWeight: '600', color: '#e2e8f0', marginBottom: '16px' },
  form: { display: 'flex', gap: '12px', alignItems: 'center' },
  input: {
    background: '#0f1117', border: '1px solid #2d3148', borderRadius: '8px',
    padding: '10px 14px', color: '#f1f5f9', fontSize: '14px',
    outline: 'none', flex: 1,
  },
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
  error: { marginTop: '12px', color: '#f87171', fontSize: '13px' },
  empty: { color: '#475569', fontSize: '14px', padding: '20px 0' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 12px', fontSize: '12px', color: '#64748b', fontWeight: '600', borderBottom: '1px solid #1e2235' },
  tr: { borderBottom: '1px solid #1e2235' },
  td: { padding: '12px', fontSize: '13px', color: '#94a3b8' },
  prefix: { background: '#0f1117', padding: '2px 6px', borderRadius: '4px', color: '#a78bfa', fontSize: '12px' },
  active: { background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '3px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  inactive: { background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '3px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  revokeBtn: {
    background: 'none', border: '1px solid rgba(239,68,68,0.3)',
    color: '#f87171', borderRadius: '6px', padding: '4px 10px',
    cursor: 'pointer', fontSize: '12px',
  },
};
