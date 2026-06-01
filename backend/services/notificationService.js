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

    await sendMail(email, subject, html);

    return true;
  } catch (error) {
    console.log("Notification Error:", error.message);

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

const sendLoanCompletedEmail = async (user, tx) => {
  return sendNotificationEmail({
    email: user.email,

    subject: "🎉 Loan Completed",

    title: "Loan Completed",

    content: `
  <b>
  ${tx.person_name}
  (${getDirection(tx)})
</b>

  <p>
    Principal Amount:
    ₹${Number(tx.principal_amount).toLocaleString("en-IN")}
  </p>

  <p>
    Total Interest:
    ₹${Number(tx.base_interest).toLocaleString("en-IN")}
  </p>

  <p>
    Total Loan Value:
    ₹${(
      Number(tx.principal_amount || 0) + Number(tx.base_interest || 0)
    ).toLocaleString("en-IN")}
  </p>

  <hr/>

  <p>
    Total EMI:
    ${tx.loan_duration}
  </p>

  <p>
    EMI Amount:
    ₹${Number(tx.emi_amount).toLocaleString("en-IN")}
  </p>

  <p>
    Completed EMI:
    ${tx.completed_emi}
  </p>

  <p>
    Loan Closed Successfully
  </p>

  <p>
    Completed On:
    ${formatDate(tx.paid_date)}
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
  sendRotationCompletedEmail,
  sendRotationExtendedEmail,
  sendLoanEmiPaymentEmail,
  sendLoanCompletedEmail,
};
