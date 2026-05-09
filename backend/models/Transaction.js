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
    enum: ['pending', 'paid', 'extended'],
    default: 'pending'
  },

  extensions: [extensionSchema],

  notes: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);