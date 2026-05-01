const express = require('express');
const router = express.Router();
const { prepare } = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/tasks - get all tasks for user (dashboard)
router.get('/', (req, res) => {
  const tasks = prepare(`
    SELECT t.*, p.name as project_name, u.name as assignee_name, cb.name as created_by_name
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN users cb ON t.created_by = cb.id
    WHERE t.assignee_id = ? OR t.created_by = ?
    ORDER BY t.created_at DESC
  `).all(req.user.id, req.user.id);
  res.json(tasks);
});

// GET /api/tasks/project/:projectId
router.get('/project/:projectId', (req, res) => {
  const project = prepare('SELECT * FROM projects WHERE id=?').get(req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const isMember = prepare('SELECT 1 FROM project_members WHERE project_id=? AND user_id=?').get(req.params.projectId, req.user.id);
  if (project.owner_id !== req.user.id && !isMember)
    return res.status(403).json({ error: 'Access denied' });

  const tasks = prepare(`
    SELECT t.*, u.name as assignee_name, cb.name as created_by_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN users cb ON t.created_by = cb.id
    WHERE t.project_id = ?
    ORDER BY t.created_at DESC
  `).all(req.params.projectId);
  res.json(tasks);
});

// POST /api/tasks
router.post('/', (req, res) => {
  const { title, description, status = 'todo', priority = 'medium', due_date, project_id, assignee_id } = req.body;
  if (!title || !project_id) return res.status(400).json({ error: 'Title and project_id required' });

  // Check project access
  const project = prepare('SELECT * FROM projects WHERE id=?').get(project_id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const isMember = prepare('SELECT 1 FROM project_members WHERE project_id=? AND user_id=?').get(project_id, req.user.id);
  if (project.owner_id !== req.user.id && !isMember)
    return res.status(403).json({ error: 'Access denied' });

  const result = prepare(`
    INSERT INTO tasks (title, description, status, priority, due_date, project_id, assignee_id, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, description || '', status, priority, due_date || null, project_id, assignee_id || null, req.user.id);

  const task = prepare(`
    SELECT t.*, u.name as assignee_name, cb.name as created_by_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN users cb ON t.created_by = cb.id
    WHERE t.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(task);
});

// PUT /api/tasks/:id
router.put('/:id', (req, res) => {
  const task = prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const project = prepare('SELECT * FROM projects WHERE id=?').get(task.project_id);
  const isMember = prepare('SELECT 1 FROM project_members WHERE project_id=? AND user_id=?').get(task.project_id, req.user.id);
  const canEdit = project.owner_id === req.user.id || task.created_by === req.user.id || task.assignee_id === req.user.id || isMember;
  if (!canEdit) return res.status(403).json({ error: 'Access denied' });

  const { title, description, status, priority, due_date, assignee_id } = req.body;
  prepare(`
    UPDATE tasks SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      status = COALESCE(?, status),
      priority = COALESCE(?, priority),
      due_date = COALESCE(?, due_date),
      assignee_id = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title, description, status, priority, due_date, assignee_id !== undefined ? assignee_id : task.assignee_id, req.params.id);

  const updated = prepare(`
    SELECT t.*, u.name as assignee_name, cb.name as created_by_name
    FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id LEFT JOIN users cb ON t.created_by = cb.id
    WHERE t.id = ?
  `).get(req.params.id);
  res.json(updated);
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const task = prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Not found' });

  const project = prepare('SELECT * FROM projects WHERE id=?').get(task.project_id);
  if (task.created_by !== req.user.id && project.owner_id !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Access denied' });

  prepare('DELETE FROM tasks WHERE id=?').run(req.params.id);
  res.json({ message: 'Task deleted' });
});

module.exports = router;
