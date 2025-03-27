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

    let path = req.originalUrl.split('?')[0];

    // Normalize the path
    path = path.replace(/\d+/g, 'id');
    path = path.replace(/\/+$/, '') || '/';
    path = path.replace(/[^a-zA-Z0-9/_\-\.]/g, '');


    const now = new Date();
    const timeSuffix = now.toISOString().slice(0, 13).replace(/[-T:]/g, ''); // YYYYMMDDHH
    const suffix = `_${timeSuffix}`; // "_2025032715"

    const callCountMetric = `API.${method}.${path}.CallCount${suffix}`;
    const durationMetric = `API.${method}.${path}.Duration${suffix}`;

    sendCustomMetric(callCountMetric);
    sendTimingMetric(durationMetric, duration);
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
