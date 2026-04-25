# create-full-project

Scaffold a production-ready full-stack JavaScript app in seconds — instead of spending 2–3 hours wiring everything together yourself.

```bash
npx create-full-project my-app
```

That's it. You get a `backend/` and `frontend/` folder, fully configured and ready to run.

---

## What you get

**Backend** — Node.js + Express + PostgreSQL (Prisma 7) + TypeScript  
**Frontend** — Next.js + Tailwind CSS + ESLint + Turbopack

Everything is already set up: folder structure, security middleware, pagination helpers, path aliases, seeds, and more.

---

## Get started in 4 steps

```bash
# 1. Scaffold the project
npx create-full-project my-app

# 2. Set your database URL in backend/.env
DATABASE_URL="postgres://username:password@host:port/db_name"

# 3. Run migrations (from backend/)
npm run db:migrate

# 4. Start the dev server
npm run dev
```

The frontend runs independently from the `frontend/` folder with `npm run dev` as well.

---

## Folder structure

```
my-app/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── seeds/
│   │   │   ├── index.ts          # seed registry + --only runner
│   │   │   └── roles.seed.ts     # admin / user / moderator roles
│   │   └── schema.prisma
│   ├── public/
│   │   └── uploads/              # static files served at /uploads
│   ├── src/
│   │   ├── middlewares/
│   │   │   ├── errorHandler.ts
│   │   │   ├── notFoundHandler.ts
│   │   │   └── sanitize.ts       # XSS sanitization for body/query/params
│   │   ├── utils/
│   │   │   ├── responseUtils.ts
│   │   │   ├── paginationUtils.ts
│   │   │   ├── statusCodes.ts
│   │   │   └── serverConfig.ts
│   │   ├── modules/
│   │   │   └── auth/
│   │   │       ├── auth.controller.ts
│   │   │       ├── auth.route.ts
│   │   │       ├── auth.service.ts
│   │   │       ├── auth.validators.ts
│   │   │       └── auth.types.ts
│   │   ├── routes.ts
│   │   └── index.ts
│   ├── prisma.ts                 # shared PrismaClient (PrismaPg adapter)
│   ├── prisma.config.ts          # datasource URL + migration + seed config
│   ├── .env
│   └── tsconfig.json
│
└── frontend/
    ├── app/
    │   ├── page.js
    │   ├── layout.js
    │   └── globals.css
    ├── next.config.mjs
    └── package.json
```

New features go into `src/modules/<domain>/` and get registered in `src/routes.ts`.

---

## Built-in: prisma-qb

**[prisma-qb](https://www.npmjs.com/package/prisma-qb)** is a companion package (also built by me and listed in the [Prisma ecosystem](https://www.prisma.io/ecosystem)) that's pre-installed and ready to use.

### The problem it solves

Every list endpoint needs the same boilerplate: parse `req.query`, validate the keys, convert types, build a `where` clause, handle sorting. Without a helper, you rewrite this logic in every service — inconsistently.

### What it does

You pass `req.query` along with an explicit allowlist of which fields are filterable, searchable, and sortable. It returns a ready-to-use `{ where, orderBy }` object you plug straight into Prisma. That's all — it doesn't run queries or replace Prisma.

```typescript
import { buildPrismaQuery } from "prisma-qb";

const { where, orderBy } = buildPrismaQuery({
  query: req.query,
  searchFields: [{ field: "name" }, { field: "email" }],
  filterFields: [
    {
      key: "status",
      field: "status",
      type: "enum",
      enumValues: ["ACTIVE", "INACTIVE"],
    },
    { key: "isActive", field: "isActive", type: "boolean" },
  ],
  sortFields: [{ key: "createdAt", field: "createdAt" }],
  defaultSort: { key: "createdAt", order: "desc" },
  allowedQueryKeys: ["page", "limit"],
});

const users = await prisma.user.findMany({
  where,
  orderBy,
  skip, // from your paginationUtils
  take,
});
```

**Supports:** string / number / boolean / date / enum filters · IN filters (comma-separated) · range filters (`_min` / `_max`) · nested relations · soft delete · strict mode (invalid keys throw early with a clear error).

→ [Full prisma-qb docs](https://github.com/MananKanani5/prisma-qb#readme)

---

## Backend scripts

Run from the `backend/` directory:

```bash
npm run dev            # development (watch)
npm run build          # compile TypeScript + rewrite path aliases
npm start              # production

npm run db:generate    # generate Prisma client
npm run db:migrate     # create and run migrations
npm run db:push        # push schema without migration history
npm run db:deploy      # apply migrations in production
npm run db:studio      # open Prisma Studio
npm run db:seed        # seed all (roles by default)
npm run db:seed -- --only=roles   # seed a specific file
```

---

## About the author

**Manan Kanani** — full-stack developer based in Mumbai, building web apps end to end since 2020. I've shipped an HRMS for Yashraj Films, a multi-model AI chat platform, and open-source tools used by teams across the globe. I write code I won't regret reading six months later.

If you're working on something and need someone to build the tech side of it, feel free to reach out.

[Portfolio](https://manankanani.in) · [GitHub](https://github.com/MananKanani5) · [LinkedIn](https://www.linkedin.com/in/manan-kanani/)
