const { ApprovalToken } = require("../models");
const  Request  = require("../models/Request");
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
      "Approval Required – Email ID Creation",
      `<p><a href="${approvalLink}">Click here to approve or reject</a></p>`
    );

    res.json({ message: "Request submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit request" });
  }
}

module.exports = { requestController };