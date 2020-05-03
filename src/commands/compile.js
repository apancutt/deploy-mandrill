const inlineCss = require('inline-css');
const pretty = require('pretty');
const configHelper = require('../helpers/config');
const layoutHelper = require('../helpers/layout');
const partialHelper = require('../helpers/partial');
const templateHelper = require('../helpers/template');
const compiledHelper = require('../helpers/compiled');
const createLogger = require('../createLogger');

const renderLayout = (layout) => (
  layoutHelper.load(layout)
);

const renderTemplate = (html, template, locale) => (
  templateHelper.load(template, locale)
    .then((templateHtml) => html.replace('<!--TEMPLATE-->', templateHtml))
);

const renderPartials = (html, locale) => {

  const next = (html) => {

    const matches = [ ...html.matchAll(/<!--PARTIAL:(.+?)-->/g) ];

    if (!matches.length) {
      return html;
    }

    return Promise.all(
      [ ...html.matchAll(/<!--PARTIAL:(.+?)-->/g) ]
        .map(([ placeholder, partial ]) => (
          partialHelper.load(partial, locale)
            .then((partialHtml) => [ placeholder, partialHtml ])
        ))
    )
      .then((partials) => partials.reduce((html, [ placeholder, partialHtml ]) => (
        html.replace(placeholder, partialHtml)
      ), html))
      .then((html) => next(html));
  };

  return next(html);

};

const compile = (template, locale) => (
  configHelper.load(template, locale)
    .then(({ layout }) => renderLayout(layout))
    .then((html) => renderTemplate(html, template, locale))
    .then((html) => renderPartials(html, locale))
    .then((html) => inlineCss(html, {
      preserveMediaQueries: true,
      removeHtmlSelectors: true,
      url: 'https://www.do-not-use-relative-urls-in-your-templates.com',
    }))
    .then((html) => pretty(html, { ocd: true }))
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
