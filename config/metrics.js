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

    let fullPath;

    // Safe route extraction
    if (req.route && req.baseUrl) {
      fullPath = `${req.baseUrl}${req.route.path}`;
    } else if (req.originalUrl) {
      fullPath = req.originalUrl.split('?')[0];
    } else {
      fullPath = 'unknown';
    }

    // Normalize path
    fullPath = fullPath
      .replace(/\/+/g, '/')
      .replace(/\/$/, '') || '/';
    fullPath = fullPath
      .replace(/:\w+/g, 'id')
      .replace(/\d+/g, 'id')
      .replace(/[^a-zA-Z0-9/_\-\.]/g, '');

    const metricBase = `API.${method}.${fullPath}`;
    sendCustomMetric(`${metricBase}.CallCount`);
    sendTimingMetric(`${metricBase}.Duration`, duration);
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
