const { Sequelize } = require('sequelize');

const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;
const dbHost = process.env.DB_HOST;

// Create initial Sequelize instance
let sequelize = new Sequelize(dbName, dbUser, dbPass, {
    host: dbHost,
    dialect: 'postgres',
    logging: false,
    pool: {
        idle: 10000
    }
});

async function connectWithDatabaseCreation() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);

        if (error.name === 'SequelizeConnectionError') {
            const sequelizeTemporary = new Sequelize('postgres', dbUser, dbPass, {
                host: dbHost,
                dialect: 'postgres',
                logging: false
            });

            try {
                await sequelizeTemporary.query(`CREATE DATABASE "${dbName}";`);
                console.log(`Database ${dbName} created successfully.`);
            } catch (creationError) {
                // Handle "database already exists" error (Postgres code: 42P04)
                if (creationError.original && creationError.original.code === '42P04') {
                    console.log(`Database ${dbName} already exists. Continuing...`);
                } else {
                    console.error('Error creating the database:', creationError);
                    throw creationError; // Re-throw if it's a different error
                }
            }

            // Reconnect to the newly created or existing database
            sequelize = new Sequelize(dbName, dbUser, dbPass, {
                host: dbHost,
                dialect: 'postgres',
                logging: false
            });

            await sequelize.authenticate();
            console.log('Reconnected to the database successfully.');
        } else {
            throw error; // Re-throw if it's not a connection error
        }
    }
}

module.exports = { sequelize, connectWithDatabaseCreation };
