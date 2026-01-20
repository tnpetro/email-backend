const { generateSessionKey, activeSessions, SESSION_DURATION } = require("../middleware/itAuthMiddleware");

const IT_EMAIL = process.env.IT_EMAIL;
const IT_PASSWORD = process.env.IT_PASSWORD;

const loginController = (req, res) => {
  const { email, password } = req.body;

  if (email === IT_EMAIL && password === IT_PASSWORD) {
    const sessionKey = generateSessionKey();

    activeSessions.set(
      sessionKey,
      Date.now() + SESSION_DURATION
    );

    return res.json({
      success: true,
      sessionKey,
      expiresIn: SESSION_DURATION
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid IT credentials"
  });
};

const logoutController = (req, res) => {
  const sessionKey = req.headers["x-it-session"];
  activeSessions.delete(sessionKey);
  res.json({ success: true });
};

setInterval(() => {
  const now = Date.now();
  for (const [key, expiry] of activeSessions.entries()) {
    if (now > expiry) {
      activeSessions.delete(key);
    }
  }
}, 60 * 1000); 


module.exports = { loginController, logoutController };
