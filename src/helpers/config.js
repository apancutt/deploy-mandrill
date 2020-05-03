const deepmerge = require('deepmerge');
const templateHelper = require('../helpers/template');
const filesystem = require('./filesystem');

const path = (template = undefined) => (
  template
    ? `${templateHelper.path(template)}/config.json`
    : `${filesystem.root}/content/config.json`
);

module.exports = {
  path,
  load: (template = undefined, locale = undefined) => new Promise((resolve) => {
    try {
      const config = deepmerge(require(path()), template ? require(path(template)) : {});
      resolve(locale ? config[locale] || {} : config);
    } catch (err) {
      console.log(err);
      resolve({});
    }
  })
};
