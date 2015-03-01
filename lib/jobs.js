var Promise = require('bluebird'),
    mongo = require('mongodb-bluebird'),
    path = require('path'),
    colors = require('colors'),
    moment = require('moment');

var dbName = path.basename(process.cwd()).replace(/\./g, "-"),
    db = mongo.connect("mongodb://localhost:27017/ci_" + dbName, {
      auto_reconnect: true
    }).catch(function(err) {
      console.log('There was an error creating a connection with the Mongo database. Please check that MongoDB is properly installed and running.'.red);
      return Promise.reject(err);
    });

/**
 * Manage jobs
 * @static
 * @class jobs
 */
var jobs = module.exports = {};

(function(jobs) {
  jobs.current = null;
  
  jobs.addJob = function addJob(hook) {
    return db.then(function(db) {
      var job = {
        addedTime: moment.utc().unix(),
        log: '',
        running: false,
        finished: false,
        failed: false,
        branch: (hook ? hook.branch : 'master'),
        hash: (hook ? hook.hash : ''),
        user: (hook ? hook.user : ''),
        repo: (hook ? hook.repo : '')
      };

      return db.collection('jobs').insert(job);
    });
  };

  jobs.getQueued = function getQueued() {
    return jobs.getJobs({
      running: false
    });
  };

  jobs.getRunning = function getRunning() {
    return jobs.getJobs({
      running: true
    });
  };

  jobs.getAll = function getAll() {
    return jobs.getJobs(null);
  };

  jobs.getLast = function getLast() {
    return db.then(function(db) {
      return db.collection('jobs').findOne({}, {
        'sort': [
          ['addedTime', 'desc']
        ]
      }).then(function(job) {
        if(job !== null && Object.keys(job).length > 0) {
          return job;
        }
        return null;
      });
    }); 
  };

  jobs.get = function get(id) {
    return db.then(function(db) {
      return db.collection('jobs').findOne({
        _id: id
      }).then(function(job) {
        if(job !== null) {
          return job;
        }
        return null;
      });
    });
  };

  jobs.clear = function clear() {
    return db.then(function(db) {
      return db.dropCollection('jobs');
    });
  };

  jobs.getLog = function getLog(id) {
    return jobs.get(id);
  };

  jobs.updateLog = function(id, string) {
    return db.then(function(db) {
      return db.collection('jobs').findOne({
        _id: id
      }).then(function(job) {
        if(job === void 0 || job === null) {
          return null;
        }

        job.log += "" + string + " <br />";
        return db.collection('jobs').save(job);
      });
    });
  };

  jobs.currentComplete = function currentComplete(job) {
    return db.then(function(db) {
      return db.collection('jobs').findOne({
        _id: jobs.current
      }).then(function(job) {
        if(job === null) {
          return null;
        }

        job.running = false;
        job.finished = true;
        job.finishedTime = moment.utc().unix();
        jobs.current = null;

        console.log('Saving job', job);
        return db.collection('jobs').save(job);
      });
    });
  };

  jobs.next = function next() {
    return db.then(function(db) {
      return db.collection('jobs').findOne({
        running: false,
        finished: false
      }).then(function(job) {
        if (job === null) {
          return null;
        }

        job.running = true;
        job.startedTime = new Date().getTime();
        jobs.current = job._id.toString();
        return db.collection('jobs').save(job).then(function() {
          return job;
        });
      });
    });
  };

  jobs.getJobs = function getJobs(filter) {
    return db.then(function(db) {
      if(filter === null) {
        filter = {};
      }

      return db.collection('jobs').find(filter, {
        'finished': true,
        'failed': true,
        'running': true,
        'log': true,
        'addedTime': true,
        '_id': true
      }, {
        'sort': [
          ['addedTime', 'desc']
        ],
        'limit': 10
      }).then(function(results) {
        return results;
      });
    });
  };

})(jobs);

module.exports = jobs;
