const sequelize = require("../db");
const Request = require("./Request");
const ApprovalToken = require("./ApprovalToken");

Request.hasMany(ApprovalToken, { onDelete: "CASCADE" });
ApprovalToken.belongsTo(Request);

module.exports = { sequelize, Request, ApprovalToken };
