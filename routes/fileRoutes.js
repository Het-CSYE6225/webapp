const express = require('express');
const { uploadFile, getFiles, getFileById, deleteFile } = require('../controllers/fileController');
const logger = require('../config/logger'); // Ensure you have this set up for winston
const statsd = require('../config/metrics'); // Ensure you have this set up for hot-shots

const router = express.Router();

router.use((req, res, next) => {
    const start = Date.now(); // Start time for measuring request duration
    res.on('finish', () => {
        const duration = Date.now() - start;
        statsd.timing(`routes.${req.route.path}`, duration);
        logger.info(`Request processed: ${req.method} ${req.route.path} - ${res.statusCode} [${duration}ms]`);
        statsd.increment(`routes.${req.method}.${req.route.path}.calls`);
    });
    if (req.method === 'HEAD') {
        return res.status(405).json({ error: "Method Not Allowed", message: "HEAD requests are not supported on this endpoint." });
    }
    next();
});

// Supported routes
router.post('/file', uploadFile);        // POST /v1/file (File upload)
router.get('/file/:id', getFileById);    // GET /v1/file/{id} (Retrieve file metadata)
router.delete('/file/:id', deleteFile);  // DELETE /v1/file/{id} (Delete file)

// Return 400 Bad Request for GET and DELETE on /v1/file (only valid for file/{id})
router.get('/file', (req, res) => {
    res.status(400).json({ error: "Bad Request", message: "GET /v1/file is not a valid request. Use GET /v1/file/{id} instead." });
});

router.delete('/file', (req, res) => {
    res.status(400).json({ error: "Bad Request", message: "DELETE /v1/file is not a valid request. Use DELETE /v1/file/{id} instead." });
});

// Return 405 Method Not Allowed for all other unsupported methods on `/v1/file`
router.all('/file', (req, res) => {
    res.status(405).json({ error: "Method Not Allowed", message: `HTTP ${req.method} is not supported on this endpoint.` });
});

// Return 405 Method Not Allowed for all unsupported methods on `/v1/file/{id}`
router.all('/file/:id', (req, res) => {
    res.status(405).json({ error: "Method Not Allowed", message: `HTTP ${req.method} is not supported on this endpoint.` });
});

module.exports = router;
