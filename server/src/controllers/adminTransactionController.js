import { approvePendingTrade, rejectPendingTrade } from "../services/tradeService.js";
import { approvePendingDeposit, rejectPendingDeposit } from "../services/walletService.js";
import { approveInvestment, rejectInvestment } from "../services/investmentService.js";
import { TransactionModel } from "../models/Transaction.js";
import { InvestmentModel } from "../models/Investment.js";

// Generic approval handler that routes based on transaction type
export async function approveTransaction(req, res) {
  try {
    const transactionId = req.params.transactionId ?? req.body?.transactionId;
    console.log('Generic approve transaction request:', { transactionId });
    
    // First, fetch the transaction to determine its type
    const transaction = await TransactionModel.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    
    console.log('Transaction type:', transaction.type);
    
    // Route to appropriate service based on type
    let result;
    if (transaction.type === "deposit") {
      result = await approvePendingDeposit({
        transactionId,
        adminId: req.admin?._id,
        note: req.body?.note,
      });
    } else if (transaction.type === "trade") {
      result = await approvePendingTrade({
        transactionId,
        adminId: req.admin?._id,
        note: req.body?.note,
      });
    } else if (transaction.type === "investment") {
      // For investments, we need to find the investment record
      const investment = await InvestmentModel.findOne({ transactionId });
      if (!investment) {
        return res.status(404).json({ error: "Investment record not found" });
      }
      result = await approveInvestment({
        investmentId: investment._id,
        adminId: req.admin?._id,
        note: req.body?.note,
      });
    } else {
      return res.status(400).json({ error: `Unsupported transaction type: ${transaction.type}` });
    }
    
    // Serialize the result
    const serializedTransaction = {
      id: (result._id || result.id).toString(),
      ...result,
      _id: undefined,
    };
    
    res.json({ transaction: serializedTransaction });
  } catch (error) {
    console.error('Error approving transaction:', error);
    const message = error?.message ?? "Unable to approve transaction.";
    const status = message.includes("NOT_FOUND")
      ? 404
      : message.includes("ALREADY_PROCESSED")
        ? 409
        : 400;
    res.status(status).json({ error: message });
  }
}

// Generic rejection handler that routes based on transaction type
export async function rejectTransaction(req, res) {
  try {
    const transactionId = req.params.transactionId ?? req.body?.transactionId;
    console.log('Generic reject transaction request:', { transactionId });
    
    // First, fetch the transaction to determine its type
    const transaction = await TransactionModel.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    
    console.log('Transaction type:', transaction.type);
    
    // Route to appropriate service based on type
    let result;
    if (transaction.type === "deposit") {
      result = await rejectPendingDeposit({
        transactionId,
        adminId: req.admin?._id,
        reason: req.body?.reason,
      });
    } else if (transaction.type === "trade") {
      result = await rejectPendingTrade({
        transactionId,
        adminId: req.admin?._id,
        reason: req.body?.reason,
      });
    } else if (transaction.type === "investment") {
      // For investments, we need to find the investment record
      const investment = await InvestmentModel.findOne({ transactionId });
      if (!investment) {
        return res.status(404).json({ error: "Investment record not found" });
      }
      result = await rejectInvestment({
        investmentId: investment._id,
        adminId: req.admin?._id,
        reason: req.body?.reason,
      });
    } else {
      return res.status(400).json({ error: `Unsupported transaction type: ${transaction.type}` });
    }
    
    // Serialize the result
    const serializedTransaction = {
      id: (result._id || result.id).toString(),
      ...result,
      _id: undefined,
    };
    
    res.json({ transaction: serializedTransaction });
  } catch (error) {
    console.error('Error rejecting transaction:', error);
    const message = error?.message ?? "Unable to reject transaction.";
    const status = message.includes("NOT_FOUND")
      ? 404
      : message.includes("ALREADY_PROCESSED")
        ? 409
        : 400;
    res.status(status).json({ error: message });
  }
}

export async function approveTradeTransaction(req, res) {
  try {
    const transaction = await approvePendingTrade({
      transactionId: req.params.transactionId ?? req.body?.transactionId,
      adminId: req.admin?._id,
      note: req.body?.note,
    });
    res.json({ transaction });
  } catch (error) {
    const message = error?.message ?? "Unable to approve trade request.";
    const status = message.includes("NOT_FOUND")
      ? 404
      : message.includes("ALREADY_PROCESSED")
        ? 409
        : 400;
    res.status(status).json({ error: message });
  }
}

