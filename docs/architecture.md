# Architecture

```text
React / Vite / Recharts
          |
       Axios API
          |
Express REST API
  Authentication / RBAC
  Complaint workflow
          |
MongoDB + Mongoose
Users, Complaints, History,
Notifications, Departments, Feedback
```

Complaint transitions are:
Submitted -> Under Review -> Assigned -> In Progress -> Resolved -> Closed.
Resolved or closed complaints may be reopened.
