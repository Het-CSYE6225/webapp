const express = require('express');
const { uploadFile, getFiles, getFileById, deleteFile } = require('../controllers/fileController');
const logger = require('../config/logger');
const { sendCustomMetric } = require('../config/metrics');

const router = express.Router();

// Supported routes
router.post('/file', uploadFile);        // POST /v1/file (File upload)
router.get('/file/:id', getFileById);    // GET /v1/file/{id} (Retrieve file metadata)
router.delete('/file/:id', deleteFile);  // DELETE /v1/file/{id} (Delete file)

// HEAD method not allowed on file routes
router.head('/file', (req, res) => {
    logger.warn(`HEAD not allowed on /v1/file`);
    sendCustomMetric('API.HEAD./v1/file.MethodNotAllowed', 1);
    res.status(405).json({
        error: "Method Not Allowed",
        message: "HEAD requests are not supported on this endpoint."
    });
});

router.head('/file/:id', (req, res) => {
    logger.warn(`HEAD not allowed on /v1/file/:id`);
    sendCustomMetric('API.HEAD./v1/file/id.MethodNotAllowed', 1);
    res.status(405).json({
        error: "Method Not Allowed",
        message: "HEAD requests are not supported on this endpoint."
    });
});

// Return 400 Bad Request for GET and DELETE on /v1/file (only valid for file/{id})
router.get('/file', (req, res) => {
    logger.warn(`Invalid GET /v1/file without ID`);
    sendCustomMetric('API.GET./v1/file.BadRequest', 1);
    res.status(400).json({
        error: "Bad Request",
        message: "GET /v1/file is not a valid request. Use GET /v1/file/{id} instead."
    });
});

router.delete('/file', (req, res) => {
    logger.warn(`Invalid DELETE /v1/file without ID`);
    sendCustomMetric('API.DELETE./v1/file.BadRequest', 1);
    res.status(400).json({
        error: "Bad Request",
        message: "DELETE /v1/file is not a valid request. Use DELETE /v1/file/{id} instead."
    });
});

// Return 405 Method Not Allowed for unsupported methods on `/v1/file`
router.all('/file', (req, res) => {
    logger.warn(`Unsupported ${req.method} method on /v1/file`);
    sendCustomMetric(`API.${req.method}./v1/file.MethodNotAllowed`, 1);
    res.status(405).json({
        error: "Method Not Allowed",
        message: `HTTP ${req.method} is not supported on this endpoint.`
    });
});

// Return 405 Method Not Allowed for unsupported methods on `/v1/file/:id`
router.all('/file/:id', (req, res) => {
    logger.warn(`Unsupported ${req.method} method on /v1/file/:id`);
    sendCustomMetric(`API.${req.method}./v1/file/id.MethodNotAllowed`, 1);
    res.status(405).json({
        error: "Method Not Allowed",
        message: `HTTP ${req.method} is not supported on this endpoint.`
    });
});

module.exports = router;
