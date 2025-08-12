const fs = require("fs");
const chalk = require("chalk");

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content.trim(), "utf8");
  console.log(chalk.gray(`✍️  Created ${filePath}`));
}

module.exports = {
  writeFile,
};
