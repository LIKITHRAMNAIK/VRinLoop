const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generateMonthlyStatement = async (
  user,
  transactions
) => {
  const filePath = path.join(
    __dirname,
    `../temp/${user._id}-statement.pdf`
  );

  const doc = new PDFDocument({
    margin: 30,
    size: "A4",
  });

  doc.pipe(
    fs.createWriteStream(filePath)
  );

  doc.fontSize(20);
  doc.text("VRinLoop Monthly Statement");

  doc.moveDown();

  doc.text(
    `Generated: ${new Date().toLocaleDateString(
      "en-GB"
    )}`
  );

  doc.text(`User: ${user.name}`);

  doc.end();

  return filePath;
};

module.exports = {
  generateMonthlyStatement,
};