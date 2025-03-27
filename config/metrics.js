const StatsD = require('hot-shots');

const statsd = new StatsD({
  host: 'localhost',
  port: 8125,
  prefix: 'MyWebApp.',
  errorHandler: (error) => {
    console.error("StatsD Error:", error);
  }
});

// Dynamically generate suffix based on current UTC hour
const getTimeSuffix = () => {
  const now = new Date();
  return '_' + now.toISOString().slice(0, 13).replace(/[-T:]/g, '');
};

const sendCustomMetric = (name, value = 1) => {
  const metricName = name + getTimeSuffix();
  statsd.increment(metricName, value);
  console.log(`[Metrics] Count -> ${metricName}`);
};

const sendTimingMetric = (name, durationMs) => {
  const metricName = name + getTimeSuffix();
  statsd.timing(metricName, durationMs);
  console.log(`[Metrics] Timing -> ${metricName}: ${durationMs}ms`);
};

const trackApiMetrics = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const method = req.method;

    let path = req.originalUrl.split('?')[0];
    path = path.replace(/\d+/g, 'id');
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

module.exports = {
  sendCustomMetric,
  sendTimingMetric,
  trackApiMetrics,
  trackDbMetric,
  trackS3Metric
};
