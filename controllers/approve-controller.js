const { ApprovalToken, Request } = require("../models");
const { Op } = require("sequelize");
const createToken = require("../token");
const sendMail = require("../mailer");

const getApproveController = async (req, res) => {
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
}

const postApproveController = async (req, res) => {
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
}

module.exports = { getApproveController, postApproveController };