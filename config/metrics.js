const StatsD = require('hot-shots');

const statsd = new StatsD({
  host: 'localhost',
  port: 8125,
  prefix: 'MyWebApp.',
  errorHandler: (error) => {
    console.error("StatsD Error:", error);
  }
});

// Reusable suffix based on current hour (e.g., _2025032715)
const now = new Date();
const timeSuffix = now.toISOString().slice(0, 13).replace(/[-T:]/g, '');
const suffix = `_${timeSuffix}`;

// Sends a basic counter metric
const sendCustomMetric = (name, value = 1) => {
  statsd.increment(name, value);
  console.log(`[Metrics] Count -> ${name}`);
};

// Sends a timing metric (duration in ms)
const sendTimingMetric = (name, durationMs) => {
  statsd.timing(name, durationMs);
  console.log(`[Metrics] Timing -> ${name}: ${durationMs}ms`);
};

// Express middleware for tracking API metrics
const trackApiMetrics = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const method = req.method;

    let path = req.originalUrl.split('?')[0];
    path = path.replace(/\d+/g, 'id');
    path = path.replace(/\/+$/, '') || '/';
    path = path.replace(/[^a-zA-Z0-9/_\-\.]/g, '');

    const callCountMetric = `API.${method}.${path}.CallCount${suffix}`;
    const durationMetric = `API.${method}.${path}.Duration${suffix}`;

    sendCustomMetric(callCountMetric);
    sendTimingMetric(durationMetric, duration);
  });

  next();
};

// DB operation timing metric with timestamped metric name
const trackDbMetric = (operation, table, startTime) => {
  const duration = Date.now() - startTime;
  const metricName = `DB.${operation}.${table}.Duration${suffix}`;
  sendTimingMetric(metricName, duration);
};

// S3 operation timing metric with timestamped metric name
const trackS3Metric = (operation, startTime) => {
  const duration = Date.now() - startTime;
  const metricName = `S3.${operation}.Duration${suffix}`;
  sendTimingMetric(metricName, duration);
};

module.exports = {
  sendCustomMetric,
  sendTimingMetric,
  trackApiMetrics,
  trackDbMetric,
  trackS3Metric
};
