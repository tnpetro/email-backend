const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const { Op } = require("sequelize");

const { sequelize, Request, ApprovalToken } = require("./models");
const sendMail = require("./mailer");
const createToken = require("./token");

const app = express();
app.use(cors());
app.use(express.json());

sequelize.sync({ alter: true })
  .then(() => console.log("MySQL connected"))
  .catch(err => console.error(err));

app.post("/api/request", async (req, res) => {
  try {
    const request = await Request.create(req.body);

    const token = createToken("functional");
    await ApprovalToken.create({
      ...token,
      RequestId: request.id
    });

    const approvalLink = `${process.env.FRONTEND_URL}/approve/${request.id}/${token.token}`;

    await sendMail(
      process.env.FUNCTIONAL_HEAD_EMAIL,
      "Approval Required – Email ID Creation",
      `<p><a href="${approvalLink}">Click here to approve or reject</a></p>`
    );

    res.json({ message: "Request submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit request" });
  }
});

app.get("/api/approve/:id/:token", async (req, res) => {
  const { id, token } = req.params;

  const approvalToken = await ApprovalToken.findOne({
    where: {
      token,
      used: false,
      expiresAt: { [Op.gt]: new Date() }
    },
    include: Request
  });

  if (!approvalToken) {
    return res.status(403).json({ message: "Invalid or expired link" });
  }

  res.json({
    role: approvalToken.role,
    request: approvalToken.Request
  });
});

app.post("/api/approve/:id/:token", async (req, res) => {
  try {
    const { id, token } = req.params;

    const approvalToken = await ApprovalToken.findOne({
      where: {
        token,
        used: false,
        expiresAt: { [Op.gt]: new Date() }
      },
      include: Request
    });

    if (!approvalToken) {
      return res.status(403).json({ message: "Invalid or used approval link" });
    }

    const request = approvalToken.Request;

    if (request.status === "Rejected") {
      return res.status(403).json({ message: "Approval flow already stopped" });
    }

    if (req.body.role === "it") {
      const { approved, authorizationLevel, status, remarks } = req.body;

      if (!approved || !authorizationLevel || !status) {
        return res.status(400).json({ message: "Incomplete IT approval data" });
      }

      request.itApproval = {
        approved,
        authorizationLevel,
        status,
        remarks,
        approvedAt: new Date()
      };

      request.itRemarks = remarks || null;

      approvalToken.used = true;
      await approvalToken.save();

      if (approved === "no") {
        request.status = "Rejected";
        request.it = "Rejected";

        await ApprovalToken.update(
          { used: true },
          { where: { RequestId: request.id } }
        );

        await request.save();

        await sendMail(
          process.env.IT_EMAIL,
          "Email ID Creation – Rejected",
          `<p>Request rejected by IT</p><p>Remarks: ${remarks || "None"}</p>`
        );

        return res.json({ message: "IT rejected. Workflow stopped." });
      }

      request.it = "Approved";
      request.status = "Approved";
      await request.save();

      await sendMail(
        process.env.IT_EMAIL,
        "Email ID Creation – Approved",
        `<p>Email ID request approved successfully.</p>`
      );

      return res.json({ message: "IT approval completed" });
    }

    const { decision, remarks } = req.body;

    if (!decision) {
      return res.status(400).json({ message: "Decision is required" });
    }

    approvalToken.used = true;
    await approvalToken.save();

    if (approvalToken.role === "functional") {
      request.functionalRemarks = remarks || null;
    }

    if (approvalToken.role === "hr") {
      request.hrRemarks = remarks || null;
    }

    if (decision === "reject") {
      request.status = "Rejected";
      request[approvalToken.role] = "Rejected";

      await ApprovalToken.update(
        { used: true },
        { where: { RequestId: request.id } }
      );

      await request.save();

      let rejectionRemarks = remarks || "None";

      await sendMail(
        process.env.IT_EMAIL,
        "Email ID Creation – Rejected",
        `<p>Request rejected by ${approvalToken.role.toUpperCase()}</p><p>Remarks: ${rejectionRemarks}</p>`
      );

      return res.json({ message: "Request rejected. Workflow terminated." });
    }

    if (approvalToken.role === "functional") {
      request.functionalHead = "Approved";

      const next = createToken("hr");
      await ApprovalToken.create({ ...next, RequestId: request.id });

      await sendMail(
        process.env.HR_EMAIL,
        "Approval Required – HR Review",
        `<p><a href="${process.env.FRONTEND_URL}/approve/${id}/${next.token}">HR Approval Link</a></p>`
      );
    }

    if (approvalToken.role === "hr") {
      request.hr = "Approved";

      const next = createToken("it");
      await ApprovalToken.create({ ...next, RequestId: request.id });

      await sendMail(
        process.env.IT_EMAIL,
        "Approval Required – IT Action",
        `<p><a href="${process.env.FRONTEND_URL}/approve/${id}/${next.token}">IT Approval Link</a></p>`
      );
    }

    await request.save();
    res.json({ message: "Approval recorded successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(5005, () =>
  console.log("Backend running on http://localhost:5005")
);
