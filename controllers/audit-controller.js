const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const { Request } = require("../models");


const auditReportController = async (req, res) => {
  try {
    const data = await Request.findAll({
      order: [["createdAt", "DESC"]]
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate audit report" });
  }
}

const auditReportExcelController = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Audit Report");

    sheet.columns = [
      { header: "Request ID", key: "id", width: 12 },
      { header: "Initiator", key: "initiatorName", width: 20 },
      { header: "Employee Code", key: "employeeType", width: 15 },
      { header: "Department", key: "department", width: 15 },
      { header: "Employee Name", key: "employeeName", width: 25 },
      { header: "Designation", key: "designation", width: 20 },
      { header: "Email Requested", key: "emailRequired", width: 30 },

      { header: "Functional Approval", key: "functionalHead", width: 18 },
      { header: "Functional Remarks", key: "functionalRemarks", width: 25 },

      { header: "HR Approval", key: "hr", width: 15 },
      { header: "HR Remarks", key: "hrRemarks", width: 25 },

      { header: "IT Approval", key: "it", width: 15 },
      { header: "IT Authorization Level", key: "itAuth", width: 20 },
      { header: "IT Account Status", key: "itStatus", width: 18 },
      { header: "IT Remarks", key: "itRemarks", width: 25 },

      { header: "Final Status", key: "status", width: 15 },
      { header: "Requested On", key: "createdAt", width: 22 },
      { header: "Last Updated", key: "updatedAt", width: 22 }
    ];

    const requests = await Request.findAll({
      order: [["createdAt", "DESC"]]
    });

    requests.forEach(r => {
      sheet.addRow({
        id: r.id,
        initiatorName: r.initiatorName,
        employeeType: r.employeeType,
        department: r.department,
        employeeName: `${r.firstName} ${r.lastName}`,
        designation: r.designation,
        emailRequired: r.emailRequired,

        functionalHead: r.functionalHead,
        functionalRemarks: r.functionalRemarks || "",

        hr: r.hr,
        hrRemarks: r.hrRemarks || "",

        it: r.it,
        itAuth: r.itApproval?.authorizationLevel || "",
        itStatus: r.itApproval?.status || "",
        itRemarks: r.itRemarks || "",

        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=audit-report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate Excel report" });
  }
}

const auditReportPDFController = async (req, res) => {
  try {
    const requests = await Request.findAll({
      order: [["createdAt", "DESC"]]
    });

    const doc = new PDFDocument({ margin: 30, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=audit-report.pdf"
    );

    doc.pipe(res);

    doc.fontSize(18).text("Audit Report", { align: "center" });
    doc.moveDown();

    requests.forEach(r => {
      doc
        .fontSize(10)
        .text(`Request ID: ${r.id}`)
        .text(`Employee: ${r.firstName} ${r.lastName}`)
        .text(`Department: ${r.department}`)
        .text(`Email: ${r.emailRequired}`)
        .text(`Functional: ${r.functionalHead}`)
        .text(`Functional Remarks: ${r.functionalRemarks || "-"}`)
        .text(`HR: ${r.hr}`)
        .text(`HR Remarks: ${r.hrRemarks || "-"}`)
        .text(`IT: ${r.it}`)
        .text(`IT Auth Level: ${r.itApproval?.authorizationLevel || "-"}`)
        .text(`IT Status: ${r.itApproval?.status || "-"}`)
        .text(`IT Remarks: ${r.itRemarks || "-"}`)
        .text(`Final Status: ${r.status}`)
        .text(`Requested On: ${r.createdAt}`)
        .moveDown()
        .moveDown();
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate PDF report" });
  }
}

module.exports = { auditReportController, auditReportExcelController, auditReportPDFController };