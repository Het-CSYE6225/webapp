require('dotenv').config();
const express = require('express');
const { sequelize, connectWithDatabaseCreation } = require('./db/config');
const healthCheckRoutes = require('./routes/healthCheckRoutes');
const fileRoutes = require('./routes/fileRoutes');
const { sendCustomMetric } = require('./config/metrics'); // Ensure this path is correct

const app = express();
const port = process.env.PORT || 8080;

app.disable('x-powered-by');
app.use(express.json());

// Middleware to track API call counts and durations
app.use((req, res, next) => {
    const start = process.hrtime();
    res.on('finish', () => {
        const elapsed = process.hrtime(start);
        const duration = elapsed[0] * 1000 + elapsed[1] / 1000000; // convert hrtime to milliseconds
        const routeName = req.route ? req.route.path : req.path; // Ensuring we capture custom route names
        sendCustomMetric(`${routeName}.CallCount`, 1);
        sendCustomMetric(`${routeName}.Duration`, duration, 'Milliseconds');
    });
    next();
});

// Error handling middleware for JSON syntax errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).send('Invalid JSON payload.');
    }
    next();
});

// Middleware to check for GET requests with a body
app.use((req, res, next) => {
    if (req.method === 'GET' && Object.keys(req.body).length > 0) {
        return res.status(400).send('GET requests should not have a body.');
    }
    next();
});

// Middleware to check for GET requests with query parameters
app.use((req, res, next) => {
    if (req.method === 'GET' && Object.keys(req.query).length > 0) {
        return res.status(400).send('GET requests should not have query parameters.');
    }
    next();
});

// Routing
app.use('/v1', fileRoutes); 
connectWithDatabaseCreation().then(() => {
    app.use('/', healthCheckRoutes);
    sequelize.sync({ alter: true })
        .then(() => {
            console.log("Database & tables are ready!");
            app.listen(port, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${port}`));
        })
        .catch(err => {
            console.error('Unable to sync the database:', err);
        });
}).catch(err => {
    console.error('Failed to initialize the database:', err);
});

module.exports = app;
