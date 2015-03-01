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
  git.target = '';
  git.runner = '';
  git.user = function user() { return git.getUser(); };
  git.pass = function pass() { return git.getPass(); };

  git.config = {
    runner: 'ci.runner',
    user: 'ci.user',
    pass: 'ci.pass'
  };

  git.init = function init(target) {
    if (target.toString().charAt(0) !== '/') {
      target = process.cwd() + '/' + target;
    }
    git.target = path.normalize(target + '/.git/');
    return new Promise(function(resolve, reject) {
      if(fs.existsSync(git.target) === true) {
        return resolve();
      }
      else {
        return reject('Invalid path');
      }
    }).then(function() {
      return git.getUser();
    }).then(function() {
      return git.getPass();
    }).then(function() {
      return git.getRunner();
    }).catch(function(err) {
      console.log(("'" + target + "' is not a valid Git repo").red);
      process.exit(1);
    });
  };

  git.pull = function pull(job) {
    console.log('job', job);
    var log = "Pulling '" + job.branch + "' branch";
    return jobs.updateLog(job._id, log).then(function() {
      console.log('Pulling log:', log.grey);
      return childProcess.exec('$(which git) fetch && $(which git) reset --hard origin/' + job.branch, {
        cwd: git.target.replace('.git/', ''),
        shell: 'bash'
      });
    }).then(function(out) {
      log = "Updated '" + job.branch + "' branch";
      return jobs.updateLog(job._id, log);
    }).then(function() {
      console.log('Done pulling, log:', log.grey);
      return job;
    }).catch(function(err) {
      log = "" + err;
      return jobs.updateLog(job._id, log).then(function() {
        console.log('Pulling failed, log:', log.red);
        return Promise.reject(log);
      });
    });
  };

  git.getUser = function getUser() {
    return childProcess.exec('$(which git) config --get ' + git.config.user, {
      cwd: git.target,
      shell: 'bash'
    }).then(function(out) {
      if(out.stderr !== void 0 && out.stderr !== '') {
        return Promise.reject(out.stderr);
      }

      git.user = out.stdout.toString().replace(/[\s\r\n]+$/, '');
      return git.user;
    }).catch(function(err) {
      git.user = '';
      return git.user;
    });
  };

  git.getPass = function getPass() {
    return childProcess.exec('$(which git) config --get ' + git.config.pass, {
      cwd: git.target,
      shell: 'bash'
    }).then(function(out) {
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

  git.getRunner = function getRunner() {
    return childProcess.exec('$(which git) config --get ' + git.config.runner, {
      cwd: git.target,
      shell: 'bash'
    }).then(function(out) {
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
