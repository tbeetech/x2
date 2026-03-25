import {
  depositFunds as depositService,
  withdrawFunds as withdrawService,
  transferFunds as transferService,
  listCryptoDepositOptions,
} from "../services/walletService.js";
import { sendAdminNotification } from "../services/emailService.js";
import logger from "../lib/logger.js";

const ERROR_RESPONSES = new Map([
  ["INVALID_AMOUNT", { status: 400, message: "Amount must be greater than zero." }],
  ["INSUFFICIENT_FUNDS", { status: 400, message: "Insufficient wallet balance." }],
]);

function handleError(res, error) {
  const code = error?.message ?? "UNKNOWN_ERROR";
  const known = ERROR_RESPONSES.get(code);
  if (known) {
    return res.status(known.status).json({ error: known.message });
  }
  logger.error({ err: error }, "wallet operation failed");
  return res.status(500).json({ error: "Unable to process wallet operation." });
}

export async function deposit(req, res) {
  try {
    const result = await depositService({
      userId: req.user.id,
      amount: req.body?.amount,
      assetSymbol: req.body?.assetSymbol,
      assetName: req.body?.assetName,
      walletAddress: req.body?.walletAddress,
      walletLabel: req.body?.walletLabel,
      network: req.body?.network,
      reference: req.body?.reference,
      method: req.body?.method,
    });

    // notify admins (best-effort)
    try {
      const tx = result?.transaction ?? null;
      const subject = `New deposit submitted${tx ? ` - ${tx._id}` : ""}`;
      const html = `User ${req.user.email} submitted a deposit${tx ? ` (id: ${tx._id})` : ""} for ${result?.dashboard?.summary?.netDeposits ?? "N/A"}`;
      void sendAdminNotification({ subject, html });
    } catch {
      // ignore notification failures
    }

    return res.status(201).json({ message: "Deposit recorded.", transaction: result?.transaction ?? null, dashboard: result?.dashboard ?? result });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function withdraw(req, res) {
  try {
    const dashboard = await withdrawService({
      userId: req.user.id,
      amount: req.body?.amount,
      method: req.body?.method,
      reference: req.body?.reference,
    });
    return res.status(201).json({ message: "Withdrawal registered.", dashboard });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function transfer(req, res) {
  try {
    const dashboard = await transferService({
      userId: req.user.id,
      amount: req.body?.amount,
      destination: req.body?.destination,
      memo: req.body?.memo,
    });
    return res.status(201).json({ message: "Transfer logged.", dashboard });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function cryptoOptions(req, res) {
  return res.json({ options: listCryptoDepositOptions() });
}
