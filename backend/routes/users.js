const express = require('express');
const router = express.Router();
const { prepare } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/users - list all users (for assigning tasks / adding members)
router.get('/', (req, res) => {
  const users = prepare('SELECT id, name, email, role, created_at FROM users ORDER BY name').all();
  res.json(users);
});

// GET /api/users/me
router.get('/me', (req, res) => {
  const user = prepare('SELECT id, name, email, role, created_at FROM users WHERE id=?').get(req.user.id);
  res.json(user);
});

// GET /api/users/dashboard - stats for current user
router.get('/dashboard', (req, res) => {
  const totalTasks = prepare('SELECT COUNT(*) as count FROM tasks WHERE assignee_id=?').get(req.user.id)?.count || 0;
  const todoTasks = prepare("SELECT COUNT(*) as count FROM tasks WHERE assignee_id=? AND status='todo'").get(req.user.id)?.count || 0;
  const inProgressTasks = prepare("SELECT COUNT(*) as count FROM tasks WHERE assignee_id=? AND status='in_progress'").get(req.user.id)?.count || 0;
  const doneTasks = prepare("SELECT COUNT(*) as count FROM tasks WHERE assignee_id=? AND status='done'").get(req.user.id)?.count || 0;
  const overdueTasks = prepare(`
    SELECT COUNT(*) as count FROM tasks
    WHERE assignee_id=? AND due_date < date('now') AND status != 'done'
  `).get(req.user.id)?.count || 0;

  const myProjects = prepare(`
    SELECT COUNT(DISTINCT p.id) as count FROM projects p
    LEFT JOIN project_members pm ON p.id = pm.project_id
    WHERE p.owner_id = ? OR pm.user_id = ?
  `).get(req.user.id, req.user.id)?.count || 0;

  const recentTasks = prepare(`
    SELECT t.*, p.name as project_name, u.name as assignee_name
    FROM tasks t JOIN projects p ON t.project_id = p.id
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.assignee_id = ? OR t.created_by = ?
    ORDER BY t.updated_at DESC LIMIT 5
  `).all(req.user.id, req.user.id);

  res.json({ totalTasks, todoTasks, inProgressTasks, doneTasks, overdueTasks, myProjects, recentTasks });
});

// PUT /api/users/:id/role - admin only
router.put('/:id/role', adminOnly, (req, res) => {
  const { role } = req.body;
  if (!['admin', 'member'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  prepare('UPDATE users SET role=? WHERE id=?').run(role, req.params.id);
  res.json({ message: 'Role updated' });
});

module.exports = router;
