// /config/metrics.js
const StatsD = require('hot-shots');

const statsd = new StatsD({
  host: 'localhost',
  port: 8125,
  prefix: 'MyWebApp.',
  errorHandler: (error) => {
    console.error("StatsD Error:", error);
  }
});

const sendCustomMetric = (name, value = 1) => {
  statsd.increment(name, value);
};

const sendTimingMetric = (name, durationMs) => {
  statsd.timing(name, durationMs);
};

const trackApiMetrics = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const method = req.method;

    // Use original URL to catch full path (including /v1 or /healthz)
    let path = req.originalUrl.split('?')[0];

    // Normalize dynamic segments (like IDs)
    path = path.replace(/\d+/g, 'id');

    // Clean path
    path = path.replace(/\/+$/, '') || '/';
    path = path.replace(/[^a-zA-Z0-9/_\-\.]/g, '');

    sendCustomMetric(`API.${method}.${path}.CallCount`);
    sendTimingMetric(`API.${method}.${path}.Duration`, duration);
  });

  next();
};




const trackDbMetric = (operation, table, startTime) => {
  const duration = Date.now() - startTime;
  sendTimingMetric(`DB.${operation}.${table}.Duration`, duration);
};

const trackS3Metric = (operation, startTime) => {
  const duration = Date.now() - startTime;
  sendTimingMetric(`S3.${operation}.Duration`, duration);
};

module.exports = { sendCustomMetric, trackApiMetrics, trackDbMetric, trackS3Metric };
