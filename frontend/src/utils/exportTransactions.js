import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportLoanCSV = (
  loans
) => {

  let csv =
  'Name,EMI Info,Stage,Type,Amount,Penalty,Balance,Due Date,Paid Date\n';

  loans.forEach((loan) => {

    const paidAmount =
      Number(
        loan.completed_emi || 0
      ) *
      Number(
        loan.emi_amount || 0
      );

    const remainingAmount =
      Number(
        loan.remaining_emi || 0
      ) *
      Number(
        loan.emi_amount || 0
      );

    csv += `${loan.person_name},${loan.emi_amount},${loan.completed_emi},${loan.remaining_emi},${loan.loan_amount || loan.principal_amount},${paidAmount},${remainingAmount},${loan.status}\n

`;

    let runningBalance =
  Number(
    loan.emi_amount || 0
  ) *

  (
    Number(loan.completed_emi || 0) +
    Number(loan.remaining_emi || 0)
  );

(
  loan.loan_history ||
  loan.emi_history ||
  loan.emiHistory ||
  []
).forEach((history, i) => {

  const emiAmount =
    Number(
      history.amount ||
      loan.emi_amount ||
      0
    );

  runningBalance =
    runningBalance - emiAmount;

  if (runningBalance < 0) {
    runningBalance = 0;
  }

  const emiDueDate = new Date(
    loan.start_date
  );

  emiDueDate.setMonth(
    emiDueDate.getMonth() + i
  );

  csv += `${
    i === 0
      ? `${loan.person_name}-${loan.principal_amount}`
      : loan.person_name
  },₹${loan.emi_amount} x ${String(
    (
      Number(loan.completed_emi || 0) +
      Number(loan.remaining_emi || 0)
    ) - i
  ).padStart(2, '0')} ${
    (
      (
        Number(loan.completed_emi || 0) +
        Number(loan.remaining_emi || 0)
      ) - i
    ) === 1
      ? 'Month'
      : 'Months'
  },EMI #${i + 1},${
    history.date &&
    loan.due_date &&
    new Date(history.date) <
      new Date(loan.due_date)
      ? 'ADVANCE PAYMENT'
      : history.is_late
      ? 'LATE PAYMENT'
      : history.payment_type || 'PAID'
  },${emiAmount},${history.penalty || 0},${runningBalance},${emiDueDate.toLocaleDateString(
    'en-GB'
  )},${
    history.date ||
    history.paid_date ||
    history.payment_date
      ? new Date(
          history.date ||
          history.paid_date ||
          history.payment_date
        ).toLocaleDateString(
          'en-GB'
        )
      : '-'
  }\n`;

});
csv += '\n';

});

  const blob = new Blob(
    [csv],
    {
      type: 'text/csv;charset=utf-8;'
    }
  );

  const url =
    window.URL.createObjectURL(blob);

  const link =
    document.createElement('a');

  link.href = url;

  link.download =
    'loan-statements.csv';

  link.click();

};

