const Transaction = require('../models/Transaction');


const addTransaction = async (req, res) => {
  try {
    const tx = new Transaction({
      person_name: req.body.person_name,
      type: req.body.type,
      transaction_type: req.body.transaction_type || 'rotation', // ✅ ADD THIS
      principal_amount: req.body.principal_amount,
      base_interest: req.body.base_interest,
      start_date: req.body.start_date,
      due_date: req.body.due_date,
      notes: req.body.notes,
      status: 'pending',
      extensions: []
    });

    

    await tx.save();
    res.json(tx);

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
};

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

    let totalInterest = tx.base_interest;

    tx.extensions.forEach(ext => {
      totalInterest += ext.extra_interest;
    });

    const total = tx.principal_amount + totalInterest;

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

exports.markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const tx = await Transaction.findById(id);

    if (!tx) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // ✅ NORMAL → INSTALLMENT LOGIC
    if (tx.transaction_type === 'normal') {


// before normal logic
if (tx.transaction_type === 'normal' && (amount === undefined || amount === null)) {
  return res.status(400).json({ message: 'Amount required for normal transaction' });
}

// inside normal
const remaining = tx.principal_amount - (tx.paid_amount || 0);

const safeAmount = Number(amount || 0);

if (!safeAmount || safeAmount <= 0) {
  return res.status(400).json({ message: 'Invalid amount' });
}

const pay = Math.min(safeAmount, remaining);

  tx.paid_amount = (tx.paid_amount || 0) + pay;

  // 🔥 ADD INSTALLMENT ENTRY
  if (!tx.installments) {
    tx.installments = [];
  }

  tx.installments.push({
    amount: pay,
    date: new Date()
  });

  // FULLY PAID
  if (tx.paid_amount >= tx.principal_amount) {
    tx.status = 'paid';
    tx.paid_date = new Date();
  }

  await tx.save();  
  return res.json(tx);
}

    // ✅ ROTATION → FULL PAYMENT

if (req.body.earlyPay === true) {

  tx.early_paid = true;

  tx.early_paid_interest = Number(
    req.body.newInterest
  );

}

tx.status = 'paid';

tx.paid_date = new Date();

await tx.save();

return res.json(tx);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Error' });
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

    

    // 🔥 IMPORTANT
    // if extended transaction
    // also update latest extension due date

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
    const transaction = new Transaction(req.body);
    await transaction.save();

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = exports;