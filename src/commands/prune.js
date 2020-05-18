const inquirer = require('inquirer');
const mandrillHelper = require('../helpers/mandrill');
const templateHelper = require('../helpers/template');
const createLogger = require('../createLogger');

const prune = (client, name, nonInteractive) => (
  nonInteractive ? Promise.resolve({ confirmed: true }) : inquirer.prompt([{
    message: `Delete ${name}?`,
    name: 'confirmed',
    type: 'confirm',
  }])
    .then(({ confirmed }) => confirmed && (
      mandrillHelper.execute(client, 'delete', { name })
        .then(() => true)
    ))
);

module.exports = {
  command: 'prune',
  describe: 'Remove templates from Mandrill that do not exist locally.',
  handler: (argv) => {

    const logger = createLogger(argv.debug, argv.outputFormat);

    return mandrillHelper.client(argv.nonInteractive)
      .then((client) => (
        mandrillHelper.execute(client, 'list')
          .then((response) => Promise.all(
            response.map((data) => {
              const { locale, template } = templateHelper.params(data.name);
              return templateHelper.available(template, locale)
                .then((available) => [ data.name, available ])
            })
          ))
          .then((namesAndAvailables) => namesAndAvailables.filter(([ , available ]) => !available))
          .then((namesAndAvailables) => namesAndAvailables.map(([ name ]) => () => (
            prune(client, name, argv.nonInteractive)
              .then((pruned) => {
                if (pruned) {
                  logger.info(`Pruned ${name}`, { pruned });
                }
              })
          )))
          .then((callbacks) => {

            const next = (callbacks) => {
              const callback = callbacks.shift();
              if (!callback) {
                return;
              }
              return callback().then(() => next(callbacks));
            };

            return next(callbacks);

          })
      ))
      .catch((err) => {
        logger.error(err.message, { stack: err.stack });
      });

  },
};
