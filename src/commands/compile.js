const mjml = require('mjml');
const configHelper = require('../helpers/config');
const layoutHelper = require('../helpers/layout');
const partialHelper = require('../helpers/partial');
const templateHelper = require('../helpers/template');
const compiledHelper = require('../helpers/compiled');
const createLogger = require('../createLogger');

const renderLayout = (layout, preview = null) => (
  layoutHelper.load(layout)
    .then((markup) => preview ? markup.replace('</mj-head>', `<mj-preview>${preview}</mj-preview></mj-head>`) : markup)
);

const renderTemplate = (markup, template, locale) => (
  templateHelper.load(template, locale)
    .then((templateHtml) => markup.replace('<!--TEMPLATE-->', templateHtml))
);

const renderPartials = (markup, locale) => {

  const next = (markup) => {

    const matches = [ ...markup.matchAll(/<!--PARTIAL:(.+?)-->/g) ];

    if (!matches.length) {
      return markup;
    }

    return Promise.all(
      [ ...markup.matchAll(/<!--PARTIAL:(.+?)-->/g) ]
        .map(([ placeholder, partial ]) => (
          partialHelper.load(partial, locale)
            .then((partialHtml) => [ placeholder, partialHtml ])
        ))
    )
      .then((partials) => partials.reduce((markup, [ placeholder, partialHtml ]) => (
        markup.replace(placeholder, partialHtml)
      ), markup))
      .then((markup) => next(markup));
  };

  return next(markup);

};

const compile = (template, locale) => (
  configHelper.load(template, locale)
    .then(({ layout, preview }) => renderLayout(layout, preview))
    .then((markup) => renderTemplate(markup, template, locale))
    .then((markup) => renderPartials(markup, locale))
    .then((markup) => ({
      markup,
      tokens: markup.match(/\{\{.+?\}\}/g).reduce((accumulator, match, index) => ({
        ...accumulator,
        [`<!-- TKN:${index} -->`]: match,
      }), {}),
    }))
    .then(({ markup, tokens }) => ({
      tokens,
      markup: Object.entries(tokens).reduce((markup, [ replacement, search ]) => markup.replace(search, replacement), markup),
    }))
    .then(({ markup, tokens }) => ({
      tokens,
      html: mjml(markup),
    }))
    .then(({ html, tokens }) => html.errors.length ? Promise.reject(new Error(html.errors.shift().formattedMessage)) : {
      tokens,
      html: html.html,
    })
    .then(({ html, tokens }) => Object.entries(tokens).reduce((html, [ search, replacement ]) => html.replace(search, replacement), html))
    .then((html) => html.replace(/["']\{\{unsub ["'](.+)["']\}\}["']/, '\'{{unsub "$1"}}\''))
);

module.exports = {
  command: 'compile',
  describe: 'Compile templates.',
  builder: {
    locale: {
      default: [ '*' ],
      describe: 'Compile specific locale(s).',
      requiresArg: true,
      type: 'array',
    },
    template: {
      default: [ '*' ],
      describe: 'Compile specific template(s).',
      requiresArg: true,
      type: 'array',
    },
  },
  handler: (argv) => {

    const logger = createLogger(argv.debug, argv.outputFormat);

    return (argv.template.includes('*') ? templateHelper.availableNames() : Promise.resolve(argv.template))
      .then((templates) => Promise.all(
        templates.map((template) => (
          templateHelper.availableLocales(template)
            .then((locales) => locales.filter((locale) => argv.locale.includes('*') || argv.locale.includes(locale)))
            .then((locales) => [ template, locales ])
        ))
      ))
      .then((templatesAndLocales) => (
        templatesAndLocales.reduce((accumulator, [ template, locales ]) => [
          ...accumulator,
          ...locales.map((locale) => () => (
            compile(template, locale)
              .then((html) => compiledHelper.save(template, locale, html))
              .then(() => {
                logger.info(`Compiled ${templateHelper.name(template, locale)}`, { template, locale });
              })
          ))
        ], [])
      ))
      .then((callbacks) => Promise.all(callbacks.map((callback) => callback())))
      .catch((err) => {
        logger.error(err.message, { stack: err.stack });
      });

  },
};
