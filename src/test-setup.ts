/**
 * This test setup script is used to patch the `obsidian` module to make it work with
 * `vitest`. It is a workaround and only adds the `main.js` file and updates the
 * `package.json` to point to it.
 */
import { writeFile } from 'fs';
import { join } from 'path';

const obsidianModuleDir = join(__dirname, '../node_modules/obsidian');
const mainFilePath = join(obsidianModuleDir, 'main.js');

// Creates an empty `main.js` file.
writeFile(mainFilePath, '', (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});

const packageJsonPath = join(obsidianModuleDir, 'package.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require(packageJsonPath);
packageJson.main = 'main.js';

// Modifies `package.json` file to add `main.js` as the main entry point.
writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});
