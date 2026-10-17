# PSRS deployment

The web app and API are deployed separately: Vercel hosts the Vite frontend, and Render hosts the Express API.

## Deploy the API to Render

1. Push the project to GitHub and create a **Web Service** in Render connected to that repository.
2. Set the service's **Root Directory** to `psrs-app`.
3. Set the commands:
   - **Build Command:** `npm ci`
   - **Start Command:** `npm run server`
4. Use Node.js 22.13 or newer. The API uses Node's built-in `node:sqlite` module.
5. Attach a persistent disk mounted at `/var/data`. The SQLite database and uploaded documents must live on persistent storage; otherwise they can be lost when the service restarts or is redeployed.
6. Add these environment variables in Render:

   | Name | Value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `JWT_SECRET` | A randomly generated secret, at least 32 characters |
   | `CORS_ORIGIN` | `https://psrsdemo.vercel.app` |
   | `DB_PATH` | `/var/data/psrs.sqlite` |
   | `UPLOADS_DIR` | `/var/data/uploads` |

   Generate a secret in PowerShell with:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

   Keep the generated value private. Do not add it to GitHub or the frontend's Vercel settings.
7. Deploy the service. Its API URL will look like `https://your-service-name.onrender.com`.
8. Check `https://your-service-name.onrender.com/api/health`. The JSON response should have `"status": "operational"`.

The service creates the database schema on startup. A new database has no sample services or accounts. `npm run seed` inserts demo data and known demo login credentials, and **deletes existing records first**. Only run it on an empty database if you specifically want demo data; never run it on a database containing real user data.

## Point Vercel at the API

In Vercel, open the frontend project's **Settings → Environment Variables** and add:

| Name | Value |
| --- | --- |
| `VITE_API_URL` | `https://your-service-name.onrender.com/api` |

Replace the example host with the URL Render assigned to your service. Apply the variable to Production, save, then redeploy the Vercel project so Vite includes it in the frontend build.

The frontend uses `/api` as a local-development fallback. Its uploaded-document links are also built from `VITE_API_URL`, so they will open from the API host in production.

## Local development

Copy `.env.example` to `.env` in this directory and run `npm run dev`. The Vite development proxy sends `/api` and `/uploads` requests to the local API on port 5000.
