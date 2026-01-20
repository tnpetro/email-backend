const router = require("express").Router();
const {auditReportController, auditReportExcelController, auditReportPDFController} = require("../controllers/audit-controller");
const { isAuthMiddleware } = require("../middleware/itAuthMiddleware");

router.get("/", auditReportController);
router.get("/excel", auditReportExcelController);
router.get("/pdf", auditReportPDFController);

module.exports = router;