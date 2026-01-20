const express = require("express");
const router = express.Router();
const { itAuthMiddleware } = require("../middleware/itAuthMiddleware");
const { Request } = require("../models");

router.get("/summary", itAuthMiddleware, async (req, res) => {
  const pending = await Request.count({ where: { status: "Pending" } });
  const approved = await Request.count({ where: { status: "Approved" } });
  const rejected = await Request.count({ where: { status: "Rejected" } });

  res.json({ pending, approved, rejected });
});

router.get("/requests", itAuthMiddleware, async (req, res) => {
  const requests = await Request.findAll({
    order: [["createdAt", "DESC"]]
  });

  res.json(requests);
});

module.exports = router;
