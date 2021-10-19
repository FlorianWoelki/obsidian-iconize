const fs = require('fs');
const rollup = require('rollup');
const { sync: mkdirp } = require('mkdirp');
const path = require('path');

const svgPathRegex = /<path\s([^>]*)>/g;
const svgAttrRegex = /(?:\s*|^)([^= ]*)="([^"]*)"/g;
const svgViewboxRegex = /viewBox="([^"]*)"/g;
const validIconName = /^[A-Z]/;

function normalizeName(name) {
  return name
    .split(/[ -]/g)
    .map((part) => {
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
}

function checkAllowedAttr(attr, value) {
  if (attr === 'd') {
    return true;
  }
  if (attr === 'fill') {
    if (value === 'none') {
      // will be filtered out
      return true;
    }
    if (value === '#000') {
      // default value
      return true;
    }
  }
  if (attr === 'fill-rule' && value === 'nonzero') {
    // default value
    return true;
  }
  return false;
}

function extractPath(content, name) {
  const allPaths = [];
  while (true) {
    const svgPathMatches = svgPathRegex.exec(content);
    const svgPath = svgPathMatches && svgPathMatches[1];
    if (!svgPath) {
      break;
    }
    const attrs = {};
    while (true) {
      const svgAttrMatches = svgAttrRegex.exec(svgPath);
      if (!svgAttrMatches) {
        break;
      }
      if (!checkAllowedAttr(svgAttrMatches[1], svgAttrMatches[2])) {
        throw new Error(`Unknown SVG attr in ${name}: ${svgAttrMatches[1]}="${svgAttrMatches[2]}"\n${content}`);
      }
      attrs[svgAttrMatches[1]] = svgAttrMatches[2];
    }
    if (attrs.fill === 'none') {
      continue;
    }
    allPaths.push(attrs);
  }
  if (allPaths.length !== 1 || !allPaths[0].d) {
    throw new Error(
      `Wrong number of path in ${name}: ${allPaths.length}\n` + `${JSON.stringify(allPaths, undefined, 2)}\n${content}`,
    );
  }
  return allPaths[0].d;
}

function collectComponents(svgFilesPath, extraPrefix) {
  const svgFiles = fs.readdirSync(svgFilesPath);

  const icons = [];
  for (const svgFile of svgFiles) {
    const svgFilePath = path.join(svgFilesPath, svgFile);

    // handle subdirs
    const stats = fs.statSync(svgFilePath);
    if (stats.isDirectory()) {
      icons.push(...collectComponents(svgFilePath, extraPrefix));
      continue;
    }

    const origName = svgFile.slice(0, -4);
    const name = normalizeName(origName);

    if (!validIconName.exec(name)) {
      console.log(`skipping icon with invalid name: ${svgFilePath}`);
      continue;
    }

    const content = fs.readFileSync(svgFilePath);
    let svgPath;
    try {
      svgPath = extractPath(content, svgFilePath);
    } catch (err) {
      console.log(err);
      continue;
    }

    let svgViewbox = content.toString().match(svgViewboxRegex)[0];

    const icon = {
      name: name + extraPrefix,
      fileName: name + extraPrefix + '.js',
      svgPath,
      svgViewbox,
    };

    icons.push(icon);
  }

  return icons;
}

async function generate(iconpackPath, iconpackName, extraPrefix = '') {
  const basePath = path.resolve(__dirname, '..');

  const svgFilesPath = path.resolve(basePath, iconpackPath);
  const buildPath = path.resolve(basePath, 'build');
  mkdirp(buildPath);
  const publishPath = path.resolve(basePath, iconpackName);
  mkdirp(publishPath);

  console.log('collecting components...');
  const components = collectComponents(svgFilesPath, extraPrefix);
  console.log('generating components...');
  const pathsToUnlink = [];
  const indexFilePath = path.resolve(buildPath, 'index.js');
  const indexOutputPath = path.resolve(publishPath, `index-${extraPrefix}.js`);
  fs.writeFileSync(indexFilePath, '');
  for (const [index, component] of components.entries()) {
    if (!component.aliasFor) {
      console.log(`generating ${component.name}... (${index + 1}/${components.length})`);
    } else {
      console.log(`generating alias ${component.name}... (${index + 1}/${components.length})`);
    }

    const fileContent = `const ${component.name} = '<svg width="16" height="16" fill="currentColor" ${component.svgViewbox}><path d="${component.svgPath}" /></svg>';
export { ${component.name} };`;
    const inputPath = path.resolve(buildPath, component.fileName.toLowerCase());
    const outputPath = path.resolve(publishPath, component.fileName.toLowerCase());

    fs.writeFileSync(inputPath, fileContent);
    fs.appendFileSync(indexFilePath, `export * from './${component.fileName.toLowerCase()}';`);

    const bundle = await rollup.rollup({
      input: inputPath,
    });

    await bundle.write({
      file: outputPath,
    });

    // remember paths to unlink later
    if (!pathsToUnlink.includes(inputPath)) {
      pathsToUnlink.push(inputPath);
    }
  }

  const indexBundle = await rollup.rollup({
    input: indexFilePath,
  });

  await indexBundle.write({
    file: indexOutputPath,
  });

  // clean up
  for (const pathToUnlink of pathsToUnlink) {
    fs.unlinkSync(pathToUnlink);
  }
}

//generate('node_modules/remixicon/icons', 'remixicons');
//generate('node_modules/@fortawesome/fontawesome-free/svgs/regular', 'fontawesome', 'Line');
//generate('node_modules/@fortawesome/fontawesome-free/svgs/solid', 'fontawesome', 'Fill');
//generate('node_modules/@fortawesome/fontawesome-free/svgs/brands', 'fontawesome', 'Brands');