export async function rejectTradeTransaction(req, res) {
  try {
    const transaction = await rejectPendingTrade({
      transactionId: req.params.transactionId ?? req.body?.transactionId,
      adminId: req.admin?._id,
      reason: req.body?.reason,
    });
    res.json({ transaction });
  } catch (error) {
    const message = error?.message ?? "Unable to reject trade request.";
    const status = message.includes("NOT_FOUND")
      ? 404
      : message.includes("ALREADY_PROCESSED")
        ? 409
        : 400;
    res.status(status).json({ error: message });
  }
}

export async function approveDepositTransaction(req, res) {
  try {
    console.log('Approve deposit request:', {
      transactionId: req.params.transactionId,
      adminId: req.admin?._id,
      note: req.body?.note,
    });
    
    const transaction = await approvePendingDeposit({
      transactionId: req.params.transactionId ?? req.body?.transactionId,
      adminId: req.admin?._id,
      note: req.body?.note,
    });
    
    console.log('Deposit approved successfully:', transaction._id || transaction.id);
    
    // Ensure proper serialization of the transaction
    const serializedTransaction = {
      id: (transaction._id || transaction.id).toString(),
      ...transaction,
      _id: undefined,
    };
    
    res.json({ transaction: serializedTransaction });
  } catch (error) {
    console.error('Error approving deposit:', error);
    const message = error?.message ?? "Unable to approve deposit request.";
    const status = message.includes("NOT_FOUND")
      ? 404
      : message.includes("ALREADY_PROCESSED")
        ? 409
        : 400;
    res.status(status).json({ error: message });
  }
}

export async function rejectDepositTransaction(req, res) {
  try {
    const transaction = await rejectPendingDeposit({
      transactionId: req.params.transactionId ?? req.body?.transactionId,
      adminId: req.admin?._id,
      reason: req.body?.reason,
    });
    res.json({ transaction });
  } catch (error) {
    const message = error?.message ?? "Unable to reject deposit request.";
    const status = message.includes("NOT_FOUND")
      ? 404
      : message.includes("ALREADY_PROCESSED")
        ? 409
        : 400;
    res.status(status).json({ error: message });
  }
}

export async function approveInvestmentRequest(req, res) {
  try {
    console.log('Approve investment request:', {
      investmentId: req.params.investmentId,
      adminId: req.admin?._id,
      note: req.body?.note,
    });
    
    const investment = await approveInvestment({
      investmentId: req.params.investmentId ?? req.body?.investmentId,
      adminId: req.admin?._id,
      note: req.body?.note,
    });
    
    console.log('Investment approved successfully:', investment._id);
    
    // Ensure proper serialization
    const serializedInvestment = {
      id: (investment._id || investment.id).toString(),
      ...investment,
      _id: undefined,
    };
    
    res.json({ investment: serializedInvestment });
  } catch (error) {
    console.error('Error approving investment:', error);
    const message = error?.message ?? "Unable to approve investment request.";
    const status = message.includes("NOT_FOUND")
      ? 404
      : message.includes("ALREADY_PROCESSED")
        ? 409
        : 400;
    res.status(status).json({ error: message });
  }
}

export async function rejectInvestmentRequest(req, res) {
  try {
    console.log('Reject investment request:', {
      investmentId: req.params.investmentId,
      adminId: req.admin?._id,
      reason: req.body?.reason,
    });
    
    const investment = await rejectInvestment({
      investmentId: req.params.investmentId ?? req.body?.investmentId,
      adminId: req.admin?._id,
      reason: req.body?.reason,
    });
    
    console.log('Investment rejected successfully:', investment._id);
    
    // Ensure proper serialization
    const serializedInvestment = {
      id: (investment._id || investment.id).toString(),
      ...investment,
      _id: undefined,
    };
    
    res.json({ investment: serializedInvestment });
  } catch (error) {
    console.error('Error rejecting investment:', error);
    const message = error?.message ?? "Unable to reject investment request.";
    const status = message.includes("NOT_FOUND")
      ? 404
      : message.includes("ALREADY_PROCESSED")
        ? 409
        : 400;
    res.status(status).json({ error: message });
  }
}
