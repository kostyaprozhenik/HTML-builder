const { promises: fs } = require('fs');
const path = require('path');

const dist = path.resolve(__dirname, 'project-dist');
const assets = path.resolve(__dirname, 'assets');

const readFile = (p) =>
  new Promise((resolve) => {
    let templateContent = '';
    fs.open(path.join(__dirname, p), 'r').then((file) => {
      const stream = file.createReadStream({ encoding: 'utf8' });
      stream.on('data', (chunk) => {
        templateContent += chunk;
      });
      stream.on('end', () => {
        resolve(templateContent);
      });
    });
  });

const writeFile = (filePath, content) =>
  new Promise((resolve) => {
    fs.open(path.join(dist, filePath), 'w').then((file) => {
      const writer = file.createWriteStream();
      writer.write(content);
      writer.on('finish', () => {
        resolve();
      });
      writer.end();
    });
  });

const copyDir = (src, dest) => {
  return fs
    .rm(dest, { recursive: true, force: true })
    .then(() => fs.mkdir(dest))
    .then(() => fs.readdir(src))
    .then((files) =>
      Promise.all(
        files.map((file) =>
          fs.copyFile(path.join(src, file), path.join(dest, file))
        )
      )
    );
};

fs.rm(dist, { recursive: true, force: true })
  .then(() => fs.mkdir(dist))
  .then(() => {
    return readFile('template.html');
  })
  .then((template) => {
    const matches = Array.from(template.matchAll(/{{([a-z]+)}}/g));
    return Promise.all(
      matches.map((match) => {
        return readFile('components/' + match[1] + '.html');
      })
    ).then((files) => {
      return files.reduce(
        (res, fileContent, i) => res.replace(matches[i][0], fileContent),
        template
      );
    });
  })
  .then((html) => {
    return writeFile('index.html', html);
  })
  .then(() => {
    const src = path.join(__dirname, 'styles');

    fs.readdir(src).then((dir) => {
      Promise.allSettled(
        dir.map((file) => {
          const filePath = path.join(src, file);
          return new Promise((resolve, reject) => {
            const chunks = [];
            fs.stat(filePath).then((stat) => {
              if (stat.isDirectory() || path.extname(file) !== '.css') {
                reject();
                return;
              }
              fs.open(filePath, 'r').then((file) => {
                const reader = file.createReadStream();
                reader.setEncoding('utf8');
                reader.on('data', (chunk) => {
                  chunks.push(chunk);
                });
                reader.on('end', () => {
                  resolve(chunks.join(''));
                });
              });
            });
          });
        })
      ).then((promiseResult) => {
        fs.open(path.join(dist, 'style.css'), 'w').then((file) => {
          const writer = file.createWriteStream();
          promiseResult
            .filter((x) => x.status === 'fulfilled')
            .map((promiseResult) => promiseResult.value)
            .forEach((x) => {
              writer.write(x);
            });
        });
      });
    });
  })
  .then(() => fs.mkdir(path.join(dist, 'assets')))
  .then(() =>
    copyDir(path.join(assets, 'img'), path.join(dist, 'assets/img'))
  )
  .then(() =>
    copyDir(path.join(assets, 'svg'), path.join(dist, 'assets/svg'))
  )
  .then(() =>
    copyDir(path.join(assets, 'fonts'), path.join(dist, 'assets/fonts'))
  );