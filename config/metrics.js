// /config/metrics.js
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch({ region: process.env.AWS_REGION });

const sendCustomMetric = (name, value, unit = 'Count', serviceName = 'YourServiceName') => {
    const params = {
        MetricData: [{
            MetricName: name,
            Dimensions: [{
                Name: 'ServiceName',
                Value: serviceName
            }],
            Timestamp: new Date(),
            Value: value,
            Unit: unit
        }],
        Namespace: 'YourApplicationMetrics'
    };

    cloudwatch.putMetricData(params, function(err, data) {
        if (err) {
            console.log("Error sending metric to CloudWatch:", err);
        } else {
            console.log("Metric successfully sent to CloudWatch:", data);
        }
    });
};

module.exports = { sendCustomMetric };
