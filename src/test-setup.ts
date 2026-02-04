/**
 * This test setup script is used to patch the `obsidian` module to make it work with
 * `vitest`. It is a workaround and only adds the `main.js` file and updates the
 * `package.json` to point to it.
 */
import { writeFileSync } from 'fs';
import { join } from 'path';
import { beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.clearAllMocks();
});

(async () => {
  const obsidianModuleDir = join(__dirname, '../node_modules/obsidian');
  const mainFilePath = join(obsidianModuleDir, 'main.js');

  // Creates an empty `main.js` file.
  writeFileSync(mainFilePath, '');

  const packageJsonPath = join(obsidianModuleDir, 'package.json');
  const packageJson = (await import(packageJsonPath)).default;
  delete packageJson.main;
  packageJson.main = 'main.js';

  // Modifies `package.json` file to add `main.js` as the main entry point.
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
})();
