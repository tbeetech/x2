import { executeTrade, queueTradeRequest } from "../services/tradeService.js";
import { UserModel } from "../models/User.js";
import logger from "../lib/logger.js";

const KNOWN_ERRORS = new Map([
  ["INSUFFICIENT_FUNDS", { status: 400, message: "Insufficient wallet balance for this trade." }],
  ["POSITION_NOT_FOUND", { status: 404, message: "Position not found for the requested symbol." }],
  ["INSUFFICIENT_POSITION", { status: 400, message: "Cannot sell more shares than currently held." }],
  ["TRANSACTION_NOT_FOUND", { status: 404, message: "Requested transaction was not found." }],
  ["TRANSACTION_ALREADY_PROCESSED", { status: 400, message: "This transaction has already been processed." }],
  ["TRANSACTION_NOT_TRADE", { status: 400, message: "Requested transaction is not a trade." }],
]);

export async function placeTrade(req, res) {
  const { symbol, name, side, quantity, price } = req.body ?? {};

  // Basic input validation to return helpful 4xx responses early
  if (!symbol || !name) {
    return res.status(400).json({ error: "Symbol and name are required." });
  }
  const tradeSide = (side ?? "").toLowerCase();
  if (!["buy", "sell"].includes(tradeSide)) {
    return res.status(400).json({ error: "Trade side must be 'buy' or 'sell'." });
  }
  if (!quantity || Number(quantity) <= 0) {
    return res.status(400).json({ error: "Quantity must be greater than zero." });
  }
  if (!price || Number(price) <= 0) {
    return res.status(400).json({ error: "Price must be greater than zero." });
  }

  try {
    const user = await UserModel.findById(req.user.id).select("role verificationStatus").lean().exec();
    if (!user) {
      return res.status(404).json({ error: "User record missing. Re-authenticate and try again." });
    }
    if (user.role !== "admin") {
      const transaction = await queueTradeRequest({
        userId: req.user.id,
        symbol,
        name,
        side,
        quantity,
        price,
      });
      return res.status(202).json({
        status: "pending",
        transactionId: transaction?._id?.toString(),
        message:
          "Trade request received. An Invisphere administrator will review and execute it once approved.",
      });
    }

    const dashboard = await executeTrade({
      userId: req.user.id,
      symbol,
      name,
      side,
      quantity,
      price,
    });

    return res.status(201).json({ status: "executed", message: "Trade executed.", dashboard });
  } catch (error) {
    const normalized = error?.message ?? "UNKNOWN_ERROR";
    const known = KNOWN_ERRORS.get(normalized);
    if (known) {
      return res.status(known.status).json({ error: known.message });
    }
    // Log full error and return the error message to the caller to aid debugging
    logger.error({ err: error }, "placeTrade error");
    const message = error?.message || "Unable to execute trade.";
    return res.status(500).json({ error: message });
  }
}
