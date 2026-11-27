# Billing System API

Express API for the billing workspace. It uses administrator and regular accounts; passwords are checked against bcrypt hashes and successful sign-ins use an HttpOnly session cookie. Workspace settings are stored per signed-in account in MongoDB.

## Source layout

```text
src/
  app.js                       Express setup, security middleware, and route mounting
  server.js                    Starts the HTTP server and handles shutdown signals
  config/
    env.js                     Validates environment configuration
    database.js                Connects to MongoDB and bootstraps the admin
    session.js                 Session cookie and token settings
  controllers/
    authController.js          Login, current-user, and logout handlers
    userController.js          Admin user creation and password changes
    workspaceDataController.js Reads and validates workspace settings
  middleware/
    authenticate.js            Validates the session cookie
    errorHandler.js             Central 404 and error responses
    loginLimiter.js             Sign-in rate limit
    requireRole.js              Role-based authorization
  models/
    User.js                     MongoDB user schema and roles
    WorkspaceData.js            Per-user currency, rate, item, consignee, buyer, and place data
  routes/
    authRoutes.js               Authentication endpoint definitions
    userRoutes.js               Admin-only user endpoints
    workspaceDataRoutes.js      Authenticated workspace data endpoints
```

## Setup

1. Install Node.js 20.19 or newer and MongoDB.
2. In `backend`, run `npm ci`.
3. Copy `.env.example` to `.env`.
4. Set `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `MONGODB_URI`, and a randomly generated `JWT_SECRET` in `.env`.
5. Run `npm run dev` for local development or `npm start` in production.

Generate a bcrypt hash locally with:

```sh
node --input-type=commonjs -e "console.log(require('bcryptjs').hashSync('replace-this-password', 12))"
```

Generate a signing secret with:

```sh
node --input-type=commonjs -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Do not commit `.env` or use the example values in production. Serve production traffic over HTTPS. If the API is behind a trusted reverse proxy, set `TRUST_PROXY=true`.

## Endpoints

- `GET /api/health` — API health status.
- `POST /api/auth/login` — accepts `{ "email": "...", "password": "..." }` and sets the session cookie.
- `GET /api/auth/me` — returns the signed-in user or `401`.
- `PATCH /api/auth/email` — admin-only; changes the admin sign-in email after confirming the current password.
- `PATCH /api/auth/password` — admin-only; changes the admin password after confirming the current password.
- `POST /api/auth/logout` — expires the session cookie.
- `POST /api/users` — admin-only; creates a regular user from `{ "email": "...", "password": "..." }`.
- `PATCH /api/users/:userId/password` — admin-only; changes that user’s password and invalidates their active sessions.
- `GET /api/workspace-data` returns the signed-in user's currencies, GST rates, items, consignee records (`customers`), buyer records, and places of supply.
- `PUT /api/workspace-data` validates and saves those five collections for the signed-in user.

Workspace data is scoped to the authenticated user's ID. The first successful save initializes that user's document; subsequent saves preserve empty collections as empty. Existing browser settings are imported for the administrator account on first use, then the browser cache is scoped by account.

Users have one of two roles: `user` or `admin`. The configured bootstrap account (default email `admin@gmail.com`) is created as the admin when no admin account exists. Existing admin accounts are preserved across restarts. Regular users cannot change the admin email or password.

The frontend uses `/api` by default. Vite proxies it to `http://localhost:4000` during development. For a separately hosted frontend, set `VITE_API_URL` to the API origin and `FRONTEND_ORIGIN` to one or more complete frontend origins separated by commas, for example `https://your-project.vercel.app,https://your-preview.vercel.app`.

## Deploy frontend and API to Vercel

Deploy this repository as two Vercel projects:

1. Create the backend project with the repository root directory set to `backend`. Vercel detects the Express app exported from `src/app.js` and routes API requests through it.
2. Add these backend environment variables in Vercel (do not commit their values):
   - `NODE_ENV=production`
   - `MONGODB_URI` — the production MongoDB connection string
   - `ADMIN_EMAIL` — the initial administrator email
   - `ADMIN_PASSWORD_HASH` — a bcrypt hash generated locally, not the plain password
   - `JWT_SECRET` — a randomly generated secret with at least 32 characters
   - `FRONTEND_ORIGIN` — the exact deployed frontend origin, such as `https://your-frontend.vercel.app`
   - `TRUST_PROXY=true`
3. Create the frontend project from the same repository with its root directory set to `frontend`. Use the Vite preset, build command `npm run build`, and output directory `dist`.
4. Set the frontend environment variable `VITE_API_URL` to the backend project's origin, such as `https://your-api.vercel.app`, then deploy the frontend.
5. Set `FRONTEND_ORIGIN` in the backend project to the frontend's final production origin and redeploy the backend. Add additional exact origins, comma-separated, only if preview deployments need access.
6. Confirm MongoDB Atlas network access allows connections from the backend deployment. Keep database credentials and all other secrets in Vercel environment settings.

The frontend must be redeployed after changing `VITE_API_URL`, because Vite embeds it during the build. The backend uses credentialed cross-origin requests, so `FRONTEND_ORIGIN` must exactly match the frontend domain.
