A simple CLI tool to set up a full-stack JavaScript project with both **backend (Express + Prisma 7)** and **frontend (Next.js + Tailwind CSS)** configured out of the box.

## Usage

Run the following command in your terminal:

```bash
npx create-full-project my-app
```

## 1. Introduction

`create-full-project` helps you quickly scaffold a ready-to-use full-stack application with proper folder structure, essential configurations, and best practices in place.  
It sets up:

- **Backend:** Node.js + Express + PostgreSQL (Prisma 7 ORM with `@prisma/adapter-pg`)
- **Frontend:** Next.js (with Tailwind CSS, ESLint, Turbopack)
- **Module-based layout:** `src/modules/<domain>/` for controllers, routes, services, validators, and types
- **Security & ops:** XSS sanitization (via `xss`), Helmet, compression, graceful shutdown, and configurable HTTP server timeouts
- **Utilities:** Typed pagination helpers, shared response helpers, status codes, and global error + 404 handlers
- **`prisma-qb`:** **[Prisma Query Builder](https://www.npmjs.com/package/prisma-qb)** ([Prisma ecosystem](https://www.prisma.io/ecosystem)) — turns `req.query` into typed Prisma **`where`** and **`orderBy`** objects per endpoint; you still call **`prisma.*.findMany()`** yourself with those objects (and your own `skip` / `take`)

---

## 2. Tech Stack

**Backend:**

- Node.js (CommonJS output from TypeScript; `tsx` for development)
- Express.js
- PostgreSQL via Prisma 7 (`schema.prisma` + root `prisma.config.ts` for datasource URL and migrations)
- `prisma.ts` at the backend root: `PrismaClient` with `PrismaPg` adapter (`@prisma/adapter-pg`)
- TypeScript (`module` / `moduleResolution`: `NodeNext`) with path aliases: `@/*`, `@root/*`, `@utils/*`, `@modules/*`, `@validators/*`, `@prisma` → `./prisma`
- `tsc-alias` rewrites aliases after `tsc` for production builds
- **[prisma-qb](https://www.npmjs.com/package/prisma-qb)** — `buildPrismaQuery({ query, searchFields, filterFields, sortFields, ... })` → `{ where, orderBy, meta? }`; strict validation, does not run DB queries
- cors, dotenv, helmet, compression
- Global error middleware, 404 handler, JSON body XSS sanitization middleware

**Frontend:**

- Next.js
- Tailwind CSS
- ESLint
- Turbopack

---

## 3. Setup Instructions

Running `npx create-full-project my-app` will generate:

- `backend` folder with Express + PostgreSQL + Prisma 7 setup
- `frontend` folder with Next.js + Tailwind CSS

After setup, configure the **`backend/.env`** file. Prisma CLI reads `DATABASE_URL` through `prisma.config.ts` (with `import 'dotenv/config'`); the `env('DATABASE_URL')` helper expects that variable to be set when you run migrate, push, studio, etc.

Example **`backend/.env`** (as generated):

```env
DATABASE_URL="postgres://username:password@host:port/db_name"
PORT=5000
DEFAULT_PAGE_SIZE=10
NODE_ENV=development
LOG_LEVEL=info
KEEP_ALIVE_TIMEOUT_MS=65000
HEADERS_TIMEOUT_MS=66000
REQUEST_TIMEOUT_MS=0
SHUTDOWN_TIMEOUT_MS=15000
```

Then from `backend/`:

1. Adjust `DATABASE_URL` for a real database.
2. Run migrations (or push): `npm run db:migrate` or `npm run db:push` (creates tables including the starter **`Role`** model).
3. Optionally seed default roles: `npm run db:seed`.
4. Start the API: `npm run dev` (development) or `npm run build` then `npm start` (production).

---

## 4. Folder Structure (generated after setup)

```
my-app/
├── backend/
│   ├── node_modules/
│   ├── prisma/
│   │   ├── migrations/          (created when you run migrations)
│   │   ├── seeds/
│   │   │   ├── index.ts        (registry + --only runner)
│   │   │   └── roles.seed.ts   (default admin / user / moderator roles)
│   │   └── schema.prisma
│   ├── public/
│   │   └── uploads/             (static files served at /uploads)
│   ├── src/
│   │   ├── middlewares/
│   │   │   ├── errorHandler.ts
│   │   │   ├── notFoundHandler.ts
│   │   │   └── sanitize.ts
│   │   ├── utils/
│   │   │   ├── responseUtils.ts
│   │   │   ├── paginationUtils.ts
│   │   │   ├── statusCodes.ts
│   │   │   └── serverConfig.ts
│   │   ├── validators/
│   │   ├── modules/
│   │   │   └── auth/
│   │   │       ├── auth.controller.ts
│   │   │       ├── auth.route.ts
│   │   │       ├── auth.service.ts
│   │   │       ├── auth.validators.ts
│   │   │       └── auth.types.ts
│   │   ├── routes.ts
│   │   └── index.ts
│   ├── .env
│   ├── .gitignore
│   ├── prisma.ts
│   ├── prisma.config.ts
│   ├── tsconfig.json
│   └── package.json
│
└── frontend/
    ├── app/
    │   ├── page.js
    │   ├── globals.css
    │   ├── favicon.ico
    │   └── layout.js
    ├── public/
    ├── package.json
    ├── next.config.mjs
    ├── jsconfig.json
    ├── eslint.config.mjs
    └── postcss.config.mjs

```

---

## 5. Key Features

### Module-based layout

Code under **`src/modules/<domain>/`** groups routes, controllers, services, validators, and types per feature. Wire new routers from **`src/routes.ts`**.

### Pagination helpers

**`src/utils/paginationUtils.ts`** exposes `getPaginationOptions` and `formatPaginationResponse` for list endpoints (works well with Prisma `skip` / `take`).

### HTTP query → Prisma **`where` / `orderBy`** (**prisma-qb**)

**[prisma-qb](https://www.npmjs.com/package/prisma-qb)** (“Prisma Query Builder”) is listed in the **[Prisma ecosystem](https://www.prisma.io/ecosystem)**. It is a small, opinionated helper: you pass **`req.query`** plus an explicit allowlist per route (**`searchFields`**, **`filterFields`**, **`sortFields`**, optional **`defaultSort`**, **`softDelete`**, **`allowedQueryKeys`**, etc.), and it returns **`{ where, orderBy, meta? }`**. It does **not** execute Prisma or replace the ORM — you merge the result into your own **`findMany` / `count`** (for example combine **`where`** with **`skip` / `take`** from **`paginationUtils`**).

Invalid or unknown keys fail early via **`QueryBuilderError`** (strict mode is the default). Search can report skipped fields in **`meta`** when a value does not match a field type. Use it so list endpoints stay predictable and you avoid duplicating filter/sort/search parsing in every service.

```typescript
import { buildPrismaQuery } from "prisma-qb";

const { where, orderBy } = buildPrismaQuery({
  query: req.query,
  searchFields: [{ field: "name" }],
  filterFields: [{ key: "slug", field: "slug", type: "string" }],
  sortFields: [{ key: "name", field: "name" }],
});

await prisma.role.findMany({ where, orderBy /* plus skip / take from your pagination helper */ });
```

### Security middleware

- **XSS:** Sanitizes string fields in `body`, `query`, and `params` before handlers run.
- **Helmet** and **compression** are enabled in **`src/index.ts`**.
- **CORS** is enabled with default settings (tighten per environment as needed).

### Seeds (registry + selective runs)

The starter includes a **`Role`** model and **`prisma/seeds/roles.seed.ts`**, which **`upsert`**s three common roles (**`admin`**, **`user`**, **`moderator`**) by **`slug`** — a practical baseline for RBAC before you add **`User`**, **`UserRole`**, or permissions.

**`prisma/seeds/index.ts`** holds a **`seedRegistry`** (starts with **`roles: seedRoles`**), runs every registered seed **in key order** for a full run, and supports **`--only`** so you can re-run individual seeds after you add more files.

**Run all seeds** (after migrations so **`Role`** exists):

```bash
npm run db:seed
```

**Run only the roles seed**

```bash
npm run db:seed -- --only=roles
```

Adding another seed: add **`prisma/seeds/other.seed.ts`**, import **`seedOther`**, register **`other: seedOther`** on **`seedRegistry`**, and keep dependency order in mind (e.g. roles before users if users reference role ids).

Prisma’s seed command is set in **`prisma.config.ts`**. **`index.ts`** calls **`prisma.$disconnect()`** in **`finally`**.

### Path aliases and NodeNext

TypeScript is configured with **`module` / `moduleResolution`: `NodeNext`**. Relative imports in generated source use **`.js` extensions** (e.g. `./routes.js`, `../utils/statusCodes.js`) so emitted JavaScript matches Node’s resolver. Path aliases (`@/`, `@root/`, …) are resolved for production via **`tsc-alias`** after **`tsc`**.

Example:

```typescript
import { sendResponse } from "@/utils/responseUtils.js";
import prisma from "@root/prisma.js";
```

### Prisma 7 layout

- **`prisma/schema.prisma`:** generator + `datasource` with `provider = "postgresql"` (URL lives in **`prisma.config.ts`**, not in the schema file), plus a starter **`Role`** model for the roles seed.
- **`prisma.config.ts`:** `datasource.url`, migration path, and seed script.
- **`prisma.ts`:** shared `PrismaClient` instance using **`PrismaPg`** and `DATABASE_URL`.

---

## 6. Backend scripts

Run these from the **`backend`** directory:

```bash
# Development (watch)
npm run dev

# Typecheck only
npm run type-check

# Production build (compile + rewrite path aliases)
npm run build

# Production server (runs compiled src entry)
npm start

# Prisma
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:deploy
npm run db:studio

# Seeds (all)
npm run db:seed

# Seeds (subset — pass through to tsx)
npm run db:seed -- --only=roles
```

---

## 7. About the Developer

I’m a Full Stack Developer 👨🏻‍💻 passionate about crafting reliable and user-friendly web applications. Since beginning my journey in 2020 📅, I’ve worked on a wide range of projects—from simple static websites to complex, full-fledged platforms—each one helping me grow my skills and refine my approach to problem-solving. I enjoy working through every stage of development, from designing the interface 🎨 to implementing the logic ⚙️, always aiming for performance, scalability, and a great user experience. Outside of building applications, I regularly practice DSA 📚 to strengthen my problem-solving mindset and keep my technical skills sharp. I’m always open to meaningful collaborations 🤝 or exciting opportunities 🚀, so if you’re working on something impactful, let’s connect.

**Profiles:** [Portfolio](https://manankanani.in) | [Github](https://github.com/MananKanani5) | [Linkedin](https://www.linkedin.com/in/manan-kanani/)

---
