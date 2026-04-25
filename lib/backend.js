const { execa } = require("execa");
const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk").default;

async function setupBackend(root) {
  const backendPath = path.join(root, "backend");
  console.log(chalk.yellow("\n🛠 Setting up backend..."));

  // Create new module-based folder structure
  console.log(chalk.blue("\n📁 Creating folder structure..."));
  const folders = [
    "src/middlewares",
    "src/utils",
    "src/validators",
    "src/modules/auth",
    "prisma/seeds",
    "public/uploads",
  ];
  folders.forEach((folder) => {
    fs.ensureDirSync(path.join(backendPath, folder));
    console.log(chalk.gray(`   ✓ ${folder}`));
  });

  // npm init
  console.log(chalk.blue("\n📦 Initializing package.json..."));
  await execa("npm", ["init", "-y"], { cwd: backendPath });
  console.log(chalk.gray("   ✓ package.json created"));

  // Install dependencies with Prisma 7.0 and new packages
  console.log(chalk.blue("\n📥 Installing dependencies..."));
  console.log(chalk.gray("   This may take a minute..."));
  await execa(
    "npm",
    [
      "install",
      "express",
      "cors",
      "dotenv",
      "@prisma/client@latest",
      "@prisma/adapter-pg",
      "xss",
      "helmet",
      "prisma-qb",
      "tsc-alias",
      "compression",
    ],
    { cwd: backendPath },
  );
  console.log(chalk.gray("   ✓ Production dependencies installed"));

  console.log(chalk.blue("\n📥 Installing dev dependencies..."));
  await execa(
    "npm",
    [
      "install",
      "-D",
      "typescript",
      "tsx",
      "@types/express",
      "@types/node",
      "@types/cors",
      "@types/compression",
      "prisma@latest",
    ],
    { cwd: backendPath },
  );
  console.log(chalk.gray("   ✓ Dev dependencies installed"));

  // Prisma init
  console.log(chalk.blue("\n🗄️  Setting up Prisma 7.0..."));
  const prismaPath = path.join(backendPath, "prisma");
  if (!fs.existsSync(prismaPath)) {
    await execa("npx", ["prisma", "init"], { cwd: backendPath });
  } else {
    console.log(chalk.gray("   ℹ️  Prisma already initialized, skipping init"));
  }

  // Create Prisma 7.0 schema
  const prismaSchema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

/// Baseline roles for RBAC-style apps — extend or replace for your product.
model Role {
  id          Int      @id @default(autoincrement())
  name        String
  slug        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([name])
}
`;
  fs.writeFileSync(
    path.join(backendPath, "prisma/schema.prisma"),
    prismaSchema,
  );
  console.log(chalk.gray("   ✓ schema.prisma created"));

  // Generate Prisma Client
  console.log(chalk.blue("\n⚡ Generating Prisma Client..."));
  await execa("npx", ["prisma", "generate"], { cwd: backendPath });
  console.log(chalk.gray("   ✓ Prisma Client generated"));

  // Create prisma.config.ts
  const prismaConfig = `import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
        seed: 'prisma/seeds/index.ts',
    },
    datasource: {
        url: env('DATABASE_URL'),
    },
})`;
  fs.writeFileSync(path.join(backendPath, "prisma.config.ts"), prismaConfig);
  console.log(chalk.gray("   ✓ prisma.config.ts created"));
  // Create prisma.ts at root
  const prismaClient = `import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })

export const prisma = new PrismaClient({ adapter })

export default prisma`;
  fs.writeFileSync(path.join(backendPath, "prisma.ts"), prismaClient);
  console.log(chalk.gray("   ✓ prisma.ts created"));

  // Create prisma/seeds: registry runner + roles seed (common RBAC baseline)
  const seedRoles = `import prisma from "@root/prisma.js";

/** Default roles many apps start from — edit or add rows for your domain. */
const DEFAULT_ROLES = [
  {
    name: "Administrator",
    slug: "admin",
    description: "Full access to manage users, roles, and settings.",
  },
  {
    name: "User",
    slug: "user",
    description: "Standard end-user access.",
  }
] as const;

