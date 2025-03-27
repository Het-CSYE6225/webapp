require('dotenv').config();
const express = require('express');
const { sequelize, connectWithDatabaseCreation } = require('./db/config');
const healthCheckRoutes = require('./routes/healthCheckRoutes');
const fileRoutes = require('./routes/fileRoutes');
const { trackApiMetrics } = require('./config/metrics');

const app = express();
const port = process.env.PORT || 8080;

app.disable('x-powered-by');
app.use(express.json());

// ✅ GET request validation (body & query) should come BEFORE routes
app.use((req, res, next) => {
  if (req.method === 'GET' && Object.keys(req.body).length > 0) {
    return res.status(400).send('GET requests should not have a body.');
  }
  if (req.method === 'GET' && Object.keys(req.query).length > 0) {
    return res.status(400).send('GET requests should not have query parameters.');
  }
  next();
});

// ✅ Your application routes
app.use('/v1', fileRoutes);
app.use('/', healthCheckRoutes);

// ✅ Metrics tracking (after routes to get full path data)
app.use(trackApiMetrics);

// ✅ JSON error handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).send('Invalid JSON payload.');
  }
  next();
});

// ✅ Start DB and app
connectWithDatabaseCreation().then(() => {
  sequelize.sync({ alter: true })
    .then(() => {
      console.log("Database & tables are ready!");
      app.listen(port, '0.0.0.0', () =>
        console.log(`Server running on http://0.0.0.0:${port}`)
      );
    })
    .catch(err => {
      console.error('Unable to sync the database:', err);
    });
}).catch(err => {
  console.error('Failed to initialize the database:', err);
});

module.exports = app;
