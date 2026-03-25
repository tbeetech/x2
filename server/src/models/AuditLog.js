import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: { 
    type: String, 
    required: true,
    enum: [
      'UPDATE_USER',
      'DEACTIVATE_USER',
      'ACTIVATE_USER',
      'DELETE_USER',
      'CREATE_USER',
      'LOGIN_ATTEMPT',
      'PASSWORD_RESET',
      'CONTENT_UPDATE'
    ]
  },
  adminId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  targetUserId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  changes: { 
    type: mongoose.Schema.Types.Mixed 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  ipAddress: String,
  userAgent: String
});

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ adminId: 1, timestamp: -1 });
auditLogSchema.index({ targetUserId: 1, timestamp: -1 });

export const AuditLogModel = mongoose.models.AuditLog ?? 
  mongoose.model('AuditLog', auditLogSchema);
