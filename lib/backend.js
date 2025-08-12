const { execa } = require("execa");
const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk").default;

async function setupBackend(root) {
  const backendPath = path.join(root, "backend");
  console.log(chalk.yellow("\n🛠 Setting up backend..."));

  // Create base folders
  const folders = [
    "src/controllers",
    "src/routes",
    "src/middleware",
    "src/utils",
    "src/types",
    "src/validators",
    "tests",
  ];
  folders.forEach((folder) => fs.ensureDirSync(path.join(backendPath, folder)));

  // npm init
  await execa("npm", ["init", "-y"], { cwd: backendPath });

  // Install dependencies
  await execa(
    "npm",
    ["install", "express", "cors", "dotenv", "@prisma/client"],
    { cwd: backendPath }
  );
  await execa(
    "npm",
    [
      "install",
      "-D",
      "typescript",
      "ts-node-dev",
      "@types/express",
      "@types/node",
      "@types/cors",
      "prisma",
    ],
    { cwd: backendPath }
  );

  // Prisma init
  const prismaPath = path.join(backendPath, "prisma");
  if (!fs.existsSync(prismaPath)) {
    await execa("npx", ["prisma", "init"], { cwd: backendPath });
  } else {
    console.log(
      chalk.gray("ℹ️  Prisma already initialized, skipping `prisma init`.")
    );
  }

  // Create tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: "ES6",
      module: "commonjs",
      rootDir: "./src",
      outDir: "./dist",
      strict: true,
      esModuleInterop: true,
    },
  };
  fs.writeJsonSync(path.join(backendPath, "tsconfig.json"), tsconfig, {
    spaces: 2,
  });

  // Create .env file
  const envContent = `PORT=5000
DATABASE_URL="postgres://username:password@localhost:5432/db_name"`;
  fs.writeFileSync(path.join(backendPath, ".env"), envContent);

  // Starter backend files
  const indexContent = `
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", routes);

// Add after routes
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(\`Server is running on port \${PORT}\`);
});
`.trim();

  const routesContent = `
import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.send("API is working!");
});

export default router;
`.trim();

  const prismaClient = `
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export default prisma;
`.trim();

  fs.writeFileSync(path.join(backendPath, "src/index.ts"), indexContent);
  fs.writeFileSync(path.join(backendPath, "src/routes.ts"), routesContent);
  fs.writeFileSync(path.join(backendPath, "src/prisma.ts"), prismaClient);

  // Add utils: responseUtils.ts
  const responseUtils = `
import { Response } from 'express';
import STATUS_CODES from "./statusCodes";

export const sendResponse = (
  res: Response,
  status: boolean,
  data: unknown,
  message = "",
  statusCode = STATUS_CODES.OK
) => {
  return res.status(statusCode).json({ status, data, message });
};
`.trim();
  fs.writeFileSync(
    path.join(backendPath, "src/utils/responseUtils.ts"),
    responseUtils
  );

  // Add utils: statusCodes.ts
  const statusCodes = `
const STATUS_CODES = {
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

export default STATUS_CODES;
`.trim();
  fs.writeFileSync(
    path.join(backendPath, "src/utils/statusCodes.ts"),
    statusCodes
  );

  // Add middleware: errorHandler.ts
  const errorHandler = `
import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/responseUtils';
import STATUS_CODES from '../utils/statusCodes';

export const errorHandler = async (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.error(err.stack);
  sendResponse(res, false, err, err.message, STATUS_CODES.SERVER_ERROR);
};
`.trim();
  fs.writeFileSync(
    path.join(backendPath, "src/middleware/errorHandler.ts"),
    errorHandler
  );

  console.log(chalk.green("✅ Backend setup complete.\n"));
}

module.exports = setupBackend;
