process.title = 'GitHubCI';
var colors = require('colors'),
    optimist = require('optimist');

var git = require('./lib/git'),
    version = '0.0.3';

var argv = optimist.usage('Usage: ci [-hpv] path_to_git_repo'.green).options('h', {
  alias: 'host',
  describe: "The hostname or ip of the host to bind to",
  "default": '0.0.0.0'
}).options('d', {
  alias: 'basedir',
  describe: "Application base path for mounted instances",
  "default": "/"
}).options('p', {
  alias: 'port',
  describe: "The port to listen on",
  "default": 4567
}).options('help', {
  describe: "Show this message"
}).options('v', {
  alias: 'version',
  describe: "Show version"
}).argv;

if (argv.help) {
  optimist.showHelp();
  process.exit(1);
}

if (argv.v) {
  console.log(("ci v" + version).green);
  process.exit(1);
}

if (argv._.length === 0) {
  optimist.showHelp();
  console.log('You must specify a Git repo'.red);
  process.exit(1);
}

var startServer = function() {
  var server;
  global.currentNamespace = argv.d;
  server = require('./lib/server');
  server.listen(argv.p, argv.h);
  return console.log("CI listening on port %d with host %s in directory %s".green, argv.p, argv.h, argv.d);
};

git.init(argv._[0], startServer);
