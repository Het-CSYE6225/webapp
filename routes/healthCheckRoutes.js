const express = require('express');
const router = express.Router();
const healthCheckController = require('../controllers/healthCheckController');

// Supported routes
router.get('/healthz', healthCheckController.performHealthCheck);
router.all('/healthz', healthCheckController.handleUnsupportedMethods);

module.exports = router;