export async function seedRoles(): Promise<void> {
  console.log("   → roles");
  for (const role of DEFAULT_ROLES) {
    await prisma.role.upsert({
      where: { slug: role.slug },
      update: { name: role.name, description: role.description },
      create: {
        name: role.name,
        slug: role.slug,
        description: role.description,
      },
    });
  }
}
`;
  const seedsIndex = `import prisma from "@root/prisma.js";
import { seedRoles } from "./roles.seed.js";

const seedRegistry = {
  roles: seedRoles,
} as const;

type SeedName = keyof typeof seedRegistry;

function parseSelectedSeeds(argv: string[]): SeedName[] | null {
  const onlyArg =
    argv.find((arg) => arg.startsWith("--only=")) ??
    (() => {
      const idx = argv.indexOf("--only");
      return idx >= 0 ? \`--only=\${argv[idx + 1] ?? ""}\` : null;
    })();

  if (!onlyArg) return null;

  const raw = onlyArg.split("=")[1]?.trim() ?? "";
  if (!raw) {
    throw new Error(
      "Missing value for --only. Example: --only=roles",
    );
  }

  const requested = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const validSeeds = Object.keys(seedRegistry) as SeedName[];
  const invalidSeeds = requested.filter(
    (seedName) => !validSeeds.includes(seedName as SeedName),
  );
  if (invalidSeeds.length > 0) {
    throw new Error(
      \`Invalid seed name(s): \${invalidSeeds.join(", ")}. Valid seeds: \${validSeeds.join(", ")}\`,
    );
  }

  return requested as SeedName[];
}

async function main(): Promise<void> {
  console.log("🌱 Starting seed...\\n");

  const selectedSeeds = parseSelectedSeeds(process.argv.slice(2));
  const seedOrder = (Object.keys(seedRegistry) as SeedName[]).filter(
    (seedName) => !selectedSeeds || selectedSeeds.includes(seedName),
  );

  if (selectedSeeds) {
    console.log(\`🎯 Running selected seeds: \${seedOrder.join(", ")}\\n\`);
  } else {
    console.log(
      \`🧩 Running all seeds (registry order): \${seedOrder.join(", ")}\\n\`,
    );
  }

  for (const seedName of seedOrder) {
    await seedRegistry[seedName]();
  }

  console.log("\\n✅ All seeds completed successfully!");
}

main()
  .catch((e: unknown) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;
  fs.writeFileSync(
    path.join(backendPath, "prisma/seeds/roles.seed.ts"),
    seedRoles,
  );
  fs.writeFileSync(path.join(backendPath, "prisma/seeds/index.ts"), seedsIndex);
  console.log(chalk.gray("   ✓ prisma/seeds/index.ts (+ roles.seed.ts)"));

  // Create tsconfig.json with path aliases
  console.log(chalk.blue("\n⚙️  Creating configuration files..."));
  const tsconfig = {
    compilerOptions: {
      target: "ES2023",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      outDir: "dist",
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      lib: ["esnext"],
      esModuleInterop: true,
      skipLibCheck: true,
      paths: {
        "@/*": ["./src/*"],
        "@root/*": ["./*"],
        "@prisma": ["./prisma"],
        "@utils/*": ["./src/utils/*"],
        "@modules/*": ["./src/modules/*"],
        "@validators/*": ["./src/validators/*"],
      },
    },
    include: [
      "./src/**/*.ts",
      "./src/types/**/*.ts",
      "./src",
      "./prisma/**/*.ts",
      "./prisma.ts",
    ],
    "ts-node": {
      transpileOnly: true,
      esm: true,
    },
  };
  fs.writeJsonSync(path.join(backendPath, "tsconfig.json"), tsconfig, {
    spaces: 2,
  });
  console.log(chalk.gray("   ✓ tsconfig.json created"));

  // Create .env file with new variables
  const envContent = `DATABASE_URL="postgres://username:password@localhost:5432/my_app?schema=public"
PORT=5000
DEFAULT_PAGE_SIZE=10
NODE_ENV=development
LOG_LEVEL=info
KEEP_ALIVE_TIMEOUT_MS=65000
HEADERS_TIMEOUT_MS=66000
REQUEST_TIMEOUT_MS=0
SHUTDOWN_TIMEOUT_MS=15000
`;
  fs.writeFileSync(path.join(backendPath, ".env"), envContent);
  console.log(chalk.gray("   ✓ .env created"));

  // Create .gitignore
  const gitignore = `node_modules
.env
.env.*
/prisma/generated
dist
build
package-lock.json`;
  fs.writeFileSync(path.join(backendPath, ".gitignore"), gitignore);
  console.log(chalk.gray("   ✓ .gitignore created"));

  // Starter backend files - index.ts with new middleware
  console.log(chalk.blue("\n🚀 Creating core application files..."));
  const indexContent = `import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import path from "path";
import helmet from "helmet";
import sanitizeMiddleware from "./middlewares/sanitize.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import compression from "compression";
import { configureServerTimeouts, registerServerLifecycle } from "./utils/serverConfig.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(sanitizeMiddleware);

app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(\`Server is running on port \${PORT}\`);
});

configureServerTimeouts(server);
registerServerLifecycle(server);
`;

const routesContent = 
`
import { Router } from "express";
import { Request, Response } from "express";
import { sendResponse } from "./utils/responseUtils";
import STATUS_CODES from "./utils/statusCodes";
const router = Router();

router.get("/", (_req: Request, res: Response) => {
  sendResponse(res, true, "", "Welcome to the Backend!", STATUS_CODES.OK);
});

//Call other modules routes here

export default router;
`;

  fs.writeFileSync(path.join(backendPath, "src/index.ts"), indexContent);
  console.log(chalk.gray("   ✓ src/index.ts created"));
  fs.writeFileSync(path.join(backendPath, "src/routes.ts"), routesContent);
  console.log(chalk.gray("   ✓ src/routes.ts created"));

  // ============= MIDDLEWARES =============
  console.log(chalk.blue("\n🛡️  Adding middleware files..."));

  // Add middleware: errorHandler.ts
  const errorHandler = `import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/responseUtils.js';
import STATUS_CODES from '../utils/statusCodes.js';

export const errorHandler = async (err: any, _req: Request, res: Response, _next: NextFunction): Promise<void> => {
  console.error("Error Handler Middleware:", err);
  sendResponse(res, false, err, err.message, STATUS_CODES.SERVER_ERROR);
};`;
  fs.writeFileSync(
    path.join(backendPath, "src/middlewares/errorHandler.ts"),
    errorHandler,
  );
  console.log(chalk.gray("   ✓ errorHandler.ts"));

  // Add middleware: notFoundHandler.ts
  const notFoundHandler = `import { Request, Response, NextFunction } from "express";
import STATUS_CODES from "../utils/statusCodes.js";
import { sendResponse } from "../utils/responseUtils.js";

export const notFoundHandler = (req: Request, res: Response, _next: NextFunction) => {
    const msg = \`Route not found: \${req.method} \${req.originalUrl}\`;
    try {
        console.error(msg);
    } catch (e) {
        console.error(msg);
    }
    sendResponse(res, false, null, "Route not found", STATUS_CODES.NOT_FOUND);
    return;
};`;
  fs.writeFileSync(
    path.join(backendPath, "src/middlewares/notFoundHandler.ts"),
    notFoundHandler,
  );
  console.log(chalk.gray("   ✓ notFoundHandler.ts"));

  // Add middleware: sanitize.ts
  const sanitize = `import { Request, Response, NextFunction } from "express";
import xss from "xss";

function sanitizeValue(value: any): any {
    if (typeof value === "string") return xss(value);
    if (Array.isArray(value)) return value.map(sanitizeValue);
    if (value && typeof value === "object") return sanitizeObject(value);
    return value;
}

function sanitizeObject(obj: Record<string, any>): Record<string, any> {
    for (const key of Object.keys(obj)) {
        obj[key] = sanitizeValue(obj[key]);
    }
    return obj;
}

export default function sanitizeMiddleware(req: Request, _res: Response, next: NextFunction) {
    try {
        if (req.body) sanitizeObject(req.body);
        if (req.query) sanitizeObject(req.query as any); 
        if (req.params) sanitizeObject(req.params as any);
    } catch (e) {
        console.warn("Sanitize middleware error:", e);
    }
    next();
}`;
  fs.writeFileSync(
    path.join(backendPath, "src/middlewares/sanitize.ts"),
    sanitize,
  );
  console.log(chalk.gray("   ✓ sanitize.ts"));

  // Add utils: responseUtils.ts
  console.log(chalk.blue("\n🔧 Adding utility files..."));
  const responseUtils = `import { Response } from 'express';
import STATUS_CODES from "./statusCodes.js";

export const sendResponse = (
  res: Response,
  status: boolean,
  data: unknown,
  message = "",
  statusCode = STATUS_CODES.OK
) => {
  return res.status(statusCode).json({ status, data, message });
};`;
  fs.writeFileSync(
    path.join(backendPath, "src/utils/responseUtils.ts"),
    responseUtils,
  );
  console.log(chalk.gray("   ✓ responseUtils.ts"));

  // Add utils: statusCodes.ts
  const statusCodes = `const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  SERVER_ERROR: 500
};

export default STATUS_CODES;`;
  fs.writeFileSync(
    path.join(backendPath, "src/utils/statusCodes.ts"),
    statusCodes,
  );
  console.log(chalk.gray("   ✓ statusCodes.ts"));

  // Add utils: paginationUtils.ts
  const paginationUtils = `export const getPaginationOptions = (query: any, defaultPageSize: number) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(query.pageSize, 10) || defaultPageSize, 1), 100);
    return {
        take: pageSize,
        skip: (page - 1) * pageSize,
        page,
        pageSize,
    };
};

export const formatPaginationResponse = (data: any[], totalRecords: number, page: number, pageSize: number) => {
    const totalPages = Math.ceil(totalRecords / pageSize);
    return {
        currentPage: page,
        pageSize,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        data,
    };
};`;
  fs.writeFileSync(
    path.join(backendPath, "src/utils/paginationUtils.ts"),
    paginationUtils,
  );
  console.log(chalk.gray("   ✓ paginationUtils.ts"));

  const serverConfig = `
  
import type { Server } from "http";
import prisma from "@root/prisma.js";

export function configureServerTimeouts(server: Server) {
  server.keepAliveTimeout = Number(process.env.KEEP_ALIVE_TIMEOUT_MS ?? 65000);
  server.headersTimeout = Number(process.env.HEADERS_TIMEOUT_MS ?? 66000);
  server.requestTimeout = Number(process.env.REQUEST_TIMEOUT_MS ?? 0);
}

export function registerServerLifecycle(server: Server) {
  let shuttingDown = false;

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(\`[Server] Received \${signal}. Starting graceful shutdown...\`);

    server.close(async () => {
      try {
        await prisma.$disconnect();
        console.log("[Server] Graceful shutdown complete.");
        process.exit(0);
      } catch (error) {
        console.error("[Server] Error during Prisma disconnect:", error);
        process.exit(1);
      }
    });

    setTimeout(
      () => {
        console.error("[Server] Graceful shutdown timed out. Exiting forcefully.");
        process.exit(1);
      },
      Number(process.env.SHUTDOWN_TIMEOUT_MS ?? 15_000),
    ).unref();
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });

  process.on("unhandledRejection", (reason) => {
    console.error("[Server] Unhandled promise rejection:", reason);
  });

  process.on("uncaughtException", (error) => {
    console.error("[Server] Uncaught exception:", error);
    void shutdown("uncaughtException");
  });
}`;
  fs.writeFileSync(
    path.join(backendPath, "src/utils/serverConfig.ts"),
    serverConfig,
  );
  console.log(chalk.gray("   ✓ serverConfig.ts"));

  // ============= AUTH MODULE SKELETON =============
  console.log(chalk.blue("\n📦 Creating auth module structure..."));

  // auth.controller.ts
  const authController = `// Add your auth controllers here
// Example:
// import { Request, Response, NextFunction } from "express";
// import STATUS_CODES from "../../utils/statusCodes.js";
// import { sendResponse } from "../../utils/responseUtils.js";

export {};`;
  fs.writeFileSync(
    path.join(backendPath, "src/modules/auth/auth.controller.ts"),
    authController,
  );
  console.log(chalk.gray("   ✓ auth.controller.ts"));

  // auth.route.ts
  const authRoute = `// Add your auth routes here
// Example:
// import { Router } from "express";
// const router = Router();
// router.post("/login", authController.login);
// export default router;

export {};`;
  fs.writeFileSync(
    path.join(backendPath, "src/modules/auth/auth.route.ts"),
    authRoute,
  );
  console.log(chalk.gray("   ✓ auth.route.ts"));

  // auth.service.ts
  const authService = `// Add your auth services here
// Example:
// import prisma from "../../../prisma.js";

export {};`;
  fs.writeFileSync(
    path.join(backendPath, "src/modules/auth/auth.service.ts"),
    authService,
  );
  console.log(chalk.gray("   ✓ auth.service.ts"));

  // auth.validators.ts
  const authValidators = `// Add your auth validators here

export {};`;
  fs.writeFileSync(
    path.join(backendPath, "src/modules/auth/auth.validators.ts"),
    authValidators,
  );
  console.log(chalk.gray("   ✓ auth.validators.ts"));

  // auth.types.ts
  const authTypes = `// Add your auth types here

export {};`;
  fs.writeFileSync(
    path.join(backendPath, "src/modules/auth/auth.types.ts"),
    authTypes,
  );
  console.log(chalk.gray("   ✓ auth.types.ts"));

  // Update package.json scripts
  console.log(chalk.blue("\n📝 Updating package.json scripts..."));
  const packageJsonPath = path.join(backendPath, "package.json");
  const packageJson = fs.readJsonSync(packageJsonPath);
  packageJson.scripts = {
    "dev": "tsx watch src/index.ts",
    "build": "prisma generate && tsc && tsc-alias",
    "start": "node dist/src/index.js",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:deploy": "prisma migrate deploy",
    "db:seed": "tsx prisma/seeds/index.ts",
    "db:studio": "prisma studio",
    "type-check": "tsc --noEmit"
  };
  fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });
  console.log(chalk.gray("   ✓ Scripts configured"));

  console.log(chalk.green("\n✅ Backend setup complete with new structure!\n"));
  console.log(chalk.cyan("📦 New features included:"));
  console.log(chalk.gray("   - Prisma 7.0 with adapter support"));
  console.log(chalk.gray("   - Module-based architecture"));
  console.log(
    chalk.gray(
      "   - prisma-qb: buildPrismaQuery() → Prisma where + orderBy from HTTP query params",
    ),
  );
  console.log(
    chalk.gray("   - Enhanced middleware (sanitize, notFound, error handling)"),
  );
  console.log(chalk.gray("   - Path aliases (@/, @utils/, @modules/)"));
  console.log(chalk.gray("   - Seed system support"));
  console.log(chalk.gray("   - Graceful shutdown with Prisma disconnect\n"));
  console.log(chalk.yellow("⚠️  Before running the app:"));
  console.log(chalk.gray("   1. Update DATABASE_URL in .env file"));
  console.log(chalk.gray("   2. Run: npm run db:migrate\n"));
}

module.exports = setupBackend;