export const exportLoanPDF = (loans) => {
  const doc = new jsPDF('landscape');

  doc.setFontSize(18);
  doc.text('Loan Statement Report', 14, 15);

  doc.setFontSize(10);
  doc.text(
    `Generated On: ${new Date().toLocaleDateString('en-GB')}`,
    14,
    22
  );

  let startY = 30;

  // Track all rows across all loans globally for autoTable
  const rows = [];

  loans.forEach((loan) => {
    const paidAmount = Number(loan.completed_emi || 0) * Number(loan.emi_amount || 0);
    const remainingAmount = Number(loan.remaining_emi || 0) * Number(loan.emi_amount || 0);

    let runningBalance = Number(loan.emi_amount || 0) * (Number(loan.completed_emi || 0) + Number(loan.remaining_emi || 0));

    // Append the Loan Summary row
    rows.push([
      `${loan.person_name}-${loan.loan_amount || loan.principal_amount}`,
      `₹${loan.emi_amount} x ${Number(loan.completed_emi || 0) + Number(loan.remaining_emi || 0)} Months`,
      'LOAN SUMMARY',
      loan.status?.toUpperCase() || 'ACTIVE',
      `₹${Number(loan.emi_amount || 0) * (Number(loan.completed_emi || 0) + Number(loan.remaining_emi || 0))}`,
      '0',
      `₹${Number(loan.emi_amount || 0) * (Number(loan.completed_emi || 0) + Number(loan.remaining_emi || 0))}`,
      loan.due_date ? new Date(loan.due_date).toLocaleDateString('en-GB') : '-',
      '-'
    ]);

    // Space separator row
    rows.push(['', '', '', '', '', '', '', '', '']);

    // Loop through individual EMI history elements
    (loan.loan_history || loan.emi_history || loan.emiHistory || []).forEach((history, i) => {
      const emiAmount = Number(history.amount || loan.emi_amount || 0);
      runningBalance = runningBalance - emiAmount;

      if (runningBalance < 0) {
        runningBalance = 0;
      }

      rows.push([
        i === 0 ? `${loan.person_name}-${loan.loan_amount || loan.principal_amount}` : loan.person_name,
        `₹${loan.emi_amount} x ${String((Number(loan.completed_emi || 0) + Number(loan.remaining_emi || 0)) - i).padStart(2, '0')} Months`,
        `EMI #${i + 1}`,
        history.payment_type || (history.is_advance ? 'ADVANCE' : history.is_late ? 'LATE' : 'PAID'),
        emiAmount,
        history.penalty || 0,
        `₹${runningBalance}`,
        (() => {
          const emiDueDate = new Date(loan.start_date);
          emiDueDate.setMonth(emiDueDate.getMonth() + i);
          return emiDueDate.toLocaleDateString('en-GB');
        })(),
        history.date || history.paid_date || history.payment_date
          ? new Date(history.date || history.paid_date || history.payment_date).toLocaleDateString('en-GB')
          : '-'
      ]);
    });

    // Final spacer for this specific loan profile loop context
    rows.push(['', '', '', '', '', '', '', '', '']);
    
    // Optional: If you want specific loan header context metadata printed on page directly
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`Loan Holder: ${loan.person_name}`, 14, startY);

    doc.setFontSize(10);
    doc.text(`Principal Amount: ₹${loan.loan_amount || loan.principal_amount}`, 14, startY + 7);
    doc.text(`EMI Plan: ₹${loan.emi_amount} x ${Number(loan.completed_emi || 0) + Number(loan.remaining_emi || 0)} Months`, 90, startY + 7);
    doc.text(`Loan Status: ${loan.status?.toUpperCase() || 'ACTIVE'}`, 200, startY + 7);
    
    startY += 14; // Push table start position down below header texts dynamically
  });

  // Now draw the autotable containing your compiled row datasets cleanly outside loops
  autoTable(doc, {
    startY: startY,
    theme: 'grid',
    head: [[
      'Name',
      'EMI Info',
      'Stage',
      'Type',
      'Amount',
      'Penalty',
      'Balance',
      'Due Date',
      'Paid Date'
    ]],
    body: rows,
    styles: {
      fontSize: 8,
      cellPadding: 2
    },
    didParseCell: function (data) {
      if (data.row.raw && data.row.raw[2] === 'LOAN SUMMARY') {
        data.cell.styles.fillColor = [219, 234, 254];
        data.cell.styles.textColor = [30, 41, 59];
        data.cell.styles.fontStyle = 'bold';
      }
      data.cell.styles.valign = 'middle';
    }
  });

  doc.save('loan-statements.pdf');
};
export const exportTransactionsCSV = (
  transactions,
  type = 'all'
) => {

  let csv =
    'Name,Type,Stage,Principal,Start,Due,Interest,Total,Paid,Balance,Paid Date,Installments,Status\n';

  transactions.forEach((tx) => {

    const isRotation =
      tx.transaction_type === 'rotation';

    const isLoan =
      tx.transaction_type === 'loan';

    let totalInterest = 0;

    if (isRotation) {

      totalInterest =
        tx.base_interest || 0;

      tx.extensions?.forEach((ext) => {

        totalInterest +=
          ext.extra_interest || 0;

      });

    }

    const totalAmount =
      Number(tx.principal_amount || 0) +
      Number(totalInterest || 0);

    let runningPaid = 0;

    csv += `${tx.person_name} - ${
      isLoan
        ? 'Loan'
        : isRotation
        ? 'Rotation'
        : 'Normal'
    },`;

    csv += `${tx.type || '-'},`;

    csv += `Original,`;

    csv += `${tx.principal_amount || 0},`;

    csv += `${
      tx.start_date
        ? new Date(
            tx.start_date
          ).toLocaleDateString('en-GB')
        : '-'
    },`;

    csv += `${
      tx.due_date
        ? new Date(
            tx.due_date
          ).toLocaleDateString('en-GB')
        : '-'
    },`;

    csv += `${totalInterest},`;

    csv += `${totalAmount},`;

    csv += `${tx.paid_amount || 0},`;

    csv += `${
      totalAmount -
      Number(tx.paid_amount || 0)
    },`;

    csv += `${
      tx.paid_date
        ? new Date(
            tx.paid_date
          ).toLocaleDateString('en-GB')
        : '-'
    },`;

    csv += `${tx.installments?.filter(
  inst => Number(inst.amount) > 0
).length || 0},`;

    csv += `${tx.status || 'pending'}\n`;

    tx.installments
?.filter(inst => Number(inst.amount) > 0)
.forEach((inst, i) => {

      runningPaid += Number(inst.amount);

      csv += `,,Payment ${i + 1},,,,,,`;

      csv += `${inst.amount},`;

      csv += `${
        Math.max(
  totalAmount - runningPaid,
  0
)
      },`;

      csv += `${
        inst.date
          ? new Date(
              inst.date
            ).toLocaleDateString('en-GB')
          : '-'
      },`;

      csv += `₹${inst.amount},`;

      csv += `${
        runningPaid >= totalAmount
          ? 'paid'
          : 'partial'
      }\n`;

    });

    tx.extensions?.forEach((ext, i) => {

      csv += `,,Extension ${i + 1},,,,,`;

      csv += `${ext.extra_interest || 0},`;

      csv += `${
        Number(tx.principal_amount || 0) +
Number(tx.base_interest || 0) +
tx.extensions
  .slice(0, i + 1)
  .reduce(
    (sum, ex) =>
      sum + Number(ex.extra_interest || 0),
    0
  )
      },,,,`;

      csv += `${
        ext.paid_last_interest
          ? 'Interest Paid'
          : 'Interest Pending'
      }\n`;

    });

    csv += '\n';

  });
  

  const blob = new Blob(
    [csv],
    {
      type: 'text/csv;charset=utf-8;'
    }
  );

  const url =
    window.URL.createObjectURL(blob);

  const link =
    document.createElement('a');

  link.href = url;

  link.download =
    `${type}-transactions.csv`;

  link.click();

};

