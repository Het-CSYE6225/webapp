const HealthCheck = require('../models/healthchecks.js');
const { sequelize } = require('../db/config.js');
const logger = require('../config/logger');
const { sendCustomMetric } = require('../config/metrics'); // Import the new metrics module

exports.performHealthCheck = async (req, res) => {
  const start = new Date();
  try {
    await sequelize.authenticate();
    await HealthCheck.create({});
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    res.status(200).send();
    logger.info('Health check successful');

    const duration = new Date() - start;
    sendCustomMetric('HealthCheckSuccess', 1);
    sendCustomMetric('HealthCheckDuration', duration, 'Milliseconds');
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    res.status(503).send();
    sendCustomMetric('HealthCheckFailure', 1);
  }
};

exports.handleUnsupportedMethods = async (req, res) => {
  const start = new Date();
  try {
    await sequelize.authenticate();
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    res.status(405).send();
    logger.warn('Unsupported method attempt', { method: req.method });

    const duration = new Date() - start;
    sendCustomMetric('UnsupportedMethodAttempt', 1);
    sendCustomMetric('UnsupportedMethodDuration', duration, 'Milliseconds');
  } catch (error) {
    logger.error('Database down during method unsupported handling', { error: error.message });
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    res.status(503).send();
    sendCustomMetric('DatabaseDownDuringUnsupported', 1);
  }
};
