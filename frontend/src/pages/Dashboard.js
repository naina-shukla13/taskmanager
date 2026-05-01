import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const statusLabel = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/users/dashboard').then(r => { setStats(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;

  const statItems = [
    { label: 'My Tasks', value: stats?.totalTasks || 0, color: 'var(--accent)' },
    { label: 'In Progress', value: stats?.inProgressTasks || 0, color: 'var(--warn)' },
    { label: 'Completed', value: stats?.doneTasks || 0, color: 'var(--success)' },
    { label: 'Overdue', value: stats?.overdueTasks || 0, color: 'var(--danger)' },
    { label: 'My Projects', value: stats?.myProjects || 0, color: 'var(--accent2)' },
    { label: 'To Do', value: stats?.todoTasks || 0, color: 'var(--text2)' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: 'var(--text2)', marginTop: 4, fontSize: 14 }}>Welcome back, {user?.name} 👋</p>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 32 }}>
        {statItems.map(({ label, value, color }) => (
          <div key={label} className="card stat-card">
            <div className="stat-value" style={{ color }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 18, marginBottom: 16 }}>Recent Activity</h2>
      {stats?.recentTasks?.length === 0 ? (
        <div className="empty-state">
          <h3>No tasks yet</h3>
          <p>Join a project and get assigned tasks to see them here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {stats?.recentTasks?.map(task => (
            <div key={task.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, marginBottom: 2 }}>{task.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>{task.project_name}</div>
              </div>
              <span className={`badge badge-${task.status}`}>{statusLabel[task.status]}</span>
              <span className={`badge badge-${task.priority}`}>{task.priority}</span>
              {task.due_date && (
                <span style={{ fontSize: 12, color: new Date(task.due_date) < new Date() && task.status !== 'done' ? 'var(--danger)' : 'var(--text2)' }}>
                  📅 {task.due_date}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
