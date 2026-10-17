# Public Service Request System (PSRS)

PSRS is a web application prototype for discovering Kenyan public services, submitting service requests, and tracking their progress. It includes a citizen portal and staff/administrator workspaces.

> **Project status:** This is a demonstration project, not an official Government of Kenya service. Sample records and payment flows are for local development only. Payments are simulated; do not enter real personal, identity, or payment information.

## Features

- Browse and search a public service directory, with category and fee filters.
- Register and sign in as a citizen; submit applications and supporting documents.
- Track applications by reference and follow status changes and notifications.
- Review applications through staff and administrator dashboards.
- Manage users, services, announcements, payments, and audit logs as an administrator.
- View receipts and payment records from the simulated payment flow.

## Tech stack

- **Frontend:** React, TypeScript, Vite, React Router
- **Backend:** Node.js, Express
- **Database:** SQLite using Node's built-in `node:sqlite` module
- **Authentication:** JSON Web Tokens and bcrypt password hashing

## Requirements

- Node.js **22.13.0 or newer**
- npm

## Run locally

From the repository root, install the app dependencies and create a local environment file:

```powershell
npm ci --prefix .\psrs-app
Copy-Item .\psrs-app\.env.example .\psrs-app\.env
```

The example environment configures the API on port `5000`, the Vite client on port `5173`, and local SQLite and upload paths. For local development, the example JWT secret is sufficient; replace it with a unique secret for any non-local environment.

To populate the local database with demonstration records, run:

```powershell
npm run seed
```

> **Warning:** Seeding clears existing users, applications, payments, and other database records before inserting the sample data. Only run it against a disposable local database.

Start the client and API together:

```powershell
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Vite development server proxies API requests to `http://localhost:5000`.

The seeded demo accounts use these passwords:

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@psrs.go.ke` | `Admin@2026` |
| Staff | `officer.civil@psrs.go.ke` | `Staff@2026` |
| Citizen | `citizen.wanjiku@example.ke` | `Citizen@2026` |

These fixed credentials are for the seeded local demo only. Do not use them in a deployed environment.

## Useful commands

Run these commands from the repository root:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API and Vite development server together |
| `npm run server` | Start only the API |
| `npm run seed` | Clear and repopulate the local database with demo data |
| `npm run build` | Type-check and build the frontend |
| `npm --prefix .\psrs-app run lint` | Lint the app |

The API health endpoint is available at [http://localhost:5000/api/health](http://localhost:5000/api/health).

## Configuration

Set these values in `psrs-app/.env` as needed:

| Variable | Purpose | Default |
| --- | --- | --- |
| `PORT` | API server port | `5000` |
| `JWT_SECRET` | Secret used to sign authentication tokens | Development fallback |
| `NODE_ENV` | Runtime environment | `development` |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma-separated | `http://localhost:5173` in development |
| `UPLOADS_DIR` | Location for uploaded documents | `./server/uploads` |
| `DB_PATH` | SQLite database file | `./server/db/psrs.sqlite` |
| `VITE_API_URL` | Frontend API base URL | `/api` |

For production, set `NODE_ENV=production`, configure `JWT_SECRET` to a random value of at least 32 characters, and set `CORS_ORIGIN` to the deployed frontend origin. Configure `VITE_API_URL` and your hosting/reverse-proxy setup so the frontend can reach the API. The sample SQLite database, local uploads, seeded accounts, and simulated payments are not a production deployment configuration.

## Project layout

```text
.
├── package.json          # Root convenience scripts
└── psrs-app/
    ├── src/              # React application
    ├── server/           # Express API, database, and seed script
    ├── .env.example      # Local environment template
    └── package.json      # App dependencies and scripts
```
