const fs = require('fs');
const winston = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');

// Ensure 'logs' directory exists
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Optional: Dynamic log group/stream naming
const logGroupName = `NodeApp-${process.env.NODE_ENV || 'dev'}`;
const logStreamName = `Webapp-${new Date().toISOString().split('T')[0]}`;

const cloudWatchConfig = {
  logGroupName,
  logStreamName,
  awsRegion: process.env.AWS_REGION,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  jsonMessage: true
};

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.simple(),
    }),

    // CloudWatch transport
    new WinstonCloudWatch(cloudWatchConfig),

    // Local file log
    new winston.transports.File({
      filename: 'logs/app.log',
      level: 'info',
    })
  ]
});

module.exports = logger;
