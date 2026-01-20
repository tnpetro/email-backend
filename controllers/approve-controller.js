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
          "Email ID Creation Request – Rejected by IT",
          `
          <p>Dear Team,</p>

          <p>The Email ID Creation request has been <strong>reviewed and rejected by IT</strong>.</p>

          <p>
            <strong>Employee Name:</strong> ${request.firstName} ${request.lastName}<br/>
            <strong>Employee Type:</strong> ${request.employeeType}
          </p>

          <p>
            <strong>Remarks:</strong><br/>
            ${remarks || "No remarks provided"}
          </p>

          <p>No further action will be taken on this request.</p>

          <p>Regards,<br/>
          <strong>TPL IT Service Portal</strong></p>
          `
        );


        return res.json({ message: "IT rejected. Workflow stopped." });
      }

      request.it = "Approved";
      request.status = "Approved";
      await request.save();

      await sendMail(
        process.env.IT_EMAIL,
        "Email ID Creation Request – Approved",
        `
        <p>Dear Team,</p>

        <p>The Email ID Creation request has been <strong>successfully approved</strong> by the IT department.</p>

        <p>
        <strong>Employee Name:</strong> ${request.firstName} ${request.lastName}<br/>
        <strong>Employee Type:</strong> ${request.employeeType}
        </p>

        <p>Please proceed with the necessary account creation activities as per policy.</p>

        <p>Regards,<br/>
        <strong>TPL IT Service Portal</strong></p>
        `
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

      if (approvalToken.role === "functional") {
        request.functionalHead = "Rejected";
        request.hr = "Cancelled";
        request.it = "Cancelled";
      }

      if (approvalToken.role === "hr") {
        request.hr = "Rejected";
        request.it = "Cancelled";
      }

      if (approvalToken.role === "it") {
        request.it = "Rejected";
      }

      await ApprovalToken.update(
        { used: true },
        { where: { RequestId: request.id } }
      );

      await request.save();

      await sendMail(
        process.env.IT_EMAIL,
        "Email ID Creation Request – Rejected",
        `
        <p>Dear Team,</p>

        <p>
          The Email ID Creation request has been <strong>rejected</strong> by the
          <strong>${approvalToken.role.toUpperCase()}</strong> department.
        </p>

        <p>
          <strong>Employee Name:</strong> ${request.firstName} ${request.lastName}<br/>
          <strong>Employee Type:</strong> ${request.employeeType}
        </p>

        <p>
          <strong>Remarks:</strong><br/>
          ${remarks || "No remarks provided"}
        </p>

        <p>The approval workflow has been terminated.</p>

        <p>Regards,<br/>
        <strong>TPL IT Service Portal</strong></p>
        `
      );


      return res.json({
        message: "Request rejected. Workflow terminated."
      });
    }



    if (approvalToken.role === "functional") {
      request.functionalHead = "Approved";

      const next = createToken("hr");
      await ApprovalToken.create({ ...next, RequestId: request.id });

      await sendMail(
        process.env.HR_EMAIL,
        "Action Required: Email ID Creation Request – HR Approval",
        `
        <p>Dear HR Team,</p>

        <p>An Email ID Creation request has been <strong>approved by the Functional Head</strong> and now requires your review.</p>

        <p>
          <strong>Employee Name:</strong> ${request.employeeName}<br/>
          <strong>Employee Type:</strong> ${request.employeeType}
        </p>
        <p>
          <strong>Action Required:</strong><br/>
          Please review and approve or reject the request using the link below.
        </p>

        <p>
          <a href="${process.env.FRONTEND_URL}/approve/${id}/${next.token}">
            Click here to review the request
          </a>
        </p>

      <p>Regards,<br/>
      <strong>TPL IT Service Portal</strong></p>
      `
      );

    }

    if (approvalToken.role === "hr") {
      request.hr = "Approved";

      const next = createToken("it");
      await ApprovalToken.create({ ...next, RequestId: request.id });

      await sendMail(
        process.env.IT_EMAIL,
        "Action Required: Email ID Creation Request – IT Approval",
        `
          <p>Dear IT Team,</p>

          <p>An Email ID Creation request has been <strong>approved by HR</strong> and is pending your action.</p>

          <p>
            <strong>Employee Name:</strong> ${request.employeeName}<br/>
            <strong>Employee Type:</strong> ${request.employeeType}
           </p>

          <p>
            <strong>Action Required:</strong><br/>
            Please review the request and complete the IT approval process.
          </p>

          <p>
            <a href="${process.env.FRONTEND_URL}/approve/${id}/${next.token}">
              Click here to access the IT approval page
            </a>
          </p>

          <p>Regards,<br/>
          <strong>TPL IT Service Portal</strong></p>
      `
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