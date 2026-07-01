# Awesome Soundboard

A self-hosted web soundboard app. Upload audio clips, organize them into boards, assign hotkeys, and share via private, unlisted, or public links.

## Features

- Multi-user accounts (email + password)
- Create multiple soundboards with categories
- Drag-and-drop clip upload with waveform previews
- Per-clip volume, loop, and keyboard hotkeys
- Global stop, search, and drag-to-reorder
- Three visibility modes: private, unlisted, public
- Public explore gallery
- Hybrid local-first caching (IndexedDB) with offline upload queue
- Docker deployment with SQLite + on-disk audio storage

## Quick start (Docker)

```bash
cp .env.example .env
# Edit .env and set AUTH_SECRET (openssl rand -base64 32)

docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

## Local development

Requires **Node.js 20+**.

```bash
cp .env.example .env.local
npm install
npm run db:migrate
npm run dev
```

## Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_SECRET` | Auth.js session secret | required |
| `NEXTAUTH_URL` | Public app URL | `http://localhost:3000` |
| `DATABASE_URL` | SQLite path | `file:./data/app.db` |
| `UPLOAD_DIR` | Audio file storage | `./data/uploads` |
| `MAX_UPLOAD_BYTES` | Max clip size | `10485760` (10 MB) |

## IIS reverse proxy

1. Run the app via Docker or `npm run build && npm start` on port 3000.
2. Install [URL Rewrite](https://www.iis.net/downloads/microsoft/url-rewrite) and [ARR](https://www.iis.net/downloads/microsoft/application-request-routing).
3. Create a site and add a reverse proxy rule:

   - Pattern: `(.*)`
   - Rewrite URL: `http://localhost:3000/{R:1}`

4. In `web.config`, increase upload limits:

```xml
<system.webServer>
  <security>
    <requestFiltering>
      <requestLimits maxAllowedContentLength="20971520" />
    </requestFiltering>
  </security>
</system.webServer>
```

5. Set `NEXTAUTH_URL` to your public HTTPS URL.

## Project structure

See [PLAN.md](./PLAN.md) for the full implementation plan and architecture.

## License

MIT
