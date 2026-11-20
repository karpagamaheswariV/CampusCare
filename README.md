# CampusCare - Smart Campus Complaint Management System

CampusCare is a full-stack MERN application for submitting, assigning, tracking and resolving campus complaints.

## Features

- Four role-based dashboards: Student, Administrator, Maintenance, and Management
- JWT authentication and bcrypt password hashing
- Complaint submission with image uploads and duplicate warnings
- Complaint workflow, status history, reopening and feedback
- Maintenance assignment and resolution evidence
- In-app notifications
- Dynamic KPI cards and analytics
- CSV report export
- Responsive navy and blue interface
- Persistent local MongoDB database (`campuscare`) by default

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Student | student@campus.edu | Campus@123 |
| Admin | admin@campus.edu | Campus@123 |
| Maintenance | maintenance@campus.edu | Campus@123 |
| Management | management@campus.edu | Campus@123 |

## Setup

1. Install dependencies:
   ```bash
   npm install
   npm install --prefix client
   npm install --prefix server
   ```
2. Ensure the MongoDB service is running. The server uses `mongodb://127.0.0.1:27017/campuscare` by default; override `MONGO_URI` in `server/.env` to use MongoDB Atlas.
3. Start both applications:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173`.

In MongoDB Compass, connect to `mongodb://127.0.0.1:27017`, then refresh the database list and open `campuscare`. The server creates this database and its collections on first startup.

## API

- Authentication: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- Complaints: `/api/complaints`, `/api/complaints/my`, `/api/complaints/:id`
- Workflow: `/api/complaints/:id/assign`, `/api/complaints/:id/status`, `/api/complaints/:id/reopen`
- Maintenance: `/api/maintenance/tasks`
- Dashboards: `/api/dashboard/student`, `/api/dashboard/admin`, `/api/dashboard/maintenance`, `/api/dashboard/management`
- Users and departments: `/api/users`, `/api/departments`
- Notifications: `/api/notifications`

## Production build

```bash
npm run build
npm start
```

The frontend can be deployed to Vercel and the Express API to Render. Set `CLIENT_URL` to the deployed frontend URL and `MONGO_URI` to MongoDB Atlas.
