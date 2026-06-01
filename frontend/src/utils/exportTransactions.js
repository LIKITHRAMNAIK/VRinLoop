import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportLoanCSV = (loans) => {
  let csv =
    "Name,EMI Info,Stage,Type,Amount,Penalty,Balance,Due Date,Paid Date\n";

  loans.forEach((loan) => {
    const paidAmount =
      Number(loan.completed_emi || 0) * Number(loan.emi_amount || 0);

    const remainingAmount =
      Number(loan.remaining_emi || 0) * Number(loan.emi_amount || 0);

    csv += `${loan.person_name},${loan.emi_amount},${loan.completed_emi},${loan.remaining_emi},${loan.loan_amount || loan.principal_amount},${paidAmount},${remainingAmount},${loan.status}\n

`;

    let runningBalance =
      Number(loan.emi_amount || 0) *
      (Number(loan.completed_emi || 0) + Number(loan.remaining_emi || 0));

    (loan.loan_history || loan.emi_history || loan.emiHistory || []).forEach(
      (history, i) => {
        const emiAmount = Number(history.amount || loan.emi_amount || 0);

        runningBalance = runningBalance - emiAmount;

        if (runningBalance < 0) {
          runningBalance = 0;
        }

        const emiDueDate = new Date(loan.start_date);

        emiDueDate.setMonth(emiDueDate.getMonth() + i);

        csv += `${
          i === 0
            ? `${loan.person_name}-${loan.principal_amount}`
            : loan.person_name
        },₹${loan.emi_amount} x ${String(
          Number(loan.completed_emi || 0) + Number(loan.remaining_emi || 0) - i,
        ).padStart(2, "0")} ${
          Number(loan.completed_emi || 0) +
            Number(loan.remaining_emi || 0) -
            i ===
          1
            ? "Month"
            : "Months"
        },EMI #${i + 1},${
          history.date &&
          loan.due_date &&
          new Date(history.date) < new Date(loan.due_date)
            ? "ADVANCE PAYMENT"
            : history.is_late
              ? "LATE PAYMENT"
              : history.payment_type || "PAID"
        },${emiAmount},${history.penalty || 0},${runningBalance},${emiDueDate.toLocaleDateString(
          "en-GB",
        )},${
          history.date || history.paid_date || history.payment_date
            ? new Date(
                history.date || history.paid_date || history.payment_date,
              ).toLocaleDateString("en-GB")
            : "-"
        }\n`;
      },
    );
    csv += "\n";
  });

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = "loan-statements.csv";

  link.click();
};

