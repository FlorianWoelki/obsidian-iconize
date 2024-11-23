import fs from 'fs/promises';
import path from 'path';

const copyFile = (options = {}) => {
  const { targets = [], hook = 'writeBundle' } = options;
  return {
    name: 'copy-files',
    [hook]: async () => {
      targets.forEach(async (target) => {
        try {
          console.log(`copying ${target.src}...`);
          const destPath = path.join(target.dest, path.basename(target.src));
          await fs.copyFile(target.src, destPath);
        } catch (error) {
          console.log(error);
        }
      });
    },
  };
};

export default copyFile;
