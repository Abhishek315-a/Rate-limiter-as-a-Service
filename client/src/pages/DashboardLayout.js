import React from 'react';
import { Switch, Route, useLocation, useHistory } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import OverviewPage from './OverviewPage';
import ApiKeysPage from './ApiKeysPage';
import RulesPage from './RulesPage';
import TesterPage from './TesterPage';

const NAV = [
  { path: '/', label: 'Overview', icon: '📊' },
  { path: '/keys', label: 'API Keys', icon: '🔑' },
  { path: '/rules', label: 'Rules', icon: '📋' },
  { path: '/tester', label: 'Live Tester', icon: '🧪' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const history = useHistory();

  function handleNav(path) { history.push(path); }

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>⚡</span>
            <span style={styles.logoText}>RLaaS</span>
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
                  <span style={styles.navIcon}>{item.icon}</span>
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

      <main style={styles.main}>
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
  shell: { display: 'flex', height: '100vh', overflow: 'hidden' },
  sidebar: {
    width: '220px', minWidth: '220px',
    background: 'var(--surface2)',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    justifyContent: 'space-between', padding: '24px 0',
  },
  sidebarTop: { display: 'flex', flexDirection: 'column' },
  logo: { display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', marginBottom: '32px' },
  logoIcon: { fontSize: '22px' },
  logoText: { fontSize: '18px', fontWeight: '700', color: '#7c3aed' },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 12px' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'none', border: 'none', color: 'var(--text4)',
    padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '14px', fontWeight: '500', textAlign: 'left', width: '100%',
  },
  navItemActive: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'rgba(124,58,237,0.15)', border: 'none',
    color: '#a78bfa', padding: '10px 12px', borderRadius: '8px',
    cursor: 'pointer', fontSize: '14px', fontWeight: '600',
    textAlign: 'left', width: '100%',
  },
  navIcon: { fontSize: '16px' },
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
  main: { flex: 1, overflow: 'auto', background: 'var(--bg)' },
};