export const exportLoanPDF = (loans) => {
  const doc = new jsPDF("landscape");

  doc.setFontSize(18);
  doc.text("Loan Statement Report", 14, 15);

  doc.setFontSize(10);
  doc.text(`Generated On: ${new Date().toLocaleDateString("en-GB")}`, 14, 22);

  let startY = 30;

  // Track all rows across all loans globally for autoTable
  const rows = [];

  loans.forEach((loan) => {
    let runningBalance =
      Number(loan.emi_amount || 0) *
      (Number(loan.completed_emi || 0) + Number(loan.remaining_emi || 0));

    // Append the Loan Summary row
    rows.push([
      `${loan.person_name}-${loan.loan_amount || loan.principal_amount}`,
      `₹${loan.emi_amount} x ${Number(loan.completed_emi || 0) + Number(loan.remaining_emi || 0)} Months`,
      "LOAN SUMMARY",
      loan.status?.toUpperCase() || "ACTIVE",
      `₹${Number(loan.emi_amount || 0) * (Number(loan.completed_emi || 0) + Number(loan.remaining_emi || 0))}`,
      "0",
      `₹${Number(loan.emi_amount || 0) * (Number(loan.completed_emi || 0) + Number(loan.remaining_emi || 0))}`,
      loan.due_date ? new Date(loan.due_date).toLocaleDateString("en-GB") : "-",
      "-",
    ]);

    // Space separator row
    rows.push(["", "", "", "", "", "", "", "", ""]);

    // Loop through individual EMI history elements
    (loan.loan_history || loan.emi_history || loan.emiHistory || []).forEach(
      (history, i) => {
        const emiAmount = Number(history.amount || loan.emi_amount || 0);
        runningBalance = runningBalance - emiAmount;

        if (runningBalance < 0) {
          runningBalance = 0;
        }

        rows.push([
          i === 0
            ? `${loan.person_name}-${loan.loan_amount || loan.principal_amount}`
            : loan.person_name,
          `₹${loan.emi_amount} x ${String(Number(loan.completed_emi || 0) + Number(loan.remaining_emi || 0) - i).padStart(2, "0")} Months`,
          `EMI #${i + 1}`,
          history.payment_type ||
            (history.is_advance
              ? "ADVANCE"
              : history.is_late
                ? "LATE"
                : "PAID"),
          emiAmount,
          history.penalty || 0,
          `₹${runningBalance}`,
          (() => {
            const emiDueDate = new Date(loan.start_date);
            emiDueDate.setMonth(emiDueDate.getMonth() + i);
            return emiDueDate.toLocaleDateString("en-GB");
          })(),
          history.date || history.paid_date || history.payment_date
            ? new Date(
                history.date || history.paid_date || history.payment_date,
              ).toLocaleDateString("en-GB")
            : "-",
        ]);
      },
    );

    // Final spacer for this specific loan profile loop context
    rows.push(["", "", "", "", "", "", "", "", ""]);

    // Optional: If you want specific loan header context metadata printed on page directly
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`Loan Holder: ${loan.person_name}`, 14, startY);

    doc.setFontSize(10);
    doc.text(
      `Principal Amount: ₹${loan.loan_amount || loan.principal_amount}`,
      14,
      startY + 7,
    );
    doc.text(
      `EMI Plan: ₹${loan.emi_amount} x ${Number(loan.completed_emi || 0) + Number(loan.remaining_emi || 0)} Months`,
      90,
      startY + 7,
    );
    doc.text(
      `Loan Status: ${loan.status?.toUpperCase() || "ACTIVE"}`,
      200,
      startY + 7,
    );

    startY += 14; // Push table start position down below header texts dynamically
  });

  // Now draw the autotable containing your compiled row datasets cleanly outside loops
  autoTable(doc, {
    startY,
    theme: "grid",
    head: [
      [
        "Name",
        "EMI Info",
        "Stage",
        "Type",
        "Amount",
        "Penalty",
        "Balance",
        "Due Date",
        "Paid Date",
      ],
    ],
    body: rows,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    didParseCell: function (data) {
      if (data.row.raw && data.row.raw[2] === "LOAN SUMMARY") {
        data.cell.styles.fillColor = [219, 234, 254];
        data.cell.styles.textColor = [30, 41, 59];
        data.cell.styles.fontStyle = "bold";
      }
      data.cell.styles.valign = "middle";
    },
  });

  doc.save("loan-statements.pdf");
};
export const exportTransactionsCSV = (transactions, type = "all") => {
  let csv =
    "Name,Type,Stage,Principal,Start,Due,Interest,Total,Paid,Balance,Paid Date,Installments,Status\n";
  const normalTransactions = transactions.filter(
    (tx) => tx.transaction_type === "normal",
  );

  const rotationTransactions = transactions.filter(
    (tx) => tx.transaction_type === "rotation",
  );
  csv += "\n================ NORMAL PAYMENTS ================\n\n";

  csv +=
    "Name,Type,Stage,Principal,Start,Due,Interest,Total,Paid,Balance,Paid Date,Installments,Status\n";

  normalTransactions.forEach((tx) => {
    const totalAmount = Number(tx.principal_amount || 0);

    const paidAmount =
      tx.status === "paid" ? totalAmount : Number(tx.paid_amount || 0);

    const balanceAmount = Math.max(totalAmount - paidAmount, 0);

    const dueDate = new Date(tx.due_date);

    dueDate.setHours(0, 0, 0, 0);

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const exportStatus =
      tx.status !== "paid" && dueDate < today
        ? "OVERDUE"
        : (tx.status || "PENDING").toUpperCase();

    csv += `${tx.person_name} - Normal,`;

    csv += `${tx.type},`;

    csv += `Original,`;

    csv += `${tx.principal_amount || 0},`;

    csv += `${
      tx.start_date ? new Date(tx.start_date).toLocaleDateString("en-GB") : "-"
    },`;

    csv += `${
      tx.due_date ? new Date(tx.due_date).toLocaleDateString("en-GB") : "-"
    },`;

    csv += `0,`;

    csv += `${totalAmount},`;

    csv += `${paidAmount},`;

    csv += `${balanceAmount},`;

    csv += `${
      tx.paid_date ? new Date(tx.paid_date).toLocaleDateString("en-GB") : "-"
    },`;

    csv += `${
      tx.installments?.filter((inst) => Number(inst.amount) > 0).length || 0
    },`;

    csv += `${exportStatus}\n`;

    let runningPaid = 0;

    tx.installments
      ?.filter((inst) => Number(inst.amount) > 0)
      .forEach((inst, i) => {
        runningPaid += Number(inst.amount);

        csv += `,,Payment ${i + 1},,,,,,`;

        csv += `${inst.amount},`;

        csv += `${Math.max(totalAmount - runningPaid, 0)},`;

        csv += `${
          inst.date ? new Date(inst.date).toLocaleDateString("en-GB") : "-"
        },`;

        csv += `₹${inst.amount},`;

        csv += `${runningPaid >= totalAmount ? "PAID" : "PARTIAL"}\n`;
      });

    csv += "\n";
  });

  csv += "\n=============== ROTATION PAYMENTS ===============\n\n";

  csv +=
    "Name,Type,Stage,Principal,Start,Due,Extended Date,Interest,Total,Paid,Balance,Paid Date,Status\n";

  rotationTransactions.forEach((tx) => {
    let totalInterest = Number(tx.base_interest || 0);

    tx.extensions?.forEach((ext) => {
      if (ext.interest_paid) {
        totalInterest = Number(ext.extra_interest || 0);
      } else {
        totalInterest += Number(ext.extra_interest || 0);
      }
    });

    const totalAmount = Number(tx.principal_amount || 0) + totalInterest;

    const paidAmount =
      tx.status === "paid" ? totalAmount : Number(tx.paid_amount || 0);

    const balanceAmount = Math.max(totalAmount - paidAmount, 0);

    const latestExtension =
      tx.extensions?.length > 0
        ? tx.extensions[tx.extensions.length - 1]
        : null;

    const extendedDate = latestExtension?.new_due_date
      ? new Date(latestExtension.new_due_date).toLocaleDateString("en-GB")
      : "-";

    const dueDate = new Date(tx.due_date);

    dueDate.setHours(0, 0, 0, 0);

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const exportStatus =
      tx.status !== "paid" && tx.status !== "extended" && dueDate < today
        ? "OVERDUE"
        : (tx.status || "PENDING").toUpperCase();

    csv += `${tx.person_name} - Rotation,`;

    csv += `${tx.type},`;

    csv += `Original,`;

    csv += `${tx.principal_amount || 0},`;

    csv += `${
      tx.start_date ? new Date(tx.start_date).toLocaleDateString("en-GB") : "-"
    },`;

    csv += `${
      tx.due_date ? new Date(tx.due_date).toLocaleDateString("en-GB") : "-"
    },`;

    csv += `${extendedDate},`;

    csv += `${totalInterest},`;

    csv += `${totalAmount},`;

    csv += `${paidAmount},`;

    csv += `${balanceAmount},`;

    csv += `${
      tx.paid_date ? new Date(tx.paid_date).toLocaleDateString("en-GB") : "-"
    },`;

    csv += `${exportStatus}\n`;

    tx.extensions?.forEach((ext, i) => {
      csv += `,,Extension ${i + 1},,,,,`;

      csv += `${
        ext.new_due_date
          ? new Date(ext.new_due_date).toLocaleDateString("en-GB")
          : "-"
      },`;

      csv += `${ext.extra_interest || 0},`;

      csv += `${
        Number(tx.principal_amount || 0) +
        Number(tx.base_interest || 0) +
        tx.extensions
          .slice(0, i + 1)
          .reduce((sum, ex) => sum + Number(ex.extra_interest || 0), 0)
      },,,,`;

      csv += `${ext.interest_paid ? "INTEREST PAID" : "INTEREST PENDING"}\n`;
    });

    csv += "\n";
  });

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = `${type}-transactions.csv`;

  link.click();
};

