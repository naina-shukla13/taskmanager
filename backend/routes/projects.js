const express = require('express');
const router = express.Router();
const { prepare } = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/projects - all projects user has access to
router.get('/', (req, res) => {
  const projects = prepare(`
    SELECT p.*, u.name as owner_name,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count
    FROM projects p
    JOIN users u ON p.owner_id = u.id
    WHERE p.owner_id = ? OR p.id IN (
      SELECT project_id FROM project_members WHERE user_id = ?
    )
    ORDER BY p.created_at DESC
  `).all(req.user.id, req.user.id);
  res.json(projects);
});

// POST /api/projects - create project (admin only)
router.post('/', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can create projects' });
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name required' });

  const result = prepare('INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)').run(name, description || '', req.user.id);
  // Add owner as member too
  prepare('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)').run(result.lastInsertRowid, req.user.id);

  const project = prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(project);
});

// GET /api/projects/:id
router.get('/:id', (req, res) => {
  const project = prepare(`
    SELECT p.*, u.name as owner_name FROM projects p
    JOIN users u ON p.owner_id = u.id WHERE p.id = ?
  `).get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  // Check access
  const isMember = prepare('SELECT 1 FROM project_members WHERE project_id=? AND user_id=?').get(req.params.id, req.user.id);
  if (project.owner_id !== req.user.id && !isMember)
    return res.status(403).json({ error: 'Access denied' });

  const members = prepare(`
    SELECT u.id, u.name, u.email, u.role FROM users u
    JOIN project_members pm ON u.id = pm.user_id WHERE pm.project_id = ?
  `).all(req.params.id);

  res.json({ ...project, members });
});

// PUT /api/projects/:id
router.put('/:id', (req, res) => {
  const project = prepare('SELECT * FROM projects WHERE id=?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  if (project.owner_id !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Only owner/admin can edit' });

  const { name, description } = req.body;
  prepare('UPDATE projects SET name=?, description=? WHERE id=?').run(name || project.name, description ?? project.description, req.params.id);
  res.json(prepare('SELECT * FROM projects WHERE id=?').get(req.params.id));
});

// DELETE /api/projects/:id
router.delete('/:id', (req, res) => {
  const project = prepare('SELECT * FROM projects WHERE id=?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  if (project.owner_id !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Only owner/admin can delete' });

  prepare('DELETE FROM projects WHERE id=?').run(req.params.id);
  res.json({ message: 'Project deleted' });
});

// POST /api/projects/:id/members - add member
router.post('/:id/members', (req, res) => {
  const project = prepare('SELECT * FROM projects WHERE id=?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (project.owner_id !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Only owner/admin can add members' });

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const user = prepare('SELECT id, name, email, role FROM users WHERE id=?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  prepare('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)').run(req.params.id, userId);
  res.json({ message: 'Member added', user });
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', (req, res) => {
  const project = prepare('SELECT * FROM projects WHERE id=?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  if (project.owner_id !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Only owner/admin can remove members' });

  prepare('DELETE FROM project_members WHERE project_id=? AND user_id=?').run(req.params.id, req.params.userId);
  res.json({ message: 'Member removed' });
});

module.exports = router;
