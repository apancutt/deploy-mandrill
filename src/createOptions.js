const yargs = require('yargs');

yargs.parserConfiguration({ 'strip-dashed': true });

module.exports = yargs
  .usage('$0 compile|deploy|prune [options]')
  .option('debug', {
    default: false,
    describe: 'Enable output of debugging log messages.',
    type: 'boolean',
  })
  .option('output-format', {
    choices: [ 'colorized', 'json', 'text' ],
    default: 'colorized',
    describe: 'Logging output format.',
    requiresArg: true,
    type: 'string',
  })
  .command(require('./commands/compile'))
  .command(require('./commands/deploy'))
  .command(require('./commands/prune'))
  .demandCommand(1, 1);
