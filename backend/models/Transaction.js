const mongoose = require('mongoose');

const extensionSchema = new mongoose.Schema({
  old_due_date: {
    type: Date,
    required: false
  },
  new_due_date: {
    type: Date,
    required: true
  },
  extra_interest: {
    type: Number,
    required: true
  },
  interest_paid: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  },
  transaction_type: {
  type: String,
  default: 'rotation'
}
});

const transactionSchema = new mongoose.Schema({
  final_interest: {
  type: Number,
  default: 0
},

final_total: {
  type: Number,
  default: 0
},

final_due_date: {
  type: Date
},

final_extensions: [
  {
    old_due_date: Date,

    new_due_date: Date,

    extra_interest: Number,

    interest_paid: Boolean
  }
],
  payment_history: [
  {
    amount: Number,

    payment_type: {
      type: String,
      enum: [
        'emi',
        'installment',
        'full',
        'early',
        'interest',
        'partial'
      ]
    },

    payment_date: {
      type: Date,
      default: Date.now
    },

    note: String
  }
],

total_paid_amount: {
  type: Number,
  default: 0
},

remaining_balance: {
  type: Number,
  default: 0
},

last_payment_date: Date,
  installments: [
  {
    amount: Number,
    date: {
      type: Date,
      default: Date.now
    }
  }
],
  transaction_type: {
  type: String,
  enum: ['rotation', 'normal', 'loan'],
  default: 'rotation'
},
paid_date: {
  type: Date
},

early_paid: {
  type: Boolean,
  default: false
},

early_paid_interest: {
  type: Number,
  default: 0
},

  person_name: {
    type: String,
    required: true
  },

  type: {
    type: String,
    enum: ['incoming', 'outgoing'],
    required: true
  },
paid_amount: {
  type: Number,
  default: 0
},

  principal_amount: {
    type: Number,
    required: true
  },

  base_interest: {
    type: Number,
    required: true
  },
  loan_duration: {
  type: Number,
  default: 0
},

emi_amount: {
  type: Number,
  default: 0
},

interest_type: {
  type: String,
  enum: ['flat', 'percentage'],
  default: 'flat'
},

  start_date: {
    type: Date,
    required: true
  },

  due_date: {
    type: Date,
    required: true
  },

  status: {
  type: String,
  enum: [
    'pending',
    'paid',
    'extended',
    'overdue'
  ],
  default: 'pending'
},

  extensions: [extensionSchema],

remaining_emi: {
  type: Number,
  default: 0
},

completed_emi: {
  type: Number,
  default: 0
},
emi_history: [
  {
    amount: Number,

    month_number: Number,

    paid_date: Date,

    status: {
      type: String,
      enum: [
        'paid',
        'late',
        'advance'
      ],
      default: 'paid'
    },

    late_days: {
      type: Number,
      default: 0
    },

    penalty_amount: {
      type: Number,
      default: 0
    }
  }
],
 notes: {
  type: String
},

user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true
}

}, {
  timestamps: true
});

module.exports =
  mongoose.model(
    'Transaction',
    transactionSchema
  );