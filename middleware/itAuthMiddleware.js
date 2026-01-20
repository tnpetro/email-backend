const crypto = require("crypto");
const activeSessions = new Map();

const SESSION_DURATION = 10 * 60 * 1000;


function generateSessionKey() {
  return crypto.randomBytes(32).toString("hex");
}

function itAuthMiddleware(req, res, next) {
  if (req.method === "OPTIONS") {
    return next();
  }
  const sessionKey = req.headers["x-it-session"];

  if (!sessionKey) {
    return res.status(401).json({
      message: "Unauthorized: No session key"
    });
  }

  const expiry = activeSessions.get(sessionKey);

  if (!expiry) {
    return res.status(401).json({
      message: "Unauthorized: Invalid session"
    });
  }

  if (Date.now() > expiry) {
    activeSessions.delete(sessionKey);
    return res.status(401).json({
      message: "Session expired"
    });
  }

  next();
}

module.exports = {
  itAuthMiddleware,
  generateSessionKey,
  activeSessions,
  SESSION_DURATION
};
