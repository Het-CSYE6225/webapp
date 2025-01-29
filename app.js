require('dotenv').config();
const express = require('express');
const { sequelize, connectWithDatabaseCreation } = require('./db/config');
const healthCheckRoutes = require('./routes/healthCheckRoutes');
const app = express();
const port = process.env.PORT || 8080;

app.disable('x-powered-by');
app.use(express.json());
app.use((req, res, next) => {
    if (req.method === 'GET' && Object.keys(req.body).length > 0) {
        return res.status(400).send('GET requests should not have a body.');
    }
    next();
});


connectWithDatabaseCreation().then(() => {
    app.use('/', healthCheckRoutes);
    sequelize.sync({ alter: true })  
        .then(() => {
            console.log("Database & tables are ready!");
            app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
        })
        .catch(err => {
            console.error('Unable to sync the database:', err);
        });
}).catch(err => {
    console.error('Failed to initialize the database:', err);
});
