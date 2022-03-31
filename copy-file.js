import fs from 'fs/promises';

const copyFile = (options = {}) => {
  const { targets = [], hook = 'writeBundle' } = options;
  return {
    name: 'copy-files',
    [hook]: async () => {
      targets.forEach(async (target) => {
        try {
          console.log(`copying ${target.src}...`);
          const destPath = target.dest + target.src.split('/').pop();
          await fs.copyFile(target.src, destPath);
        } catch (error) {
          console.log(error);
        }
      });
    },
  };
};

export default copyFile;
