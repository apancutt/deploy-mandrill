const filesystem = require('./filesystem');
const templateHelper = require('./template');

const extension = templateHelper.extension;

const path = (layout = undefined) => (
  layout
    ? `${path()}/${layout}${extension}`
    : `${filesystem.root}/content/layouts`
);

module.exports = {
  extension,
  path,
  available: (layout) => Promise.reject(new Error('Not implemented')),
  availableNames: () => Promise.reject(new Error('Not implemented')),
  filename: (layout) => `${layout}${extension}`,
  load: (layout) => filesystem.load(path(layout)),
  save: (layout, html) => filesystem.save(path(layout), html),
};
