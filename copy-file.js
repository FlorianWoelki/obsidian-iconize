import fs from 'fs/promises';
import { normalize } from 'path';

const copyFile = (options = {}) => {
  const { targets = [], hook = 'writeBundle' } = options;
  return {
    name: 'copy-files',
    [hook]: async () => {
      targets.forEach(async (target) => {
        try {
          const destPath = normalize(`${target.dest}/${target.src.split('/').pop()}`);
          console.log(`copying ${target.src} to ${destPath}...`);
          await fs.copyFile(target.src, destPath);
        } catch (error) {
          console.log(error);
        }
      });
    },
  };
};

export default copyFile;
