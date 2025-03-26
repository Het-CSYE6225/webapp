const express = require('express');
const router = express.Router();
const healthCheckController = require('../controllers/healthCheckController.js');
const logger = require('../config/logger');
const { sendCustomMetric } = require('../config/metrics'); // Updated to use CloudWatch metrics

router.use((req, res, next) => {
    const start = Date.now(); // Start time for measuring request duration

    res.on('finish', () => {
        const duration = Date.now() - start;
        const routePath = req.route ? req.route.path : req.path;

        sendCustomMetric(`routes.${routePath}.Duration`, duration, 'Milliseconds');
        sendCustomMetric(`routes.${req.method}.${routePath}.Calls`, 1);

        logger.info(`Request processed: ${req.method} ${routePath} - ${res.statusCode} [${duration}ms]`);
    });

    next();
});

// Supported health check routes
router.get('/healthz', healthCheckController.performHealthCheck);
router.all('/healthz', healthCheckController.handleUnsupportedMethods);

module.exports = router;
