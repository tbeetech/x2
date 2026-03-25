import express from 'express';
import { isAdmin, adminRateLimit } from '../middleware/adminMiddleware.js';
import {
  getOverview,
  getAllUsers,
  updateUser,
  deactivateUser,
  getAuditLogs
} from '../controllers/adminController.js';
import { listSiteContent, upsertSiteContent } from '../controllers/adminContentController.js';
import {
  listVerificationDocuments,
  downloadVerificationDocument,
} from '../controllers/verificationController.js';
import {
  approveTransaction,
  rejectTransaction,
  approveTradeTransaction,
  rejectTradeTransaction,
  approveDepositTransaction,
  rejectDepositTransaction,
  approveInvestmentRequest,
  rejectInvestmentRequest,
} from '../controllers/adminTransactionController.js';
import {
  getTreasury,
  updateTreasury,
} from '../controllers/adminTreasuryController.js';

const router = express.Router();

// Apply rate limiting to all admin routes
router.use(adminRateLimit);

// Require admin authentication for all routes
router.use(isAdmin);

router.get('/overview', getOverview);

// User management routes
router.get('/users', getAllUsers);
router.patch('/users/:userId', updateUser);
router.post('/users/:userId/deactivate', deactivateUser);

// Audit logs
router.get('/audit-logs', getAuditLogs);

// Content management
router.get('/content', listSiteContent);
router.put('/content/:key', upsertSiteContent);

// Verification document access
router.get('/verification/documents/:documentId/download', downloadVerificationDocument);
router.get('/verification/:userId/documents', listVerificationDocuments);

// Generic transaction approvals (auto-routes based on transaction type)
router.post('/transactions/:transactionId/approve', approveTransaction);
router.post('/transactions/:transactionId/reject', rejectTransaction);

// Specific trade approvals (for explicit trade-only requests)
router.post('/trades/:transactionId/approve', approveTradeTransaction);
router.post('/trades/:transactionId/reject', rejectTradeTransaction);

// Specific deposit approvals (for explicit deposit-only requests)
router.post('/deposits/:transactionId/approve', approveDepositTransaction);
router.post('/deposits/:transactionId/reject', rejectDepositTransaction);

// Investment approvals (uses investmentId not transactionId)
router.post('/investments/:investmentId/approve', approveInvestmentRequest);
router.post('/investments/:investmentId/reject', rejectInvestmentRequest);

// Treasury management
router.get('/treasury', getTreasury);
router.put('/treasury', updateTreasury);

export default router;
