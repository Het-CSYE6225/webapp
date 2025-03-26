const HealthCheck = require('../models/healthchecks.js');
const { sequelize } = require('../db/config.js');
const logger = require('../config/logger');
const { sendCustomMetric, trackDbMetric } = require('../config/metrics');

exports.performHealthCheck = async (req, res) => {
  const start = new Date();
  try {
    const dbStart = Date.now();
    await sequelize.authenticate();
    await HealthCheck.create({});
    trackDbMetric('INSERT', 'health_checks', dbStart);

    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });

    res.status(200).send();
    logger.info('Health check successful');

    const duration = new Date() - start;
    sendCustomMetric('HealthCheck.Success', 1);
    sendCustomMetric('HealthCheck.Duration', duration, 'Milliseconds');
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    res.status(503).send();
    sendCustomMetric('HealthCheck.Fail', 1);
  }
};

exports.handleUnsupportedMethods = async (req, res) => {
  const start = new Date();
  try {
    const dbStart = Date.now();
    await sequelize.authenticate();
    trackDbMetric('SELECT', 'health_checks', dbStart);

    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });

    res.status(405).send();
    logger.warn('Unsupported method attempt', { method: req.method });

    const duration = new Date() - start;
    sendCustomMetric('Method.Unsupported', 1);
    sendCustomMetric('Method.Unsupported.Duration', duration, 'Milliseconds');
  } catch (error) {
    logger.error('DB down during unsupported method', { error: error.message });
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    res.status(503).send();
    sendCustomMetric('Method.Unsupported.DBFail', 1);
  }
};
