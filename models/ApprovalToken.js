const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ApprovalToken = sequelize.define("ApprovalToken", {
  token: DataTypes.STRING,
  role: DataTypes.STRING,
  expiresAt: DataTypes.DATE,
  used: { type: DataTypes.BOOLEAN, defaultValue: false }
});

module.exports = ApprovalToken;
