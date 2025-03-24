const winston = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');

const cloudWatchConfig = {
  logGroupName: 'NodeApplication',
  logStreamName: 'MainStream',
  awsRegion: process.env.AWS_REGION,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  jsonMessage: true
};

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new WinstonCloudWatch(cloudWatchConfig)
  ]
});

module.exports = logger;
