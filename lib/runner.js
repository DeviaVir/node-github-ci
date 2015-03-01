var Promise = require('bluebird'),
    childProcess = require('child-process-promise'),
    Github = require('github');

var git = require('./git'),
    jobs = require('./jobs'),
    config = require('../config');

var github = new Github({
  version: '3.0.0',
  debug: true,
  protocol: "https",
  timeout: 5000,
  headers: {
    "user-agent": "node-github-ci", // GitHub is happy with a unique user agent 
  }
});
github.authenticate({
  type: 'oauth',
  token: (config.github ? config.github.username : '')
});

var parseSequence = function(input) {
  var length;
  length = input.length;
  return {
    cmd: input[length - 1],
    args: input.substring(2, length - 1)
  };
};

var tokenize = function(input, result) {
  if (result === null || result === void 0) {
    result = [];
  }
  if (input === '') {
    return [''];
  }
  input.replace(/(\u001B\[.*?([@-~]))|([^\u001B]+)/g, function(m) {
    return result.push(m[0] === '\u001B' && parseSequence(m) || m);
  });
  return result;
};

var COLORS = {
  0: '',
  1: 'bold',
  4: 'underscore',
  5: 'blink',
  30: 'fg-black',
  31: 'fg-red',
  32: 'fg-green',
  33: 'fg-yellow',
  34: 'fg-blue',
  35: 'fg-magenta',
  36: 'fg-cyan',
  37: 'fg-white',
  40: 'bg-black',
  41: 'bg-red',
  42: 'bg-green',
  43: 'bg-yellow',
  44: 'bg-blue',
  45: 'bg-magenta',
  46: 'bg-cyan',
  47: 'bg-white'
};

var html = function(input) {
  var result;
  result = input.map(function(v) {
    var cls;
    if (typeof v === 'string') {
      return v;
    } else if (v.cmd === 'm') {
      cls = v.args.split(';').map(function(v) {
        return COLORS[parseInt(v)];
      }).join(' ');
      return "</span><span class=\"" + cls + "\">";
    } else {
      return '';
    }
  });
  return "<code><pre><span>" + (result.join('')) + "</span></pre></code>";
};

var runner = {
  build: function(port) {
    return runNextJob(port);
  }
};

var runNextJob = function(port) {
  if (jobs.current !== null) {
    return false;
  }

  return jobs.next().then(function(job) {
    if(job === null) {
      return Promise.reject();
    }

    return Promise.promisify(github.statuses.create.bind(github))({
      user: job.user,
      repo: job.repo,
      sha: job.hash,
      state: 'pending',
      context: 'ci/tests',
      target_url: (config.host ? config.host : '') + ':' + port,
      description: 'Running test'
    }).then(function(status) {
      return git.pull(job);
    });
  }).then(function(job) {
    return runTask(job);
  }).then(function(job) {
    return Promise.promisify(github.statuses.create)({
      user: job.user,
      repo: job.repo,
      sha: job.hash,
      state: (job.failed === true ? 'failure' : 'success'),
      context: 'ci/tests',
      target_url: (config.host ? config.host : '') + ':' + port,
      description: (job.failed === true ? 'Please check your tests!' : 'All good')
    }).then(function(status) {
      return jobs.currentComplete(job);
    });
  }).then(function() {
    return runNextJob();
  }).catch(function(err) {
    return false;
  });
};

var runTask = function runTask(job) {
  return jobs.updateLog(job, "Executing '" + git.runner + "'").then(function() {
    return childProcess.exec(git.runner, {
      maxBuffer: 1024 * 1024,
      cwd: git.target.replace('.git/', ''),
      shell: 'bash'
    }).then(function(out) {
      if(out.error !== void 0) {
        return updateLog(job, out.error, true).then(function() {
          return updateLog(job, out.stdout, true);
        }).then(function() {
          return updateLog(job, out.stderr, true);
        }).then(function() {
          job.failed = true;
          return job;
        });
      }
      else {
        return updateLog(job, out.stdout, false).then(function() {
          job.failed = false;
          return job;
        });
      }
    }).catch(function(err) {
      return updateLog(job, err.stdout, true).then(function() {
        return updateLog(job, err.stderr, true);
      }).then(function() {
        job.failed = true;
        return job;
      });
    });
  });
};

var updateLog = function(job, buffer, isError) {
  var content, errorClass;
  content = html(tokenize(buffer.toString()));
  if (isError) {
    errorClass = ' error';
    console.log(("updateLog: " + content).red);
  } else {
    errorClass = '';
  }
  return jobs.updateLog(job._id, "<span class='output" + errorClass + "'>" + content + "</span>");
};


module.exports = runner;
