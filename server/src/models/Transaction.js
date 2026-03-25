import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      index: true 
    },
    type: { 
      type: String, 
      required: true,
      enum: ['deposit', 'withdrawal', 'trade', 'investment', 'transfer', 'fee', 'reward'],
      index: true
    },
    asset: { 
      type: String, 
      required: true,
      uppercase: true,
      trim: true 
    },
    symbol: { 
      type: String, 
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },
    amount: { 
      type: Number, 
      required: true,
      validate: {
        validator: function(v) {
          return Number.isFinite(v) && v !== 0;
        },
        message: '{VALUE} is not a valid amount'
      }
    },
    price: { 
      type: Number, 
      required: true,
      validate: {
        validator: function(v) {
          return Number.isFinite(v) && v >= 0;
        },
        message: '{VALUE} is not a valid price'
      }
    },
    total: { 
      type: Number, 
      required: true,
      validate: {
        validator: function(v) {
          return Number.isFinite(v);
        },
        message: '{VALUE} is not a valid total'
      }
    },
    status: { 
      type: String, 
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'rejected'],
      default: "pending",
      index: true
    },
    direction: { 
      type: String, 
      enum: ["in", "out", "internal"], 
      default: "internal",
      index: true
    },
    method: { 
      type: String,
      enum: ['wire', 'crypto', 'card', 'bank_transfer', 'internal']
    },
    reference: { 
      type: String,
      trim: true,
      sparse: true,
      index: true
    },
    metadata: { 
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    adminNote: { 
      type: String,
      trim: true 
    },
    occurredOn: { 
      type: Date, 
      required: true,
      index: true
    },
    completedAt: { 
      type: Date,
      index: true
    },
    failureReason: String,
    fees: [{
      type: { type: String, required: true },
      amount: { type: Number, required: true },
      currency: { type: String, required: true }
    }]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  },
);

// Compound indexes for common queries
transactionSchema.index({ userId: 1, status: 1, occurredOn: -1 });
transactionSchema.index({ userId: 1, type: 1, occurredOn: -1 });
transactionSchema.index({ userId: 1, asset: 1, occurredOn: -1 });

// Validation middleware
transactionSchema.pre('save', function(next) {
  // Ensure total matches amount * price for trades
  if (this.type === 'trade' && this.isModified('amount', 'price', 'total')) {
    const calculatedTotal = this.amount * this.price;
    if (Math.abs(calculatedTotal - this.total) > 0.00001) {
      return next(new Error('Total amount does not match price * amount'));
    }
  }
  next();
});

transactionSchema.index({ userId: 1, occurredOn: -1 });

export const TransactionModel =
  mongoose.models.Transaction ?? mongoose.model("Transaction", transactionSchema);
