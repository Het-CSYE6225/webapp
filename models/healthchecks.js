const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/config.js');  

const HealthCheck = sequelize.define('HealthCheck', {
  check_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  datetime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'health_checks'
});



module.exports = HealthCheck;
