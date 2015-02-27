var Logger = function(currentStream) {
  return {
    stream: currentStream !== null ? currentStream : '',
    log: function(args) {
      return this.stream += "" + args + "\n";
    }
  };
};

module.exports = Logger;
