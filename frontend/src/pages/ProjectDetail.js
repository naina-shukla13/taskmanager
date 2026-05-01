import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const STATUS_COLS = [
  { key: 'todo', label: 'To Do', color: 'var(--text2)' },
  { key: 'in_progress', label: 'In Progress', color: 'var(--accent)' },
  { key: 'done', label: 'Done', color: 'var(--success)' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assignee_id: '' });
  const [memberUserId, setMemberUserId] = useState('');
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';
  const isOwner = project?.owner_id === user?.id;
  const canManage = isAdmin || isOwner;

  const fetchData = async () => {
    const [projRes, taskRes, usersRes] = await Promise.all([
      axios.get(`/api/projects/${id}`),
      axios.get(`/api/tasks/project/${id}`),
      axios.get('/api/users'),
    ]);
    setProject(projRes.data);
    setTasks(taskRes.data);
    setAllUsers(usersRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const openCreate = () => { setEditTask(null); setTaskForm({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assignee_id: '' }); setShowTaskModal(true); };
  const openEdit = (task) => { setEditTask(task); setTaskForm({ title: task.title, description: task.description || '', status: task.status, priority: task.priority, due_date: task.due_date || '', assignee_id: task.assignee_id || '' }); setShowTaskModal(true); };

  const handleTaskSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editTask) {
        await axios.put(`/api/tasks/${editTask.id}`, { ...taskForm, project_id: id });
      } else {
        await axios.post('/api/tasks', { ...taskForm, project_id: id });
      }
      setShowTaskModal(false);
      fetchData();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    await axios.delete(`/api/tasks/${taskId}`);
    fetchData();
  };

  const handleStatusChange = async (taskId, newStatus) => {
    await axios.put(`/api/tasks/${taskId}`, { status: newStatus });
    fetchData();
  };

  const handleAddMember = async (e) => {
    e.preventDefault(); setError('');
    try {
      await axios.post(`/api/projects/${id}/members`, { userId: memberUserId });
      setShowMemberModal(false); setMemberUserId('');
      fetchData();
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    await axios.delete(`/api/projects/${id}/members/${userId}`);
    fetchData();
  };

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;
  if (!project) return <div style={{ padding: 40, color: 'var(--text2)' }}>Project not found.</div>;

  const nonMembers = allUsers.filter(u => !project.members?.some(m => m.id === u.id));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>← Back</button>
      </div>
      <div className="page-header">
        <div>
          <h1>{project.name}</h1>
          {project.description && <p style={{ color: 'var(--text2)', marginTop: 4, fontSize: 14 }}>{project.description}</p>}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {canManage && <button className="btn btn-ghost btn-sm" onClick={() => { setError(''); setShowMemberModal(true); }}>👥 Members ({project.members?.length || 0})</button>}
          <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Add Task</button>
        </div>
      </div>

      {/* Kanban Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {STATUS_COLS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div key={col.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: col.color, display: 'inline-block' }}/>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>{col.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)', background: 'var(--surface2)', padding: '2px 8px', borderRadius: 20 }}>{colTasks.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 100 }}>
                {colTasks.map(task => (
                  <div key={task.id} className="card" style={{ padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontWeight: 500, fontSize: 14, flex: 1 }}>{task.title}</div>
                      <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: 11 }} onClick={() => openEdit(task)}>✏️</button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: 11 }} onClick={() => handleDeleteTask(task.id)}>🗑</button>
                      </div>
                    </div>
                    {task.description && <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>{task.description}</p>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      {task.assignee_name && <span style={{ fontSize: 12, color: 'var(--text2)' }}>👤 {task.assignee_name}</span>}
                    </div>
                    {task.due_date && (
                      <div style={{ fontSize: 12, color: new Date(task.due_date) < new Date() && task.status !== 'done' ? 'var(--danger)' : 'var(--text3)', marginBottom: 8 }}>
                        📅 {task.due_date}
                      </div>
                    )}
                    <select className="input" style={{ fontSize: 12, padding: '4px 8px', marginTop: 4 }}
                      value={task.status} onChange={e => handleStatusChange(task.id, e.target.value)}>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editTask ? 'Edit Task' : 'New Task'}</h2>
            <form onSubmit={handleTaskSubmit}>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label>Title *</label>
                <input className="input" required value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="input" rows={2} style={{ resize: 'vertical' }} value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Status</label>
                  <select className="input" value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select className="input" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Assignee</label>
                <select className="input" value={taskForm.assignee_id} onChange={e => setTaskForm({ ...taskForm, assignee_id: e.target.value })}>
                  <option value="">Unassigned</option>
                  {project.members?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input className="input" type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editTask ? 'Save Changes' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Project Members</h2>
            <div style={{ marginBottom: 20 }}>
              {project.members?.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{m.email}</div>
                  </div>
                  <span className={`badge badge-${m.role}`}>{m.role}</span>
                  {m.id !== project.owner_id && (
                    <button className="btn btn-ghost btn-sm" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => handleRemoveMember(m.id)}>Remove</button>
                  )}
                </div>
              ))}
            </div>
            {nonMembers.length > 0 && (
              <form onSubmit={handleAddMember}>
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-group">
                  <label>Add Member</label>
                  <select className="input" value={memberUserId} onChange={e => setMemberUserId(e.target.value)} required>
                    <option value="">Select a user...</option>
                    {nonMembers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowMemberModal(false)}>Close</button>
                  <button type="submit" className="btn btn-primary">Add Member</button>
                </div>
              </form>
            )}
            {nonMembers.length === 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button className="btn btn-ghost" onClick={() => setShowMemberModal(false)}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
