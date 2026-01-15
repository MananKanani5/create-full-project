const { execa } = require("execa");
const path = require("path");
const chalk = require("chalk").default;
const fs = require("fs/promises");

async function setupFrontend(root) {
  console.log(chalk.yellow("\n🚀 Setting up frontend..."));
  console.log(chalk.blue("\n📦 Creating Next.js app with Tailwind CSS..."));
  console.log(chalk.gray("   This may take a minute...\n"));

  await execa(
    "npx",
    [
      "create-next-app@latest",
      "frontend",
      "--yes",
      "--tailwind",
      "--eslint",
      "--app",
      "--no-src-dir",
      "--no-import-alias",
      "--use-npm",
      "--turbopack",
      "--no-typescript",
    ],
    {
      cwd: root,
      stdio: "inherit",
    }
  );


  const readmePath = path.join(root, "frontend", "README.md");

  const customReadme = `# Frontend – Next.js App

This frontend was created using the \`create-fullstack-app\` CLI tool, which automates a clean and minimal setup using **Next.js** with **Tailwind CSS**, **ESLint**, and **Turbopack**.

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- [Tailwind CSS](https://tailwindcss.com/)
- [ESLint](https://eslint.org/)
- [Turbopack](https://turbo.build/pack) – lightning-fast bundler
- JavaScript (no TypeScript)

---

## About the Developer

**👨‍💻 Manan Kanani**  
Professional Website Designer & Developer  
Based in Mumbai, Maharashtra, India  
Crafting inspiring and user-centric web experiences since 2020.

- 🌐 Portfolio: [manankanani.in](https://manankanani.in)
- 💼 LinkedIn: [linkedin.com/in/manan-kanani](https://linkedin.com/in/manan-kanani)
- 🛠 GitHub: [github.com/MananKanani5](https://github.com/MananKanani5)

---

Generated with ❤️ using [create-fullstack-app](https://github.com/your-org/create-fullstack-app).
`;

  await fs.writeFile(readmePath, customReadme, "utf-8");

  console.log(chalk.green("\n✅ Frontend setup complete!\n"));
}

module.exports = setupFrontend;
