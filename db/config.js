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

            await sequelizeTemporary.query(`CREATE DATABASE "${dbName}";`);
            console.log(`Database ${dbName} created successfully.`);

            
            sequelize = new Sequelize(dbName, dbUser, dbPass, {
                host: dbHost,
                dialect: 'postgres',
                logging: false
            });
            await sequelize.authenticate();
            console.log('Reconnected to the new database successfully.');
        } else {
            throw error;  
        }
    }
}

module.exports = { sequelize, connectWithDatabaseCreation };
