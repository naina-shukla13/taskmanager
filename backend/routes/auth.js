const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prepare } = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const { name, email, password, role = 'member' } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email, and password are required' });

  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const validRole = ['admin', 'member'].includes(role) ? role : 'member';

  try {
    const hashed = bcrypt.hashSync(password, 10);
    const stmt = prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
    const result = stmt.run(name, email.toLowerCase(), hashed, validRole);

    const user = { id: result.lastInsertRowid, name, email: email.toLowerCase(), role: validRole };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid credentials' });

  const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: payload });
});

module.exports = router;
