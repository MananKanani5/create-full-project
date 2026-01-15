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
    "src/modules/auth",
    "prisma/seeds",
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
      "compression",
    ],
    { cwd: backendPath }
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
      "prisma@latest",
    ],
    { cwd: backendPath }
  );
  console.log(chalk.gray("   ✓ Dev dependencies installed"));

  // Prisma init
  console.log(chalk.blue("\n🗄️  Setting up Prisma 7.0..."));
  const prismaPath = path.join(backendPath, "prisma");
  if (!fs.existsSync(prismaPath)) {
    await execa("npx", ["prisma", "init"], { cwd: backendPath });
  } else {
    console.log(
      chalk.gray("   ℹ️  Prisma already initialized, skipping init")
    );
  }

  // Create Prisma 7.0 schema
  const prismaSchema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}`;
  fs.writeFileSync(path.join(backendPath, "prisma/schema.prisma"), prismaSchema);
  console.log(chalk.gray("   ✓ schema.prisma created"));

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
  fs.writeFileSync(path.join(backendPath, "prisma.config.ts"), prismaConfig);  console.log(chalk.gray("   ✓ prisma.config.ts created"));
  // Create prisma.ts at root
  const prismaClient = `import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })

export const prisma = new PrismaClient({ adapter })

export default prisma`;
  fs.writeFileSync(path.join(backendPath, "prisma.ts"), prismaClient);
  console.log(chalk.gray("   ✓ prisma.ts created"));

  // Create seeds/index.ts
  const seedsIndex = `import prisma from "@root/prisma";

async function main() {
    console.log("🌱 Starting seed...");

    //Call other seeds here from other files

    console.log("✅ Seed completed successfully!");
}

main()
    .catch(e => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });`;
  fs.writeFileSync(path.join(backendPath, "prisma/seeds/index.ts"), seedsIndex);
  console.log(chalk.gray("   ✓ seeds/index.ts created"));

  // Create tsconfig.json with path aliases
  console.log(chalk.blue("\n⚙️  Creating configuration files..."));
  const tsconfig = {
    compilerOptions: {
      target: "ES2023",
      module: "ESNext",
      moduleResolution: "Node",
      outDir: "dist",
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      lib: ["esnext"],
      esModuleInterop: true,
      skipLibCheck: true,
      baseUrl: ".",
      paths: {
        "@/*": ["src/*"],
        "@root/*": ["./*"],
        "@prisma": ["./prisma"],
        "@utils/*": ["src/utils/*"],
        "@modules/*": ["src/modules/*"],
        "@validators/*": ["src/validators/*"],
      },
    },
    include: ["src/**/*.ts", "src/types/**/*.ts", "src", "prisma", "prisma.ts"],
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
  const envContent = `DATABASE_URL="postgres://username:password@host:port/db_name"
PORT=5000
DEFAULT_PAGE_SIZE=10
NODE_ENV=development
LOG_LEVEL=info`;
  fs.writeFileSync(path.join(backendPath, ".env"), envContent);
  console.log(chalk.gray("   ✓ .env created"));

  // Create .gitignore
  const gitignore = `node_modules
