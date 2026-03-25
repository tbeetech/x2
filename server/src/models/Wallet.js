import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      unique: true,
      index: true 
    },
    balance: { 
      type: Number, 
      default: 0,
      min: [0, 'Balance cannot be negative'],
      validate: {
        validator: Number.isFinite,
        message: '{VALUE} is not a valid number'
      }
    },
    totalDeposited: { 
      type: Number, 
      default: 0,
      min: [0, 'Total deposited cannot be negative'],
      validate: {
        validator: Number.isFinite,
        message: '{VALUE} is not a valid number'
      }
    },
    totalWithdrawn: { 
      type: Number, 
      default: 0,
      min: [0, 'Total withdrawn cannot be negative'],
      validate: {
        validator: Number.isFinite,
        message: '{VALUE} is not a valid number'
      }
    },
    earningRate: { 
      type: Number, 
      default: 0,
      min: [0, 'Earning rate cannot be negative'],
      max: [100, 'Earning rate cannot exceed 100%'],
      validate: {
        validator: Number.isFinite,
        message: '{VALUE} is not a valid number'
      }
    },
    pendingHold: { 
      type: Number, 
      default: 0,
      min: [0, 'Pending hold cannot be negative'],
      validate: {
        validator: Number.isFinite,
        message: '{VALUE} is not a valid number'
      }
    },
    lastActivity: { type: Date, default: Date.now },
    assetBalances: [{
      asset: { type: String, required: true },
      amount: { 
        type: Number, 
        required: true,
        validate: {
          validator: Number.isFinite,
          message: '{VALUE} is not a valid number'
        }
      },
      lastUpdated: { type: Date, default: Date.now }
    }]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  },
);

// Compound index for queries involving userId and lastActivity
walletSchema.index({ userId: 1, lastActivity: -1 });

// Compound index for assetBalances
walletSchema.index({ 'assetBalances.asset': 1, userId: 1 });

export const WalletModel = mongoose.models.Wallet ?? mongoose.model("Wallet", walletSchema);
