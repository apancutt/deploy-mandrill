const inquirer = require('inquirer');
const mandrill = require('mandrill-api/mandrill');

module.exports = {
  client: () => (
    inquirer.prompt([{
      message: 'Mandrill API key',
      name: 'key',
      type: 'password',
    }])
      .then(({ key }) => new mandrill.Mandrill(key))
  ),
  execute: (client, command, params = {}) => new Promise((resolve, reject) => (
    client.templates[command](
      params,
      (data) => resolve(data),
      (err) => reject(err),
    )
  )),
};
