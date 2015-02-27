var exec = require('child_process').exec;

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
  return jobs.next(function() {
    return git.pull(function() {
      return runTask(function(success) {
        return jobs.currentComplete(success, function() {
          return runNextJob();
        });
      });
    });
  });
};

var runTask = function(next) {
  jobs.updateLog(jobs.current, "Executing '" + git.runner + "'");
  return exec(git.runner, {
    maxBuffer: 1024 * 1024
  }, (function(_this) {
    return function(error, stdout, stderr) {
      if (error !== null) {
        return updateLog(error, true, function() {
          return updateLog(stdout, true, function() {
            return updateLog(stderr, true, function() {
              return runFile(git.failure, next, false);
            });
          });
        });
      } else {
        return updateLog(stdout, true, function() {
          return runFile(git.success, next, true);
        });
      }
    };
  })(this));
};

var runFile = function(file, next, args) {
  if (args === null) {
    args = null;
  }
  return jobs.updateLog(jobs.current, "Executing " + file, function() {
    console.log(("Executing " + file).grey);
    return exec(file, (function(_this) {
      return function(error, stdout, stderr) {
        if (error !== null) {
          return updateLog(error, true, function() {
            return updateLog(stdout, true, function() {
              return updateLog(stderr, true, function() {
                return next(args);
              });
            });
          });
        } else {
          return updateLog(stdout, true, function() {
            return next(args);
          });
        }
      };
    })(this));
  });
};

var updateLog = function(buffer, isError, done) {
  var content, errorClass;
  content = html(tokenize(buffer.toString()));
  if (isError) {
    errorClass = ' error';
    console.log(("" + content).red);
  } else {
    errorClass = '';
    console.log(content);
  }
  return jobs.updateLog(jobs.current, "<span class='output" + errorClass + "'>" + content + "</span>", done);
};


module.exports = runner;
