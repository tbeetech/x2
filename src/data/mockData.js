export const mockPortfolioSummary = {
  totalValue: 148_532,
  totalReturn: 18.4,
  dailyChange: 2.1,
  netDeposits: 95_000,
};

export const mockPositions = [
  {
    id: "btc",
    name: "Bitcoin",
    symbol: "BTC",
    allocation: 42,
    amount: 1.1,
    currentValue: 74_400,
    pnl: 26_700,
    pnlPercent: 56.1,
  },
  {
    id: "eth",
    name: "Ethereum",
    symbol: "ETH",
    allocation: 28,
    amount: 20.4,
    currentValue: 41_320,
    pnl: 12_180,
    pnlPercent: 41.8,
  },
  {
    id: "sol",
    name: "Solana",
    symbol: "SOL",
    allocation: 18,
    amount: 280,
    currentValue: 26_320,
    pnl: 7_840,
    pnlPercent: 42.4,
  },
  {
    id: "ada",
    name: "Cardano",
    symbol: "ADA",
    allocation: 6,
    amount: 12_500,
    currentValue: 9_280,
    pnl: 1_180,
    pnlPercent: 14.5,
  },
  {
    id: "link",
    name: "Chainlink",
    symbol: "LINK",
    allocation: 6,
    amount: 1_100,
    currentValue: 7_212,
    pnl: 980,
    pnlPercent: 15.7,
  },
];

export const mockTransactions = [
  {
    id: "txn-2591",
    type: "Buy",
    asset: "Bitcoin",
    symbol: "BTC",
    date: "2025-10-09",
    status: "completed",
    amount: 0.24,
    price: 67_800,
    total: 16_272,
  },
  {
    id: "txn-2589",
    type: "Stake",
    asset: "Solana",
    symbol: "SOL",
    date: "2025-10-08",
    status: "completed",
    amount: 120,
    price: 188,
    total: 22_560,
  },
  {
    id: "txn-2585",
    type: "Deposit",
    asset: "USD",
    symbol: "USD",
    date: "2025-10-07",
    status: "completed",
    amount: 25_000,
    price: 1,
    total: 25_000,
  },
  {
    id: "txn-2580",
    type: "Sell",
    asset: "Ethereum",
    symbol: "ETH",
    date: "2025-10-05",
    status: "pending",
    amount: 1.8,
    price: 3_540,
    total: 6_372,
  },
];

export const mockWallet = {
  balance: 32_540,
  totalDeposited: 97_500,
  totalWithdrawn: 64_960,
  earningRate: 6.2,
};

export const verificationTimeline = [
  {
    id: 1,
    title: "Identity Verification",
    description: "Primary identification document submitted.",
    status: "completed",
    timestamp: "2025-09-14T12:15:00Z",
  },
  {
    id: 2,
    title: "Address Verification",
    description: "Proof of address submitted for review.",
    status: "completed",
    timestamp: "2025-09-15T08:10:00Z",
  },
  {
    id: 3,
    title: "Enhanced Due Diligence",
    description: "Compliance review in progress.",
    status: "in_progress",
    timestamp: "2025-09-16T10:35:00Z",
  },
  {
    id: 4,
    title: "Approval",
    description: "Final approval pending.",
    status: "pending",
    timestamp: "2025-09-18T09:00:00Z",
  },
];

export const mockDailyPnlHistory = [
  {
    date: "2025-10-10",
    realized: 2_150,
    unrealized: 1_320,
    notes: "Strong BTC momentum following CPI release.",
  },
  {
    date: "2025-10-09",
    realized: 1_480,
    unrealized: 845,
    notes: "SOL staking rewards compounded. Trimmed ETH exposure.",
  },
  {
    date: "2025-10-08",
    realized: -640,
    unrealized: 420,
    notes: "Rebalanced into stablecoins ahead of FOMC minutes.",
  },
  {
    date: "2025-10-07",
    realized: 910,
    unrealized: 510,
    notes: "Captured intraday ALGO breakout. Hedged with BTC puts.",
  },
  {
    date: "2025-10-06",
    realized: 380,
    unrealized: -220,
    notes: "Minor drawdown due to alt rotation. Added to LINK position.",
  },
  {
    date: "2025-10-05",
    realized: 1_120,
    unrealized: 640,
    notes: "Week open momentum trade on BTC/ETH pair spread.",
  },
];
