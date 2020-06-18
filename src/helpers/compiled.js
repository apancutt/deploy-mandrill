const filesystem = require('./filesystem');
const templateHelper = require('./template');

const extension = '.htm';
const filename = (template, locale) => `${templateHelper.name(template, locale)}${extension}`;

const path = (template = undefined, locale = undefined) => (
  template
    ? `${path()}/${filename(template, locale)}`
    : `${filesystem.root}/build`
);

const availableNames = () => (
  filesystem.files(path(), extension)
    .then((filenames) => filenames.map((filename) => filename.replace(extension, '')))
    .then((names) => names.map((name) => templateHelper.params(name).template))
    .then((locales) => locales.filter((value, index, array) => array.indexOf(value) == index))
);

const availableLocales = (template = undefined) => (
  (template ? Promise.resolve([ template ]) : availableNames())
    .then((templates) => (
      filesystem.files(path(), extension)
        .then((filenames) => filenames.map((filename) => filename.replace(extension, '')))
        .then((names) => names.filter((name) => templates.includes(templateHelper.params(name).template)))
        .then((names) => names.map((name) => templateHelper.params(name).locale))
        .then((locales) => locales.filter((value, index, array) => array.indexOf(value) == index))
    ))
);

module.exports = {
  availableLocales,
  availableNames,
  extension,
  filename,
  path,
  available: (template, locale = undefined) => (
    availableNames()
      .then((templates) => templates.includes(template))
      .then((templateExists) => locale ? (
        availableLocales(template)
          .then((locales) => locales.includes(locale))
      ) : templateExists)
  ),
  load: (template, locale) => filesystem.load(path(template, locale)),
  save: (template, locale, html) => filesystem.save(path(template, locale), html),
};
