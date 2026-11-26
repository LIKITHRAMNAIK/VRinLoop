const sendMail = require("../utils/sendMail");
const formatDate = (date) => {
  return new Date(date)
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, "-");
};
const getDirection = (tx) => {
  return tx.type === "incoming" ? "IN" : "OUT";
};

const sendNotificationEmail = async ({ email, subject, title, content }) => {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; padding:20px;">
        <h2 style="color:#2563eb;">
          ${title}
        </h2>

        <div style="font-size:14px; line-height:1.7;">
          ${content}
        </div>

        <br/>

        <p style="margin-top:20px;">
  Regards,
  <br/>
  <b>VRinLoop Team</b>
  <br/>
  Smart Financial Management Platform
</p>
      </div>
    `;

        const emailSent = await sendMail(email, subject, html);

    return emailSent === true;
  } catch (error) {
    console.error("Notification Error:", error.message);

    return false;
  }
};
const buildPaymentContent = async (transactions) => {
  let content = "";

  transactions.forEach((tx) => {
    const overdueDays = Math.floor(
      (new Date() - new Date(tx.due_date)) / (1000 * 60 * 60 * 24),
    );

    const overdueBadge =
      overdueDays > 0
        ? `
      <span
        style="
          color:#dc2626;
          font-weight:bold;
          margin-left:10px;
        "
      >
        🔴 Overdue By
        ${overdueDays}
        Day${overdueDays > 1 ? "s" : ""}
      </span>
    `
        : "";

    // NORMAL BLOCK

    if (tx.transaction_type === "normal") {
      // your normal code
      const remaining =
        Number(tx.principal_amount || 0) - Number(tx.paid_amount || 0);

      content += `
        <div style="margin-bottom:20px;">
          <h3>💰 Normal Payment</h3>

          <p>
  <b
    style="
      font-size:16px;
    "
  >
    ${tx.person_name}
    (${getDirection(tx)})
  </b>

  ${overdueBadge}
</p>


          <p>
Principal:
₹${Number(tx.principal_amount || 0).toLocaleString("en-IN")}
</p>

<p>
Paid:
₹${Number(tx.paid_amount || 0).toLocaleString("en-IN")}
</p>

<p>
Remaining:
₹${Number(remaining || 0).toLocaleString("en-IN")}
</p>

<p>
Due Date:
${formatDate(tx.due_date)}
</p>
        </div>
        <hr/>
      `;
    }

    // ROTATION BLOCK

    if (tx.transaction_type === "rotation") {
      let totalInterest = Number(tx.base_interest || 0);

      let addedInterest = 0;

      tx.extensions?.forEach((ext) => {
        if (ext.interest_paid) {
          totalInterest = Number(ext.extra_interest || 0);

          addedInterest = Number(ext.extra_interest || 0);
        } else {
          totalInterest += Number(ext.extra_interest || 0);

          addedInterest += Number(ext.extra_interest || 0);
        }
      });

      const finalTotal = Number(tx.principal_amount || 0) + totalInterest;

      const latestDueDate =
        tx.extensions?.length > 0
          ? tx.extensions[tx.extensions.length - 1].new_due_date
          : tx.due_date;

      content += `
    <div style="margin-bottom:20px;">

      <h3>🔄 Rotation Payment</h3>

      <p>
  <b
    style="
      font-size:16px;
    "
  >
    ${tx.person_name}
(${getDirection(tx)})
  </b>

  ${overdueBadge}
</p>

      <p>
        Principal:
        ₹${Number(tx.principal_amount).toLocaleString("en-IN")}
      </p>

      <p>
        Base Interest:
        ₹${Number(tx.base_interest).toLocaleString("en-IN")}
      </p>

      <p>
        Extensions:
        ${tx.extensions?.length || 0}
      </p>

      <p>
        Added Interest:
        ₹${addedInterest.toLocaleString("en-IN")}
      </p>

      <p>
        Total Interest:
        ₹${totalInterest.toLocaleString("en-IN")}
      </p>

      <p>
        Final Total:
        ₹${finalTotal.toLocaleString("en-IN")}
      </p>

      <p>
        Due Date:
${formatDate(latestDueDate)}
      </p>

    </div>

    <hr/>
  `;
    }

    // LOAN BLOCK

    if (tx.transaction_type === "loan") {
      content += `
    <div style="margin-bottom:20px;">
      <h3>🏦 Loan EMI</h3>

      <p>
  <b
    style="
      font-size:16px;
    "
  >
    ${tx.person_name}
(${getDirection(tx)})
  </b>

  ${overdueBadge}
</p>

      <p>
EMI Amount:
₹${Number(tx.emi_amount || 0).toLocaleString("en-IN")}
</p>

<p>
Remaining EMI:
${Number(tx.remaining_emi || 0).toLocaleString("en-IN")}
</p>

<p>
Completed EMI:
${Number(tx.completed_emi || 0).toLocaleString("en-IN")}
</p>

<p>
Due Date:
${formatDate(tx.due_date)}
</p>
    </div>
    <hr/>
  `;
    }
  });

  return content;
};

const sendDueTomorrowEmail = async (user, transactions) => {
  const content = await buildPaymentContent(transactions);

  return sendNotificationEmail({
    email: user.email,

    subject: "📅 Payments Due Tomorrow",

    title: "Due Tomorrow Reminder",

    content,
  });
};

const sendDueTodayEmail = async (user, transactions) => {
  const content = await buildPaymentContent(transactions);

  return sendNotificationEmail({
    email: user.email,

    subject: "🚨 Payments Due Today",

    title: "Payments Due Today",

    content,
  });
};

const sendOverdueEmail = async (user, transactions) => {
  const warning = `
    <div
      style="
        background:#fee2e2;
        padding:12px;
        border-radius:8px;
        border:1px solid #ef4444;
        margin-bottom:20px;
      "
    >
      <b>
        ⚠ Action Required
      </b>

      <br/><br/>

      One or more payments are overdue.
    </div>
  `;

  const content = warning + (await buildPaymentContent(transactions));

  return sendNotificationEmail({
    email: user.email,

    subject: "🔴 Overdue Payments Reminder",

    title: "Overdue Payments",

    content,
  });
};

const sendWeeklyUpcomingEmail = async (user, transactions) => {
  const content = await buildPaymentContent(transactions);

  return sendNotificationEmail({
    email: user.email,

    subject: "📅 Upcoming Payments This Week",

    title: "Upcoming Payments (Next 7 Days)",

    content,
  });
};

const sendInstallmentPaymentEmail = async (user, tx, installmentAmount) => {
  const installmentNumber = tx.installments.filter(
    (i) => Number(i.amount) > 0,
  ).length;

  const remaining = Number(tx.principal_amount) - Number(tx.paid_amount);

  return sendNotificationEmail({
    email: user.email,

    subject: "💰 Installment Payment Recorded",

    title: "Installment Payment Recorded",

    content: `
        <p>
  <b>
    ${tx.person_name}
    (${getDirection(tx)})
  </b>
</p>

        <p>
  Payments Recorded:
  ${installmentNumber}
</p>

        <p>
          Amount Paid:
          ₹${Number(installmentAmount).toLocaleString("en-IN")}
        </p>

        <p>
          Total Paid:
          ₹${Number(tx.paid_amount).toLocaleString("en-IN")}
        </p>

        <p>
          Remaining:
          ₹${remaining.toLocaleString("en-IN")}
        </p>

        <p>
          Payment Date:
          ${formatDate(new Date())}
        </p>
      `,
  });
};

const sendNormalCompletedEmail = async (
  user,
  tx,
  finalPaymentAmount
) => {
  const installmentNumber = tx.installments.filter(
    (i) => Number(i.amount) > 0
  ).length;

  const remaining = Math.max(
    0,
    Number(tx.principal_amount) - Number(tx.paid_amount)
  );

  return sendNotificationEmail({
    email: user.email,

    subject: "✅ Normal Payment Completed",

    title: "Normal Payment Completed",

    content: `
      <p>
        <b>
          ${tx.person_name}
          (${getDirection(tx)})
        </b>
      </p>

      <p>
        Principal Amount:
        ₹${Number(tx.principal_amount).toLocaleString("en-IN")}
      </p>

      <p>
        Payments Recorded:
        ${installmentNumber}
      </p>

      <p>
        Final Payment:
        ₹${Number(finalPaymentAmount).toLocaleString("en-IN")}
      </p>

      <p>
        Total Paid:
        ₹${Number(tx.paid_amount).toLocaleString("en-IN")}
      </p>

      <p>
        Remaining:
        ₹${remaining.toLocaleString("en-IN")}
      </p>

      <p>
        Status:
        <b style="color: green;">Fully Paid</b>
      </p>

      <p>
        Completed On:
        ${formatDate(tx.paid_date)}
      </p>
    `,
  });
};

const sendRotationCompletedEmail = async (
  user,
  tx,
  totalInterest,
  finalTotal,
) => {
  let addedInterest = 0;

  tx.final_extensions?.forEach((ext) => {
    addedInterest += Number(ext.extra_interest || 0);
  });

  return sendNotificationEmail({
    email: user.email,

    subject: "✅ Rotation Payment Completed",

    title: "Rotation Payment Completed",

    content: `
        <b>
  ${tx.person_name}
  (${getDirection(tx)})
</b>

        <p>
          Principal:
          ₹${Number(tx.principal_amount).toLocaleString("en-IN")}
        </p>

        <p>
          Base Interest:
          ₹${Number(tx.base_interest).toLocaleString("en-IN")}
        </p>

        <p>
          Extensions:
          ${tx.final_extensions?.length || 0}
        </p>

        <p>
          Added Interest:
          ₹${addedInterest.toLocaleString("en-IN")}
        </p>

        <p>
          Total Interest:
          ₹${totalInterest.toLocaleString("en-IN")}
        </p>

        <p>
          Final Total:
          ₹${finalTotal.toLocaleString("en-IN")}
        </p>

        <p>
          Completed On:
          ${formatDate(tx.paid_date)}
        </p>
      `,
  });
};

const sendRotationExtendedEmail = async (
  user,
  tx,
  extension,
  totalInterest,
  finalTotal,
) => {
  return sendNotificationEmail({
    email: user.email,

    subject: "🔄 Rotation Payment Extended",

    title: "Rotation Payment Extended",

    content: `
        <b>
  ${tx.person_name}
  (${getDirection(tx)})
</b>

        <p>
          Old Due Date:
          ${formatDate(extension.old_due_date)}
        </p>

        <p>
          New Due Date:
          ${formatDate(extension.new_due_date)}
        </p>

        <p>
          Additional Interest:
          ₹${Number(extension.extra_interest).toLocaleString("en-IN")}
        </p>

        <p>
          Last Interest Paid:
          ${extension.interest_paid ? "Yes" : "No"}
        </p>

        <p>
          Updated Total Interest:
          ₹${totalInterest.toLocaleString("en-IN")}
        </p>

        <p>
          Updated Total Amount:
          ₹${finalTotal.toLocaleString("en-IN")}
        </p>
      `,
  });
};

const sendLoanEmiPaymentEmail = async (user, tx, emiCount, paidAmount) => {
  return sendNotificationEmail({
    email: user.email,

    subject: "🏦 EMI Payment Recorded",

    title: "EMI Payment Recorded",

    content: `
        <b>
  ${tx.person_name}
  (${getDirection(tx)})
</b>

        <p>
          EMIs Paid This Time:
          ${emiCount}
        </p>

        <p>
          EMI Amount:
          ₹${Number(tx.emi_amount).toLocaleString("en-IN")}
        </p>

        <p>
          Paid This Time:
          ₹${Number(paidAmount).toLocaleString("en-IN")}
        </p>

        <p>
          Completed EMI:
          ${tx.completed_emi}
        </p>

        <p>
          Remaining EMI:
          ${tx.remaining_emi}
        </p>

        <p>
          Payment Date:
          ${formatDate(new Date())}
        </p>

        <p>
  Next Due Date:
  ${formatDate(tx.due_date)}
</p>
      `,
  });
};

const sendLoanCreatedEmail = async (user, tx, loanMode) => {
  const principal = Number(tx.principal_amount || 0);
  const interest = Number(tx.base_interest || 0);
  const totalLoan = principal + interest;

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]);

  return sendNotificationEmail({
    email: user.email,

    subject: "📋 Loan Creation Confirmation",

    title: "Loan Creation Confirmation",

    content: `
      <p>
        A loan has been successfully added to your VRinLoop account.
      </p>

      <p>
        <b>
          ${escapeHtml(tx.person_name)}
          (${getDirection(tx)})
        </b>
      </p>

      <p>
        Loan Entry Type:
        ${loanMode === "existing" ? "Existing Loan" : "New Loan"}
      </p>

      <hr/>

      <p>
        Principal Amount:
        ₹${principal.toLocaleString("en-IN")}
      </p>

      <p>
        Interest Type:
        ${escapeHtml(tx.interest_type)}
      </p>

      <p>
        Total Interest:
        ₹${interest.toLocaleString("en-IN")}
      </p>

      <p>
        Total Loan Value:
        ₹${totalLoan.toLocaleString("en-IN")}
      </p>

      <hr/>

      <p>
        Loan Duration:
        ${tx.loan_duration} Months
      </p>

      <p>
        Monthly EMI:
        ₹${Number(tx.emi_amount).toLocaleString("en-IN")}
      </p>

      <p>
        Completed EMIs:
        ${tx.completed_emi}
      </p>

      <p>
        Remaining EMIs:
        ${tx.remaining_emi}
      </p>

      <hr/>

      <p>
        Loan Start Date:
        ${formatDate(tx.start_date)}
      </p>

      <p>
        Next EMI Due Date:
        ${
          tx.status === "paid"
            ? "Not Applicable"
            : tx.due_date
              ? formatDate(tx.due_date)
              : "Not Available"
        }
      </p>

      <p>
        Added On:
        ${formatDate(tx.createdAt || new Date())}
      </p>

      <p>
        Loan Status:
        <b style="color: green;">
          ${tx.status === "paid" ? "Fully Paid" : "Active"}
        </b>
      </p>

      <hr/>

      <p>
        Please review the above loan details carefully.
        If you did not add this loan, please secure
        your VRinLoop account immediately.
      </p>
    `,
  });
};

const sendLoanCompletedEmail = async (user, tx) => {
  const principal = Number(tx.principal_amount || 0);
  const interest = Number(tx.base_interest || 0);
  const totalLoan = principal + interest;

  const emiHistory = [...(tx.emi_history || [])].sort(
    (a, b) => Number(a.month_number) - Number(b.month_number)
  );

  const totalPaid = emiHistory.reduce(
    (sum, emi) => sum + Number(emi.amount || 0),
    0
  );

  const money = (amount) =>
    Number(amount || 0).toLocaleString("en-IN");

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]);

  const historyRows = emiHistory.map((emi, index) => {
    let status = "Paid";
    let statusColor = "#15803d";

    if (emi.status === "late") {
      status = `Late (${Number(emi.late_days || 0)} days)`;
      statusColor = "#dc2626";
    } else if (emi.status === "advance") {
      status = "Advance";
      statusColor = "#2563eb";
    }

    return `
      <tr style="background:${index % 2 === 0 ? "#ffffff" : "#f8fafc"};">
        <td style="padding:10px;border:1px solid #ddd;">
          ${Number(emi.month_number)}
        </td>

        <td style="padding:10px;border:1px solid #ddd;">
          ${emi.paid_date ? formatDate(emi.paid_date) : "Not Recorded"}
        </td>

        <td style="padding:10px;border:1px solid #ddd;">
          ₹${money(emi.amount)}
        </td>

        <td style="padding:10px;border:1px solid #ddd;color:${statusColor};">
          ${status}
        </td>
      </tr>
    `;
  }).join("");

  const historyWarning =
    emiHistory.length !== Number(tx.completed_emi)
      ? `<p style="color:#b45309;">
          Note: Some EMI history records may be missing.
          The table shows available payment records only.
        </p>`
      : "";

  return sendNotificationEmail({
    email: user.email,

    subject: "🎉 Loan Completed - Final Loan Statement",

    title: "Loan Closure Statement",

    content: `
      <div style="
        background:#f0fdf4;
        border:1px solid #bbf7d0;
        border-radius:10px;
        padding:20px;
        text-align:center;
      ">
        <h2 style="color:#15803d;margin:0;">
          ✓ Loan Successfully Closed
        </h2>

        <p>All EMIs have been completed.</p>
      </div>

      <h3>Loan Summary</h3>

      <p>
        <b>
          ${escapeHtml(tx.person_name)}
          (${getDirection(tx)})
        </b>
      </p>

      <p>Principal Amount: ₹${money(principal)}</p>

      <p>Total Interest: ₹${money(interest)}</p>

      <p>Total Loan Value: ₹${money(totalLoan)}</p>

      <p>Loan Duration: ${tx.loan_duration} Months</p>

      <p>Monthly EMI: ₹${money(tx.emi_amount)}</p>

      <p>
        Completed EMIs:
        ${tx.completed_emi}/${tx.loan_duration}
      </p>

      <p>Remaining EMIs: ${tx.remaining_emi}</p>

      <p>
        Loan Start Date:
        ${tx.start_date ? formatDate(tx.start_date) : "Not Recorded"}
      </p>

      <hr/>

      <h3>Complete EMI Payment History</h3>

      ${historyWarning}

      <table style="
        width:100%;
        border-collapse:collapse;
        font-size:13px;
      ">
        <thead>
          <tr style="background:#2563eb;color:white;">
            <th style="padding:10px;">EMI No.</th>
            <th style="padding:10px;">Paid Date</th>
            <th style="padding:10px;">Amount</th>
            <th style="padding:10px;">Status</th>
          </tr>
        </thead>

        <tbody>
          ${
            historyRows ||
            `<tr>
              <td colspan="4" style="padding:10px;">
                No EMI history available.
              </td>
            </tr>`
          }

          <tr style="background:#e8f5e9;font-weight:bold;">
            <td colspan="2" style="padding:12px;">
              Total Recorded EMI Payments
            </td>

            <td colspan="2" style="padding:12px;">
              ₹${money(totalPaid)}
            </td>
          </tr>
        </tbody>
      </table>

      <br/>

      <div style="
        background:#f0fdf4;
        border:1px solid #86efac;
        border-radius:10px;
        padding:20px;
        text-align:center;
      ">
        <p>Total Loan Value Closed</p>

        <h1 style="color:#15803d;margin:5px;">
          ₹${money(totalLoan)}
        </h1>

        <p>Remaining EMIs: ${tx.remaining_emi}</p>

        <h2 style="color:#15803d;">
          LOAN CLOSED
        </h2>

        <p>
          Completed On:
          ${tx.paid_date ? formatDate(tx.paid_date) : "Not Recorded"}
        </p>

        <p>No further EMI payments are pending.</p>
      </div>

      <p>
        Thank you for using VRinLoop.
        Please retain this email for your financial records.
      </p>
    `,
  });
};

module.exports = {
  sendNotificationEmail,
  sendDueTomorrowEmail,
  sendDueTodayEmail,
  sendOverdueEmail,
  sendWeeklyUpcomingEmail,
  sendInstallmentPaymentEmail,
  sendNormalCompletedEmail,
  sendRotationCompletedEmail,
  sendRotationExtendedEmail,
  sendLoanCreatedEmail,
  sendLoanEmiPaymentEmail,
  sendLoanCompletedEmail,
};
