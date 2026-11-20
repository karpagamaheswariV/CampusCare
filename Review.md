# CampusCare Review Comments

## Overall assessment

CampusCare is a strong full-stack MERN prototype with role-based dashboards, complaint workflows, file uploads, notifications, and analytics. The feature set is broad and the role separation is clear. The project is usable for a demo, but several security, reliability, and maintainability issues should be addressed before production use.

## Positive observations

- **Complete workflow:** Supports complaint submission, assignment, status updates, resolution, reopening, closure, and feedback.
- **Role-based access:** The frontend routes and backend middleware separate Student, Admin, Maintenance, and Management responsibilities.
- **Useful security foundations:** Password hashing, JWT authentication, Helmet, CORS configuration, rate limiting, input limits, and authorization checks are present.
- **Data modeling:** Mongoose schemas provide validation and reflect the complaint lifecycle well.
- **Practical setup documentation:** The README clearly explains installation, demo accounts, API areas, and production deployment concepts.
- **Manual browser coverage:** A Playwright script exercises the landing page, student submission, notifications, dashboards, mobile login, and password-reset page.

## High-priority concerns

1. **Frontend API URL is hard-coded to localhost**

   `client/src/api.js` uses `http://localhost:5000/api`, so the deployed frontend cannot automatically communicate with a deployed backend. Introduce an environment variable such as `VITE_API_URL` and use that as the Axios base URL.

2. **Forgot-password flow is insecure in development and incomplete in production**

   The backend currently exposes `devResetToken` under development conditions. Returning reset tokens in API responses is risky and should only be exposed in a tightly controlled test environment. No email delivery implementation is visible; production currently responds with instructions but does not send a reset link or token.

3. **Demo credentials and automatic seeding are enabled by default**

   `server.js` seeds known accounts with the shared password `Campus@123` every startup when they do not exist. The README also publishes these credentials. This is convenient for demos but unsafe for a public or production deployment. Restrict seeding to development or require an explicit seed command and environment flag.

4. **Uploaded files are not adequately restricted or validated**

   Multer validates only file size. It does not use an allowlist of MIME types or extensions, and the public `/uploads` route can serve any uploaded file. Restrict uploads to approved image types, validate file content, generate safer filenames, and consider object storage for production.

5. **Authorization and lifecycle logic need stronger server-side enforcement**

   Status transitions are implemented, but the public complaint routes and mutation endpoints should be reviewed for object-level authorization, reassignment, and terminal-state edge cases. Prevent admins or maintenance staff from performing actions outside their ownership or role, and ensure updates are atomic where possible.

## Medium-priority concerns

1. **Search parameters use regular expressions constructed from user input**

   Values supplied to `RegExp` in complaint search could produce ReDoS risk for crafted input and may cause database-side exceptions for invalid patterns. Prefer MongoDB text search or escape user input before constructing regular expressions.

2. **Dashboard calculations are expensive and load full complaint collections**

   Several dashboard endpoints retrieve every complaint and then filter in JavaScript. This will become slow as data grows. Add MongoDB aggregation pipelines, indexes, and pagination for analytics and list endpoints.

3. **Ticket IDs are not generated with collision protection**

   `ticketId` is based on the final six digits of `Date.now()`. Rapid submissions could collide. Use a MongoDB counter, UUID, or an atomic sequence mechanism for reliably unique ticket IDs.

4. **Duplicate detection is limited**

   Duplicate complaints match the same student, active status, category, and location/building/room. It may miss near-duplicates or flag unrelated complaints. Improve matching with a normalized description/title comparison or allow a staff workflow to explicitly merge duplicates.

5. **Error handling can expose implementation details**

   The global error handler returns `err.message`, which may reveal internal database or library errors. In production, log the full error internally and return a sanitized generic message for 5xx responses.

6. **The client stores authentication data directly in `localStorage`**

   This is common for SPAs, but XSS can expose the JWT and user object. For stronger security, consider short-lived access tokens with secure, HTTP-only cookies or a carefully implemented refresh-token flow.

7. **The `Remember me` checkbox is non-functional**

   The control does not affect session lifetime or persistence. Either implement it or remove it to avoid misleading users.

## Frontend recommendations

- Replace hard-coded API URLs with `import.meta.env.VITE_API_URL`.
- Centralize loading, API error, and retry behavior instead of using repeated inline toast handling.
- Split the 270-line monolithic `App.jsx` into route, layout, dashboard, and feature components.
- Replace `window.prompt` and `window.confirm` flows with accessible dialogs or forms for assigning staff, reopening complaints, confirming resolutions, and submitting feedback.
- Add client-side validation for registration fields and file types; never rely only on server validation.
- Remove or implement unused routes and placeholder content such as the Management Reports page.
- The forgot-password UI appears to implement reset-token entry, but the submit path should be verified carefully and aligned with a secure email-link flow.

## Backend and data recommendations

- Move business logic out of `server.js` into controllers and route modules to improve testability.
- Add automated unit and integration tests for authentication, role authorization, transitions, duplicate detection, uploads, and dashboard calculations.
- Validate all request bodies with `express-validator` or a schema library instead of relying on a few manual checks.
- Lowercase and trim emails consistently in every create/update path.
- Normalize role and status values and prevent privileged role changes without explicit authorization.
- Add database indexes for frequent queries such as student complaints, assigned tasks, status/priority/category filters, and notifications.
- Add pagination and sorting to maintenance tasks and notification endpoints if datasets grow.
- Run Mongoose `runValidators` when update operations are expected to modify validated fields.
- Do not use a default fallback for `MONGO_URI` or `JWT_SECRET` in production.

## Testing and operations recommendations

- The Playwright script is useful, but it requires manually started services and creates a permanent complaint during the run. It should be isolated with test credentials and database cleanup.
- Expand browser checks to cover rejected/invalid submissions, assignment, status transitions, reopening, feedback, logout, and unauthorized route access.
- Add assertions for API response codes and negative authorization cases, not only successful UI navigation.
- Add health/readiness endpoints and graceful startup/shutdown handling.
- Use separate development, test, and production environment files.
- Add logging, monitoring, backup procedures, and migration/version-management tooling for MongoDB.

## Suggested implementation priority

1. Replace localhost API configuration and restrict demo seeding.
2. Secure password reset and uploaded files.
3. Add comprehensive server-side validation and authorization tests.
4. Implement atomic ticket IDs and database indexes.
5. Split the frontend and backend into maintainable modules.
6. Replace browser prompts and placeholder flows with accessible UI components.

## Final summary

CampusCare has a clear product direction and demonstrates a solid understanding of a role-based MERN application. It is already suitable as a functional prototype or academic submission. The next major step is hardening security, stabilizing environment configuration, adding test coverage, and improving maintainability before any real-world deployment.
