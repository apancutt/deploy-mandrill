const filesystem = require('./filesystem');
const templateHelper = require('./template');

const extension = templateHelper.extension;

const path = (partial = undefined, locale = undefined) => (
  partial
    ? locale
      ? `${path(partial)}/${locale}${extension}`
      : `${path()}/${partial}`
    : `${filesystem.root}/partials`
);

module.exports = {
  extension,
  path,
  available: () => Promise.reject(new Error('Not implemented')),
  availableLocales: () => Promise.reject(new Error('Not implemented')),
  availableNames: () => Promise.reject(new Error('Not implemented')),
  filename: (locale) => `${locale}${extension}`,
  load: (partial, locale) => filesystem.load(path(partial, locale)),
  save: (partial, locale, html) => filesystem.save(path(partial, locale), html),
};
