var Promise = require( 'bluebird' ),
    sinon = require('sinon'),
    childProcess = require('child-process-promise');

var git = require('../lib/git'),
    jobs = require('../lib/jobs');

describe('U:CI:git', function() {
  'use strict';

  describe( 'pull', function() {
    beforeEach(function() {
      sinon.stub(jobs, 'updateLog');
      sinon.stub(childProcess, 'exec');
    });

    it('should run okay', function(done) {
      this.timeout(5000);
      childProcess.exec.returns(Promise.resolve());
      jobs.updateLog.returns(Promise.resolve());

      git.pull().then(function(res) {
        expect(childProcess.exec).to.be.calledOnce;
        expect(jobs.updateLog).to.be.calledTwice;
        expect(res).to.eql(void 0);
      }).then(done, done);
    });

    it('should fail', function(done) {
      this.timeout(5000);
      childProcess.exec.returns(Promise.reject('fail'));
      jobs.updateLog.returns(Promise.resolve());

      git.pull().catch(function(err) {
        expect(childProcess.exec).to.be.calledOnce;
        expect(jobs.updateLog).to.be.calledTwice;
        expect(err).to.eql('fail');
      }).then(done, done);
    });

    afterEach(function() {
      jobs.updateLog.restore();
      childProcess.exec.restore();
    });
  });

  describe( 'getUser', function() {
    beforeEach(function() {
      sinon.stub(childProcess, 'exec');
    });

    it( 'should return account info', function(done) {
      this.timeout(5000);
      childProcess.exec.returns(Promise.resolve({
        'stdout': 'chase'
      }));
      git.getUser().then(function(user) {
        expect(childProcess.exec).to.be.calledOnce;
        expect(user).to.eql('chase');
      }).then(done, done);
    });

    it( 'should return empty', function(done) {
      this.timeout(5000);
      childProcess.exec.returns(Promise.resolve({
        'stderr': 'err!'
      }));
      git.getUser().then(function(user) {
        expect(childProcess.exec).to.be.calledOnce;
        expect(user).to.eql('');
      }).then(done, done);
    });

    it( 'should return empty', function(done) {
      this.timeout(5000);
      childProcess.exec.returns(Promise.reject());
      git.getUser().then(function(user) {
        expect(childProcess.exec).to.be.calledOnce;
        expect(user).to.eql('');
      }).then(done, done);
    });

    afterEach(function() {
      childProcess.exec.restore();
    });
  });

  describe( 'getPass', function() {
    beforeEach(function() {
      sinon.stub(childProcess, 'exec');
    });

    it( 'should return password info', function(done) {
      this.timeout(5000);
      childProcess.exec.returns(Promise.resolve({
        'stdout': '12345'
      }));
      git.getPass().then(function(pass) {
        expect(childProcess.exec).to.be.calledOnce;
        expect(pass).to.eql('12345');
      }).then(done, done);
    });

    it( 'should return empty', function(done) {
      this.timeout(5000);
      childProcess.exec.returns(Promise.resolve({
        'stderr': 'err!'
      }));
      git.getPass().then(function(pass) {
        expect(childProcess.exec).to.be.calledOnce;
        expect(pass).to.eql('');
      }).then(done, done);
    });

    it( 'should return empty', function(done) {
      this.timeout(5000);
      childProcess.exec.returns(Promise.reject());
      git.getPass().then(function(pass) {
        expect(childProcess.exec).to.be.calledOnce;
        expect(pass).to.eql('');
      }).then(done, done);
    });

    afterEach(function() {
      childProcess.exec.restore();
    });
  });

  describe( 'getBranch', function() {
    beforeEach(function() {
      sinon.stub(childProcess, 'exec');
      sinon.stub(git, 'gitContinue');
    });

    it( 'should return master', function(done) {
      this.timeout(5000);
      childProcess.exec.returns(Promise.resolve({
        'stdout': 'master'
      }));
      git.gitContinue.returns(Promise.resolve());
      git.getBranch().then(function() {
        expect(git.branch).to.eql('master');
        expect(childProcess.exec).to.be.calledOnce;
      }).then(done, done);
    });

    it( 'should return develop', function(done) {
      this.timeout(5000);
      childProcess.exec.returns(Promise.resolve({
        'stdout': 'develop'
      }));
      git.gitContinue.returns(Promise.resolve());
      git.getBranch().then(function() {
        expect(git.branch).to.eql('develop');
        expect(childProcess.exec).to.be.calledOnce;
      }).then(done, done);
    });

    it( 'should return empty', function(done) {
      this.timeout(5000);
      childProcess.exec.returns(Promise.resolve({
        'stderr': 'err!'
      }));
      git.gitContinue.returns(Promise.resolve());
      git.getBranch().then(function() {
        expect(git.branch).to.eql('master');
        expect(childProcess.exec).to.be.calledOnce;
      }).then(done, done);
    });

    afterEach(function() {
      childProcess.exec.restore();
      git.gitContinue.restore();
    });
  });

  describe( 'getRunner', function() {
    beforeEach(function() {
      sinon.stub(childProcess, 'exec');
      sinon.stub(git, 'gitContinue');
    });

    it( 'should return npm test', function(done) {
      this.timeout(5000);
      childProcess.exec.returns(Promise.resolve({
        'stdout': 'npm test'
      }));
      git.gitContinue.returns(Promise.resolve());
      git.getRunner().then(function() {
        expect(git.runner).to.eql('npm test');
        expect(childProcess.exec).to.be.calledOnce;
        expect(git.gitContinue).to.be.calledOnce;
      }).then(done, done);
    });

    it( 'should return npm i', function(done) {
      this.timeout(5000);
      childProcess.exec.returns(Promise.resolve({
        'stdout': 'npm i'
      }));
      git.gitContinue.returns(Promise.resolve());
      git.getRunner().then(function() {
        expect(git.runner).to.eql('npm i');
        expect(childProcess.exec).to.be.calledOnce;
        expect(git.gitContinue).to.be.calledOnce;
      }).then(done, done);
    });

    it( 'should return empty', function(done) {
      this.timeout(5000);
      childProcess.exec.returns(Promise.resolve({
        'stderr': 'err!'
      }));
      git.gitContinue.returns(Promise.resolve());
      git.getRunner().then(function() {
        expect(git.runner).to.eql('none');
        expect(childProcess.exec).to.be.calledOnce;
        expect(git.gitContinue).to.be.calledOnce;
      }).then(done, done);
    });

    afterEach(function() {
      childProcess.exec.restore();
      git.gitContinue.restore();
    });
  });
});
