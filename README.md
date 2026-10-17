# Public Service Request System (PSRS)

PSRS is a small full-stack demonstration project inspired by an eCitizen-style online workflow. It is focused on one task: helping citizens report local service issues and follow their status.

> **Demo only:** PSRS is not an official government service. Use fictional details and do not submit sensitive personal information.

## Assignment scope

Citizens can create an account, sign in, submit a request, optionally attach an image, and track its progress. Request forms collect:

- **Category:** Roads & Lighting, Water Services, Waste Management, Drainage & Flooding, Public Spaces & Parks, or Public Facilities
- **Location**
- **Description**
- **Optional image**

Requests follow the lifecycle **Pending → In Progress → Resolved**. Administrators can view requests, update their status, and see basic open-versus-resolved analytics. Public tracking exposes the reference, category, status, and status history without exposing the citizen's description, location, or account details.

The eCitizen-style aspect refers to the online request-and-tracking workflow only; PSRS does not process statutory applications.

## Tech stack

- **Frontend:** React, TypeScript, Vite, React Router
- **Backend:** Node.js, Express
- **Database:** SQLite through Node's built-in `node:sqlite` module
- **Authentication:** JSON Web Tokens and bcrypt password hashing
- **Image uploads:** Multer; JPG, PNG, and WebP files up to 5 MB

## Requirements

- Node.js **22.13.0 or newer**
- npm

## Run locally

From the repository root:

```powershell
npm ci --prefix .\psrs-app
Copy-Item .\psrs-app\.env.example .\psrs-app\.env
npm run seed
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API listens on port `5000`; Vite proxies API calls to it.

The seed command is idempotent: it adds missing demo accounts and sample requests and does not clear existing records.

| Account | Email | Password |
| --- | --- | --- |
| Administrator | `admin@psrs.go.ke` | `Admin@2026` |
| Citizen | `citizen@example.ke` | `Citizen@2026` |

These credentials are for local evaluation only. Do not use them in a deployed environment.

## Useful commands

Run from the repository root:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API and Vite frontend |
| `npm run server` | Start only the API |
| `npm run seed` | Add demo users and sample requests without clearing data |
| `npm run build` | Type-check and build the frontend |
| `npm test` | Run the request API lifecycle tests |
| `npm --prefix .\psrs-app run lint` | Run ESLint |

The health endpoint is [http://localhost:5000/api/health](http://localhost:5000/api/health).

## Main API routes

- `POST /api/auth/register` and `POST /api/auth/login`
- `POST /api/requests` — create a citizen request (multipart form; optional `image`)
- `GET /api/requests/my` — list the signed-in citizen's requests
- `GET /api/requests/:id` — view a request the citizen owns, or any request as an admin
- `GET /api/requests/track/:referenceNumber` — public, privacy-limited status tracking
- `GET /api/requests/demo` — public list of seeded, privacy-limited demo requests
- `GET /api/requests` — administrator request list with optional status/category/search filters
- `PATCH /api/requests/:id/status` — administrator status progression
- `GET /api/requests/stats` — administrator totals and category counts

## Configuration

Set these values in `psrs-app/.env`:

| Variable | Purpose | Default |
| --- | --- | --- |
| `PORT` | API server port | `5000` |
| `JWT_SECRET` | Secret used to sign tokens | Development fallback |
| `NODE_ENV` | Runtime environment | `development` |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma-separated | `http://localhost:5173` |
| `UPLOADS_DIR` | Location for uploaded images | `./server/uploads` |
| `DB_PATH` | SQLite database file | `./server/db/psrs.sqlite` |
| `VITE_API_URL` | Frontend API base URL | `/api` |

For a deployed environment, set a unique `JWT_SECRET` of at least 32 characters and configure `CORS_ORIGIN` and the frontend API URL for the deployment. The sample accounts and local SQLite setup are for demonstration and evaluation, not production deployment.

## Project layout

```text
.
├── package.json
└── psrs-app/
    ├── src/              # React citizen and administrator interfaces
    ├── server/           # Express API, request workflow, and SQLite database
    ├── .env.example      # Local environment template
    └── package.json
```
