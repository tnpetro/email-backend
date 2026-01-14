const { DataTypes } = require("sequelize");
const sequelize = require("../database/db");

const Request = sequelize.define("Request", {
  initiatorName: DataTypes.STRING,
  employeeType: DataTypes.STRING,
  department: DataTypes.STRING,
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  designation: DataTypes.STRING,
  emailRequired: DataTypes.STRING,

  functionalHead: { type: DataTypes.STRING, defaultValue: "Pending" },
  hr: { type: DataTypes.STRING, defaultValue: "Pending" },
  it: { type: DataTypes.STRING, defaultValue: "Pending" },
  functionalRemarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  hrRemarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  itRemarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  itApproval: {
    type: DataTypes.JSON,
    allowNull: true
  },
  status: { type: DataTypes.STRING, defaultValue: "Pending" }
});

module.exports = Request;
