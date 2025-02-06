const HealthCheck = require('../models/healthchecks.js');
const { sequelize } = require('../db/config.js');

exports.performHealthCheck = async (req, res) => {
  try {
    await sequelize.authenticate();
    await HealthCheck.create({});
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    res.status(200).send();
  } catch (error) {
   // console.error("Health check failed. Database may be down");
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    res.status(503).send();
  }
};

exports.handleUnsupportedMethods = async (req, res) => {
  try {
    await sequelize.authenticate();
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    res.status(405).send();
  } catch (error) {
    console.error("Database may be down");
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    res.status(503).send();
  }
};
