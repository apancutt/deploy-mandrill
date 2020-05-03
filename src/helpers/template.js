const filesystem = require('./filesystem');

const extension = '.htm';

const path = (template = undefined, locale = undefined) => (
  template
    ? locale
      ? `${path(template)}/${locale}${extension}`
      : `${path()}/${template}`
    : `${filesystem.root}/content/templates`
);

const name = (template, locale) => `${template}-${locale}`;

const availableNames = () => filesystem.directories(path());

const availableLocales = (template = undefined) => (
  (template ? Promise.resolve([ template ]) : availableNames())
    .then((templates) => Promise.all(templates.map((template) => (
      filesystem.files(path(template), extension)
        .then((filenames) => filenames.map((filename) => filename.replace(extension, '')))
    ))))
    .then((locales) => locales.reduce((accumulator, locales) => ([
      ...accumulator,
      ...locales,
    ]), []))
    .then((locales) => locales.filter((value, index, array) => array.indexOf(value) == index))
);

module.exports = {
  availableLocales,
  availableNames,
  extension,
  name,
  path,
  available: (template, locale = undefined) => (
    availableNames()
      .then((templates) => templates.includes(template))
      .then((templateExists) => locale ? (
        availableLocales(template)
          .then((locales) => locales.includes(locale))
      ) : templateExists)
  ),
  filename: (template, locale) => `${name(template, locale)}${extension}`,
  save: (template, locale, html) => filesystem.save(path(template, locale), html),
  load: (template, locale) => filesystem.load(path(template, locale)),
  params: (name) => ({
    template: name.split('-').slice(0, -2).join('-'),
    locale: name.split('-').slice(-2).join('-'),
  }),
};
