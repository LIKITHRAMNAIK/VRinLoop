const Transaction = require('../models/Transaction');


exports.extendTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    let { new_due_date, extra_interest, interest_paid } = req.body;

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // ✅ Safe date
    if (!new_due_date) {
      return res.status(400).json({ message: 'New due date required' });
    }

    // ✅ Safe number conversion
    extra_interest = parseFloat(extra_interest);
    if (isNaN(extra_interest)) extra_interest = 0;

    // ✅ Safe boolean
    interest_paid = interest_paid === true || interest_paid === "true";

    // ✅ Push extension safely
    transaction.extensions.push({
      old_due_date: transaction.due_date,
      new_due_date: new Date(new_due_date),
      extra_interest,
      interest_paid,
      date: new Date()
    });

    transaction.due_date = new Date(new_due_date);
    transaction.status = 'extended';

    await transaction.save();

    res.json(transaction);

  } catch (error) {
    console.log("EXTEND ERROR:", error); // 👈 THIS WILL SHOW REAL ERROR
    res.status(500).json({ message: error.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const transactions = await Transaction.find();

    let incoming = 0;
    let outgoing = 0;
    let principal = 0;
    let interest = 0;

    transactions.forEach(tx => {

        // ================= AUTO OVERDUE =================

  if (tx.status !== 'paid') {

    const todayDate = new Date();

    todayDate.setHours(0,0,0,0);

    const dueDate =
      new Date(tx.due_date);

    dueDate.setHours(0,0,0,0);

    if (dueDate < todayDate) {

      tx.status = 'overdue';

    }

  }

  const isActive = tx.status !== 'paid';

  // 🔥 NORMAL (INSTALLMENT)
  if (tx.transaction_type === 'normal') {

    const paid = tx.paid_amount || 0;
    const balance = tx.principal_amount - paid;

    if (balance > 0) {
      principal += balance;

      if (tx.type === 'incoming') {
        incoming += balance;
      } else {
        outgoing += balance;
      }
    }

    return;
  }

  // 🔥 ROTATION / LOAN
  if (isActive) {

    // ================= LOAN =================

if (tx.transaction_type === 'loan') {

  const remainingLoanAmount =
    (tx.remaining_emi || 0) *
    (tx.emi_amount || 0);

  // ONLY active liability
  outgoing += remainingLoanAmount;


  return;
}

// ================= ROTATION =================

let totalInterest =
  Number(tx.base_interest || 0);

tx.extensions?.forEach(ext => {

  if (ext.interest_paid) {

    totalInterest =
      Number(ext.extra_interest || 0);

  } else {

    totalInterest +=
      Number(ext.extra_interest || 0);

  }

});

const finalInterest =

  tx.status === 'paid'

    ? Number(
        tx.final_interest || totalInterest
      )

    : totalInterest;

const total =

  tx.status === 'paid'

    ? Number(
        tx.final_total ||
        (tx.principal_amount + finalInterest)
      )

    : (
        tx.principal_amount +
        finalInterest
      );

    principal += tx.principal_amount;
    interest += totalInterest;

    if (tx.type === 'incoming') {
      incoming += total;
    } else {
      outgoing += total;
    }
  }

});

    res.json({
      incoming,
      outgoing,
      interest,
      principal,
      net: incoming - outgoing
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getByDateRange = async (req, res) => {
  try {
    const { start, end } = req.query;

    const transactions = await Transaction.find({
      due_date: {
        $gte: new Date(start),
        $lte: new Date(end)
      }
    });

    let incoming = 0;
    let outgoing = 0;
    let interest = 0;

    transactions.forEach(tx => {
      let totalInterest = tx.base_interest;

      tx.extensions.forEach(ext => {
        if (ext.interest_paid) {
          totalInterest = ext.extra_interest;
        } else {
          totalInterest += ext.extra_interest;
        }
      });

      const total = tx.principal_amount + totalInterest;

      if (tx.type === 'incoming') {
        incoming += total;
        interest += totalInterest;
      } else {
        outgoing += total;
      }
    });

    res.json({
      incoming,
      outgoing,
      interest,
      net: incoming - outgoing,
      count: transactions.length
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.payLoanEmi = async (req, res) => {

  try {

    const { id } = req.params;

    const tx = await Transaction.findById(id);

    if (!tx) {
      return res.status(404).json({
        message: 'Loan not found'
      });
    }

    // SAFE DEFAULTS
    if (!tx.emi_history) {
      tx.emi_history = [];
    }

    if (tx.completed_emi === undefined) {
      tx.completed_emi = 0;
    }

    if (tx.remaining_emi === undefined) {
      tx.remaining_emi =
        Number(tx.loan_duration || 0);
    }

    // VALIDATION
    if (tx.transaction_type !== 'loan') {
      return res.status(400).json({
        message: 'Not a loan transaction'
      });
    }

    if (tx.remaining_emi <= 0) {
      return res.status(400).json({
        message: 'Loan already completed'
      });
    }

    // EMI HISTORY
        // ================= EMI COUNT =================

    const emiCount =
      Number(req.body.emiCount || 1);

      const penaltyAmount =
  Number(
    req.body.penaltyAmount || 0
  );

    // SAFE LIMIT
    const safeCount = Math.min(
      emiCount,
      tx.remaining_emi
    );

    // ================= EMI LOOP =================

    for (let i = 0; i < safeCount; i++) {

      const currentMonth =
  tx.completed_emi + 1;

      const paidDate =
        new Date();

      // ================= EMI STATUS =================

      const dueDate =
  new Date(tx.start_date);

// actual EMI month
dueDate.setMonth(
  dueDate.getMonth() +
  tx.completed_emi
);

            // ================= EMI STATUS =================

            let emiStatus = 'paid';

      let lateDays = 0;

      const comparePaidDate =
        new Date(paidDate);

      const compareDueDate =
        new Date(dueDate);

      comparePaidDate.setHours(
        0,0,0,0
      );

      compareDueDate.setHours(
        0,0,0,0
      );

      if (
        comparePaidDate >
        compareDueDate
      ) {

        emiStatus = 'late';

        const timeDifference =

  comparePaidDate.getTime() -
  compareDueDate.getTime();

lateDays = Math.round(

  timeDifference /

  (1000 * 60 * 60 * 24)

);

      }

      if (
        comparePaidDate <
        compareDueDate
      ) {
        emiStatus = 'advance';
      }

      // ================= EMI HISTORY =================

            tx.emi_history.push({

  amount: tx.emi_amount,

  month_number: currentMonth,

  paid_date: paidDate,

  status: emiStatus,

  late_days: lateDays,

  penalty_amount:
    penaltyAmount

});

      tx.completed_emi += 1;

      tx.remaining_emi -= 1;

    }

        // ================= NEXT EMI DATE =================

    if (tx.remaining_emi > 0) {

      const currentDueDate =
        new Date(tx.due_date);

      currentDueDate.setMonth(
        currentDueDate.getMonth() +
        safeCount
      );

      tx.due_date = currentDueDate;

    }

    // ================= AUTO COMPLETE =================

    if (tx.remaining_emi <= 0) {

      tx.status = 'paid';

      tx.paid_date = new Date();

    }

    await tx.save();

    res.json(tx);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: error.message
    });

  }

};

exports.markAsPaid = async (req, res) => {

  try {

    const tx = await Transaction.findById(req.params.id);

    if (!tx) {
      return res.status(404).json({
        message: 'Transaction not found'
      });
    }

    // ================= NORMAL PAYMENT =================

    if (tx.transaction_type === 'normal') {

      const amount = Number(req.body.amount || 0);

      tx.paid_amount =
        (tx.paid_amount || 0) + amount;

      tx.installments.push({
        amount,
        date: new Date()
      });

      tx.last_payment_date = new Date();

      if (tx.paid_amount >= tx.principal_amount) {

        tx.status = 'paid';

        tx.paid_date = new Date();

      }

      await tx.save();

      return res.json(tx);

    }

    // ================= ROTATION / LOAN =================

    let totalInterest =
  Number(tx.base_interest || 0);

tx.extensions.forEach(ext => {

  if (ext.interest_paid) {

    totalInterest =
      Number(ext.extra_interest || 0);

  } else {

    totalInterest +=
      Number(ext.extra_interest || 0);

  }

});

// ✅ USE SNAPSHOT FOR PAID
if (tx.status === 'paid') {

  totalInterest =
    tx.final_interest || totalInterest;

}

    // ================= EARLY PAY =================

    if (req.body.earlyPay) {

      tx.early_paid = true;

      tx.early_paid_interest =
        Number(req.body.newInterest || 0);

      totalInterest = tx.early_paid_interest;

    }

    const finalTotal =
      tx.principal_amount + totalInterest;

    tx.status = 'paid';

    tx.paid_date = new Date();

    // 🔥 IMPORTANT SNAPSHOTS

    tx.final_interest = totalInterest;

    tx.final_total = finalTotal;

    tx.final_due_date =

  tx.extensions?.length > 0

    ? tx.extensions[
        tx.extensions.length - 1
      ].new_due_date

    : tx.due_date;

    tx.final_extensions = [...tx.extensions];

    await tx.save();

    res.json(tx);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: 'Server Error'
    });

  }

};

  exports.getByPerson = async (req, res) => {
    try {
      const { name } = req.params;
  
      const transactions = await Transaction.find({
        person_name: { $regex: new RegExp(`^${name}$`, 'i') }
      }).sort({ createdAt: -1 });
  
      let principal = 0;
let interest = 0;
let incoming = 0;   // ✅ ADD
let outgoing = 0;   // ✅ ADD
  
      transactions.forEach(tx => {

        if (tx.status === 'paid') return; // 🔥 ignore paid
      
        let totalInterest = tx.base_interest;

tx.extensions.forEach(ext => {
  if (ext.interest_paid) {
    totalInterest = ext.extra_interest;
  } else {
    totalInterest += ext.extra_interest;
  }
});
      
        const total = tx.principal_amount + totalInterest;
      
        principal += tx.principal_amount;
      
        if (tx.type === 'incoming') {
          incoming += total;
          interest += totalInterest;
        } else {
          outgoing += total;
        }
      });
  
      res.json({
        transactions,
        summary: {
          principal,
          interest,
          net: principal + interest
        }
      });
  
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

  exports.updateTransaction = async (req, res) => {
  try {

    const { id } = req.params;

    const tx = await Transaction.findById(id);

    if (!tx) {
      return res.status(404).json({
        message: 'Transaction not found'
      });
    }

    // 🔥 BASIC UPDATE
    tx.principal_amount =
      req.body.principal_amount;

    tx.start_date =
      req.body.start_date;
    
    tx.loan_duration =
  req.body.loan_duration || tx.loan_duration;

tx.emi_amount =
  req.body.emi_amount || tx.emi_amount;

tx.interest_type =
  req.body.interest_type || tx.interest_type;

    if (
  tx.extensions &&
  tx.extensions.length > 0
) {

  // 🔥 update latest extension date
  tx.extensions[
    tx.extensions.length - 1
  ].new_due_date = req.body.due_date;

  // 🔥 ALSO sync main due_date
  tx.due_date = req.body.due_date;

} else {

  tx.due_date = req.body.due_date;

}

    await tx.save();

    res.json(tx);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: error.message
    });

  }
};
  
  
  exports.deleteTransaction = async (req, res) => {
    try {
      const { id } = req.params;
  
      await Transaction.findByIdAndDelete(id);
  
      res.json({ message: 'Deleted successfully' });
  
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  exports.addTransaction = async (req, res) => {
  try {

    const {
  loan_mode,
  already_paid_months,
  last_paid_date
} = req.body;

let completedEmi = 0;
let remainingEmi = 0;

if (req.body.transaction_type === 'loan') {

  if (loan_mode === 'existing') {

    completedEmi = Number(already_paid_months || 0);

    remainingEmi =
      Number(req.body.loan_duration) -
      completedEmi;

  } else {

    completedEmi = 0;

    remainingEmi =
      Number(req.body.loan_duration);

  }

}

const emiHistory = [];

if (
  req.body.transaction_type === 'loan' &&
  loan_mode === 'existing'
) {

  for (
    let i = 0;
    i < Number(already_paid_months || 0);
    i++
  ) {

    const paidDate = new Date(
      req.body.start_date
    );

    paidDate.setMonth(
      paidDate.getMonth() + i
    );

    // LAST EMI DATE
    if (
      i === Number(already_paid_months) - 1 &&
      last_paid_date
    ) {
      paidDate.setTime(
        new Date(last_paid_date).getTime()
      );
    }

    emiHistory.push({

      amount: Number(req.body.emi_amount),

      month_number: i + 1,

      paid_date: paidDate

    });

  }

}
const totalPaid =
  req.body.installments?.reduce(
    (sum, inst) =>
      sum + Number(inst.amount),
    0
  ) || 0;

const remainingBalance =
  Number(req.body.principal_amount) -
  totalPaid;

  let finalInterest = null;
let finalTotal = null;

if (
  req.body.transaction_type === 'rotation' &&
  req.body.rotation_entry_mode === 'completed'
) {

  let totalInterest =
  Number(req.body.base_interest || 0);

req.body.extensions?.forEach(ext => {

  // ✅ Last interest paid
  if (ext.interest_paid) {

  totalInterest =
    Number(ext.extra_interest || 0);

}

  // ✅ Normal extension
  else {

    totalInterest +=
      Number(ext.extra_interest || 0);

  }

});

  finalInterest = totalInterest;

  finalTotal =
    Number(req.body.principal_amount) +
    totalInterest;

}
console.log({
  completedEmi,
  remainingEmi,
  loanStatus:
    Number(remainingEmi) <= 0
      ? 'paid'
      : 'pending'
});

const transaction = new Transaction({

  

  installments:
  req.body.installments || [],

total_paid_amount:
  totalPaid,

remaining_balance:
  remainingBalance,

last_payment_date:

  req.body.installments?.length > 0

    ? req.body.installments[
        req.body.installments.length - 1
      ].date

    : null,

  person_name: req.body.person_name,

  type: req.body.type,

  transaction_type:
    req.body.transaction_type,

  principal_amount:
    Number(req.body.principal_amount),

  base_interest:
    Number(req.body.base_interest),

  start_date:
    req.body.start_date,

  due_date:
    req.body.due_date,

  notes:
    req.body.notes,
  
  paid_date:

  req.body.installments?.length > 0

    ? req.body.installments[
        req.body.installments.length - 1
      ].date

    : req.body.paid_date || null,

  loan_duration:
    Number(req.body.loan_duration || 0),

  emi_amount:
    Number(req.body.emi_amount || 0),

  interest_type:
    req.body.interest_type || 'flat',

  completed_emi:
    completedEmi,

  remaining_emi:
    remainingEmi,

  emi_history:
  emiHistory,

  final_interest: finalInterest,

final_total: finalTotal,

final_due_date:
  req.body.due_date,

final_extensions:
  (req.body.extensions || []).map(ext => ({

    old_due_date:
      ext.old_due_date,

    new_due_date:
      ext.new_due_date,

    extra_interest:
      Number(ext.extra_interest || 0),

    interest_paid:
      ext.interest_paid || false

  })),

status:

// ================= ROTATION =================

req.body.transaction_type === 'rotation'

  ? (

      req.body.rotation_entry_mode === 'completed'

        ? 'paid'

        : 'pending'
    )

// ================= LOAN =================

: req.body.transaction_type === 'loan'

  ? (

      Number(remainingEmi) <= 0

        ? 'paid'

        : 'pending'
    )

// ================= NORMAL =================

: (

      req.body.entry_mode === 'completed'

        ? (

            totalPaid >=
            Number(req.body.principal_amount)

              ? 'paid'

              : 'pending'
          )

        : 'pending'
    ),

paid_amount:

req.body.transaction_type === 'normal'

  ? totalPaid

  : 0,

});

await transaction.save();

    res.status(201).json(transaction);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};
const updateLoanHistoryDate = async (req, res) => {

  try {

    const {
      txId,
      emiIndex,
      paid_date
    } = req.body;

    const transaction =
      await Transaction.findById(txId);

    if (!transaction) {
      return res.status(404).json({
        message: 'Loan not found'
      });
    }

    if (
      !transaction.emi_history ||
      !transaction.emi_history[emiIndex]
    ) {
      return res.status(404).json({
        message: 'EMI not found'
      });
    }

    const emi =
  transaction.emi_history[
    emiIndex
  ];

emi.paid_date = paid_date;

// ================= RECALCULATE STATUS =================

const comparePaidDate =
  new Date(paid_date);

comparePaidDate.setHours(
  0,0,0,0
);

const dueDate =
  new Date(transaction.start_date);

dueDate.setMonth(
  dueDate.getMonth() + emiIndex
);

dueDate.setHours(
  0,0,0,0
);

let emiStatus = 'paid';

let lateDays = 0;

if (comparePaidDate > dueDate) {

  emiStatus = 'late';

  lateDays = Math.round(

    (
      comparePaidDate -
      dueDate
    ) /

    (1000 * 60 * 60 * 24)

  );

}

if (comparePaidDate < dueDate) {

  emiStatus = 'advance';

}

emi.status = emiStatus;

emi.late_days = lateDays;

    await transaction.save();

    res.json({
      message: 'EMI date updated'
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: 'Server Error'
    });

  }

};


module.exports = {
  addTransaction: exports.addTransaction,
  extendTransaction: exports.extendTransaction,
  getTransactions: exports.getTransactions,
  getDashboard: exports.getDashboard,
  getByDateRange: exports.getByDateRange,
  markAsPaid: exports.markAsPaid,
  getByPerson: exports.getByPerson,
  updateTransaction: exports.updateTransaction,
  deleteTransaction: exports.deleteTransaction,
  payLoanEmi: exports.payLoanEmi,
  updateLoanHistoryDate
};