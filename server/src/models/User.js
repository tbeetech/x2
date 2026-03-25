import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: props => `${props.value} is not a valid email address!`
      }
    },
    passwordHash: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['user', 'admin', 'superadmin'],
      default: 'user',
      index: true
    },
    membership: { type: String, default: "Member" },
    bonusPoints: { 
      type: Number, 
      default: 0,
      min: [0, 'Bonus points cannot be negative']
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "in_review", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0, min: 0 },
    lockUntil: Date,
    country: { type: String, trim: true },
    phone: { type: String, trim: true },
    timezone: { type: String, default: 'UTC' },
    settings: {
      priceAlerts: { type: Boolean, default: true },
      portfolioSummaries: { type: Boolean, default: true },
      twoFactorEnabled: { type: Boolean, default: false }
    },
    lastPasswordChange: { type: Date, default: Date.now },
    passwordResetToken: String,
    passwordResetExpires: Date
  },
  { 
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.passwordHash;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        return ret;
      }
    }
  },
);

export const UserModel = mongoose.models.User ?? mongoose.model("User", userSchema);
