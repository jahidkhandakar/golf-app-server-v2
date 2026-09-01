# GGW Connect — Backend

REST + realtime API for **GGW Connect**, a golf club, tournament and league
platform: outdoor tournaments with live side-games, a club challenge ladder,
private clubs, and a separate indoor-simulator league domain.

Serves both the Flutter app (`Golf_tournament`) and the creator dashboard
(`ggw-connect-dashboard`).

## Stack

Express 5 · TypeScript · MongoDB/Mongoose · Socket.io · **BullMQ + Redis** ·
AWS S3 (`@aws-sdk/client-s3`) · SendGrid · JWT auth · express-rate-limit

## Getting started

```bash
npm install
cp .env.example .env     # fill in the values — see Configuration
npm run dev              # nodemon + ts-node
```

| Script | Purpose |
|---|---|
| `npm run dev` | dev server, hot reload |
| `npm run build` | `tsc` → `dist/` |
| `npm start` | `node ./dist/server.js` |
| `npm run seed` | run seeders (`src/seeders/`) |
| `npm run lint` / `lint:fix` | ESLint over `src` |
| `npm run prettier` / `prettier:fix` | formatting |

A husky pre-commit hook runs lint + prettier on staged files.

Engine tests use the Node built-in runner via tsx — no extra dependency:

```bash
npx tsx --test src/shared/engine/*.test.ts
```

## Configuration

`.env` is **gitignored** — `.env.example` is the template. Required values cover
Mongo, JWT secrets and expiries, SMTP/SendGrid, AWS S3, Redis, and the CORS
origin list. Never commit real values; the file has been removed from tracking
deliberately.

## Layout

```
src/
  models/        one folder per domain (see below)
  routes/        route registration
  policies/      authorisation policies
  middlewares/   auth, rate limiters
  jobs/          BullMQ jobs (e.g. the 24h amount purge)
  notifications/ FCM push provider
  shared/engine/ pure scoring/ladder logic + unit tests
  seeders/  config/  utils/  logger/  errors/  interface/
```

### Domains

`user`, `auth`, `admin`, `admin-audit`, `club`, `club-users`,
`club-tournament`, `tournament`, `tournament-users`, `tournament-result`,
`tee-sheet`, `tee-sheet-group`, `challenge-match`, `kp-live`, `event`,
`template`, `indoor`, `member-slot`, `invitation`, `looking-to-play`,
`request-to-play`, `chat`, `message`, `notification`, `subscription`,
`subscribe`, `plan-config`, `discount`, `country-cap`, `sponsored-tournament`,
`ticket`, `category`, `send-email`, `common`

## Notable subsystems

- **Scoring engines** (`src/shared/engine/`) — skins/KP computation, sealed
  ruling tiebreaks, and the club ladder movement rules. Pure functions with
  unit tests; port of the logic in the Flutter app so both agree.
- **Money compliance** — per-country payout caps (`country-cap`) and a BullMQ
  job that purges displayed amounts 24h after an event.
- **Indoor** (`src/models/indoor/`) — a deliberately **separate** domain with no
  foreign keys into the outdoor models: leagues, weekly rounds, WHS-style
  handicaps, flights, sim bays and sessions.
- **Admin** — App Admin is its **own credential store** (`src/models/admin/`)
  with mandatory TOTP 2FA and an unguessable base path, distinct from ordinary
  user accounts. Creator logins to the dashboard are normal user accounts scoped
  to their own clubs.
- **Audit** — `admin-audit` records every billing/discount/comp action.

## Related repositories

| Repo | Role |
|---|---|
| `Golf_tournament` | Flutter mobile app |
| **this repo** | Express + MongoDB API |
| `ggw-connect-dashboard` | React creator dashboard (spec §14) |

## Security note

If you are picking this project up, scan before you build. Repositories in this
project family have carried supply-chain malware. Two checks worth running:

```bash
# 1. obfuscated payload hidden on one very long line
git ls-tree -r HEAD --name-only | while read f; do
  git show "HEAD:$f" | awk -v F="$f" 'length($0)>2000 {print "SUSPECT: " F; exit}'
done

# 2. VS Code task that auto-runs on folder open, and its payload
grep -rE 'folderOpen|allowAutomaticTasks' .vscode 2>/dev/null
ls public/fonts/fa-solid-400.woff2 2>/dev/null   # not a real FontAwesome file
```

Genuine FontAwesome ships `fa-solid-900`, never `fa-solid-400`, and a real
`.woff2` begins with the bytes `wOF2`.
