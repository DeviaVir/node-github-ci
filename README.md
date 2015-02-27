# CI
CI is a minimalistic Continuous Integration server.

![ci](http://dl.dropbox.com/u/1152970/concrete_screenshot_hi.png)

## Quickstart

> Note: This project requires a MongoDB instance

    npm install -g node-github-ci
    git clone git://github.com/you/yourrepo.git
    cd yourrepo
    git config --add ci.runner "npm i ; npm test"
    ci .
    open http://localhost:4567

## Usage
    Usage: ci [-hpv] path_to_git_repo

    Options:
      -h, --host     The hostname or ip of the host to bind to  [default: "0.0.0.0"]
      -p, --port     The port to listen on                      [default: 4567]
      --help         Show this message
      -v, --version  Show version

## Setting the test runner
    git config --add ci.runner "npm i ; npm test"

## Setting the branch
    git config --add ci.branch deploy

## Adding HTTP Basic authentication
    git config --add ci.user username
    git config --add ci.pass password

## Post build
After building CI will run `.git/hooks/build-failed` or `.git/hooks/build-worked` depending on test outcome. Like all git hooks, they're just shell scripts so put whatever you want in there.
