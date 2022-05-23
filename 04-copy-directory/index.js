const { promises: fs } = require('fs');
const path = require('path');

const dest = path.resolve(__dirname, 'files-copy');
const src = path.resolve(__dirname, 'files');
fs.rm(dest, { recursive: true, force: true })
  .then(() => fs.mkdir(dest))
  .then(() => fs.readdir(src))
  .then((files) =>
    Promise.all(
      files.map((file) =>
        fs.copyFile(path.join(src, file), path.join(dest, file))
      )
    )
  );