import {
  getDashboardSnapshot,
  getPortfolioPositions,
  getTransactions,
  getVerificationTimeline,
  getWallet,
  getMarketTop,
} from "../services/dataService.js";

export async function dashboardSummary(req, res) {
  try {
    const data = await getDashboardSnapshot(req.user.id);
    return res.json(data);
  } catch (error) {
    console.error("Dashboard summary error:", error);
    return res.status(500).json({ error: "Unable to load dashboard data." });
  }
}

export async function portfolioPositions(req, res) {
  try {
    const positions = await getPortfolioPositions(req.user.id);
    return res.json({ positions });
  } catch (error) {
    console.error("Portfolio positions error:", error);
    return res.status(500).json({ error: "Unable to load portfolio." });
  }
}

export async function listTransactions(req, res) {
  try {
    const transactions = await getTransactions(req.user.id);
    return res.json({ transactions });
  } catch (error) {
    console.error("Transactions error:", error);
    return res.status(500).json({ error: "Unable to load transactions." });
  }
}

export async function verificationTimeline(req, res) {
  try {
    const timeline = await getVerificationTimeline(req.user.id);
    return res.json({ timeline });
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ error: "Unable to load verification timeline." });
  }
}

export async function walletSnapshot(req, res) {
  try {
    const wallet = await getWallet(req.user.id);
    return res.json({ wallet });
  } catch (error) {
    console.error("Wallet error:", error);
    return res.status(500).json({ error: "Unable to load wallet data." });
  }
}

export async function marketTop(req, res) {
  try {
    const assets = await getMarketTop();
    return res.json({ assets });
  } catch (error) {
    console.error("Market top error:", error);
    return res.status(500).json({ error: "Unable to load market data." });
  }
}
