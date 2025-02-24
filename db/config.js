const { Sequelize } = require('sequelize');

const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;
const dbHost = process.env.DB_HOST;

// Validate environment variables
if (!dbName || !dbUser || !dbPass || !dbHost) {
    throw new Error('Missing required database environment variables');
}

// Create initial Sequelize instance
let sequelize = new Sequelize(dbName, dbUser, dbPass, {
    host: dbHost,
    dialect: 'postgres',
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

async function connectWithDatabaseCreation() {
    try {
        // Try to authenticate with the main database
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);

        // If the database doesn't exist, try to create it
        if (error.name === 'SequelizeConnectionError' || error.original.code === '3D000') {
            try {
                // Connect to the default 'postgres' database to create a new DB
                const tempSequelize = new Sequelize('postgres', dbUser, dbPass, {
                    host: dbHost,
                    dialect: 'postgres',
                    logging: false
                });

                await tempSequelize.query(`CREATE DATABASE "${dbName}";`);
                console.log(`Database ${dbName} created successfully.`);
                await tempSequelize.close();

                // Reconnect to the newly created database
                sequelize = new Sequelize(dbName, dbUser, dbPass, {
                    host: dbHost,
                    dialect: 'postgres',
                    logging: false
                });

                await sequelize.authenticate();
                console.log('Reconnected to the new database successfully.');
            } catch (creationError) {
                console.error('Error during database creation:', creationError);
                throw creationError;
            }
        } else {
            throw error;
        }
    }
}

module.exports = { sequelize, connectWithDatabaseCreation };
