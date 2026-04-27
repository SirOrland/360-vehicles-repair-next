# Deploying to Vercel

## 1. Set up the database (Neon — free)

1. Go to https://neon.tech and create a free account
2. Create a new project → copy the **Connection string** (looks like `postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require`)
3. You'll need two variables:
   - `DATABASE_URL` — the pooled connection string (for Prisma queries)
   - `DIRECT_URL` — the direct connection string (for Prisma migrations)
   Neon shows both on the dashboard under **Connection Details**

## 2. Install dependencies locally

```bash
cd 360-vehicles-repair-next
npm install
```

## 3. Create your .env file

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.neon.tech/dbname?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require"
AUTH_SECRET="run-this: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
BLOB_READ_WRITE_TOKEN="get-from-vercel-dashboard"
```

## 4. Push database schema & seed

```bash
npm run db:push       # creates all tables in Neon
npm run db:seed       # inserts admin user + services + settings
```

## 5. Test locally

```bash
npm run dev
```

Visit http://localhost:3000
- Admin login: admin@360vehicles.com / admin123

## 6. Deploy to Vercel

### Option A — Vercel CLI (fastest)
```bash
npm install -g vercel
vercel login
vercel --prod
```

When prompted, add your environment variables (or do it in step below).

### Option B — GitHub + Vercel dashboard
1. Push this folder to a new GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial Next.js app"
   git remote add origin https://github.com/YOUR_USER/360-vehicles-repair-next.git
   git push -u origin main
   ```
2. Go to https://vercel.com/new → Import your repo
3. Vercel auto-detects Next.js — click **Deploy**

## 7. Add environment variables in Vercel

In your Vercel project → **Settings → Environment Variables**, add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Neon pooled URL |
| `DIRECT_URL` | Your Neon direct URL |
| `AUTH_SECRET` | Random 32-byte base64 string |
| `NEXTAUTH_URL` | Your Vercel deployment URL (e.g. `https://your-app.vercel.app`) |
| `BLOB_READ_WRITE_TOKEN` | From Vercel dashboard → Storage → Blob |

## 8. Set up Vercel Blob (for vehicle image uploads)

1. In Vercel dashboard → **Storage → Create → Blob Store**
2. Link it to your project — it auto-adds `BLOB_READ_WRITE_TOKEN`

## 9. Redeploy after adding env vars

```bash
vercel --prod
```

Or trigger a redeploy from the Vercel dashboard.

---

## Default credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@360vehicles.com | admin123 |
| Customer | Register at /auth/register | — |

**Change the admin password immediately after first login!**

---

## Project structure

```
src/
  app/
    page.tsx                  ← Home page
    auth/login|register/      ← Auth pages
    admin/                    ← Admin portal
    customer/                 ← Customer portal
    mechanic/                 ← Mechanic portal
    api/                      ← All API routes
  components/                 ← Shared components
  lib/
    prisma.ts                 ← Database client
    auth.ts                   ← NextAuth config
    utils.ts                  ← Helpers (formatCurrency, etc.)
  middleware.ts               ← Route protection
prisma/
  schema.prisma               ← Database schema (13 tables)
  seed.ts                     ← Seed data
```
