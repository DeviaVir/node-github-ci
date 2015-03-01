# CI
CI is a minimalistic Continuous Integration server.

![ci](http://dl.dropbox.com/u/1152970/concrete_screenshot_hi.png)

## Quickstart

> Note: This project requires a MongoDB instance

    npm install -g node-github-ci
    npm install -g forever
    git clone git://github.com/you/yourrepo.git
    cd yourrepo
    git config --add ci.runner "npm i ; npm test"
    forever start ci /yourrepo
    add webhook to http://localhost:4567

## Usage
    Usage: ci [-hpv] path_to_git_repo

    Options:
      -h, --host     The hostname or ip of the host to bind to  [default: "0.0.0.0"]
      -p, --port     The port to listen on                      [default: 4567]
      --help         Show this message
      -v, --version  Show version

## Setting up config
Please find an example in `config/data.example.js`, you can copy this to `config/data.js`. Generate a new Access Token, select at least `repo:status`: https://github.com/settings/tokens/new

## Setting the test runner
    git config --add ci.runner "npm i ; npm test"

## Adding HTTP Basic authentication
    git config --add ci.user username
    git config --add ci.pass password

## Post build
After building, CI will update your PR or Commit Status with the status.
