import React, { useState } from 'react';
import { Switch, Route, useLocation, useHistory } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import OverviewPage from './OverviewPage';
import ApiKeysPage from './ApiKeysPage';
import RulesPage from './RulesPage';
import TesterPage from './TesterPage';

const NAV = [
  { path: '/', label: 'Overview' },
  { path: '/keys', label: 'API Keys' },
  { path: '/rules', label: 'Rules' },
  { path: '/tester', label: 'Live Tester' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const history = useHistory();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleNav(path) { history.push(path); setSidebarOpen(false); }

  return (
    <div className="rlaas-shell">
      <div className="rlaas-topbar">
        <button style={styles.hamburger} onClick={() => setSidebarOpen(true)}>&#9776;</button>
        <span style={styles.wordmark}>rlaas</span>
      </div>
      <div className={`rlaas-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`rlaas-sidebar${sidebarOpen ? ' open' : ''}`} style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <div style={styles.logo}>
            <span style={styles.logoDot} />
            <span style={styles.logoText}>rlaas</span>
          </div>
          <nav style={styles.nav}>
            {NAV.map((item) => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  style={active ? styles.navItemActive : styles.navItem}
                  onClick={() => handleNav(item.path)}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
        <div style={styles.sidebarBottom}>
          <button style={styles.themeBtn} onClick={toggleTheme}>
            {isDark ? '☀️ Light mode' : '🌙 Dark mode'}
          </button>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>{user?.email?.[0]?.toUpperCase()}</div>
            <div style={styles.userEmail}>{user?.email}</div>
          </div>
          <button style={styles.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </aside>

      <main className="rlaas-main" style={styles.main}>
        <Switch>
          <Route exact path="/" component={OverviewPage} />
          <Route path="/keys" component={ApiKeysPage} />
          <Route path="/rules" component={RulesPage} />
          <Route path="/tester" component={TesterPage} />
        </Switch>
      </main>
    </div>
  );
}

const styles = {
  hamburger: {
    background: 'none', border: 'none', color: 'var(--text)',
    fontSize: '18px', cursor: 'pointer', padding: '4px 8px', lineHeight: 1,
  },
  wordmark: {
    fontFamily: "'SF Mono', 'Fira Code', 'Menlo', monospace",
    fontSize: '15px', fontWeight: '700', color: '#7c3aed', letterSpacing: '-0.02em',
  },
  sidebar: {
    background: 'var(--surface2)',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    justifyContent: 'space-between', padding: '20px 0',
  },
  sidebarTop: { display: 'flex', flexDirection: 'column' },
  logo: { display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', marginBottom: '28px' },
  logoDot: {
    display: 'inline-block', width: '8px', height: '8px',
    borderRadius: '50%', background: '#7c3aed', flexShrink: 0,
  },
  logoText: {
    fontFamily: "'SF Mono', 'Fira Code', 'Menlo', monospace",
    fontSize: '15px', fontWeight: '700', color: 'var(--text)', letterSpacing: '-0.02em',
  },
  nav: { display: 'flex', flexDirection: 'column', padding: '0 8px' },
  navItem: {
    display: 'flex', alignItems: 'center',
    background: 'none', border: 'none', borderLeft: '2px solid transparent',
    color: 'var(--text4)', padding: '8px 14px',
    cursor: 'pointer', fontSize: '13px', fontWeight: '400',
    textAlign: 'left', width: '100%', letterSpacing: '0.01em',
  },
  navItemActive: {
    display: 'flex', alignItems: 'center',
    background: 'rgba(124,58,237,0.07)', border: 'none',
    borderLeft: '2px solid #7c3aed',
    color: 'var(--text)', padding: '8px 14px',
    cursor: 'pointer', fontSize: '13px', fontWeight: '500',
    textAlign: 'left', width: '100%', letterSpacing: '0.01em',
  },
  sidebarBottom: { padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '8px' },
  themeBtn: {
    background: 'none', border: '1px solid var(--border2)', color: 'var(--text4)',
    borderRadius: '8px', padding: '8px 12px', cursor: 'pointer',
    fontSize: '12px', fontWeight: '500', width: '100%', textAlign: 'left',
  },
  userInfo: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px' },
  avatar: {
    width: '30px', height: '30px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: '700', color: '#fff', flexShrink: 0,
  },
  userEmail: { fontSize: '12px', color: 'var(--text4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  logoutBtn: {
    background: 'none', border: '1px solid var(--border2)', color: 'var(--text4)',
    borderRadius: '8px', padding: '8px 12px', cursor: 'pointer',
    fontSize: '13px', fontWeight: '500', width: '100%',
  },
  main: { background: 'var(--bg)' },
};
