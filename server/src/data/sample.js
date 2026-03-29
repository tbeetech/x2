export const sampleUser = {
  id: "user-1",
  email: "demo@invisphere.com",
  firstName: "Demo",
  lastName: "User",
  role: "user",
  membership: "Premium Member",
  password: "demo123",
  createdAt: new Date("2024-01-04T10:00:00Z").toISOString(),
};

export const samplePortfolioSummary = {
  totalValue: 148532,
  totalReturn: 18.4,
  dailyChange: 2.1,
  netDeposits: 95000,
};

export const sampleWallet = {
  balance: 32540,
  totalDeposited: 97500,
  totalWithdrawn: 64960,
  earningRate: 6.2,
};

export const samplePositions = [
  {
    id: "btc",
    name: "Bitcoin",
    symbol: "BTC",
    allocation: 42,
    amount: 1.1,
    currentValue: 74400,
    pnl: 26700,
    pnlPercent: 56.1,
  },
  {
    id: "eth",
    name: "Ethereum",
    symbol: "ETH",
    allocation: 28,
    amount: 20.4,
    currentValue: 41320,
    pnl: 12180,
    pnlPercent: 41.8,
  },
  {
    id: "sol",
    name: "Solana",
    symbol: "SOL",
    allocation: 18,
    amount: 280,
    currentValue: 26320,
    pnl: 7840,
    pnlPercent: 42.4,
  },
  {
    id: "ada",
    name: "Cardano",
    symbol: "ADA",
    allocation: 6,
    amount: 12500,
    currentValue: 9280,
    pnl: 1180,
    pnlPercent: 14.5,
  },
  {
    id: "link",
    name: "Chainlink",
    symbol: "LINK",
    allocation: 6,
    amount: 1100,
    currentValue: 7212,
    pnl: 980,
    pnlPercent: 15.7,
  },
];

export const sampleTransactions = [
  {
    id: "txn-2591",
    type: "Buy",
    asset: "Bitcoin",
    symbol: "BTC",
    date: "2025-10-09",
    status: "completed",
    amount: 0.24,
    price: 67800,
    total: 16272,
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
    total: 22560,
  },
  {
    id: "txn-2585",
    type: "Deposit",
    asset: "USD",
    symbol: "USD",
    date: "2025-10-07",
    status: "completed",
    amount: 25000,
    price: 1,
    total: 25000,
  },
  {
    id: "txn-2580",
    type: "Sell",
    asset: "Ethereum",
    symbol: "ETH",
    date: "2025-10-05",
    status: "pending",
    amount: 1.8,
    price: 3540,
    total: 6372,
  },
];

export const sampleMarketTop = [
  {
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    currentPrice: 68215,
    marketCap: 1342000000000,
    priceChangePercentage24h: 2.84,
    totalVolume: 18320000000,
  },
  {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    currentPrice: 3620,
    marketCap: 435000000000,
    priceChangePercentage24h: 1.63,
    totalVolume: 12450000000,
  },
  {
    id: "solana",
    symbol: "SOL",
    name: "Solana",
    currentPrice: 189,
    marketCap: 84200000000,
    priceChangePercentage24h: -0.42,
    totalVolume: 3900000000,
  },
  {
    id: "xrp",
    symbol: "XRP",
    name: "XRP",
    currentPrice: 1.02,
    marketCap: 56100000000,
    priceChangePercentage24h: 0.71,
    totalVolume: 1640000000,
  },
  {
    id: "cardano",
    symbol: "ADA",
    name: "Cardano",
    currentPrice: 0.74,
    marketCap: 26400000000,
    priceChangePercentage24h: -1.9,
    totalVolume: 870000000,
  },
];

export const sampleVerificationTimeline = [
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

// NOTE: This account is used only when USE_SAMPLE_DATA is active (development/demo mode).
// It is never reachable in production where USE_SAMPLE_DATA defaults to false.
export const sampleAdminUser = {
  id: "admin-1",
  email: "admin@invisphere.com",
  firstName: "Admin",
  lastName: "User",
  role: "admin",
  membership: "Admin",
  password: "admin123",
  createdAt: new Date("2024-01-01T00:00:00Z").toISOString(),
};

export const sampleUserStore = [sampleUser, sampleAdminUser];
