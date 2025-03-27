const StatsD = require('hot-shots');

const statsd = new StatsD({
  host: 'localhost',
  port: 8125,
  prefix: 'MyWebApp.',
  errorHandler: (error) => {
    console.error("StatsD Error:", error);
  }
});

// Generate hourly time suffix like "_2025032715"
const getTimeSuffix = () => {
  const now = new Date();
  return '_' + now.toISOString().slice(0, 13).replace(/[-T:]/g, '');
};

const sendCustomMetric = (name, value = 1) => {
  statsd.increment(name, value); // Stable name
  statsd.increment(name + getTimeSuffix(), value); // Timestamped
  console.log(`[Metrics] Count -> ${name} + ${name + getTimeSuffix()}`);
};

const sendTimingMetric = (name, durationMs) => {
  statsd.timing(name, durationMs); // Stable name
  statsd.timing(name + getTimeSuffix(), durationMs); // Timestamped
  console.log(`[Metrics] Timing -> ${name}: ${durationMs}ms`);
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

    const baseMetric = `API.${method}.${path}`;
    sendCustomMetric(`${baseMetric}.CallCount`);
    sendTimingMetric(`${baseMetric}.Duration`, duration);
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
