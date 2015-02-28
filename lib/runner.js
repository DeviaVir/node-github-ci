var childProcess = require('child-process-promise');

var git = require('./git'),
    jobs = require('./jobs');

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
  build: function() {
    return runNextJob();
  }
};

var runNextJob = function() {
  if (jobs.current !== null) {
    return false;
  }
  return jobs.next().then(function() {
    return git.pull();
  }).then(function() {
    console.log('Running task');
    return runTask();
  }).then(function(success) {
    console.log('success', success);
    return jobs.currentComplete(success);
  }).then(function() {
    return runNextJob();
  });
};

var runTask = function runTask() {
  jobs.updateLog(jobs.current, "Executing '" + git.runner + "'").then(function() {
    return childProcess.exec(git.runner, {
      maxBuffer: 1024 * 1024,
      cwd: git.target,
      shell: 'bash'
    }).then(function(out) {
      if(out.error !== void 0) {
        return updateLog(out.error, true).then(function() {
          return updateLog(out.stdout, true);
        }).then(function() {
          return updateLog(out.stderr, true);
        }).then(function() {
          return runFile(git.failure);
        });
      }
      else {
        return updateLog(out.stdout, false).then(function() {
          return runFile(git.success);
        });
      }
    }).catch(function(err) {
      return updateLog(err.stdout, true).then(function() {
        return updateLog(err.stderr, true);
      }).then(function() {
        return runFile(git.failure);
      });
    });
  });
};

var runFile = function(file, next, args) {
  return jobs.updateLog(jobs.current, "Executing " + file).then(function() {
    console.log(("Executing runFile " + file).grey);
    return childProcess.exec(file, {
      cwd: git.target,
      shell: 'bash'
    }).then(function(out) {
      if(out.error !== void 0) {
        return updateLog(out.error, true).then(function() {
          return updateLog(out.stdout, true);
        }).then(function() {
          return updateLog(out.stderr, true);
        });
      }
      else {
        return updateLog(out.stdout, false);
      }
    }).catch(function(err) {
      return updateLog(err.stdout, true).then(function() {
        return updateLog(err.stderr, true);
      });
    }).then(function() {
      return args;
    });
  });
};

var updateLog = function(buffer, isError) {
  var content, errorClass;
  content = html(tokenize(buffer.toString()));
  if (isError) {
    errorClass = ' error';
    console.log(("updateLog: " + content).red);
  } else {
    errorClass = '';
    console.log('updateLog', content);
  }
  return jobs.updateLog(jobs.current, "<span class='output" + errorClass + "'>" + content + "</span>");
};


module.exports = runner;
