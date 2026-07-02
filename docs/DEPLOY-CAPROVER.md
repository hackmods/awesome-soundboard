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

| Secret | Required | Example | Notes |
|--------|----------|---------|-------|
| `CAPROVER_SERVER` | Yes | `https://captain.apps.example.com` | CapRover **dashboard** URL |
| `CAPROVER_APP_NAME` | Yes | `awesome-soundboard` | Exact app name — not a URL |
| `CAPROVER_APP_TOKEN` | Yes* | (Deployment tab) | App deploy token |
| `CAPROVER_PASSWORD` | Optional | Captain password | Auto-creates app if missing; deploys with password auth |
| `CAPROVER_OTP_TOKEN` | Optional | 2FA code | Required if CapRover dashboard has two-factor auth enabled |

\* Use `CAPROVER_APP_TOKEN` **or** `CAPROVER_PASSWORD`. If the app does not exist yet, add `CAPROVER_PASSWORD` once — CI will create the app, then deploy.

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

### 404 "Nothing here yet" on deploy

CapRover/nginx returned the default empty-app page instead of accepting the deploy. The app name in `CAPROVER_APP_NAME` **does not exist** on your CapRover server.

**Fix (pick one):**

1. **Manual:** CapRover dashboard → Apps → Create New App → name it exactly like `CAPROVER_APP_NAME` → Deployment → Enable App Token → update GitHub secrets.
2. **Automatic:** Add GitHub secret `CAPROVER_PASSWORD` (your CapRover dashboard password). The workflow will create the app on first run, then deploy.

### Self-signed HTTPS

CI sets `NODE_TLS_REJECT_UNAUTHORIZED=0` for self-signed captain certificates. Enable Let's Encrypt in CapRover for production.

### Wrong server URL

| Wrong (`CAPROVER_SERVER`) | Right |
|---------------------------|-------|
| `https://awesome-soundboard.apps.example.com` | `https://captain.apps.example.com` |
| Your app's public URL | CapRover dashboard URL |

`NEXTAUTH_URL` uses the **app** URL; `CAPROVER_SERVER` uses the **captain** URL.
