const router = require("express").Router();
const { getApproveController, postApproveController} = require("../controllers/approve-controller");

router.get("/:id/:token", getApproveController);
router.post("/:id/:token", postApproveController);

module.exports = router;