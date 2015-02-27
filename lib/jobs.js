var mongo = require('mongodb'),
    path = require('path'),
    colors = require('colors'),
    moment = require('moment');

var dbName = path.basename(process.cwd()).replace(/\./g, "-"),
    db = new mongo.Db("ci_" + dbName, new mongo.Server('localhost', mongo.Connection.DEFAULT_PORT, {
      auto_reconnect: true
    }), {});

db.open(function(error) {
  if (error) {
    console.log('There was an error creating a connection with the Mongo database. Please check that MongoDB is properly installed and running.'.red);
    return process.exit(1);
  }
});

var ObjectID = mongo.BSONPure.ObjectID;

/**
 * Manage jobs
 * @static
 * @class jobs
 */
var jobs = module.exports = {};

(function(jobs) {
  jobs.current = null;
  
  jobs.addJob = function addJob(fn) {
    return Promise.promisify(db.collection.bind(db))('jobs').then(function(collection) {
      var job = {
        addedTime: moment.utc().unix(),
        log: '',
        running: false,
        finished: false
      };

      collection.insert(job);

      if(fn !== void 0 && fn !== null) {
        return fn(job);
      }
    });
  };

  jobs.getQueued = function getQueued(fn) {
    return jobs.getJobs({
      running: false
    }).then(function() {
      if(fn !== void 0 && fn !== null) {
        return fn();
      }
    });
  };

  jobs.getRunning = function getRunning(fn) {
    return jobs.getJobs({
      running: true
    }).then(function() {
      if(fn !== void 0 && fn !== null) {
        return fn();
      }
    });
  };

  jobs.getAll = function getAll(fn) {
    return jobs.getJobs(null).then(function() {
      if(fn !== void 0 && fn !== null) {
        return fn();
      }
    });
  };

  jobs.getLast = function getLast(fn) {
    return Promise.promisify(db.collection.bind(db))('jobs').then(function(collection) {
      return collection.find().sort({
        $natural: -1
      }).limit(1).toArray(function(error, jobs) {
        if(jobs.length > 0) {
          return fn(jobs[0]);
        } else {
          return fn();
        }
      });
    });
  };

  jobs.get = function get(id, fn) {
    return Promise.promisify(db.collection.bind(db))('jobs').then(function(collection) {
      return collection.findOne({
        _id: new ObjectID(id)
      }, function(error, job) {
        if(job !== null) {
          return fn(job);
        } else {
          return fn("No job found with the id '" + id + "'");
        }
      });
    });
  };

  jobs.clear = function clear(fn) {
    return Promise.promisify(db.dropCollection.bind(db))('jobs').then(function() {
      if(fn !== void 0 && fn !== null) {
        return fn();
      }
    });
  };

  jobs.getLog = function getLog(id, fn) {
    return Promise.promisify(db.collection.bind(db))('jobs').then(function(collection) {
      return collection.findOne({
        _id: new ObjectID(id)
      }, function(error, job) {
        if (job !== null) {
          return fn(job.log);
        } else {
          return fn("No job found with the id '" + id + "'");
        }
      });
    });
  };

  jobs.updateLog = function(id, string, fn) {
    return Promise.promisify(db.collection.bind(db))('jobs').then(function(collection) {
      return collection.findOne({
        _id: new ObjectID(id)
      }, function(error, job) {
        console.log("update log for job " + job + ", " + string);
        if(job === void 0 || job === null) {
          return false;
        }
        job.log += "" + string + " <br />";
        collection.save(job);
      });
    }).then(function() {
      if(fn !== void 0 && fn !== null) {
        return fn();
      }
    });
  };

  jobs.currentComplete = function currentComplete(success, fn) {
    return Promise.promisify(db.collection.bind(db))('jobs').then(function(collection) {
      return collection.findOne({
        _id: new ObjectID(jobs.current)
      }, function(error, job) {
        if (job === null) {
          return false;
        }
        job.running = false;
        job.finished = true;
        job.failed = !success;
        job.finishedTime = new Date().getTime();
        jobs.current = null;
        collection.save(job);
      });
    }).then(function() {
      if(fn !== void 0 && fn !== null) {
        return fn();
      }
    });
  };

  jobs.next = function next(fn) {
    return Promise.promisify(db.collection.bind(db))('jobs').then(function(collection) {
      return collection.findOne({
        running: false,
        finished: false
      }, function(error, job) {
        if (job === null) {
          return false;
        }
        job.running = true;
        job.startedTime = new Date().getTime();
        jobs.current = job._id.toString();
        collection.save(job);
      });
    }).then(function() {
      if(fn !== void 0 && fn !== null) {
        return fn();
      }
    });
  };

  jobs.getJobs = function getJobs(filter, fn) {
    return Promise.promisify(db.collection.bind(db))('jobs').then(function(collection) {
      if(filter !== null) {
        return collection.find(filter).sort({
          addedTime: -1
        }).limit(10).toArray(function(error, results) {
          return fn(results);
        });
      } else {
        return collection.find().sort({
          addedTime: -1
        }).limit(10).toArray(function(error, results) {
          return fn(results);
        });
      }
    });
  };

})(jobs);

module.exports = jobs;
