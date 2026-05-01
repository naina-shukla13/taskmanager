========================================
  TASKFLOW - Team Task Manager
  Full-Stack Web Application
========================================

OVERVIEW
--------
TaskFlow is a full-stack team task management web app with role-based access control.
Built with Node.js/Express backend, SQLite database, and React frontend.

LIVE URL
--------
[Add your Railway URL here after deployment]

GITHUB REPO
-----------
[Add your GitHub repo URL here]

FEATURES
--------
Authentication:
  - Signup with name, email, password, and role selection (Admin/Member)
  - Login with JWT-based sessions (7-day tokens)
  - Protected routes on both frontend and backend

Role-Based Access Control:
  - Admin: Can create/delete projects, manage members, create/delete any task
  - Member: Can view assigned projects, create tasks within projects, update task status

Project Management:
  - Create, view, and delete projects (Admin only)
  - Add/remove team members per project
  - View project member list

Task Management:
  - Create tasks with title, description, status, priority, assignee, due date
  - Kanban board view: To Do / In Progress / Done columns
  - Edit and delete tasks
  - One-click status updates from the board
  - Overdue task highlighting

Dashboard:
  - Personal task stats (total, in-progress, done, overdue)
  - Project count
  - Recent task activity feed

TECH STACK
----------
Backend:
  - Node.js + Express.js
  - better-sqlite3 (SQLite, zero-config database)
  - bcryptjs (password hashing)
  - jsonwebtoken (JWT authentication)

Frontend:
  - React 18
  - React Router v6
  - Axios
  - Custom CSS (no UI library)

Deployment:
  - Railway (monorepo: frontend builds to static, backend serves it)

DATABASE SCHEMA
---------------
users       - id, name, email, password (hashed), role, created_at
projects    - id, name, description, owner_id, created_at
project_members - project_id, user_id (many-to-many)
tasks       - id, title, description, status, priority, due_date,
              project_id, assignee_id, created_by, created_at, updated_at

REST API ENDPOINTS
------------------
POST   /api/auth/signup         - Register new user
POST   /api/auth/login          - Login, returns JWT

GET    /api/projects            - List user's projects
POST   /api/projects            - Create project (Admin)
GET    /api/projects/:id        - Get project with members
PUT    /api/projects/:id        - Update project
DELETE /api/projects/:id        - Delete project
POST   /api/projects/:id/members     - Add member
DELETE /api/projects/:id/members/:uid - Remove member

GET    /api/tasks               - My tasks (dashboard)
GET    /api/tasks/project/:id   - Tasks for a project
POST   /api/tasks               - Create task
PUT    /api/tasks/:id           - Update task
DELETE /api/tasks/:id           - Delete task

GET    /api/users               - All users (for assignment)
GET    /api/users/me            - Current user profile
GET    /api/users/dashboard     - Dashboard stats
PUT    /api/users/:id/role      - Update role (Admin)

LOCAL SETUP
-----------
1. Clone the repository
2. cd backend && npm install
3. cd ../frontend && npm install
4. cd ../backend && node server.js
5. cd ../frontend && npm start
6. Open http://localhost:3000

RAILWAY DEPLOYMENT
------------------
1. Push to GitHub
2. Go to railway.app → New Project → Deploy from GitHub
3. Select this repository
4. Railway auto-detects the railway.toml config
5. Set environment variable: JWT_SECRET=your_secret_key
6. Deploy → your app will be live in ~3 minutes

ENVIRONMENT VARIABLES
---------------------
JWT_SECRET   - Secret key for JWT signing (default provided, change in production)
PORT         - Server port (Railway sets this automatically)
NODE_ENV     - Set to "production" for Railway

VALIDATION & SECURITY
---------------------
- All inputs validated server-side
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens expire after 7 days
- Role-based middleware on all protected routes
- SQL injection prevented via parameterized queries
- CORS enabled for cross-origin requests

========================================
