const express = require("express");
const router = express.Router();
const { itAuthMiddleware } = require("../middleware/itAuthMiddleware");
const {loginController, logoutController, statsController} = require("../controllers/it-controller");

router.post("/login", loginController);
router.post("/logout", logoutController);


module.exports = router;


