# CapRover deployment (GitHub Actions)

Pushes to `master` build a Docker image on GitHub Actions, push it to GitHub Container Registry (GHCR), and deploy it to CapRover with the CapRover CLI — same flow as `math-minute`.

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
5. Set **Container HTTP Port** to `3000` (App Configs → HTTP Settings → Container HTTP Port). CapRover defaults to port 80; this app listens on 3000.

## GitHub secrets

| Secret | Required | Example | Notes |
|--------|----------|---------|-------|
| `CAPROVER_SERVER` | Yes | `https://captain.behind7proxies.com` | CapRover **dashboard** URL |
| `CAPROVER_APP_NAME` | Yes | `awesome-soundboard` | Exact app name — not a URL |
| `CAPROVER_APP_TOKEN` | Yes | (Deployment tab) | App deploy token |

**Find `CAPROVER_SERVER`:** open the CapRover dashboard in your browser and copy that URL (e.g. `https://captain.behind7proxies.com`).

## GitHub Container Registry

The workflow pushes to `ghcr.io/<owner>/awesome-soundboard` with tags `latest` and the commit SHA. CapRover must be able to pull that image.

If the package is **private**, add GHCR credentials in CapRover → **Cluster** → **Docker Registry Configuration**:

| Field | Value |
|-------|-------|
| Registry Domain | `ghcr.io` |
| Username | Your GitHub username |
| Password | GitHub PAT with `read:packages` |

Alternatively, make the package **public** in GitHub → Packages → package settings.

## How the deploy works

1. GitHub Actions builds the image from `Dockerfile` and pushes to GHCR.
2. `caprover deploy --imageName ghcr.io/...` tells CapRover to pull that image and restart the app.

## Troubleshooting

### `unauthorized` when pulling from ghcr.io

CapRover cannot pull the private GHCR image. Add registry credentials in CapRover (see above) or make the package public.

### 404 "Nothing here yet" on deploy

The app name in `CAPROVER_APP_NAME` does not exist on your CapRover server. Create the app in the dashboard with that exact name and enable an app token.

### Wrong server URL

| Wrong (`CAPROVER_SERVER`) | Right |
|---------------------------|-------|
| `https://awesome-soundboard.behind7proxies.com` | `https://captain.behind7proxies.com` |
| Your app's public URL | CapRover dashboard URL |

`NEXTAUTH_URL` uses the **app** URL; `CAPROVER_SERVER` uses the **captain** URL.

### 502 Bad Gateway after a successful deploy

The image built and deployed, but CapRover/nginx cannot reach the running container. Check these in order:

1. **Container HTTP Port** — App Configs → HTTP Settings → set **Container HTTP Port** to `3000`, then save and restart the app. (Most common cause.)
2. **`AUTH_SECRET`** — must be set in App Configs → Environment Variables. The app **exits on startup** in production if it is missing or still a placeholder (`change-me-in-production`). Generate one with `openssl rand -base64 32`.
3. **App logs** — CapRover dashboard → your app → **App Logs**. Look for `AUTH_SECRET must be set` or `EACCES` / port bind errors.
4. **`NEXTAUTH_URL`** — set to your public app URL (e.g. `https://awesome-soundboard.behind7proxies.com`), not the captain URL.
5. **Persistent data** — confirm `/app/data` is enabled so SQLite and uploads can be written.

Quick health check once the port is correct: `curl https://<your-app-domain>/api/health` should return `{"status":"ok",...}`.

### Self-signed HTTPS

If the CapRover CLI fails with a certificate error, enable Let's Encrypt in CapRover or set `NODE_TLS_REJECT_UNAUTHORIZED=0` on the deploy step (not recommended for production).
