const StatsD = require('hot-shots');
const statsd = new StatsD({
  host: 'localhost',
  port: 8125,
  prefix: 'myApplication.',
  errorHandler: error => {
    console.error('StatsD error:', error);
  }
});

module.exports = statsd;
