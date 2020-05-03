require('colors');
const diff = require('diff');
const inquirer = require('inquirer');
const os = require('os');
const compiledHelper = require('../helpers/compiled');
const configHelper = require('../helpers/config');
const mandrillHelper = require('../helpers/mandrill');
const templateHelper = require('../helpers/template');
const createLogger = require('../createLogger');

const render = (data) => ([
  `Subject: ${data.subject}`,
  `From: ${data.from.name} <${data.from.email}>`,
  '',
  data.html,
].join(os.EOL));

const command = (template, locale, local, remote) => {

  const params = {
    code: local.html,
    from_email: local.from.email,
    from_name: local.from.name,
    subject: local.subject,
    labels: [ locale, template ],
    name: templateHelper.name(template, locale),
    publish: true,
  };

  if (!remote) {
    return [ 'add', params ];
  }

  const changes = diff.diffLines(render(remote), render(local));
  if (!changes.find((line) => line.added || line.removed)) {
    return [];
  }

  changes.forEach((line) => {
    process.stdout.write(line.value[line.added ? 'green' : line.removed ? 'red' : 'grey']);
  });
  console.log();

  return inquirer.prompt([{
    message: `Publish changes to ${templateHelper.name(template, locale)}?`,
    name: 'confirmed',
    type: 'confirm',
  }])
    .then(({ confirmed }) => (
      confirmed
        ? [ 'update', params ]
        : []
    ));

};

const deploy = (client, template, locale) => (
  configHelper.load(template, locale)
    .then(({ from, subject }) => (
      compiledHelper.load(template, locale)
        .then((html) => ({
          from,
          subject,
          html,
        }))
    ))
    .then(({ from, html, subject }) => (
      mandrillHelper.execute(client, 'info', { name: templateHelper.name(template, locale) })
        .catch((err) => 'Unknown_Template' === err.name ? null : Promise.reject(err))
        .then((response) => command(
          template,
          locale,
          { from, subject, html },
          response
            ? {
              from: {
                name: response.publish_from_name,
                email: response.publish_from_email,
              },
              subject: response.publish_subject,
              html: response.publish_code,
            }
            : undefined
        ))
        .then(([ command, params ]) => (
          command
            ? (
              mandrillHelper.execute(client, command, params)
                .then(() => true)
            )
            : false
        ))
    ))
);

module.exports = {
  command: 'deploy',
  describe: 'Deploy compiled templates to Mandrill.',
  builder: {
    locale: {
      default: [ '*' ],
      describe: 'Deploy specific locale(s).',
      requiresArg: true,
      type: 'array',
    },
    template: {
      default: [ '*' ],
      describe: 'Deploy specific locale(s).',
      requiresArg: true,
      type: 'array',
    },
  },
  handler: (argv) => {

    const logger = createLogger(argv.debug, argv.outputFormat);

    return (argv.template.includes('*') ? compiledHelper.availableNames() : Promise.resolve(argv.template))
      .then((templates) => Promise.all(
        templates.map((template) => (
          compiledHelper.availableLocales(template)
            .then((locales) => locales.filter((locale) => argv.locale.includes('*') || argv.locale.includes(locale)))
            .then((locales) => [ template, locales ])
        ))
      ))
      .then((templatesAndLocales) => (
        templatesAndLocales.reduce((accumulator, [ template, locales ]) => [
          ...accumulator,
          ...locales.map((locale) => (client) => (
            deploy(client, template, locale)
              .then((deployed) => {
                if (deployed) {
                  logger.info(`Deployed ${templateHelper.name(template, locale)}`, { template, locale });
                }
              })
          ))
        ], [])
      ))
      .then((callbacks) => {

        if (!callbacks.length) {
          return;
        }

        return mandrillHelper.client()
          .then((client) => {

            const next = (callbacks) => {
              const callback = callbacks.shift();
              if (!callback) {
                return;
              }
              return callback(client).then(() => next(callbacks));
            };

            return next(callbacks);

          });

      })
      .catch((err) => {
        logger.error(err.message, { stack: err.stack });
      });

  },
};
