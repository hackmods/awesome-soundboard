# CapRover deployment (GitHub Actions)

Pushes to `main` build a Docker image on GitHub Actions and deploy it to CapRover.

## One-time CapRover setup

1. **Create the app** in the CapRover dashboard before the first deploy.
   - Use a short lowercase name, e.g. `awesome-soundboard`
   - This name must match `CAPROVER_APP_NAME` **exactly**
2. Open the app → **Deployment** → **Enable App Token** → copy the token
3. Set app environment variables (App Configs → Environment Variables):

```
AUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://<your-app>.<your-root-domain>
DATABASE_URL=file:/app/data/app.db
UPLOAD_DIR=/app/data/uploads
```

4. Enable **Persistent Directories** for `/app/data` so the database and uploads survive redeploys

## GitHub secrets

| Secret | Example | Notes |
|--------|---------|-------|
| `CAPROVER_SERVER` | `https://captain.apps.example.com` | CapRover **dashboard** URL (where you log in) |
| `CAPROVER_APP_NAME` | `awesome-soundboard` | Exact app name from CapRover — not a URL |
| `CAPROVER_APP_TOKEN` | (from Deployment tab) | Token for **that** app |

**Find `CAPROVER_SERVER`:** open the CapRover dashboard in your browser and copy that URL.

## GitHub Container Registry (required for image deploy)

The workflow pushes to `ghcr.io/<owner>/<repo>`. CapRover must be able to pull it:

**Option A (simplest):** After the first workflow run, open GitHub → **Packages** → your package → **Package settings** → change visibility to **Public**.

**Option B (private package):** In CapRover → **Cluster** → **Docker Registry** add:

| Field | Value |
|-------|-------|
| Domain | `ghcr.io` |
| Username | Your GitHub username |
| Password | GitHub PAT with `read:packages` |
| Image Prefix | your-github-username (lowercase) |

## Troubleshooting

### 404 "Nothing here yet"

CapRover/nginx returned the default empty-app page instead of the API. Almost always:

1. **App not created** — create `awesome-soundboard` (or your chosen name) in CapRover first
2. **Wrong app name** — `CAPROVER_APP_NAME` must match the CapRover app name exactly
3. **Wrong token** — regenerate App Token on the correct app's Deployment tab

### Self-signed HTTPS

CI sets `NODE_TLS_REJECT_UNAUTHORIZED=0` for self-signed captain certificates. Enable Let's Encrypt in CapRover for production.

### Wrong server URL

| Wrong (`CAPROVER_SERVER`) | Right |
|---------------------------|-------|
| `https://awesome-soundboard.apps.example.com` | `https://captain.apps.example.com` |
| Your app's public URL | CapRover dashboard URL |

`NEXTAUTH_URL` uses the **app** URL; `CAPROVER_SERVER` uses the **captain** URL.
