#!/usr/bin/env node
const { program } = require("commander");
const path = require("path");
const fs = require("fs-extra");
const chalk = require("chalk").default;

const setupFrontend = require("../lib/frontend");
const setupBackend = require("../lib/backend");

program
  .name("create-fullstack-app")
  .description(
    "Scaffold a fullstack app with Next.js, Tailwind, Express, Prisma"
  )
  .argument("<project-name>")
  .action(async (projectName) => {
    const root = path.resolve(projectName);
    fs.ensureDirSync(root);
    fs.ensureDirSync(path.join(root, "frontend"));
    fs.ensureDirSync(path.join(root, "backend"));

    console.log(chalk.blue(`\n📁 Creating ${projectName}...`));
    await setupFrontend(root);
    await setupBackend(root);
    console.log(chalk.green("\n✅ Done! Happy coding.\n"));
  });

program.parse();