.env
.env.*
/prisma/generated
/package-lock.json
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
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import path from "path";
import helmet from "helmet";
import sanitizeMiddleware from "./middlewares/sanitize";
import { notFoundHandler } from "./middlewares/notFoundHandler";
import compression from "compression";

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
app.listen(PORT, () => {
    console.log(\`Server is running on port \${PORT}\`);
});`;

  const routesContent = `import { Router } from "express";
const router = Router();

//add routes here

export default router;`;

  fs.writeFileSync(path.join(backendPath, "src/index.ts"), indexContent);
  console.log(chalk.gray("   ✓ src/index.ts created"));
  fs.writeFileSync(path.join(backendPath, "src/routes.ts"), routesContent);
  console.log(chalk.gray("   ✓ src/routes.ts created"));

  // ============= MIDDLEWARES =============
  console.log(chalk.blue("\n🛡️  Adding middleware files..."));
  
  // Add middleware: errorHandler.ts
  const errorHandler = `import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/responseUtils';
import STATUS_CODES from '../utils/statusCodes';

export const errorHandler = async (err: any, _req: Request, res: Response, _next: NextFunction): Promise<void> => {
  console.error("Error Handler Middleware:", err);
  sendResponse(res, false, err, err.message, STATUS_CODES.SERVER_ERROR);
};`;
  fs.writeFileSync(
    path.join(backendPath, "src/middlewares/errorHandler.ts"),
    errorHandler
  );
  console.log(chalk.gray("   ✓ errorHandler.ts"));

  // Add middleware: notFoundHandler.ts
  const notFoundHandler = `import { Request, Response, NextFunction } from "express";
import STATUS_CODES from "@/utils/statusCodes";
import { sendResponse } from "@/utils/responseUtils";

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
    notFoundHandler
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
    sanitize
  );
  console.log(chalk.gray("   ✓ sanitize.ts"));

  // Add utils: responseUtils.ts
  console.log(chalk.blue("\n🔧 Adding utility files..."));
  const responseUtils = `import { Response } from 'express';
import STATUS_CODES from "./statusCodes";

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
    responseUtils
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
  UNPROCESSIBLE_ENTITY: 422,
  SERVER_ERROR: 500
};

export default STATUS_CODES;`;
  fs.writeFileSync(
    path.join(backendPath, "src/utils/statusCodes.ts"),
    statusCodes
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
    paginationUtils
  );
  console.log(chalk.gray("   ✓ paginationUtils.ts"));

  // Add utils: queryBuilder.ts (comprehensive query builder)
  const queryBuilder = `// --- TYPES ---
type SearchField = {
    model?: string;
    field: string;
};

type FilterField = {
    key: string;
    model?: string;
    field: string;
    type?: "string" | "number" | "boolean" | "date" | "enum";
};

type SortField = {
    key: string;
    field: string;
    model?: string;
};

interface QueryOptions<T> {
    query: any;
    searchFields?: SearchField[];
    filterFields?: FilterField[];
    sortFields?: SortField[];
    defaultSort?: { key: string; sortOrder: "asc" | "desc" };
    modelWhereType: T;
}

// --- HELPERS ---
function buildNestedObject(path: string, field: string, value: any): Record<string, any> {
    const parts = path.split(".");
    let obj: Record<string, any> = { [field]: value };
    for (let i = parts.length - 1; i >= 0; i--) {
        obj = { [parts[i] as string]: obj };
    }
    return obj;
}

function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
    for (const key of Object.keys(source)) {
        const srcVal = source[key];
        const tgtVal = target[key];

        if (isPlainObject(srcVal) && isPlainObject(tgtVal)) {
            target[key] = deepMerge({ ...tgtVal }, srcVal);
        } else {
            target[key] = srcVal;
        }
    }
    return target;
}

function isPlainObject(v: any): v is Record<string, any> {
    return v !== null && typeof v === "object" && !Array.isArray(v);
}

function parseSortString(sortString: string | null) {
    if (!sortString) return [];
    return sortString.split(",").map((item) => {
        const [key, order] = item.split(":").map((s) => s.trim());
        return { key, order: order === "desc" ? "desc" : "asc" };
    });
}

function isNullString(v: any) {
    return typeof v === "string" && v.trim().toLowerCase() === "null";
}

// --- MAIN ---
export const buildPrismaQuery = <T>({
    query,
    searchFields = [],
    filterFields = [],
    sortFields = [],
    defaultSort,
}: QueryOptions<T>) => {

    // ------------------------
    // SEARCH
    // ------------------------
    let searchCondition: any[] = [];
    if (query?.search && searchFields.length > 0) {
        const q = String(query.search).trim();
        if (q.length > 0) {
            searchCondition = searchFields.map((f) => {
                const value = { contains: q, mode: "insensitive" };
                return f.model
                    ? buildNestedObject(f.model, f.field, value)
                    : { [f.field]: value };
            });
        }
    }

    // ------------------------
    // FILTERS (IN + RANGE + EXACT + NULL)
    // ------------------------
    let filterCondition: Record<string, any> = {};

    for (const filter of filterFields) {
        const raw = query?.[filter.key];

        // skip absent / empty
        if (raw === undefined || raw === "" || raw === null) continue;

        // If user passed explicit "null" string, treat it as real null
        if (isNullString(raw)) {
            // set null directly on the field (or nested)
            const value: any = null;
            if (filter.model) {
                const nested = buildNestedObject(filter.model, filter.field, value);
                filterCondition = deepMerge(filterCondition, nested);
            } else {
                filterCondition[filter.field] = value;
            }
            continue;
        }

        // 1) IN SUPPORT (comma-separated values)
        if (typeof raw === "string" && raw.includes(",")) {
            const arr = raw.split(",").map((v) => v.trim()).filter((v) => v.length > 0);
            const parsedArr = arr.map((v) => {
                if (isNullString(v)) return null;
                if (filter.type === "number") return Number(v);
                if (filter.type === "boolean") {
                    if (v === "1" || v === "0") return v === "1";
                    return String(v).toLowerCase() === "true";
                }
                if (filter.type === "date") return new Date(v);
                return v;
            });

            const value = { in: parsedArr };
            if (filter.model) {
                const nested = buildNestedObject(filter.model, filter.field, value);
                filterCondition = deepMerge(filterCondition, nested);
            } else {
                filterCondition[filter.field] = value;
            }
            continue;
        }

        // 2) RANGE SUPPORT (_min / _max)
        if (filter.key.endsWith("_min") || filter.key.endsWith("_max")) {
            const actualField = filter.field;
            const isMin = filter.key.endsWith("_min");

            let val: any = raw;
            if (filter.type === "number") val = Number(raw);
            else if (filter.type === "boolean") {
                if (typeof raw === "boolean") val = raw;
                else if (raw === "1" || raw === "0") val = raw === "1";
                else val = String(raw).toLowerCase() === "true";
            } else if (filter.type === "date") val = new Date(raw);

            const rangeObj = isMin ? { gte: val } : { lte: val };

            if (filter.model) {
                const nested = buildNestedObject(filter.model, actualField, rangeObj);
                filterCondition = deepMerge(filterCondition, nested);
            } else {
                filterCondition[actualField] = {
                    ...(filterCondition[actualField] || {}),
                    ...rangeObj,
                };
            }
            continue;
        }

        // 3) EXACT VALUE FILTER (including typed conversion)
        let parsedVal: any = raw;
        if (filter.type === "number") parsedVal = Number(raw);
        if (filter.type === "boolean") {
            if (typeof raw === "boolean") parsedVal = raw;
            else if (raw === "1" || raw === "0") parsedVal = raw === "1";
            else parsedVal = String(raw).toLowerCase() === "true";
        }
        if (filter.type === "date") parsedVal = new Date(raw);

        if (filter.model) {
            const nested = buildNestedObject(filter.model, filter.field, parsedVal);
            filterCondition = deepMerge(filterCondition, nested);
        } else {
            filterCondition[filter.field] = parsedVal;
        }
    }

    // ------------------------
    // SORT
    // ------------------------
    let orderBy: any[] = [];
    const sortString: string | null = query?.sort ?? null;
    let sortItems = parseSortString(sortString);

    if (sortItems.length === 0 && defaultSort) {
        sortItems = [{ key: defaultSort.key, order: defaultSort.sortOrder }];
    }

    for (const item of sortItems) {
        const sortConfig = sortFields.find((sf) => sf.key === item.key);
        if (!sortConfig) continue;

        if (sortConfig.model) {
            orderBy.push(buildNestedObject(sortConfig.model, sortConfig.field, item.order));
        } else {
            orderBy.push({ [sortConfig.field]: item.order });
        }
    }

    if (orderBy.length === 0) {
        orderBy = [{ createdAt: "desc" }];
    }

    // ------------------------
    // COMBINE WHERE
    // ------------------------
    const AND: any[] = [];

    AND.push({ isDeleted: false });

    if (Object.keys(filterCondition).length > 0) AND.push(filterCondition);
    if (searchCondition.length > 0) AND.push({ OR: searchCondition });

    const where: any = AND.length > 0 ? { AND } : {};

    return { where, orderBy };
};`;
  fs.writeFileSync(
    path.join(backendPath, "src/utils/queryBuilder.ts"),
    queryBuilder
  );
  console.log(chalk.gray("   ✓ queryBuilder.ts"));

  // ============= AUTH MODULE SKELETON =============
  console.log(chalk.blue("\n📦 Creating auth module structure..."));
  
  // auth.controller.ts
  const authController = `import { Request, Response, NextFunction } from "express";
import STATUS_CODES from "@/utils/statusCodes";
import { sendResponse } from "@/utils/responseUtils";

// Add your auth controllers here

export {};`;
  fs.writeFileSync(
    path.join(backendPath, "src/modules/auth/auth.controller.ts"),
    authController
  );
  console.log(chalk.gray("   ✓ auth.controller.ts"));

  // auth.route.ts
  const authRoute = `import { Router } from "express";

const router = Router();

// Add your auth routes here

export default router;`;
  fs.writeFileSync(
    path.join(backendPath, "src/modules/auth/auth.route.ts"),
    authRoute
  );
  console.log(chalk.gray("   ✓ auth.route.ts"));

  // auth.service.ts
  const authService = `import prisma from "@root/prisma";

// Add your auth services here

export {};`;
  fs.writeFileSync(
    path.join(backendPath, "src/modules/auth/auth.service.ts"),
    authService
  );
  console.log(chalk.gray("   ✓ auth.service.ts"));

  // auth.validators.ts
  const authValidators = `// Add your auth validators here

export {};`;
  fs.writeFileSync(
    path.join(backendPath, "src/modules/auth/auth.validators.ts"),
    authValidators
  );
  console.log(chalk.gray("   ✓ auth.validators.ts"));

  // auth.types.ts
  const authTypes = `// Add your auth types here

export {};`;
  fs.writeFileSync(
    path.join(backendPath, "src/modules/auth/auth.types.ts"),
    authTypes
  );
  console.log(chalk.gray("   ✓ auth.types.ts"));

  // Update package.json scripts
  console.log(chalk.blue("\n📝 Updating package.json scripts..."));
  const packageJsonPath = path.join(backendPath, "package.json");
  const packageJson = fs.readJsonSync(packageJsonPath);
  packageJson.scripts = {
    dev: "tsx watch src/index.ts",
    build: "tsc",
    start: "node dist/index.js",
    "db:seed": "tsx prisma/seeds/index.ts",
    "type-check": "tsc --noEmit",
  };
  fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });
  console.log(chalk.gray("   ✓ Scripts configured"));

  console.log(chalk.green("✅ Backend setup complete with new structure!\n"));
}

module.exports = setupBackend;
