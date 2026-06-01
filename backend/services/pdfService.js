const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const generateMonthlyStatement = async (user, transactions) => {
  const tempDir = path.join(__dirname, "../temp");

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const filePath = path.join(tempDir, `${user._id}-statement.pdf`);

  const doc = new PDFDocument({
    margin: 20,
    size: "A4",
    layout: "landscape",
  });

  doc.pipe(fs.createWriteStream(filePath));

  const totalTransactions = transactions.length;

  const activeTransactions = transactions.filter(
    (tx) => tx.status !== "paid",
  ).length;

  const paidTransactions = transactions.filter(
    (tx) => tx.status === "paid",
  ).length;

  const loans = transactions.filter(
    (tx) => tx.transaction_type === "loan",
  ).length;

  const normalTransactions = transactions.filter(
    (tx) => tx.transaction_type === "normal",
  );

  const rotationTransactions = transactions.filter(
    (tx) => tx.transaction_type === "rotation",
  );

  const loanTransactions = transactions.filter(
    (tx) => tx.transaction_type === "loan",
  );

  doc.fontSize(20);

  doc.text("VRinLoop Monthly Financial Statement", {
    align: "center",
  });

  doc.moveDown();

  doc.fontSize(12);

  doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`);

  doc.text(`User: ${user.name}`);

  doc.moveDown();

  doc.fontSize(18);

  doc.text("SUMMARY", 40, 120);

  const boxY = 180;
  const boxWidth = 170;
  const boxHeight = 100;
  const summaryGap = 20;

  const summaryCards = [
    {
      title: "Total Transactions",
      value: totalTransactions,
    },
    {
      title: "Active",
      value: activeTransactions,
    },
    {
      title: "Paid",
      value: paidTransactions,
    },
    {
      title: "Loans",
      value: loans,
    },
  ];

  summaryCards.forEach((card, index) => {
    const x = 40 + index * (boxWidth + summaryGap);

    doc.rect(x, boxY, boxWidth, boxHeight).stroke();

    doc.fontSize(12);

    doc.text(card.title, x + 15, boxY + 20);

    doc.fontSize(28);

    doc.text(String(card.value), x + 15, boxY + 50);
  });

  doc.fontSize(18);

  doc.text("BREAKDOWN", 40, 350);

  doc.fontSize(14);

  doc.text(`Normal Payments: ${normalTransactions.length}`, 60, 400);

  doc.text(`Rotation Payments: ${rotationTransactions.length}`, 60, 430);

  doc.text(`Loan Accounts: ${loanTransactions.length}`, 60, 460);

  doc.moveDown();

  doc.addPage();

  doc.fontSize(16);
  doc.text("NORMAL PAYMENTS");

  doc.moveDown();

  let startX = 20;
  let startY = doc.y;

  const cardWidth = 250;
  const cardHeight = 220;
  const cardGap = 15;
  let currentPage = 0;

  normalTransactions.forEach((tx, index) => {
    const cardsPerPage = 6;

    const page = Math.floor(index / cardsPerPage);

    const pageIndex = index % cardsPerPage;

    if (page > currentPage) {
      doc.addPage();

      currentPage = page;

      startY = 30;
    }

    const col = pageIndex % 3;

    const row = Math.floor(pageIndex / 3);

    let cardX = startX + col * (cardWidth + cardGap);

    let cardY = startY + row * (cardHeight + cardGap);

    doc.rect(cardX, cardY, cardWidth, cardHeight).stroke();

    doc.rect(cardX, cardY, cardWidth, 25).fillAndStroke("#EAEAEA", "#000000");

    doc.fillColor("black");

    doc.fontSize(13);

    doc.fontSize(10);

    doc.text(`${tx.person_name}`, cardX + 10, cardY + 7);

    const totalAmount = Number(tx.principal_amount || 0);

    const paidAmount =
      tx.status === "paid" ? totalAmount : Number(tx.paid_amount || 0);

    const balanceAmount = Math.max(totalAmount - paidAmount, 0);

    doc.fontSize(12);

    doc.fontSize(11);

    doc.text(`Stage: Original`, cardX + 10, cardY + 35);

    doc.text(
      `Principal: Rs. ${totalAmount.toLocaleString("en-IN")}`,
      cardX + 10,
      cardY + 50,
    );

    doc.text(
      `Paid: Rs. ${paidAmount.toLocaleString("en-IN")}`,
      cardX + 10,
      cardY + 65,
    );

    doc.text(
      `Balance: Rs. ${balanceAmount.toLocaleString("en-IN")}`,
      cardX + 10,
      cardY + 80,
    );

    doc.text(
      `Installments: ${
        tx.installments?.filter((i) => Number(i.amount) > 0).length || 0
      }`,
      cardX + 10,
      cardY + 95,
    );

    doc.text(`Status: ${tx.status?.toUpperCase()}`, cardX + 10, cardY + 110);

    doc.text(
      `Start: ${
        tx.start_date
          ? new Date(tx.start_date).toLocaleDateString("en-GB")
          : "-"
      }`,
      cardX + 10,
      cardY + 125,
    );

    doc.text(
      `Due: ${
        tx.due_date ? new Date(tx.due_date).toLocaleDateString("en-GB") : "-"
      }`,
      cardX + 10,
      cardY + 140,
    );

    let paymentY = cardY + 155;

    tx.installments
      ?.filter((i) => Number(i.amount) > 0)
      .forEach((inst, index) => {
        doc.text(
          `Payment ${index + 1}: Rs. ${Number(inst.amount).toLocaleString(
            "en-IN",
          )} (${new Date(inst.date).toLocaleDateString("en-GB")})`,
          cardX + 10,
          paymentY,
        );

        paymentY += 18;
      });
  });

  doc.addPage();

  doc.fontSize(16);
  doc.text("ROTATION PAYMENTS");

  doc.moveDown();

  let currentRotationPage = 0;

  let rotationStartX = 20;
  let rotationStartY = doc.y;

  const rotationCardWidth = 250;
  const rotationCardHeight = 220;
  const rotationGap = 15;

  rotationTransactions.forEach((tx, index) => {
    const cardsPerPage = 6;

    const page = Math.floor(index / cardsPerPage);

    const pageIndex = index % cardsPerPage;

    if (page > currentRotationPage) {
      doc.addPage();

      currentRotationPage = page;

      rotationStartY = 30;
    }

    const col = pageIndex % 3;

    const row = Math.floor(pageIndex / 3);

    const cardX = rotationStartX + col * (rotationCardWidth + rotationGap);

    const cardY = rotationStartY + row * (rotationCardHeight + rotationGap);

    let totalInterest = Number(tx.base_interest || 0);

    tx.extensions?.forEach((ext) => {
      if (!ext.interest_paid) {
        totalInterest += Number(ext.extra_interest || 0);
      }
    });

    const finalTotal = Number(tx.principal_amount || 0) + totalInterest;

    doc.rect(cardX, cardY, rotationCardWidth, rotationCardHeight).stroke();

    doc
      .rect(cardX, cardY, rotationCardWidth, 25)
      .fillAndStroke("#EAEAEA", "#000000");

    doc.fillColor("black");

    doc.fontSize(11);

    doc.text(
      `${tx.person_name} (${tx.type?.toUpperCase()})`,
      cardX + 10,
      cardY + 7,
    );

    doc.text(
      `Principal: Rs. ${Number(tx.principal_amount).toLocaleString("en-IN")}`,
      cardX + 10,
      cardY + 35,
    );

    doc.text(
      `Base Interest: Rs. ${Number(tx.base_interest || 0).toLocaleString(
        "en-IN",
      )}`,
      cardX + 10,
      cardY + 50,
    );

    doc.text(
      `Total Interest: Rs. ${totalInterest.toLocaleString("en-IN")}`,
      cardX + 10,
      cardY + 65,
    );

    doc.text(
      `Final Total: Rs. ${finalTotal.toLocaleString("en-IN")}`,
      cardX + 10,
      cardY + 80,
    );

    doc.text(
      `Extensions: ${tx.extensions?.length || 0}`,
      cardX + 10,
      cardY + 95,
    );

    doc.text(`Status: ${tx.status?.toUpperCase()}`, cardX + 10, cardY + 110);

    doc.text(
      `Due: ${
        tx.due_date ? new Date(tx.due_date).toLocaleDateString("en-GB") : "-"
      }`,
      cardX + 10,
      cardY + 125,
    );
    let extensionY = cardY + 145;

    tx.extensions?.forEach((ext, extIndex) => {
      doc.fontSize(9);

      doc.text(
        `Ext ${extIndex + 1}: Rs. ${Number(
          ext.extra_interest || 0,
        ).toLocaleString("en-IN")}`,
        cardX + 10,
        extensionY,
      );

      extensionY += 15;

      doc.text(
        ext.interest_paid ? "Interest Paid" : "Interest Not Paid",
        cardX + 10,
        extensionY,
      );

      extensionY += 15;
    });
  });

  doc.addPage();

  doc.fontSize(16);
  doc.text("LOAN STATEMENTS");

  doc.moveDown();

  let currentLoanPage = 0;

  let loanStartX = 20;
  let loanStartY = doc.y;

  const loanCardWidth = 250;
  const loanCardHeight = 320;
  const loanGap = 15;

  loanTransactions.forEach((tx, index) => {
    const cardsPerPage = 3;

    const page = Math.floor(index / cardsPerPage);

    const pageIndex = index % cardsPerPage;

    if (page > currentLoanPage) {
      doc.addPage();

      currentLoanPage = page;

      loanStartY = 30;
    }

    const col = pageIndex % 3;

    const row = Math.floor(pageIndex / 3);

    const cardX = loanStartX + col * (loanCardWidth + loanGap);

    const cardY = loanStartY + row * (loanCardHeight + loanGap);

    const totalLoanValue =
      Number(tx.emi_amount || 0) * Number(tx.loan_duration || 0);

    doc.rect(cardX, cardY, loanCardWidth, loanCardHeight).stroke();

    doc
      .rect(cardX, cardY, loanCardWidth, 25)
      .fillAndStroke("#EAEAEA", "#000000");

    doc.fillColor("black");

    doc.fontSize(10);

    doc.text(
      `${tx.person_name} (${tx.type?.toUpperCase()})`,
      cardX + 10,
      cardY + 7,
    );

    doc.fontSize(9);

    doc.text(
      `Loan Amount: Rs. ${Number(tx.principal_amount || 0).toLocaleString(
        "en-IN",
      )}`,
      cardX + 10,
      cardY + 35,
    );

    doc.text(
      `EMI Amount: Rs. ${Number(tx.emi_amount || 0).toLocaleString("en-IN")}`,
      cardX + 10,
      cardY + 50,
    );

    doc.text(
      `Duration: ${tx.loan_duration || 0} Months`,
      cardX + 10,
      cardY + 65,
    );

    doc.text(`Completed EMI: ${tx.completed_emi || 0}`, cardX + 10, cardY + 80);

    doc.text(`Remaining EMI: ${tx.remaining_emi || 0}`, cardX + 10, cardY + 95);

    doc.text(
      `Total Value: Rs. ${totalLoanValue.toLocaleString("en-IN")}`,
      cardX + 10,
      cardY + 110,
    );

    doc.text(`Status: ${tx.status?.toUpperCase()}`, cardX + 10, cardY + 125);

    doc.text(
      `Due: ${
        tx.due_date ? new Date(tx.due_date).toLocaleDateString("en-GB") : "-"
      }`,
      cardX + 10,
      cardY + 140,
    );

    let emiY = cardY + 160;

    tx.emi_history?.slice(0, 4).forEach((emi, emiIndex) => {
      doc.fontSize(8);

      doc.text(
        `EMI ${emiIndex + 1}: Rs. ${Number(emi.amount || 0).toLocaleString(
          "en-IN",
        )}`,
        cardX + 10,
        emiY,
      );

      emiY += 12;

      doc.text(
        `${emi.status?.toUpperCase()} | Penalty: Rs. ${Number(
          emi.penalty_amount || 0,
        ).toLocaleString("en-IN")}`,
        cardX + 10,
        emiY,
      );

      emiY += 15;
    });
  });

  doc.end();

  return filePath;
};

module.exports = {
  generateMonthlyStatement,
};
