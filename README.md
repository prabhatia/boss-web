# boss — Next.js frontend

Next.js 14 (App Router) + TypeScript + Supabase Auth. Ported from the
static HTML mockups, wired to the Spring Boot services on ports 8080–8083.

---

## Run it

```bash
cd boss-web
npm install
cp .env.local.example .env.local     # then fill in your Supabase keys
npm run dev
```

Open http://localhost:3000

---

## Pages

| Route | Source mockup | Notes |
|---|---|---|
| `/` | landing.html | OAuth buttons inline in the hero |
| `/login` | — | Dedicated sign-in page |
| `/dashboard` | dashboard.html | Auth-protected, LinkedIn import |
| `/companies` | company.html | Live from company-service :8082 |
| `/jobs` | jobs.html | Live from jobs-service :8083 |
| `/faq` | faq.html | Static content |
| `/logo` | export-logo.html | Canvas PNG export |

---

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_SITE_URL=http://localhost:3000

AUTH_SERVICE_URL=http://localhost:8080
PROFILE_SERVICE_URL=http://localhost:8081
COMPANY_SERVICE_URL=http://localhost:8082
JOBS_SERVICE_URL=http://localhost:8083
```

The `service_role` key is never used here. Only the anon key belongs in a
browser app.

---

## Supabase setup

### 1. Redirect URLs

Dashboard → Authentication → URL Configuration → Redirect URLs:

```
http://localhost:3000/auth/callback
https://your-domain.com/auth/callback
```

Site URL: `http://localhost:3000`

### 2. Google

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create OAuth client ID → Web application
3. Authorized redirect URI: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
4. Copy Client ID + Secret into Supabase → Authentication → Providers → Google

### 3. Apple

1. [Apple Developer](https://developer.apple.com/account) → Certificates, Identifiers & Profiles
2. Create an App ID, then a Services ID (this is your client ID)
3. Configure the Services ID: Return URL = `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
4. Create a Sign in with Apple key (.p8), note the Key ID and Team ID
5. In Supabase → Providers → Apple, paste Services ID, Team ID, Key ID, and the .p8 contents

Apple requires a paid developer account ($99/yr).

### 4. LinkedIn

1. [LinkedIn Developers](https://www.linkedin.com/developers/apps) → Create app
2. Upload the logo from `/logo` (download the PNG there)
3. Products tab → request **Sign In with LinkedIn using OpenID Connect**
4. Auth tab → Authorized redirect URL: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
5. Copy Client ID + Secret into Supabase → Providers → LinkedIn (OIDC)

Use the provider named **LinkedIn (OIDC)**, not the deprecated "LinkedIn" entry.

---

## What LinkedIn actually returns

This matters for the "import profile" feature, so it is worth being precise.

Sign In with LinkedIn using OpenID Connect grants three scopes — `openid`,
`profile`, `email` — which return exactly these claims:

```
sub, name, given_name, family_name, picture, email, email_verified
```

That is the complete list. **Work history, education, skills, and connections
are not included.** Those endpoints live behind LinkedIn's Marketing Developer
Platform and Talent Solutions partner programs, which require a signed
commercial agreement and are not granted to most applications.

So `LinkedInImport.tsx` does what is actually possible:

1. Imports name, email, and profile photo from the OIDC claims.
2. Tells the user plainly that work history is not available.
3. Points them at manual entry or resume upload for the rest.

If you later get partner approval, the extra fetch goes in
`importFromSession()` in `src/components/LinkedInImport.tsx`.

---

## How auth flows through to Spring Boot

```
Browser signs in via Supabase (Google / Apple / LinkedIn)
  → Supabase issues an RS256 JWT
  → Stored in an httpOnly cookie by @supabase/ssr
  → middleware.ts refreshes it on every request
  → src/lib/api.ts attaches it as: Authorization: Bearer <jwt>
  → Next.js rewrite proxies to the Java service
  → SupabaseJwtAuthFilter validates against the JWKS endpoint
  → AuthenticatedUser principal is built
```

Requests are proxied through Next.js rewrites (`/api/profile-svc/*` →
`localhost:8081/api/*`), so you do not need CORS configured on the Java side
during local development.

---

## Structure

```
boss-web/
├── middleware.ts                  Session refresh + route protection
├── next.config.js                 Rewrites to the four Java services
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── globals.css            Design tokens from the mockups
    │   ├── page.tsx               Landing
    │   ├── login/
    │   ├── auth/callback/         OAuth code exchange
    │   ├── dashboard/
    │   ├── companies/
    │   ├── jobs/
    │   ├── faq/
    │   └── logo/
    ├── components/
    │   ├── BossLogo.tsx           SVG wordmark
    │   ├── Nav.tsx
    │   ├── Footer.tsx
    │   ├── OAuthButtons.tsx       Google / Apple / LinkedIn
    │   └── LinkedInImport.tsx
    └── lib/
        ├── api.ts                 Typed client for the Java services
        └── supabase/
            ├── client.ts          Browser
            └── server.ts          Server components
```

---

## Running the whole stack

```bash
# Terminal 1 — infrastructure
docker run -d -p 5432:5432 -e POSTGRES_DB=platform_db \
  -e POSTGRES_USER=platform -e POSTGRES_PASSWORD=password \
  pgvector/pgvector:pg16
docker run -d -p 6379:6379 redis:7

# Terminal 2 — Java services
cd platform_final && mvn clean install -DskipTests
cd auth-service && mvn spring-boot:run       # :8080
# repeat for profile-service :8081, company-service :8082, jobs-service :8083

# Terminal 3 — frontend
cd boss-web && npm run dev                   # :3000
```

The dashboard degrades gracefully — if the Java services are not running it
shows a banner and falls back to the Supabase account details.
