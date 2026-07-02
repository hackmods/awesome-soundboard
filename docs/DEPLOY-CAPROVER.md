# CapRover deployment (GitHub Actions)

Pushes to `main` deploy via `.github/workflows/deploy.yml`.

## Prerequisites on CapRover

1. Create an app in the CapRover dashboard (e.g. `awesome-soundboard`).
2. Open the app → **Deployment** → **Enable App Token** and copy the token.
3. Ensure HTTP/HTTPS ports 80 and 443 are open on the server.

## GitHub secrets

| Secret | Example | Notes |
|--------|---------|-------|
| `CAPROVER_SERVER` | `https://captain.apps.example.com` | **Captain** dashboard URL — must contain `captain` in the hostname |
| `CAPROVER_APP_NAME` | `awesome-soundboard` | Short app name from CapRover — **not** a URL or domain |
| `CAPROVER_APP_TOKEN` | (from Deployment tab) | App-specific deploy token |

### Common mistake: 404 "Nothing here yet"

If deploy fails with HTML containing `Nothing here yet :/`, the `CAPROVER_SERVER` secret is almost certainly wrong.

| Wrong | Right |
|-------|-------|
| `https://awesome-soundboard.apps.example.com` | `https://captain.apps.example.com` |
| `https://apps.example.com` | `https://captain.apps.example.com` |
| `https://example.com` | `https://captain.apps.example.com` |

Self-signed HTTPS on CapRover is supported in CI via `NODE_TLS_REJECT_UNAUTHORIZED=0`. For production, enable Let's Encrypt in CapRover.

## App environment variables

Set these in the CapRover app **App Configs** → **Environment Variables**:

```
AUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://awesome-soundboard.apps.example.com
DATABASE_URL=file:/app/data/app.db
UPLOAD_DIR=/app/data/uploads
```

Mount persistent storage for `/app/data` in CapRover if you want uploads and the database to survive redeploys.
