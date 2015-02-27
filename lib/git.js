var Promise = require('bluebird'),
    childProcess = require('child-process-promise'),
    fs = require('fs'),
    path = require('path'),
    colors = require('colors');

var jobs = require('./jobs');

/**
 * Manage git
 * @static
 * @class git
 */
var git = module.exports = {};

(function(git) {
  git.runner = '';
  git.branch = '';
  git.user = '';
  git.pass = '';

  git.config = {
    runner: 'ci.runner',
    branch: 'ci.branch',
    user: 'ci.user',
    pass: 'ci.pass'
  };

  git.init = function init(target) {
    if (target.toString().charAt(0) !== '/') {
      target = process.cwd() + '/' + target;
    }
    process.chdir(target);
    git.target = path.normalize(target + '/.git/');
    git.failure = path.normalize(target + '/.git/hooks/build-failed');
    git.success = path.normalize(target + '/.git/hooks/build-worked');
    return Promise.promisify(fs.exists.bind(fs))(git.target).then(function(exists) {
      if (exists === false) {
        return Promise.reject();
      }
    }).then(function() {
      return git.getUser();
    }).then(function() {
      return git.getPass();
    }).then(function() {
      return git.getBranch();
    }).then(function() {
      return git.getRunner();
    }).catch(function(err) {
      console.log(("'" + target + "' is not a valid Git repo").red);
      process.exit(1);
    });
  };

  git.pull = function pull() {
    var log = "Pulling '" + git.branch + "' branch";
    return jobs.updateLog(jobs.current, log).then(function() {
      console.log(log.grey);
      return childProcess.exec('git fetch && git reset --hard origin/' + git.branch);
    }).then(function(out) {
      log = "Updated '" + git.branch + "' branch";
      return jobs.updateLog(jobs.current, log);
    }).then(function() {
      return console.log(log.grey);
    }).catch(function(err) {
      log = "" + err;
      return jobs.updateLog(jobs.current, log).then(function() {
        console.log(log.red);
        return Promise.reject(log);
      });
    });
  };

  git.getUser = function getUser() {
    return childProcess.exec('git config --get ' + git.config.user).then(function(out) {
      if(out.stderr !== void 0 && out.stderr !== '') {
        return Promise.reject(out.stderr);
      }

      git.user = out.stdout.toString().replace(/[\s\r\n]+$/, '');
      return git.user;
    }).catch(function(err) {
      console.log('err', err);
      git.user = '';
      return git.user;
    });
  };

  git.getPass = function getPass() {
    return childProcess.exec('git config --get ' + git.config.pass).then(function(out) {
      if(out.stderr !== void 0 && out.stderr !== '') {
        return Promise.reject(out.stderr);
      }

      git.pass = out.stdout.toString().replace(/[\s\r\n]+$/, '');
      return git.pass;
    }).catch(function(err) {
      git.pass = '';
      return git.pass;
    });
  };

  git.getBranch = function getBranch() {
    return childProcess.exec('git config --get ' + git.config.branch).then(function(out) {
      if(out.stderr !== void 0 && out.stderr !== '') {
        return Promise.reject(out.stderr);
      }

      git.branch = out.stdout.toString().replace(/[\s\r\n]+$/, '');
      if (git.branch === '') {
        git.branch = 'master';
      }
      return git.gitContinue();
    }).catch(function(err) {
      git.branch = 'master';
      return git.gitContinue();
    });
  };

  git.getRunner = function getRunner() {
    return childProcess.exec('git config --get ' + git.config.runner).then(function(out) {
      if(out.stderr !== void 0 && out.stderr !== '') {
        return Promise.reject(out.stderr);
      }

      git.runner = out.stdout.toString().replace(/[\s\r\n]+$/, '');
      if (git.runner === '') {
        git.runner = 'none';
      }
      return git.gitContinue();
    }).catch(function(err) {
      git.runner = 'none';
      return git.gitContinue();
    });
  };

  git.gitContinue = function gitContinue() {
    return new Promise(function(resolve, reject) {
      if (git.branch === 'none') {
        git.branch = 'master';
      } else if (git.branch === '') {
        return reject();
      }
      if (git.runner === 'none') {
        console.log('Git.gitContinue: You must specify a Git runner'.red);
        process.exit(1);
      } else if (git.runner === '') {
        return reject();
      }
      return resolve();
    });
  };

})(git);

module.exports = git;
