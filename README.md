A simple CLI tool to set up a full-stack JavaScript project with both **backend (Express)** and **frontend (Next.js + Tailwind CSS)** configured out of the box.

## Ussage

Run the following command in your terminal:

```bash
npx create-full-project my-app
```

## 1. Introduction

`create-full-project` helps you quickly scaffold a ready-to-use full-stack application with proper folder structure, essential configurations, and best practices in place.  
It sets up:

- **Backend:** Node.js + Express + PostgreSQL (Prisma ORM)
- **Frontend:** Next.js (with Tailwind CSS, ESLint, Turbopack)
- Common utilities like environment variables, error handling, and API structure.

---

## 2. Tech Stack

**Backend:**

- Node.js
- Express.js
- PostgreSQL (via Prisma ORM)
- cors
- dotenv
- Global Error Middleware
- Custom Response Utility

**Frontend:**

- Next.js
- Tailwind CSS
- ESLint
- Turbopack

---

## 3. Setup Instructions

Running `npx create-full-project my-app` will generate:

- `backend` folder with Express + PostgreSQL setup
- `frontend` folder with Next.js + Tailwind CSS

After setup, you **must** configure the `.env` file for database connection in the `backend` folder.

Example `.env` file:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
PORT=5000
```

---

## 4. Folder Structure (Generated after setup)

```
my-app/
├── backend/
│   ├── node_modules/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── middlewares/
│   │   │   ├── errorHandler.ts
│   │   ├── utils/
│   │   │   └── responseUtils.ts
│   │   │   └── statusCodes.ts
│   │   ├── routes/
│   │   ├── types/
│   │   ├── validators/
│   │   ├── controllers/
│   │   ├── prisma.ts
│   │   ├── routes.ts
│   │   └── index.ts
│   ├── .env
│   ├── tests/
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

## 5. About the Developer

I’m a Full Stack Developer 👨🏻‍💻 passionate about crafting reliable and user-friendly web applications. Since beginning my journey in 2020 📅, I’ve worked on a wide range of projects—from simple static websites to complex, full-fledged platforms—each one helping me grow my skills and refine my approach to problem-solving. I enjoy working through every stage of development, from designing the interface 🎨 to implementing the logic ⚙️, always aiming for performance, scalability, and a great user experience. Outside of building applications, I regularly practice DSA 📚 to strengthen my problem-solving mindset and keep my technical skills sharp. I’m always open to meaningful collaborations 🤝 or exciting opportunities 🚀, so if you’re working on something impactful, let’s connect.

**Profiles:** [Portfolio](https://manankanani.in) | [Github](https://github.com/MananKanani5) | [Linkedin](https://www.linkedin.com/in/manan-kanani/)

---
