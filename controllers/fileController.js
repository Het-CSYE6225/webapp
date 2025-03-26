const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { v4: uuidv4 } = require('uuid');
const File = require('../models/File.js');
const logger = require('../config/logger');
const { sendCustomMetric } = require('../config/metrics');

// Initialize S3 client for AWS SDK v3
const s3 = new S3Client({
    region: process.env.AWS_REGION || "us-east-1"
});
const isTestEnv = process.env.NODE_ENV === 'test';

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

if (!isTestEnv && !BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME environment variable is missing.");
}

// Multer-S3 storage configuration
const upload = isTestEnv
    ? (req, res, next) => {
        req.file = {
            originalname: "dummy.txt",
            location: "s3://dummy-bucket/dummy.txt",
            mimetype: "text/plain",
            size: 1024
        };
        next();
    }
    : multer({
        storage: multerS3({
            s3: s3,
            bucket: BUCKET_NAME,
            metadata: (req, file, cb) => {
                cb(null, { fieldName: file.fieldname });
            },
            key: (req, file, cb) => {
                const fileKey = `uploads/${uuidv4()}-${file.originalname}`;
                cb(null, fileKey);
            }
        })
    }).single('file');

// POST /v1/file - Upload a file
exports.uploadFile = async (req, res) => {
    const startTime = new Date();
    upload(req, res, async (err) => {
        if (err) {
            logger.error("File upload error", { error: err });
            sendCustomMetric('FileUploadFail', 1);
            return res.status(500).json({ error: "File upload failed", details: err.message });
        }

        if (!req.file) {
            logger.error("No file uploaded");
            sendCustomMetric('FileUploadNoFile', 1);
            return res.status(400).json({ error: "No file uploaded" });
        }

        try {
            const newFile = await File.create({
                fileName: req.file.originalname,
                s3Path: req.file.location,
                fileType: req.file.mimetype,
                fileSize: req.file.size
            });

            const duration = new Date() - startTime;
            sendCustomMetric('FileUploadDuration', duration, 'Milliseconds');
            sendCustomMetric('FileUploadCount', 1);

            logger.info("File uploaded", { fileName: req.file.originalname, location: req.file.location });
            res.status(201).json({
                id: newFile.id,
                fileName: newFile.fileName,
                s3Path: newFile.s3Path
            });
        } catch (error) {
            logger.error("Database error", { error: error.message });
            sendCustomMetric('FileUploadDBError', 1);
            res.status(500).json({ error: "Database error", details: error.message });
        }
    });
};

// GET /v1/file - List all files
exports.getFiles = async (req, res) => {
    const startTime = new Date();
    try {
        const files = await File.findAll({ attributes: ['id', 'fileName', 's3Path', 'fileType', 'fileSize', 'createdAt'] });
        const duration = new Date() - startTime;
        sendCustomMetric('FileListDuration', duration, 'Milliseconds');
        sendCustomMetric('FileListCount', 1);

        logger.info("Files retrieved", { count: files.length });
        res.status(200).json(files);
    } catch (error) {
        logger.error("Database error", { error: error.message });
        sendCustomMetric('FileListDBError', 1);
        res.status(500).json({ error: "Database error", details: error.message });
    }
};

// GET /v1/file/{id} - Get file metadata
exports.getFileById = async (req, res) => {
    const startTime = new Date();
    try {
        const file = await File.findByPk(req.params.id);
        const duration = new Date() - startTime;
        if (!file) {
            logger.error("File not found", { fileId: req.params.id });
            sendCustomMetric('FileGetNotFound', 1);
            return res.status(404).json({ error: "File not found" });
        }

        sendCustomMetric('FileGetDuration', duration, 'Milliseconds');
        sendCustomMetric('FileGetCount', 1);
        logger.info("File retrieved", { fileId: file.id });
        res.status(200).json(file);
    } catch (error) {
        logger.error("Database error", { error: error.message });
        sendCustomMetric('FileGetDBError', 1);
        res.status(500).json({ error: "Database error", details: error.message });
    }
};

// DELETE /v1/file/{id} - Delete file
exports.deleteFile = async (req, res) => {
    const startTime = new Date();
    try {
        const file = await File.findByPk(req.params.id);
        if (!file) {
            logger.error("File not found", { fileId: req.params.id });
            sendCustomMetric('FileDeleteNotFound', 1);
            return res.status(404).json({ error: "File not found" });
        }

        const deleteParams = {
            Bucket: BUCKET_NAME,
            Key: file.s3Path.split('/').pop()
        };

        const deleteStartTime = new Date();
        await s3.send(new DeleteObjectCommand(deleteParams));
        await file.destroy();
        const deleteDuration = new Date() - deleteStartTime;

        sendCustomMetric('FileDeleteDuration', deleteDuration, 'Milliseconds');
        sendCustomMetric('FileDeleteCount', 1);

        logger.info("File deleted", { fileId: file.id });
        res.status(200).json({ message: "File deleted successfully" });
    } catch (error) {
        logger.error("Error deleting file", { error: error.message });
        sendCustomMetric('FileDeleteFail', 1);
        res.status(500).json({ error: "Error deleting file", details: error.message });
    }
};
