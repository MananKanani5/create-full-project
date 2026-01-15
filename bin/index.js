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
    
    console.log(chalk.cyan("\n╔════════════════════════════════════════════╗"));
    console.log(chalk.cyan("║   Create Full-Stack App CLI               ║"));
    console.log(chalk.cyan("╚════════════════════════════════════════════╝"));
    console.log(chalk.blue(`\n📁 Creating project: ${chalk.bold(projectName)}\n`));
    
    fs.ensureDirSync(root);
    fs.ensureDirSync(path.join(root, "frontend"));
    fs.ensureDirSync(path.join(root, "backend"));

    await setupBackend(root);
    await setupFrontend(root);
    
    console.log(chalk.green("╔════════════════════════════════════════════╗"));
    console.log(chalk.green("║   ✅ Project Created Successfully!         ║"));
    console.log(chalk.green("╚════════════════════════════════════════════╝"));
    console.log(chalk.cyan("\n📂 Next steps:\n"));
    console.log(chalk.gray(`   cd ${projectName}`));
    console.log(chalk.gray("   \n   Backend:"));
    console.log(chalk.gray("   cd backend"));
    console.log(chalk.gray("   npm run dev"));
    console.log(chalk.gray("   \n   Frontend (in another terminal):"));
    console.log(chalk.gray("   cd frontend"));
    console.log(chalk.gray("   npm run dev"));
    console.log(chalk.cyan("\n🎉 Happy coding!\n"));
  });

program.parse();
