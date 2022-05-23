const fs = require('fs');
const path = require('path');

let dist = path.join(__dirname, 'project-dist', 'bundle.css');
let src = path.join(__dirname, 'styles');


fs.open(dist, 'w', (err) => {
  if (err) {
    console.log(err);
  }
  fs.readdir(src, { withFileTypes: true }, (err, files) => {
    if (err) {
      console.log(err);
    } else {
      files.forEach(file => {
        let filePath = path.join(__dirname, 'styles', file.name);
        let fileExtension = path.extname(file.name).slice(1);
        fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
            console.log(err);
          } else {
            if (fileExtension === 'css') {
              fs.appendFile(dist, data, (err) => {
                if (err) {
                  console.log(err);
                }
              });
            }
          }
        });
      });
    }
  });
});