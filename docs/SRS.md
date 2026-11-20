# Software Requirements Specification

## Functional requirements

Students register, submit categorized complaints, upload evidence, track status history, receive notifications, reopen unresolved complaints and submit feedback.

Administrators review all complaints, reject or approve requests, assign maintenance staff, update status and priority, manage users and departments, and view analytics.

Maintenance staff view only assigned tasks, update progress, record notes and submit resolution evidence.

Management users have read-only access to volume, resolution, SLA, department and staff performance analytics.

## Non-functional requirements

- Passwords are bcrypt hashed.
- APIs use JWT bearer authentication and role authorization.
- Protected ownership checks prevent unauthorized complaint access.
- HTTP headers and rate limiting improve security.
- The interface is responsive across desktop, tablet and mobile.
- MongoDB indexes and references support scalable querying.
