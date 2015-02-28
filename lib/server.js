var express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser');

var runner = require('./runner'),
    jobs = require('./jobs'),
    git = require('./git'),
    app;

if (git.user && git.pass) {
  app = express.createServer(express.basicAuth(git.user, git.pass));
} else {
  app = express.createServer();
}

require('express-namespace');

app.helpers({
  baseUrl: function() {
    return path.normalize("" + global.currentNamespace + "/");
  }
});

app.configure(function() {
  app.set('views', __dirname + '/../views');
  app.set('view engine', 'ejs');
  app.use(express.static(__dirname + '/../public'));
  app.use(express.logger());
  app.use(app.router);
  app.set('view options', {
    layout: false
  });
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  return app.use(global.currentNamespace, express["static"](__dirname + '/../public'));
});

app.configure('development', function() {
  return app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
});

app.configure('production', function() {
  return app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
});

var deferredApp = function() {
  app.get('/', function(req, res) {
    return jobs.getAll().then(function(jobs) {
      return res.render('index', {
        project: path.basename(process.cwd()),
        jobs: jobs,
        title: ''
      });
    });
  });
  app.get('/jobs', function(req, res) {
    return jobs.getAll().then(function(jobs) {
      return res.json(jobs);
    });
  });
  app.get('/job/:id', function(req, res) {
    return jobs.get(req.params.id).then(function(job) {
      return res.json(job);
    });
  });
  app.get('/job/:id/:attribute', function(req, res) {
    return jobs.get(req.params.id).then(function(job) {
      if (job[req.params.attribute] !== null) {
        return res.json(job[req.params.attribute]);
      } else {
        return res.send("The job doesn't have the " + req.params.attribute + " attribute");
      }
    });
  });
  app.get('/clear', function(req, res) {
    return jobs.clear().then(function() {
      return res.redirect("" + (this._locals.baseUrl()) + "/jobs");
    });
  });
  app.get('/add', function(req, res) {
    return jobs.addJob().then(function() {
      return res.redirect("" + (this._locals.baseUrl()) + "/jobs");
    });
  });
  app.get('/ping', function(req, res) {
    console.log('pinged!');
    return jobs.getLast().then(function(job) {
      if (job.failed) {
        return res.send(412);
      } else {
        return res.send(200);
      }
    });
  });
  app.post('/', function(req, res) {
    console.log(req.body);
    return jobs.addJob().then(function(job) {
      runner.build();
      if (req.xhr) {
        return res.json(job[0]);
      } else {
        return res.redirect("" + (this._locals.baseUrl()) + "/");
      }
    });
  });
};

if (global.currentNamespace !== "/") {
  app.namespace(global.currentNamespace, deferredApp);
} else {
  deferredApp();
}

module.exports = app;
