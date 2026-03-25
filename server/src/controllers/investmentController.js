import { createInvestmentRequest, getUserInvestments } from "../services/investmentService.js";
import { sendAdminNotification } from "../services/emailService.js";
import logger from "../lib/logger.js";

const ERROR_RESPONSES = new Map([
  ["INVALID_AMOUNT", { status: 400, message: "Amount must be greater than zero." }],
  ["INSUFFICIENT_FUNDS", { status: 400, message: "Insufficient wallet balance." }],
  ["INVALID_PLAN", { status: 400, message: "Invalid investment plan selected." }],
]);

function handleError(res, error) {
  const code = error?.message ?? "UNKNOWN_ERROR";
  const known = ERROR_RESPONSES.get(code);
  if (known) {
    return res.status(known.status).json({ error: known.message });
  }
  logger.error({ err: error }, "investment operation failed");
  return res.status(500).json({ error: "Unable to process investment request." });
}

export async function createInvestment(req, res) {
  try {
    const result = await createInvestmentRequest({
      userId: req.user.id,
      planId: req.body?.planId,
      planTitle: req.body?.planTitle,
      amount: req.body?.amount,
      duration: req.body?.duration,
      expectedReturn: req.body?.expectedReturn,
    });

    // notify admins (best-effort)
    try {
      const subject = `New investment request - ${result?.investment?._id ?? "N/A"}`;
      const html = `User ${req.user.email} submitted an investment request for ${result?.investment?.planTitle ?? "N/A"} with amount ${result?.investment?.amount ?? "N/A"}`;
      void sendAdminNotification({ subject, html });
    } catch {
      // ignore notification failures
    }

    return res.status(201).json({ 
      message: "Investment request created successfully.", 
      investment: result?.investment ?? null, 
      dashboard: result?.dashboard ?? result 
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listInvestments(req, res) {
  try {
    const investments = await getUserInvestments(req.user.id);
    return res.json({ investments });
  } catch (error) {
    return handleError(res, error);
  }
}
