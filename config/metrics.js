// /config/metrics.js
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch({ region: process.env.AWS_REGION });

const sendCustomMetric = (name, value, unit = 'Count', dimensions = []) => {
  const params = {
    MetricData: [
      {
        MetricName: name,
        Dimensions: [
          { Name: 'App', Value: 'MyWebApp' },
          ...dimensions
        ],
        Timestamp: new Date(),
        Value: value,
        Unit: unit
      }
    ],
    Namespace: 'MyWebApp/Metrics'
  };

  cloudwatch.putMetricData(params, (err, data) => {
    if (err) console.error("CloudWatch metric error:", err);
    else console.log(`Metric sent: ${name} = ${value}`);
  });
};

const trackApiMetrics = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const method = req.method;
    const route = req.route?.path || req.path;
    sendCustomMetric(`API.${method}.${route}.CallCount`, 1);
    sendCustomMetric(`API.${method}.${route}.Duration`, duration, 'Milliseconds');
  });
  next();
};

const trackDbMetric = (operation, table, startTime) => {
  const duration = Date.now() - startTime;
  sendCustomMetric(`Database.${operation}.${table}.Duration`, duration, 'Milliseconds');
};

const trackS3Metric = (operation, startTime) => {
  const duration = Date.now() - startTime;
  sendCustomMetric(`S3.${operation}.Duration`, duration, 'Milliseconds');
};

module.exports = { sendCustomMetric, trackApiMetrics, trackDbMetric, trackS3Metric };
