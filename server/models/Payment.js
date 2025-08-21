const mongoose = require('mongoose');

// Payment Code Schema
const paymentCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
  },
  value: {
    type: Number,
    required: true,
    min: 1
  },
  isRedeemed: {
    type: Boolean,
    default: false
  },
  redeemedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  redeemedAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  batchId: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from creation
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit', 'refund', 'bonus'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  reference: {
    type: String, // Could be payment code, course ID, etc.
    default: null
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Wallet Schema (embedded in User model, but defined here for reference)
const walletSchema = new mongoose.Schema({
  isActivated: {
    type: Boolean,
    default: false
  },
  activatedAt: {
    type: Date,
    default: null
  },
  termsAcceptedAt: {
    type: Date,
    default: null
  },
  totalEarned: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  lastTransactionAt: {
    type: Date,
    default: null
  }
});

// Indexes for performance
paymentCodeSchema.index({ isRedeemed: 1 });
paymentCodeSchema.index({ expiresAt: 1 });

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ reference: 1 });

const PaymentCode = mongoose.model('PaymentCode', paymentCodeSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = {
  PaymentCode,
  Transaction,
  walletSchema
};
