const router = require("express").Router();
const { requestController } = require("../controllers/request-controller")

router.post("/", requestController);

module.exports = router;