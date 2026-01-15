A simple CLI tool to set up a full-stack JavaScript project with both **backend (Express + Prisma 7.0)** and **frontend (Next.js + Tailwind CSS)** configured out of the box.

## Usage

Run the following command in your terminal:

```bash
npx create-full-project my-app
```

## 1. Introduction

`create-full-project` helps you quickly scaffold a ready-to-use full-stack application with proper folder structure, essential configurations, and best practices in place.  
It sets up:

- **Backend:** Node.js + Express + PostgreSQL (Prisma 7.0 ORM with adapter support)
- **Frontend:** Next.js (with Tailwind CSS, ESLint, Turbopack)
- **Module-based Architecture:** Domain-driven folder structure for better scalability
- **Advanced Query Builder:** Built-in search, filter, sort, and pagination utilities
- **Security Middleware:** XSS sanitization, Helmet, and compression
- Common utilities like environment variables, error handling, and API structure.

---

## 2. Tech Stack

**Backend:**

- Node.js
- Express.js
- PostgreSQL (via Prisma 7.0 ORM with adapter support)
- TypeScript with path aliases (@/, @utils/, @modules/)
- cors, dotenv, helmet, compression
- XSS sanitization middleware
- Global Error Middleware + 404 Handler
- Custom Response Utility
- Advanced Query Builder (search, filter, sort, pagination)
- Seed system support

**Frontend:**

- Next.js
- Tailwind CSS
- ESLint
- Turbopack

---

## 3. Setup Instructions

Running `npx create-full-project my-app` will generate:

- `backend` folder with Express + PostgreSQL + Prisma 7.0 setup
- `frontend` folder with Next.js + Tailwind CSS

After setup, you **must** configure the `.env` file for database connection in the `backend` folder.

Example `.env` file:

```env
DATABASE_URL="postgres://username:password@host:port/db_name"
PORT=5000
DEFAULT_PAGE_SIZE=10
NODE_ENV=development
LOG_LEVEL=info
```

---

## 4. Folder Structure (Generated after setup)

```
my-app/
├── backend/
│   ├── node_modules/
│   ├── prisma/
│   │   ├── seeds/
│   │   │   └── index.ts
│   │   └── schema.prisma
│   ├── src/
│   │   ├── middlewares/
│   │   │   ├── errorHandler.ts
│   │   │   ├── notFoundHandler.ts
│   │   │   └── sanitize.ts
│   │   ├── utils/
│   │   │   ├── responseUtils.ts
│   │   │   ├── queryBuilder.ts
│   │   │   ├── paginationUtils.ts
│   │   │   └── statusCodes.ts
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
        ├── page.js
        ├── globals.css
        ├── favicon.ico
        └── layout.js
    ├── public/
    ├── package.json
    ├── next.config.mjs
    ├── jsconfig.json
    ├── eslint.config.mjs
    └── postcss.config.mjs

```

---

## 5. Key Features

### 🏗️ Module-Based Architecture
Unlike traditional MVC structure, the new architecture organizes code by **business domain** (modules) rather than technical layers. Each module contains all related files:
- `*.controller.ts` - Request handlers
- `*.service.ts` - Business logic
- `*.route.ts` - API routes
- `*.validators.ts` - Input validation
- `*.types.ts` - TypeScript types

**Benefits:** Better code organization, easier maintenance, scalable for large projects.

### 🔍 Advanced Query Builder
Built-in utilities for dynamic API queries:
- **Search:** `?search=keyword` - Search across multiple fields
- **Filter:** `?status=active&role=admin` - Exact match filtering
- **Range Filter:** `?age_min=18&age_max=65` - Min/max range queries
- **IN Filter:** `?status=active,pending` - Multiple value filtering
- **Sort:** `?sort=createdAt:desc,name:asc` - Multi-field sorting
- **Pagination:** `?page=1&pageSize=20` - Automatic pagination

### 🛡️ Security Middleware
- **XSS Protection:** Sanitizes all incoming requests
- **Helmet:** Security headers configuration
- **Compression:** Response compression for better performance
- **CORS:** Cross-origin resource sharing configuration

### 🌱 Seed System
Organized seed structure in `prisma/seeds/` for database seeding:
```bash
npm run db:seed
```

### 🔗 Path Aliases
Clean imports using TypeScript path aliases:
```typescript
import { sendResponse } from '@/utils/responseUtils';
import prisma from '@root/prisma';
import AuthService from '@modules/auth/auth.service';
```

### ⚡ Modern Development Setup
- **tsx:** Fast TypeScript execution and watch mode
- **Prisma 7.0:** Latest Prisma with adapter support
- **ESNext:** Modern JavaScript/TypeScript features
- **Strict TypeScript:** Type safety with strict mode

---

## 6. Backend Scripts

```bash
# Development with auto-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run database seeds
npm run db:seed

# Type checking
npm run type-check
```

---

## 7. About the Developer

I’m a Full Stack Developer 👨🏻‍💻 passionate about crafting reliable and user-friendly web applications. Since beginning my journey in 2020 📅, I’ve worked on a wide range of projects—from simple static websites to complex, full-fledged platforms—each one helping me grow my skills and refine my approach to problem-solving. I enjoy working through every stage of development, from designing the interface 🎨 to implementing the logic ⚙️, always aiming for performance, scalability, and a great user experience. Outside of building applications, I regularly practice DSA 📚 to strengthen my problem-solving mindset and keep my technical skills sharp. I’m always open to meaningful collaborations 🤝 or exciting opportunities 🚀, so if you’re working on something impactful, let’s connect.

**Profiles:** [Portfolio](https://manankanani.in) | [Github](https://github.com/MananKanani5) | [Linkedin](https://www.linkedin.com/in/manan-kanani/)

---
