import React, { useState } from 'react';
import { Switch, Route, useLocation, useHistory } from 'react-router-dom';
import { useAuth } from '../AuthContext';
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
    width: '220px',
    minWidth: '220px',
    background: '#13151f',
    borderRight: '1px solid #1e2235',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '24px 0',
  },
  sidebarTop: { display: 'flex', flexDirection: 'column' },
  logo: { display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', marginBottom: '32px' },
  logoIcon: { fontSize: '22px' },
  logoText: { fontSize: '18px', fontWeight: '700', color: '#7c3aed' },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 12px' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'none', border: 'none', color: '#64748b',
    padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '14px', fontWeight: '500', textAlign: 'left', width: '100%',
    transition: 'all 0.15s',
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
  userInfo: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px' },
  avatar: {
    width: '30px', height: '30px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: '700', color: '#fff',
  },
  userEmail: { fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  logoutBtn: {
    background: 'none', border: '1px solid #2d3148', color: '#64748b',
    borderRadius: '8px', padding: '8px 12px', cursor: 'pointer',
    fontSize: '13px', fontWeight: '500', width: '100%',
    transition: 'all 0.15s',
  },
  main: { flex: 1, overflow: 'auto', background: '#0f1117' },
};
