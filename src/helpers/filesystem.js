const fs = require('fs');
const p = require('path');

module.exports = {
  root: process.env.INIT_CWD || p.resolve(`${__dirname}/../..`),
  directories: (path) => new Promise((resolve) => {
    try {
      resolve(
        fs.readdirSync(path, { withFileTypes: true })
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => dirent.name)
      );
    } catch (err) {
      resolve([]);
    }
  }),
  files: (path, extension = undefined) => new Promise((resolve) => {
    try {
      resolve(
        fs.readdirSync(path, { withFileTypes: true })
          .filter((dirent) => !dirent.isDirectory())
          .filter((dirent) => !extension || dirent.name.endsWith(extension))
          .map((dirent) => dirent.name)
      );
    } catch (err) {
      resolve([]);
    }
  }),
  load: (path) => new Promise((resolve, reject) => {
    try {
      resolve(fs.readFileSync(path).toString().trim());
    } catch (err) {
      reject(err);
    }
  }),
  save: (path, content) => new Promise((resolve, reject) => {
    try {

      const dirname = p.dirname(path);

      try {
        fs.accessSync(dirname);
      } catch (err) {
        fs.mkdirSync(dirname, { recursive: true });
      }

      fs.writeFileSync(path, content);
      resolve();

    } catch (err) {
      reject(err);
    }
  }),
};
