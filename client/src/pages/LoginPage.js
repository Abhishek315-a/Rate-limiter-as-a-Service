import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const history = useHistory();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const { data } = await api.post(endpoint, { email, password });
      login(data.user, data.token);
      history.push('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-left" style={styles.left}>
        <div style={styles.brand}>
          <div style={styles.brandMark}>
            <span style={styles.dot} />
            <span style={styles.wordmark}>rlaas</span>
          </div>
          <p style={styles.brandDesc}>Rate limiting infrastructure.<br />Per-user, per-resource, configurable.</p>
        </div>
        <div style={styles.featureList}>
          <div style={styles.feature}>Token Bucket &amp; Sliding Window algorithms</div>
          <div style={styles.feature}>Named rules — define once, apply anywhere</div>
          <div style={styles.feature}>Real-time request logs &amp; traffic charts</div>
        </div>
      </div>

      <div className="login-right" style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.title}>{isRegister ? 'Create account' : 'Sign in'}</h2>
          <p style={styles.subtitle}>{isRegister ? 'Start rate limiting in minutes.' : 'Continue to your dashboard.'}</p>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button style={loading ? styles.btnDisabled : styles.btn} type="submit" disabled={loading}>
              {loading ? 'Signing in...' : (isRegister ? 'Create account' : 'Sign in')}
            </button>
          </form>

          <p style={styles.toggle}>
            {isRegister ? 'Already have an account? ' : 'No account? '}
            <button style={styles.link} onClick={() => { setIsRegister(!isRegister); setError(''); }}>
              {isRegister ? 'Sign in' : 'Register'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { background: 'var(--bg)' },
  left: {
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
    padding: '60px', borderRight: '1px solid var(--border)',
    background: 'var(--surface2)',
  },
  right: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px',
  },
  brand: { marginBottom: '48px' },
  brandMark: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' },
  dot: {
    display: 'inline-block', width: '10px', height: '10px',
    borderRadius: '50%', background: '#7c3aed', flexShrink: 0,
  },
  wordmark: {
    fontFamily: "'SF Mono', 'Fira Code', 'Menlo', monospace",
    fontSize: '20px', fontWeight: '700', color: 'var(--text)', letterSpacing: '-0.02em',
  },
  brandDesc: {
    fontSize: '15px', color: 'var(--text3)', lineHeight: '1.6',
    fontWeight: '400',
  },
  featureList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  feature: {
    fontSize: '13px', color: 'var(--text4)',
    paddingLeft: '16px', borderLeft: '2px solid var(--border2)',
    lineHeight: '1.5',
  },
  card: {
    width: '100%', maxWidth: '360px',
  },
  title: { fontSize: '20px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' },
  subtitle: { fontSize: '13px', color: 'var(--text4)', marginBottom: '28px' },
  error: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#f87171',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '14px',
    marginBottom: '20px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: 'var(--text3)' },
  input: {
    background: 'var(--input-bg)',
    border: '1px solid var(--border2)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: 'var(--text)',
    fontSize: '14px',
    outline: 'none',
  },
  btn: {
    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  btnDisabled: {
    background: 'var(--border2)',
    color: 'var(--text4)',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'not-allowed',
    marginTop: '8px',
  },
  toggle: { textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text4)' },
  link: {
    background: 'none',
    border: 'none',
    color: '#7c3aed',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    padding: 0,
  },
};