export const exportTransactionsPDF = (transactions, type = "all") => {
  const doc = new jsPDF("landscape");

  const normalTransactions = transactions.filter(
    (tx) => tx.transaction_type === "normal",
  );

  const rotationTransactions = transactions.filter(
    (tx) => tx.transaction_type === "rotation",
  );

  const rows = [];

  rows.push([
    "NORMAL PAYMENTS",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  rows.push([
    "Name",
    "Type",
    "Stage",
    "Principal",
    "Start",
    "Due",
    "Interest",
    "Total",
    "Paid",
    "Balance",
    "Paid Date",
    "Installments",
    "Status",
  ]);

  normalTransactions.forEach((tx) => {
    const totalAmount = Number(tx.principal_amount || 0);

    const paidAmount =
      tx.status === "paid" ? totalAmount : Number(tx.paid_amount || 0);

    const balanceAmount = Math.max(totalAmount - paidAmount, 0);

    const dueDate = new Date(tx.due_date);

    dueDate.setHours(0, 0, 0, 0);

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const exportStatus =
      tx.status !== "paid" && dueDate < today
        ? "OVERDUE"
        : (tx.status || "PENDING").toUpperCase();

    rows.push([
      `${tx.person_name} (${tx.type?.toUpperCase()})`,

      tx.type,

      "Original",

      tx.principal_amount || 0,

      tx.start_date ? new Date(tx.start_date).toLocaleDateString("en-GB") : "-",

      tx.due_date ? new Date(tx.due_date).toLocaleDateString("en-GB") : "-",

      0,

      totalAmount,

      paidAmount,

      balanceAmount,

      tx.paid_date ? new Date(tx.paid_date).toLocaleDateString("en-GB") : "-",

      tx.installments?.filter((inst) => Number(inst.amount) > 0).length || 0,

      exportStatus,
    ]);

    let runningPaid = 0;

    tx.installments
      ?.filter((inst) => Number(inst.amount) > 0)
      .forEach((inst, i) => {
        runningPaid += Number(inst.amount);

        rows.push([
          "",

          "",

          `Payment ${i + 1}`,

          "",

          "",

          "",

          "",

          "",

          inst.amount,

          Math.max(totalAmount - runningPaid, 0),

          inst.date ? new Date(inst.date).toLocaleDateString("en-GB") : "-",

          `₹${inst.amount}`,

          runningPaid >= totalAmount ? "PAID" : "PARTIAL",
        ]);
      });

    rows.push(["", "", "", "", "", "", "", "", "", "", "", "", ""]);
  });

  rows.push([
    "ROTATION PAYMENTS",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  rows.push([
    "Name",
    "Type",
    "Stage",
    "Principal",
    "Start",
    "Due",
    "Extended Date",
    "Interest",
    "Total",
    "Paid",
    "Balance",
    "Paid Date",
    "Status",
  ]);

  rotationTransactions.forEach((tx) => {
    let totalInterest = Number(tx.base_interest || 0);

    tx.extensions?.forEach((ext) => {
      if (ext.interest_paid) {
        totalInterest = Number(ext.extra_interest || 0);
      } else {
        totalInterest += Number(ext.extra_interest || 0);
      }
    });

    const totalAmount = Number(tx.principal_amount || 0) + totalInterest;

    const paidAmount =
      tx.status === "paid" ? totalAmount : Number(tx.paid_amount || 0);

    const balanceAmount = Math.max(totalAmount - paidAmount, 0);

    const latestExtension =
      tx.extensions?.length > 0
        ? tx.extensions[tx.extensions.length - 1]
        : null;

    const extendedDate = latestExtension?.new_due_date
      ? new Date(latestExtension.new_due_date).toLocaleDateString("en-GB")
      : "-";

    const dueDate = new Date(tx.due_date);

    dueDate.setHours(0, 0, 0, 0);

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const exportStatus =
      tx.status !== "paid" && tx.status !== "extended" && dueDate < today
        ? "OVERDUE"
        : (tx.status || "PENDING").toUpperCase();

    rows.push([
      `${tx.person_name} (${tx.type?.toUpperCase()})`,

      tx.type,

      "Original",

      tx.principal_amount || 0,

      tx.start_date ? new Date(tx.start_date).toLocaleDateString("en-GB") : "-",

      tx.due_date ? new Date(tx.due_date).toLocaleDateString("en-GB") : "-",

      extendedDate,

      totalInterest,

      totalAmount,

      paidAmount,

      balanceAmount,

      tx.paid_date ? new Date(tx.paid_date).toLocaleDateString("en-GB") : "-",

      exportStatus,
    ]);

    tx.extensions?.forEach((ext, i) => {
      rows.push([
        "",

        "",

        `Extension ${i + 1}`,

        "",

        "",

        "",

        ext.new_due_date
          ? new Date(ext.new_due_date).toLocaleDateString("en-GB")
          : "-",

        ext.extra_interest || 0,

        Number(tx.principal_amount || 0) +
          Number(tx.base_interest || 0) +
          tx.extensions
            .slice(0, i + 1)
            .reduce((sum, ex) => sum + Number(ex.extra_interest || 0), 0),

        "",

        "",

        "",

        ext.interest_paid ? "INTEREST PAID" : "INTEREST PENDING",
      ]);
    });

    rows.push(["", "", "", "", "", "", "", "", "", "", "", "", ""]);
  });

  autoTable(doc, {
    startY: 20,

    head: [],

    body: rows,

    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: "linebreak",
    },

    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 18 },
      2: { cellWidth: 20 },
      3: { cellWidth: 22 },
      4: { cellWidth: 22 },
      5: { cellWidth: 22 },
      6: { cellWidth: 18 },
      7: { cellWidth: 22 },
      8: { cellWidth: 18 },
      9: { cellWidth: 20 },
      10: { cellWidth: 25 },
      11: { cellWidth: 25 },
      12: { cellWidth: 20 },
    },

    didParseCell: function (data) {
      if (
        data.row.raw &&
        (data.row.raw[0] === "NORMAL PAYMENTS" ||
          data.row.raw[0] === "ROTATION PAYMENTS")
      ) {
        data.cell.styles.fillColor = [15, 23, 42];

        data.cell.styles.textColor = [255, 255, 255];

        data.cell.styles.fontStyle = "bold";
      }

      if (data.row.raw && data.row.raw[2] === "LOAN SUMMARY") {
        data.cell.styles.fillColor = [219, 234, 254];

        data.cell.styles.textColor = [30, 41, 59];

        data.cell.styles.fontStyle = "bold";
      }

      data.cell.styles.valign = "middle";

      if (data.column.index === 3 && data.cell.raw) {
        const value = String(data.cell.raw).toUpperCase();

        if (value.includes("PAID")) {
          data.cell.styles.textColor = [22, 163, 74];
        }

        if (value.includes("ADVANCE")) {
          data.cell.styles.textColor = [37, 99, 235];
        }

        if (value.includes("LATE")) {
          data.cell.styles.textColor = [220, 38, 38];
        }
      }
    },
  });

  doc.save(`${type}-transactions.pdf`);
};
export const exportProfileCSV = (stats) => {
  const rows = [
    ["MMS FINANCIAL REPORT"],

    [],

    ["Metric", "Value"],

    ["Total Users", stats.users],

    ["Transactions", stats.transactions],

    ["Active Incoming", stats.incoming],

    ["Active Outgoing", stats.outgoing],

    ["Paid Incoming", stats.paidIncoming],

    ["Paid Outgoing", stats.paidOutgoing],

    ["Net Profit", stats.totalProfit],

    ["Overdue Cases", stats.overdue],

    ["Total Loans", stats.totalLoans],

    ["Pending Loans", stats.pendingLoans],

    ["Completed Loans", stats.completedLoans],

    ["Recovery Rate", `${stats.recoveryRate}%`],

    ["Loan Success Rate", `${stats.loanSuccessRate}%`],
  ];

  const csvContent = rows.map((row) => row.join(",")).join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = "MMS-Financial-Analytics.csv";

  link.click();
};

export const exportProfilePDF = ({
  users = 0,
  transactions = [],
  incoming = 0,
  outgoing = 0,
  netIncoming = 0,
  netOutgoing = 0,
  overdue = 0,
  loans = [],
}) => {
  const doc = new jsPDF("landscape");

  const today = new Date().toLocaleDateString("en-GB");

  // ================= PAGE 1 =================

  doc.setFillColor(37, 99, 235);

  doc.roundedRect(12, 10, 270, 26, 6, 6, "F");

  doc.setTextColor(255, 255, 255);

  doc.setFontSize(22);

  doc.text("VRinLoop Financial Analytics Report", 18, 26);

  doc.setFontSize(10);

  doc.text(`Generated: ${today}`, 230, 27);

  const totalLoans = loans.length;

  const completedLoans = loans.filter((loan) => loan.status === "paid").length;

  const pendingLoans = loans.filter((loan) => loan.status !== "paid").length;

  const stats = [
    ["Total Users", users],
    ["Transactions", transactions.length],
    ["Active Incoming", `₹${Number(incoming).toLocaleString("en-IN")}`],
    ["Active Outgoing", `₹${Number(outgoing).toLocaleString("en-IN")}`],

    ["Paid Incoming", `₹${Number(netIncoming).toLocaleString("en-IN")}`],
    ["Paid Outgoing", `₹${Number(netOutgoing).toLocaleString("en-IN")}`],

    ["Overdue Cases", overdue],
    [
      "Net Profit",
      `₹${Number(netIncoming - netOutgoing).toLocaleString("en-IN")}`,
    ],

    ["Total Loans", totalLoans],

    ["Loan Status", `Pending: ${pendingLoans}\nCompleted: ${completedLoans}`],
  ];

  let x = 14;
  let y = 50;

  stats.forEach((item, index) => {
    const colors = [
      [59, 130, 246],
      [124, 58, 237],
      [34, 197, 94],
      [239, 68, 68],
      [16, 185, 129],
      [245, 158, 11],
      [220, 38, 38],
      [14, 165, 233],
      [99, 102, 241],
      [15, 23, 42],
    ];

    const color = colors[index % colors.length];

    doc.setFillColor(color[0], color[1], color[2]);

    doc.roundedRect(x, y, 48, 32, 4, 4, "F");

    doc.setTextColor(255, 255, 255);

    doc.setFontSize(9);

    doc.text(item[0], x + 4, y + 9);

    doc.setFontSize(14);

    const valueLines = String(item[1]).split("\n");

    valueLines.forEach((line, i) => {
      doc.text(line, x + 4, y + 22 + i * 7);
    });

    x += 54;

    if (x > 230) {
      x = 14;
      y += 42;
    }
  });

  // ================= PAGE 2 =================

  doc.addPage();

  const normalTransactions = transactions.filter(
    (tx) => tx.transaction_type === "normal",
  );

  const normalRows = [];

  normalRows.push([
    "NORMAL PAYMENTS",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  normalRows.push([
    "Name",
    "Type",
    "Stage",
    "Principal",
    "Start",
    "Due",
    "Interest",
    "Total",
    "Paid",
    "Balance",
    "Paid Date",
    "Installments",
    "Status",
  ]);

  normalTransactions.forEach((tx) => {
    const totalAmount = Number(tx.principal_amount || 0);

    const paidAmount =
      tx.status === "paid" ? totalAmount : Number(tx.paid_amount || 0);

    const balanceAmount = Math.max(totalAmount - paidAmount, 0);

    normalRows.push([
      `${tx.person_name} (${tx.type?.toUpperCase()})`,

      tx.type,

      "Original",

      tx.principal_amount || 0,

      tx.start_date ? new Date(tx.start_date).toLocaleDateString("en-GB") : "-",

      tx.due_date ? new Date(tx.due_date).toLocaleDateString("en-GB") : "-",

      0,

      totalAmount,

      paidAmount,

      balanceAmount,

      tx.paid_date ? new Date(tx.paid_date).toLocaleDateString("en-GB") : "-",

      tx.installments?.length || 0,

      tx.status?.toUpperCase(),
    ]);

    let runningPaid = 0;

    tx.installments
      ?.filter((inst) => Number(inst.amount) > 0)
      .forEach((inst, i) => {
        runningPaid += Number(inst.amount);

        normalRows.push([
          "",
          "",
          `Payment ${i + 1}`,
          "",
          "",
          "",
          "",
          "",
          inst.amount,

          Math.max(totalAmount - runningPaid, 0),

          inst.date ? new Date(inst.date).toLocaleDateString("en-GB") : "-",

          `₹${Number(inst.amount).toLocaleString("en-IN")}`,

          runningPaid >= totalAmount ? "PAID" : "PARTIAL",
        ]);
      });

    normalRows.push(["", "", "", "", "", "", "", "", "", "", "", "", ""]);
  });

  doc.setFillColor(15, 23, 42);

  doc.roundedRect(10, 10, 277, 12, 2, 2, "F");

  doc.setTextColor(255, 255, 255);

  doc.setFontSize(16);

  doc.text("NORMAL PAYMENTS", 16, 18);

  autoTable(doc, {
    startY: 28,

    body: normalRows,

    styles: {
      fontSize: 8,
    },

    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
  });

  // ================= PAGE 3 =================

  doc.addPage();

  const rotationTransactions = transactions.filter(
    (tx) => tx.transaction_type === "rotation",
  );

  const rotationRows = [];

  rotationRows.push([
    "ROTATION PAYMENTS",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  rotationRows.push([
    "Name",
    "Type",
    "Stage",
    "Principal",
    "Start",
    "Due",
    "Extended Date",
    "Interest",
    "Total",
    "Paid",
    "Balance",
    "Paid Date",
    "Status",
  ]);

  rotationTransactions.forEach((tx) => {
    let totalInterest = Number(tx.base_interest || 0);

    tx.extensions?.forEach((ext) => {
      totalInterest += Number(ext.extra_interest || 0);
    });

    const totalAmount = Number(tx.principal_amount || 0) + totalInterest;

    const latestExtension =
      tx.extensions?.length > 0
        ? tx.extensions[tx.extensions.length - 1]
        : null;

    rotationRows.push([
      `${tx.person_name} (${tx.type?.toUpperCase()})`,

      tx.type,

      "Original",

      tx.principal_amount || 0,

      tx.start_date ? new Date(tx.start_date).toLocaleDateString("en-GB") : "-",

      tx.due_date ? new Date(tx.due_date).toLocaleDateString("en-GB") : "-",

      latestExtension?.new_due_date
        ? new Date(latestExtension.new_due_date).toLocaleDateString("en-GB")
        : "-",

      totalInterest,

      totalAmount,

      tx.paid_amount || 0,

      totalAmount - Number(tx.paid_amount || 0),

      tx.paid_date ? new Date(tx.paid_date).toLocaleDateString("en-GB") : "-",

      tx.status?.toUpperCase(),
    ]);

    tx.extensions?.forEach((ext, i) => {
      rotationRows.push([
        "",
        "",
        `Extension ${i + 1}`,
        "",
        "",
        "",

        ext.new_due_date
          ? new Date(ext.new_due_date).toLocaleDateString("en-GB")
          : "-",

        ext.extra_interest || 0,

        "",
        "",
        "",
        "",

        ext.interest_paid ? "INTEREST PAID" : "INTEREST PENDING",
      ]);
    });

    rotationRows.push(["", "", "", "", "", "", "", "", "", "", "", "", ""]);
  });

  doc.setFillColor(124, 58, 237);

  doc.roundedRect(10, 10, 277, 12, 2, 2, "F");

  doc.setTextColor(255, 255, 255);

  doc.setFontSize(16);

  doc.text("ROTATION PAYMENTS", 16, 18);

  autoTable(doc, {
    startY: 28,

    body: rotationRows,

    styles: {
      fontSize: 8,
    },

    headStyles: {
      fillColor: [124, 58, 237],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
  });

  // ================= PAGE 4 =================

  doc.addPage();

  exportLoanPDFToDocument(doc, loans);

  doc.save("VRinLoop-Full-Financial-Report.pdf");
};

const exportLoanPDFToDocument = (doc, loans) => {
  doc.setFillColor(20, 184, 166);

  doc.roundedRect(10, 10, 277, 12, 2, 2, "F");

  doc.setTextColor(255, 255, 255);

  doc.setFontSize(16);

  doc.text("LOAN STATEMENTS", 16, 18);

  doc.setTextColor(0, 0, 0);

  doc.setFontSize(10);

  doc.text(`Generated On: ${new Date().toLocaleDateString("en-GB")}`, 14, 22);

  let startY = 40;

  const rows = [];

  loans.forEach((loan) => {
    doc.setFontSize(14);

    doc.setTextColor(15, 23, 42);

    doc.text(`Loan Holder: ${loan.person_name}`, 14, startY);

    doc.setFontSize(10);

    doc.text(
      `Principal Amount: ₹${loan.loan_amount || loan.principal_amount}`,
      14,
      startY + 7,
    );

    doc.text(
      `EMI Plan: ₹${loan.emi_amount} x ${
        Number(loan.completed_emi || 0) + Number(loan.remaining_emi || 0)
      } Months`,
      90,
      startY + 7,
    );

    doc.text(`Loan Status: ${loan.status?.toUpperCase()}`, 200, startY + 7);

    startY += 14;

    let runningBalance =
      Number(loan.emi_amount || 0) *
      (Number(loan.completed_emi || 0) + Number(loan.remaining_emi || 0));

    rows.push([
      `${loan.person_name}-${loan.loan_amount || loan.principal_amount}`,

      `₹${loan.emi_amount} x ${Number(loan.completed_emi || 0) + Number(loan.remaining_emi || 0)} Months`,

      "LOAN SUMMARY",

      loan.status?.toUpperCase(),

      `₹${runningBalance}`,

      "0",

      `₹${runningBalance}`,

      loan.due_date ? new Date(loan.due_date).toLocaleDateString("en-GB") : "-",

      "-",
    ]);

    rows.push(["", "", "", "", "", "", "", "", ""]);

    (loan.loan_history || loan.emi_history || []).forEach((history, i) => {
      const emiAmount = Number(history.amount || loan.emi_amount || 0);

      runningBalance -= emiAmount;

      rows.push([
        loan.person_name,

        `₹${loan.emi_amount} x ${String(
          Number(loan.completed_emi || 0) + Number(loan.remaining_emi || 0) - i,
        ).padStart(2, "0")} Months`,

        `EMI #${i + 1}`,

        history.payment_type || "PAID",

        emiAmount,

        history.penalty || 0,

        `₹${runningBalance}`,

        (() => {
          const emiDueDate = new Date(loan.start_date);

          emiDueDate.setMonth(emiDueDate.getMonth() + i);

          return emiDueDate.toLocaleDateString("en-GB");
        })(),

        history.date || history.paid_date || history.payment_date
          ? new Date(
              history.date || history.paid_date || history.payment_date,
            ).toLocaleDateString("en-GB")
          : "-",
      ]);
    });
  });

  autoTable(doc, {
    startY,

    head: [
      [
        "Name",
        "EMI Info",
        "Stage",
        "Type",
        "Amount",
        "Penalty",
        "Balance",
        "Due Date",
        "Paid Date",
      ],
    ],

    body: rows,

    styles: {
      fontSize: 8,
    },
    headStyles: {
      fillColor: [20, 184, 166],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
  });
};
