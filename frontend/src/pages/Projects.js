import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  const fetchProjects = () => {
    axios.get('/api/projects').then(r => { setProjects(r.data); setLoading(false); });
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setError('');
    try {
      await axios.post('/api/projects', form);
      setShowModal(false); setForm({ name: '', description: '' });
      fetchProjects();
    } catch (err) { setError(err.response?.data?.error || 'Failed to create project'); }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    if (!window.confirm('Delete this project? All tasks will be removed.')) return;
    await axios.delete(`/api/projects/${id}`);
    fetchProjects();
  };

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Projects</h1>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <h3>No projects yet</h3>
          <p>{user?.role === 'admin' ? 'Create your first project to get started.' : 'You haven\'t been added to any projects yet.'}</p>
        </div>
      ) : (
        <div className="grid-2">
          {projects.map(p => (
            <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ transition: 'border-color 0.15s, transform 0.15s', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <h3 style={{ fontSize: 16 }}>{p.name}</h3>
                  {(user?.role === 'admin' || p.owner_id === user?.id) && (
                    <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: 12 }}
                      onClick={(e) => handleDelete(p.id, e)}>🗑</button>
                  )}
                </div>
                {p.description && <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>{p.description}</p>}
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text2)' }}>
                  <span>📋 {p.task_count} tasks</span>
                  <span>👥 {p.member_count} members</span>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>by {p.owner_name}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Project</h2>
            <form onSubmit={handleCreate}>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label>Project Name *</label>
                <input className="input" placeholder="My Awesome Project" required
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="input" placeholder="What's this project about?" rows={3} style={{ resize: 'vertical' }}
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
