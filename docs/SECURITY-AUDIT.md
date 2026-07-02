# Security Audit — Awesome Soundboard

**Date:** 2026-07-01  
**Scope:** Auth, middleware, server actions, API routes, file storage, Docker/deploy  
**Methodology:** Manual code review + regression tests in `tests/integration/` and `tests/unit/`

## Summary

| Finding | Severity | Status |
|---------|----------|--------|
| Clip IDOR in server actions | High | Fixed |
| Category IDOR in server actions | High | Fixed |
| Upload `categoryId` not board-scoped | High | Fixed |
| Path traversal via `resolveClipAbsolutePath` | Medium | Fixed |
| Weak `AUTH_SECRET` default in Docker Compose | Medium | Fixed |
| Permissive upload MIME (`application/octet-stream`) | Medium | Fixed |
| No rate limiting | Medium | Open (deferred) |
| Register email enumeration | Medium | Open (deferred) |
| No CSP / security headers | Low | Open (deferred) |
| Unlisted clip access by ID (by design) | Info | Accepted |
| Board delete does not remove disk files | Low | Open (deferred) |
| `next-auth` beta dependency | Info | Accepted |

## Controls in place

- JWT sessions via Auth.js v5; bcrypt password hashing (cost 12)
- Middleware protects dashboard and board editor routes
- Upload API checks board ownership before write
- Audio API uses `canAccessBoard()` for visibility enforcement
- Drizzle ORM parameterizes queries (no raw SQL injection surface)
- Docker runs as non-root user; `.gitignore` excludes `.env`
- Production startup fails if `AUTH_SECRET` is missing or a known placeholder

---

## Detailed findings

### High — Clip IDOR (Fixed)

**Location:** `src/app/(app)/actions.ts` — `updateClipAction`, `deleteClipAction`, `reorderClipsAction`

**Risk:** Owner of board A could mutate, delete, or reorder clips on board B by passing a foreign `clipId` while supplying their own `boardId` (only board ownership was checked).

**Remediation:** Added `getClipByIdAndBoardId` / `getClipsByIdsForBoard` in `src/lib/db/queries.ts`. Actions now verify clip belongs to board before any mutation.

### High — Category IDOR (Fixed)

**Location:** `src/app/(app)/actions.ts` — `updateCategoryAction`, `deleteCategoryAction`, `reorderCategoriesAction`

**Risk:** Same IDOR pattern for `categoryId`.

**Remediation:** Added `getCategoryByIdAndBoardId` / `getCategoriesByIdsForBoard`. Actions verify category belongs to board.

### High — Upload category not scoped (Fixed)

**Location:** `src/app/api/uploads/route.ts`

**Risk:** Authenticated user could link a new clip to another board's category via `categoryId` form field.

**Remediation:** Validate `categoryId` with `getCategoryByIdAndBoardId`; return 400 if invalid.

### Medium — Path traversal (Fixed)

**Location:** `src/lib/storage/files.ts` — `resolveClipAbsolutePath`

**Risk:** Malicious `filePath` values with `..` could escape upload directory.

**Remediation:** Resolve path under `UPLOAD_DIR` and reject if resolved path is outside base directory.

### Medium — Weak AUTH_SECRET default (Fixed)

**Location:** `docker-compose.yml`, `src/instrumentation.ts`

**Risk:** Compose fallback `change-me-in-production` could ship to production.

**Remediation:** Removed Compose fallback; production Node startup exits if `AUTH_SECRET` is missing or matches known placeholders.

### Medium — Permissive upload MIME (Fixed)

**Location:** `src/lib/storage/files.ts` — `isAllowedAudioFile`

**Risk:** Bare `application/octet-stream` accepted without extension validation beyond allowlist.

**Remediation:** Reject `application/octet-stream`; extension allowlist still required.

### Medium — No rate limiting (Deferred)

**Location:** Login, register, upload endpoints

**Risk:** Brute-force and abuse on self-hosted instances.

**Status:** Accepted gap for v1 self-hosted; track for future release.

### Medium — Register email enumeration (Deferred)

**Location:** `src/app/(auth)/` register flow

**Risk:** Distinct error messages may reveal whether an email is registered.

**Status:** Documented; generic error message optional follow-up.

### Low — No security headers (Deferred)

**Location:** `next.config.ts`

**Risk:** Missing CSP, HSTS, X-Frame-Options at app layer (may be handled by reverse proxy).

**Status:** Deferred; recommend proxy-level headers for production deploys.

### Informational — Unlisted clip access

Public and unlisted boards intentionally allow audio access by slug or clip ID. Private boards require ownership.

### Low — Board delete file cleanup (Deferred)

`deleteBoardAction` removes DB rows but not files on disk. Orphaned uploads possible.

### Informational — next-auth beta

Project uses Auth.js v5 beta; monitor upstream releases.

---

## Remediation log

| Date | Change |
|------|--------|
| 2026-07-01 | Created `.cursor/rules/security.mdc` and this audit document |
| 2026-07-01 | Board-scoped query helpers; IDOR fixes in server actions |
| 2026-07-01 | Upload `categoryId` validation; path traversal guard |
| 2026-07-01 | AUTH_SECRET hardening (Compose + instrumentation) |
| 2026-07-01 | Reject bare `application/octet-stream` uploads |
| 2026-07-01 | Regression tests: `actions-idor.test.ts`, extended `api-uploads.test.ts`, `files.test.ts` |

## Regression tests

| Test file | Covers |
|-----------|--------|
| `tests/integration/actions-idor.test.ts` | Clip/category IDOR blocked |
| `tests/integration/api-uploads.test.ts` | Foreign category rejected |
| `tests/unit/files.test.ts` | Path traversal + MIME rules |

Run: `npm run test:integration` or `npm run test`
