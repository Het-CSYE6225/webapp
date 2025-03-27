const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { v4: uuidv4 } = require('uuid');
const File = require('../models/File.js');
const logger = require('../config/logger');
const { sendCustomMetric, trackDbMetric, trackS3Metric } = require('../config/metrics');

const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const isTestEnv = process.env.NODE_ENV === 'test';
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

if (!isTestEnv && !BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME environment variable is missing.");
}

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
            metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
            key: (req, file, cb) => cb(null, `uploads/${uuidv4()}-${file.originalname}`)
        })
    }).single('file');

// POST /v1/file
exports.uploadFile = async (req, res) => {
    const startTime = new Date();
    upload(req, res, async (err) => {
        if (err) {
            logger.error("File upload error", { error: err });
            sendCustomMetric('S3.Upload.Fail', 1);
            return res.status(500).json({ error: "File upload failed", details: err.message });
        }

        if (!req.file) {
            logger.error("No file uploaded");
            sendCustomMetric('S3.Upload.NoFile', 1);
            return res.status(400).json({ error: "No file uploaded" });
        }

        try {
            const dbStart = Date.now();
            const newFile = await File.create({
                fileName: req.file.originalname,
                s3Path: req.file.location,
                fileType: req.file.mimetype,
                fileSize: req.file.size
            });
            trackDbMetric('INSERT', 'files', dbStart);

            trackS3Metric('Upload', startTime);

            logger.info("File uploaded", { fileName: req.file.originalname });
            res.status(201).json({
                id: newFile.id,
                fileName: newFile.fileName,
                s3Path: newFile.s3Path
            });
        } catch (error) {
            logger.error("DB Error", { error: error.message });
            sendCustomMetric('Database.INSERT.files.Fail', 1);
            res.status(500).json({ error: "Database error", details: error.message });
        }
    });
};

// GET /v1/file
exports.getFiles = async (req, res) => {
    const start = Date.now();
    try {
        const files = await File.findAll({ attributes: ['id', 'fileName', 's3Path', 'fileType', 'fileSize', 'createdAt'] });
        trackDbMetric('SELECT', 'files', start);

        logger.info("Files retrieved", { count: files.length });
        res.status(200).json(files);
    } catch (error) {
        logger.error("DB Error", { error: error.message });
        sendCustomMetric('Database.SELECT.files.Fail', 1);
        res.status(500).json({ error: "Database error", details: error.message });
    }
};

// GET /v1/file/:id
exports.getFileById = async (req, res) => {
    const start = Date.now();
    try {
        const file = await File.findByPk(req.params.id);
        trackDbMetric('SELECT', 'files', start);

        if (!file) {
            logger.warn("File not found", { fileId: req.params.id });
            sendCustomMetric('File.Get.NotFound', 1);
            return res.status(404).json({ error: "File not found" });
        }

        logger.info("File fetched", { id: file.id });
        res.status(200).json(file);
    } catch (error) {
        logger.error("DB Error", { error: error.message });
        sendCustomMetric('Database.SELECT.files.Fail', 1);
        res.status(500).json({ error: "Database error", details: error.message });
    }
};

// DELETE /v1/file/:id
exports.deleteFile = async (req, res) => {
    const start = Date.now();
    try {
        const file = await File.findByPk(req.params.id);
        trackDbMetric('SELECT', 'files', start);

        if (!file) {
            logger.warn("File not found", { fileId: req.params.id });
            sendCustomMetric('File.Delete.NotFound', 1);
            return res.status(404).json({ error: "File not found" });
        }

        const s3Start = Date.now();
        await s3.send(new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: file.s3Path.split('.amazonaws.com/')[1]   
        }));
        
        trackS3Metric('Delete', s3Start);

        const deleteStart = Date.now();
        await file.destroy();
        trackDbMetric('DELETE', 'files', deleteStart);

        logger.info("File deleted", { id: file.id });
        res.status(200).json({ message: "File deleted successfully" });
    } catch (error) {
        logger.error("Error deleting file", { error: error.message });
        sendCustomMetric('File.Delete.Fail', 1);
        res.status(500).json({ error: "Error deleting file", details: error.message });
    }
};
