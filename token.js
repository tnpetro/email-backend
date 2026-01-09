const crypto = require("crypto");

module.exports = (role) => {
  return {
    token: crypto.randomBytes(32).toString("hex"),
    role,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    used: false
  };
};
