const HealthCheck = require('../models/healthchecks.js');
const { sequelize } = require('../db/config.js');
const logger = require('../config/logger'); // ensure you have a logger configuration
const statsd = require('../config/metrics'); // ensure you have a StatsD configuration

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
    statsd.increment('healthcheck.success');
    statsd.timing('healthcheck.duration', new Date() - start);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    res.status(503).send();
    statsd.increment('healthcheck.failure');
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
    statsd.increment('method.unsupported');
    statsd.timing('method.unsupported.duration', new Date() - start);
  } catch (error) {
    logger.error('Database down during method unsupported handling', { error: error.message });
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    res.status(503).send();
    statsd.increment('healthcheck.db_failure');
  }
};
