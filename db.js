const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: "172.27.17.136",
    dialect: "mysql",
    port: 3306,
    logging: false
  }
);

module.exports = sequelize;
