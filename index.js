const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const app = express();
const cors = require("cors");

const requestRoute = require("./routes/requestRoute");
const approveRoute = require("./routes/approveRoute");
const auditRoute = require("./routes/auditRoute");

const { sequelize } = require("./models");


app.use(cors());
app.use(express.json());

sequelize.sync({ alter: true })
  .then(() => console.log("MySQL connected"))
  .catch(err => console.error(err));

app.use("/api/request", requestRoute);
app.use("/api/approve", approveRoute);
app.use("/api/audit-report", auditRoute);


app.listen(process.env.PORT, '0.0.0.0', () =>
  console.log(`Backend running on http://localhost:${process.env.PORT}`)
);
