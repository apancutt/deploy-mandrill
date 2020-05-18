# deploy-mandrill

Compiles, deploys and prunes templates to/from Mandrill.

## Installation

    yarn add deploy-mandrill

### Authentication

The tool will prompt for your Mandrill API key when required. Non-interactive mode is not currently supported.


  "scripts": {
    "compile": "deploy-mandrill compile",
    "deploy": "deploy-mandrill deploy",
    "prune": "deploy-mandrill prune"
  }

## Usage

    deploy-mandrill compile [options] # Compile templates.
    deploy-mandrill deploy [options] # Deploy compiled templates to Mandrill.
    deploy-mandrill prune [options] # Remove templates from Mandrill that do not exist locally.

### Options

#### Options: Global

##### `--debug`

Enable output of debugging log messages.

Default: `false`

##### `--non-interactive`

Do not prompt for confirmations.

The Mandrill API key should be provided in the `MANDRILL_API_KEY` environment variable when `--non-interactive` is `true`.

Default: `false`

##### `--output-format <format>`

Logging output format.

Accepted formats are: `colorized`, `json` or `text`.

Default: `colorized`

#### Options: `deploy-mandrill compile`

##### `--locale`

Compile specific locale(s).

Use `*` to compile all locales.

Default: `*`

##### `--template`

Compile specific template(s).

Use `*` to compile all templates.

Default: `*`

#### Options: `deploy-mandrill deploy`

##### `--locale`

Deploy specific locale(s).

Use `*` to deploy all locales.

Default: `*`

##### `--template`

Deploy specific template(s).

Use `*` to deploy all templates.

Default: `*`

## Installation as a `run-script` alias (optional)

Add script aliases to your `package.json` file:

```
{
  ...
  "scripts": {
    ...
    "predeploy": "deploy-mandrill compile",
    "deploy": "deploy-mandrill deploy",
    "postdeploy": "deploy-mandrill prune"
  }
}
```

Run `yarn run deploy` or `npm run deploy` to compile, deploy and prune with a single command.

If you need to pass user or environment-level options that you don't want committed into `package.json` you can provide these at call-time, e.g. `yarn run deploy --template welcome` or `npm run deploy -- --template welcome`.

## Concepts

### Layout

A layout represents the overall appearance of the e-mail template. It contains the HTML header and footer that wrap the main content (the _template_).

This tool allows for multiple layouts allowing different messages to have different appearances. You could also make use of multiple layouts to apply a temporary seasonal theme the to e-mails (e.g. create an `xmas` layout with a Christmas-y background, etc.)

Each layout is stored in the `./layouts/` folder. A single layout file exists for all locales. Any necessary localisation should be implemented using _partials_.

Use the `<!--TEMPLATE-->` placeholder to mark where the template should be embedded.

### Templates

Each message has a corresponding _template_. This is the content specific for the message being sent.

Each template is stored in the `./templates/` folder. A template file exist for each supported locale.

The template is published to Mandill using the naming convention `<template>-<locale>` (e.g. `welcome-en-us`).

### Partials

Layouts and templates often share snippets of HTML, such as welcoming or sign-off messaging. To avoid repetition, you should embed a _partial_.

Like templates, each partial is stored as a subfolder in the `./partials/` folder, and contains various `.htm` files; one for each supported locale.

Each partial is stored in the `partials/` folder. A partial file exist for each supported locale.

Use the `<!--PARTIAL:name-->` placeholder where you'd like a partial to be embedded, replacing `name` with the name of the partial.

## Configuration

The global configuration file should be located at `./config.json`. This contains some default settings which are inherited by the templates.

Individual options can be overridden by templates. Create a config file in `./templates/<template>/config.json` containing the options you'd like to override.

The configuration file is in JSON format. At the top level is the locale for which the options are applied to.

### Example
```
# Global config at ./config.json (inherited by all templates)
{
  "en-us": {
    "layout": "default",
    "subject": null,
    "from": {
      "name": "My Company",
      "email": "support@mycompany.com"
    }
  }
}

# Template-specific config at ./templates/welcome/config.json
{
  "en-us": {
    "subject": "Welcome Aboard!"
  }
}

# Effective config passed to the "welcome-en-us" template
{
  "en-us": {
    "layout": "default",
    "subject": "Welcome Aboard!",
    "from": {
      "name": "My Company",
      "email": "support@mycompany.com"
    }
  }
}
```
