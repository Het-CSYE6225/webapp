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

    if (req.route && req.baseUrl) {
      // This is a matched route (e.g., /v1/file/:id)
      fullPath = `${req.baseUrl}${req.route.path}`;
    } else {
      // Unmatched or unsupported route (e.g., invalid PATCH/HEAD)
      fullPath = req.originalUrl.split('?')[0];
    }

    // Normalize the path
    fullPath = fullPath
      .replace(/\/+/g, '/')           
      .replace(/\/$/, '') || '/';     
    fullPath = fullPath
      .replace(/\d+/g, 'id')          
      .replace(/[^a-zA-Z0-9/_\-\.]/g, ''); 

    // Send metrics
    sendCustomMetric(`API.${method}.${fullPath}.CallCount`);
    sendTimingMetric(`API.${method}.${fullPath}.Duration`, duration);
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
