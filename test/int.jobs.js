var Promise = require('bluebird'),
    moment = require('moment');

var jobs = require('../lib/jobs');

describe('U:CI:jobs', function() {
  'use strict';

  describe( 'addJob', function() {
    it('should run okay', function(done) {
      this.timeout(5000);

      var time = moment.utc().unix();
      return jobs.addJob().then(function(res) {
        expect(res[0].addedTime >= time).to.be.ok();
        expect(res[0].log).to.eql('');
        expect(res[0].running).to.eql(false);
        expect(res[0].finished).to.eql(false);
        expect(res[0]._id).to.be.ok();
      }).then(done, done);
    });
  });

  describe( 'getLast', function() {
    it('should run okay', function(done) {
      this.timeout(5000);

      return jobs.getLast().then(function(res) {
        expect(res).to.be.ok();
        expect(res._id).to.be.ok();
      }).then(done, done);
    });
  });

  describe( 'get', function() {
    it('should return job', function(done) {
      this.timeout(5000);

      var time = moment.utc().unix();
      return jobs.addJob().then(function(res) {
        expect(res[0].addedTime >= time).to.be.ok();
        expect(res[0].log).to.eql('');
        expect(res[0].running).to.eql(false);
        expect(res[0].finished).to.eql(false);
        expect(res[0]._id).to.be.ok();

        return jobs.get(res[0]._id).then(function(job) {
          expect(job.addedTime).to.eql(res[0].addedTime);
          expect(job.log).to.eql(res[0].log);
          expect(job.running).to.eql(res[0].running);
          expect(job.finished).to.eql(res[0].finished);
          expect(job._id).to.eql(res[0]._id);
        });
      }).then(done, done);
    });

    it('should return null', function(done) {
      this.timeout(5000);

      return jobs.get(1).then(function(job) {
        expect(job).to.eql(null);
      }).then(done, done);
    });
  });

  describe( 'clear', function() {
    it('should return okay', function(done) {
      return jobs.clear().then(function(res) {
        expect(res).to.eql(true);
      }).then(done, done);
    });
  });

  describe( 'getLog', function() {
    it('should return job', function(done) {
      this.timeout(5000);

      var time = moment.utc().unix();
      return jobs.addJob().then(function(res) {
        expect(res[0].addedTime >= time).to.be.ok();
        expect(res[0].log).to.eql('');
        expect(res[0].running).to.eql(false);
        expect(res[0].finished).to.eql(false);
        expect(res[0]._id).to.be.ok();

        return jobs.getLog(res[0]._id).then(function(job) {
          expect(job.addedTime).to.eql(res[0].addedTime);
          expect(job.log).to.eql(res[0].log);
          expect(job.running).to.eql(res[0].running);
          expect(job.finished).to.eql(res[0].finished);
          expect(job._id).to.eql(res[0]._id);
        });
      }).then(done, done);
    });

    it('should return null', function(done) {
      this.timeout(5000);

      return jobs.getLog(1).then(function(job) {
        expect(job).to.eql(null);
      }).then(done, done);
    });
  });

  describe( 'getJobs', function() {
    it( 'should return a list of jobs', function(done) {
      this.timeout(5000);

      return jobs.getJobs().then(function(results) {
        expect(results.length).to.be.greaterThan(0);
      }).then(done, done);
    });
  });
});
