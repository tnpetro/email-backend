const { ApprovalToken } = require("../models");
const Request = require("../models/Request");
const createToken = require("../token");
const sendMail = require("../mailer");

const requestController = async (req, res) => {
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
      "Action Required: Email ID Creation Request – Functional Head Approval",
      `
        <p>Dear Functional Head,</p>

        <p>
          An <strong>Email ID Creation</strong> request has been submitted and requires your review and decision.
        </p>

      <p>
        <strong>Employee Name:</strong> ${request.firstName} ${request.lastName}<br/>
        <strong>Employee Type:</strong> ${request.employeeType}
      </p>

        <p>
          <strong>Action Required:</strong><br/>
          Please click the link below to approve or reject the request.
        </p>

        <p>
          <a href="${approvalLink}">
            Review Email ID Creation Request
          </a>
        </p>

        <p>
          Kindly complete the action at the earliest to avoid delays in processing.
        </p>

        <p>Regards,<br/>
        <strong>TPL IT Service Portal</strong></p>
        `
    );


    res.json({ message: "Request submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit request" });
  }
}

module.exports = { requestController };