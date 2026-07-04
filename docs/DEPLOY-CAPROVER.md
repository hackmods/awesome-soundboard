# CapRover deployment (GitHub Actions)

Pushes to `main` upload the source as a tarball to CapRover, which builds the Docker image (from `captain-definition` + `Dockerfile`) and deploys it. No container registry is involved, so there are no image-pull permission issues.

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

## How the build works

The workflow tars the repo (excluding `node_modules`, `.git`, `data`, `.next`) and POSTs it to CapRover's `appData` endpoint. CapRover reads `captain-definition`, builds the image with your `Dockerfile` on the server, then deploys it. Because CapRover builds locally, it never pulls from an external registry — this avoids `ghcr.io ... unauthorized` image-pull failures.

> Note: the build runs on your CapRover host, so it needs enough RAM for a Next.js production build (~1–2 GB). If builds OOM, increase server memory or add swap.

## Troubleshooting

### 404 "Nothing here yet" on deploy

CapRover/nginx returned the default empty-app page instead of accepting the deploy. The app name in `CAPROVER_APP_NAME` **does not exist** on your CapRover server.

**Fix (pick one):**

1. **Manual:** CapRover dashboard → Apps → Create New App → name it exactly like `CAPROVER_APP_NAME` → Deployment → Enable App Token → update GitHub secrets.
2. **Automatic:** Add GitHub secret `CAPROVER_PASSWORD` (your CapRover dashboard password). The workflow will create the app on first run, then deploy.

### Self-signed HTTPS

The workflow calls the CapRover API with `curl -k`, so self-signed captain certificates are accepted. Enable Let's Encrypt in CapRover for production.

### Build fails / out of memory on the server

The image is built on your CapRover host. A Next.js production build needs ~1–2 GB RAM. If the build is killed, add swap or increase the server's memory.

### Wrong server URL

| Wrong (`CAPROVER_SERVER`) | Right |
|---------------------------|-------|
| `https://awesome-soundboard.apps.example.com` | `https://captain.apps.example.com` |
| Your app's public URL | CapRover dashboard URL |

`NEXTAUTH_URL` uses the **app** URL; `CAPROVER_SERVER` uses the **captain** URL.
