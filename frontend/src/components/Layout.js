import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: 'var(--surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '24px 0', position: 'sticky', top: 0, height: '100vh'
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
            Task<span style={{ color: 'var(--accent)' }}>Flow</span>
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff'
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{user?.name}</div>
              <span className={`badge badge-${user?.role}`} style={{ fontSize: 11, padding: '1px 8px' }}>{user?.role}</span>
            </div>
          </div>
        </div>

        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {[
            { to: '/dashboard', label: '📊 Dashboard' },
            { to: '/projects', label: '📁 Projects' },
          ].map(({ to, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'block', padding: '10px 12px', borderRadius: 'var(--radius-sm)',
              marginBottom: 4, fontSize: 14, fontWeight: 500, transition: 'all 0.15s',
              background: isActive ? 'rgba(108,99,255,0.15)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text2)',
            })}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto', background: 'var(--bg)' }}>
        <Outlet />
      </main>
    </div>
  );
}