export const exportTransactionsPDF = (
  transactions,
  type = 'all'
) => {

  const doc = new jsPDF(
    'landscape'
  );

  const rows = [];

  transactions.forEach((tx) => {

    const isRotation =
      tx.transaction_type === 'rotation';

    const isLoan =
      tx.transaction_type === 'loan';

    let totalInterest = 0;

    if (isRotation) {

      totalInterest =
        tx.base_interest || 0;

      tx.extensions?.forEach((ext) => {

        totalInterest +=
          ext.extra_interest || 0;

      });

    }

    const totalAmount =
      Number(tx.principal_amount || 0) +
      Number(totalInterest || 0);

    let runningPaid = 0;

    rows.push([

      `${tx.person_name} - ${
        isLoan
          ? 'Loan'
          : isRotation
          ? 'Rotation'
          : 'Normal'
      }`,

      tx.type || '-',

      'Original',

      tx.principal_amount || 0,

      tx.start_date
        ? new Date(
            tx.start_date
          ).toLocaleDateString('en-GB')
        : '-',

      tx.due_date
        ? new Date(
            tx.due_date
          ).toLocaleDateString('en-GB')
        : '-',

      totalInterest,

      totalAmount,

      tx.status === 'paid'
  ? totalAmount
  : (tx.paid_amount || 0),

      tx.status === 'paid'
  ? 0
  : Math.max(
      totalAmount -
      Number(tx.paid_amount || 0),
      0
    ),

      tx.paid_date
        ? new Date(
            tx.paid_date
          ).toLocaleDateString('en-GB')
        : '-',

      tx.installments?.length || 0,

      tx.status || 'pending'

    ]);

    tx.installments
?.filter(inst => Number(inst.amount) > 0)
.forEach((inst, i) => {

      runningPaid += Number(inst.amount);

      rows.push([

        '',
        '',
        `Payment ${i + 1}`,
        '',
        '',
        '',
        '',
        '',

        inst.amount,

        Math.max(
  totalAmount - runningPaid,
  0
),

        inst.date
          ? new Date(
              inst.date
            ).toLocaleDateString('en-GB')
          : '-',

        `Rs.${inst.amount}`,

        runningPaid >= totalAmount
          ? 'paid'
          : 'partial'

      ]);

    });

    tx.extensions?.forEach((ext, i) => {

      rows.push([

        '',
        '',
        `Extension ${i + 1}`,
        '',
        '',
        '',

        ext.extra_interest || 0,

        Number(tx.principal_amount || 0) +
Number(tx.base_interest || 0) +
tx.extensions
  .slice(0, i + 1)
  .reduce(
    (sum, ex) =>
      sum + Number(ex.extra_interest || 0),
    0
  ),

        '',
        '',
        '',
        '',

        ext.paid_last_interest
          ? 'Interest Paid'
          : 'Interest Pending'

      ]);

    });

    rows.push([
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  ''
]);

});

autoTable(doc, {

    startY: 20,

    head: [[
      'Name',
      'Type',
      'Stage',
      'Principal',
      'Start',
      'Due',
      'Interest',
      'Total',
      'Paid',
      'Balance',
      'Paid Date',
      'Installments',
      'Status'
    ]],

    body: rows,

    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak'
    },

    columnStyles: {
      0: { cellWidth: 35 },
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
      12: { cellWidth: 20 }
    },

    didParseCell: function (data) {

        if (
  data.row.raw &&
  data.row.raw[2] === 'LOAN SUMMARY'
) {

  data.cell.styles.fillColor =
    [219, 234, 254];

  data.cell.styles.textColor =
    [30, 41, 59];

  data.cell.styles.fontStyle =
    'bold';

}

  data.cell.styles.valign =
    'middle';

  if (
    data.column.index === 3 &&
    data.cell.raw
  ) {

    const value =
      String(
        data.cell.raw
      ).toUpperCase();

    if (value.includes('PAID')) {

      data.cell.styles.textColor =
        [22, 163, 74];

    }

    if (
      value.includes('ADVANCE')
    ) {

      data.cell.styles.textColor =
        [37, 99, 235];

    }

    if (
      value.includes('LATE')
    ) {

      data.cell.styles.textColor =
        [220, 38, 38];

    }

  }

}

  });

  doc.save(
    `${type}-transactions.pdf`
  );

};