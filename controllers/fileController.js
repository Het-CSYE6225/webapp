const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { v4: uuidv4 } = require('uuid');
const File = require('../models/File.js');

// Initialize S3 client for AWS SDK v3
const s3 = new S3Client({
    region: process.env.AWS_REGION || "us-east-1"
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Skip S3 validation if running in test mode
if (!isTestEnv && !BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME environment variable is missing.");
}


// Check if the environment is test mode
const isTestEnv = process.env.NODE_ENV === 'test';

// Mock file upload middleware for test mode
const testUploadMiddleware = (req, res, next) => {
    req.file = {
        originalname: "dummy.txt",
        location: "s3://dummy-bucket/dummy.txt",  // Fake S3 path
        mimetype: "text/plain",
        size: 1024
    };
    next();
};

// Multer-S3 storage configuration (for actual usage)
const upload = multer({
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

// **POST /v1/file - Upload a file**
exports.uploadFile = async (req, res) => {
    // Select the appropriate middleware based on the environment
    const uploadMiddleware = isTestEnv ? testUploadMiddleware : upload;

    uploadMiddleware(req, res, async (err) => {
        if (err) {
            console.error("File upload error:", err);
            return res.status(500).json({ error: "File upload failed", details: err.message });
        }

        if (!req.file) {
            console.error("No file uploaded.");
            return res.status(400).json({ error: "No file uploaded" });
        }

        try {
            console.log("File uploaded:", req.file);

            const newFile = await File.create({
                fileName: req.file.originalname,
                s3Path: req.file.location,
                fileType: req.file.mimetype,
                fileSize: req.file.size
            });

            res.status(201).json({ 
                id: newFile.id, 
                fileName: newFile.fileName, 
                s3Path: newFile.s3Path 
            });
        } catch (error) {
            console.error("Database error:", error);
            res.status(500).json({ error: "Database error", details: error.message });
        }
    });
};

// **GET /v1/file - List all files**
exports.getFiles = async (req, res) => {
    try {
        const files = await File.findAll({ attributes: ['id', 'fileName', 's3Path', 'fileType', 'fileSize', 'createdAt'] });
        res.status(200).json(files);
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};

// **GET /v1/file/{id} - Get file metadata**
exports.getFileById = async (req, res) => {
    try {
        const file = await File.findByPk(req.params.id);
        if (!file) {
            return res.status(404).json({ error: "File not found" });
        }
        res.status(200).json(file);
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};

// **DELETE /v1/file/{id} - Delete file**
exports.deleteFile = async (req, res) => {
    try {
        const file = await File.findByPk(req.params.id);
        if (!file) {
            return res.status(404).json({ error: "File not found" });
        }

        const deleteParams = {
            Bucket: BUCKET_NAME,
            Key: file.s3Path.split('/').pop()
        };

        await s3.send(new DeleteObjectCommand(deleteParams));
        await file.destroy();

        res.status(200).json({ message: "File deleted successfully" });
    } catch (error) {
        console.error("Error deleting file:", error);
        res.status(500).json({ error: "Error deleting file", details: error.message });
    }
};
