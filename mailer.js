const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.TNPETRO_EMAIL,
    pass: process.env.APP_PASSWORD
  }
});

module.exports = async (to, subject, html) => {
  await transporter.sendMail({
    from: process.env.TNPETRO_EMAIL,
    to,
    subject,
    html
  });
};
