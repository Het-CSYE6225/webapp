const express = require('express');
const { uploadFile, getFiles, getFileById, deleteFile } = require('../controllers/fileController');

const router = express.Router();

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

// Explicitly return 405 for HEAD requests on `/v1/file` and `/v1/file/{id}`
router.head('/file', (req, res) => {
    res.status(405).json({ error: "Method Not Allowed", message: "HEAD requests are not supported on this endpoint." });
});

router.head('/file/:id', (req, res) => {
    res.status(405).json({ error: "Method Not Allowed", message: "HEAD requests are not supported on this endpoint." });
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
