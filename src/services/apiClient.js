import { DEFAULT_CRYPTO_DEPOSIT_OPTIONS } from "../data/cryptoDepositOptions.js";
import { logger } from "./logger.js";

// Storage availability detection for mobile browsers (iOS Safari private mode, etc.)
function isStorageAvailable(type) {
  if (typeof window === "undefined") return false;
  
  try {
    const storage = window[type];
    const testKey = "__storage_test__";
    storage.setItem(testKey, "test");
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    logger.debug("Storage unavailable", { type, message: error?.message });
    return false;
  }
}

// Detect mobile browsers for enhanced compatibility
function isMobileBrowser() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  
  const ua = navigator.userAgent || navigator.vendor || window.opera || "";
  
  // Check for mobile devices
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i;
  return mobileRegex.test(ua);
}

const IS_LOCAL_STORAGE_AVAILABLE = isStorageAvailable("localStorage");
const IS_SESSION_STORAGE_AVAILABLE = isStorageAvailable("sessionStorage");
const IS_MOBILE = isMobileBrowser();

// Shared key used to remember which storage mechanism succeeded last
export const AUTH_STORAGE_PREFERENCE_KEY = "auth_storage_preference";

// Log storage availability for debugging
if (typeof window !== "undefined") {
  logger.info("Storage availability check", {
    localStorage: IS_LOCAL_STORAGE_AVAILABLE,
    sessionStorage: IS_SESSION_STORAGE_AVAILABLE,
    isMobile: IS_MOBILE,
    userAgent: navigator.userAgent
  });
}

const DEFAULT_STOCK_QUOTES = [
  {
    symbol: "AAPL",
    shortName: "Apple Inc.",
    regularMarketPrice: 195.12,
    regularMarketChange: 1.82,
    regularMarketChangePercent: 0.94,
    regularMarketVolume: 53200000,
    marketCap: 3_020_000_000_000,
    currency: "USD",
  },
  {
    symbol: "GOOGL",
    shortName: "Alphabet Inc.",
    regularMarketPrice: 174.5,
    regularMarketChange: -0.86,
    regularMarketChangePercent: -0.49,
    regularMarketVolume: 18200000,
    marketCap: 2_170_000_000_000,
    currency: "USD",
  },
  {
    symbol: "AMZN",
    shortName: "Amazon.com, Inc.",
    regularMarketPrice: 183.44,
    regularMarketChange: 2.67,
    regularMarketChangePercent: 1.48,
    regularMarketVolume: 41200000,
    marketCap: 1_900_000_000_000,
    currency: "USD",
  },
  {
    symbol: "NFLX",
    shortName: "Netflix, Inc.",
    regularMarketPrice: 642.18,
    regularMarketChange: 4.71,
    regularMarketChangePercent: 0.74,
    regularMarketVolume: 7200000,
    marketCap: 280_000_000_000,
    currency: "USD",
  },
  {
    symbol: "PYPL",
    shortName: "PayPal Holdings, Inc.",
    regularMarketPrice: 76.32,
    regularMarketChange: -0.42,
    regularMarketChangePercent: -0.55,
    regularMarketVolume: 9400000,
    marketCap: 84_000_000_000,
    currency: "USD",
  },
  {
    symbol: "TSLA",
    shortName: "Tesla, Inc.",
    regularMarketPrice: 251.45,
    regularMarketChange: 3.92,
    regularMarketChangePercent: 1.59,
    regularMarketVolume: 51200000,
    marketCap: 800_000_000_000,
    currency: "USD",
  },
];

const DEFAULT_STOCK_HISTORY = {
  AAPL: {
    symbol: "AAPL",
    range: "1mo",
    currency: "USD",
    candles: [
      { time: "2025-09-20T14:30:00.000Z", open: 188.2, high: 189.6, low: 187.5, close: 188.9, volume: 48200000 },
      { time: "2025-09-27T14:30:00.000Z", open: 189.1, high: 191.2, low: 187.9, close: 190.8, volume: 51200000 },
      { time: "2025-10-04T14:30:00.000Z", open: 191.3, high: 193.8, low: 190.1, close: 192.7, volume: 49800000 },
      { time: "2025-10-11T14:30:00.000Z", open: 192.5, high: 196.2, low: 191.7, close: 195.1, volume: 52100000 },
    ],
  },
};

function normalizeBaseUrl(value) {
  if (!value) {
    return undefined;
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.replace(/\/+$/, "");
}

function readMetaContent(name) {
  if (typeof document === "undefined") {
    return undefined;
  }
  const node = document.querySelector(`meta[name="${name}"]`);
  return normalizeBaseUrl(node?.getAttribute("content"));
}

function resolveApiBaseUrl() {
  const candidates = [];

  const addCandidate = (value) => {
    const normalized = normalizeBaseUrl(value);
    if (normalized && !candidates.includes(normalized)) {
      candidates.push(normalized);
    }
  };

  // Priority 1: Environment variable (injected at build time by Vite)
  addCandidate(import.meta.env?.VITE_API_BASE_URL);
  
  // Priority 2: Global config objects (runtime configuration)
  addCandidate(globalThis?.__APP_CONFIG__?.apiBaseUrl);
  addCandidate(globalThis?.__ENV__?.VITE_API_BASE_URL);
  
  // Priority 3: Meta tag (for production environments)
  addCandidate(readMetaContent("api-base-url"));

  if (typeof window === "undefined") {
    // Server-side rendering fallback
    addCandidate("http://localhost:8080/api");
  } else {
    const { hostname, origin, protocol } = window.location;
    
    // Check if we're in a production environment
    const isProduction = 
      !hostname.includes("localhost") && 
      hostname !== "127.0.0.1" && 
      hostname !== "0.0.0.0" &&
      hostname !== "[::1]";
    
    const isLocalHost =
      origin.includes("localhost") ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "[::1]";
    
    const isRenderPaired = hostname.includes("-app.") && hostname.endsWith(".onrender.com");
    const isAppPrefixed = hostname.startsWith("app.");
    const isWwwPrefixed = hostname.startsWith("www.");

    if (isLocalHost) {
      // Local development: use localhost:8080
      addCandidate("http://localhost:8080/api");
    } else if (isProduction) {
      // Production environments: prioritize same-origin first
      const sameOrigin = `${protocol}//${hostname}/api`;
      
      // For production, ALWAYS try same-origin first (most common VPS setup)
      addCandidate(sameOrigin);
      
      // Then try common production patterns
      if (isRenderPaired) {
        addCandidate(`${protocol}//${hostname.replace("-app.", "-api.")}/api`);
      }
      
      if (isAppPrefixed || isWwwPrefixed) {
        addCandidate(`${protocol}//${hostname.replace(/^app\.|^www\./, "api.")}/api`);
      }
      
      if (!hostname.startsWith("api.")) {
        addCandidate(`${protocol}//api.${hostname}/api`);
      }
      
      // Last resort: try relative path
      addCandidate("/api");
    } else {
      // Other environments (staging, etc.)
      const sameHost = `${protocol}//${hostname}/api`;
      addCandidate(sameHost);
      
      if (isRenderPaired) {
        addCandidate(`${protocol}//${hostname.replace("-app.", "-api.")}/api`);
      }
      
      if (isAppPrefixed || isWwwPrefixed) {
        addCandidate(`${protocol}//${hostname.replace(/^app\.|^www\./, "api.")}/api`);
      }
      
      if (!hostname.startsWith("api.")) {
        addCandidate(`${protocol}//api.${hostname}/api`);
      }
      
      addCandidate("/api");
    }
  }

  const resolved = candidates[0] ?? "/api";
  
  // Only log in development or when explicitly debugging
  if (typeof window !== "undefined" && typeof console !== "undefined") {
    const isDev = import.meta.env?.DEV;
    
    if (isDev) {
      console.log(`[Invisphere API] Resolved URL: ${resolved}`);
      console.log(`[Invisphere API] All candidates:`, candidates);
    }
  }

  return resolved;
}

const API_BASE_URL = resolveApiBaseUrl();

const ENABLE_MOCK = false;

const STORAGE_KEY = "xfa_mock_state_v2";
export const MOCK_STORAGE_KEY = STORAGE_KEY;

function clone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function generateId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6)
    .toString(36)
    .padStart(4, "0")}`;
}

let inMemoryAuthToken = null;

function setAuthToken(token) {
  inMemoryAuthToken = token ?? null;
  
  if (typeof window === "undefined") {
    return;
  }
  
  // Multi-layer storage strategy for mobile compatibility
  const tokenValue = token ?? null;
  let storageSuccess = false;
  
  // Try localStorage first (best for desktop and most mobile browsers)
  if (IS_LOCAL_STORAGE_AVAILABLE) {
    try {
      if (tokenValue) {
        window.localStorage.setItem("auth_token", tokenValue);
        window.localStorage.setItem("authToken", tokenValue);
        storageSuccess = true;
      } else {
        window.localStorage.removeItem("auth_token");
        window.localStorage.removeItem("authToken");
        storageSuccess = true;
      }
    } catch (storageError) {
      logger.warn("localStorage failed, trying sessionStorage", storageError);
    }
  }
  
  // Fallback to sessionStorage (works in iOS Safari private mode)
  if (!storageSuccess && IS_SESSION_STORAGE_AVAILABLE) {
    try {
      if (tokenValue) {
        window.sessionStorage.setItem("auth_token", tokenValue);
        window.sessionStorage.setItem("authToken", tokenValue);
        storageSuccess = true;
        logger.info("Using sessionStorage for auth token (localStorage unavailable)");
      } else {
        window.sessionStorage.removeItem("auth_token");
        window.sessionStorage.removeItem("authToken");
        storageSuccess = true;
      }
    } catch (storageError) {
      logger.warn("sessionStorage also failed, using in-memory only", storageError);
    }
  }
  
  // For mobile browsers, sync to sessionStorage as backup
  if (IS_MOBILE && storageSuccess && tokenValue && IS_SESSION_STORAGE_AVAILABLE) {
    try {
      window.sessionStorage.setItem("auth_token", tokenValue);
      window.sessionStorage.setItem("authToken", tokenValue);
    } catch (error) {
      logger.debug("Session storage backup write failed", {
        message: error?.message,
      });
    }
  }
  
  if (!storageSuccess && tokenValue) {
    logger.warn("Unable to persist auth token - using in-memory only (will be lost on page refresh)");
  }
}

function getAuthToken() {
  if (typeof window === "undefined") {
    return inMemoryAuthToken;
  }
  
  let token = null;
  
  // Try localStorage first
  if (IS_LOCAL_STORAGE_AVAILABLE) {
    try {
      token = window.localStorage.getItem("auth_token") ?? window.localStorage.getItem("authToken");
      if (token) {
        inMemoryAuthToken = token;
        return token;
      }
    } catch (storageError) {
      logger.warn("Unable to read from localStorage", storageError);
    }
  }
  
  // Fallback to sessionStorage (iOS Safari private mode)
  if (IS_SESSION_STORAGE_AVAILABLE) {
    try {
      token = window.sessionStorage.getItem("auth_token") ?? window.sessionStorage.getItem("authToken");
      if (token) {
        inMemoryAuthToken = token;
        return token;
      }
    } catch (storageError) {
      logger.warn("Unable to read from sessionStorage", storageError);
    }
  }
  
  // Last resort: in-memory token
  return inMemoryAuthToken;
}

const DEFAULT_STATE = (() => {
  const baseSummary = {
    totalValue: 148_532,
    totalReturn: 18.4,
    dailyChange: 2.1,
    netDeposits: 95_000,
  };
  const baseWallet = {
    balance: 32_540,
    totalDeposited: 97_500,
    totalWithdrawn: 64_960,
    earningRate: 6.2,
  };
  const basePositions = [
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
  const baseTransactions = [
    {
      id: "txn-2591",
      type: "Deposit",
      asset: "USD",
      symbol: "USD",
      amount: 25_000,
      price: 1,
      total: 25_000,
      status: "completed",
      direction: "in",
      method: "wire",
      requestedAt: "2025-10-07T08:00:00Z",
      completedAt: "2025-10-07T09:12:00Z",
    },
    {
      id: "txn-2590",
      type: "Buy",
      asset: "Bitcoin",
      symbol: "BTC",
      amount: 0.24,
      price: 67_800,
      total: 16_272,
      status: "completed",
      direction: "out",
      requestedAt: "2025-10-09T13:45:00Z",
      completedAt: "2025-10-09T13:47:00Z",
    },
    {
      id: "txn-2589",
      type: "Stake",
      asset: "Solana",
      symbol: "SOL",
      amount: 120,
      price: 188,
      total: 22_560,
      status: "completed",
      direction: "out",
      requestedAt: "2025-10-08T18:30:00Z",
      completedAt: "2025-10-08T18:33:00Z",
    },
    {
      id: "txn-2588",
      type: "Withdrawal",
      asset: "USD",
      symbol: "USD",
      amount: 10_000,
      price: 1,
      total: 10_000,
      status: "completed",
      direction: "out",
      method: "bank_transfer",
      requestedAt: "2025-10-05T10:00:00Z",
      completedAt: "2025-10-05T14:00:00Z",
    },
  ];
  const baseVerification = [
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
  ];
  const baseDailyPnl = [
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
  ].map((entry) => ({
    id: generateId("pnl"),
    ...entry,
  }));

  const accounts = {
    "user-1": {
      summary: clone(baseSummary),
      wallet: clone(baseWallet),
      positions: clone(basePositions),
      transactions: clone(baseTransactions),
      verification: clone(baseVerification),
      dailyPnl: clone(baseDailyPnl),
    },
    "user-2": {
      summary: { totalValue: 92_320, totalReturn: 12.8, dailyChange: -0.8, netDeposits: 70_000 },
      wallet: { balance: 18_540, totalDeposited: 75_000, totalWithdrawn: 56_460, earningRate: 5.4 },
      positions: clone(basePositions).map((position, index) => ({
        ...position,
        allocation: [35, 30, 20, 10, 5][index],
      })),
      transactions: clone(baseTransactions).map((tx) => ({ ...tx, id: `${tx.id}-p2` })),
      verification: clone(baseVerification),
      dailyPnl: clone(baseDailyPnl),
    },
    "user-3": {
      summary: { totalValue: 212_410, totalReturn: 22.1, dailyChange: 3.2, netDeposits: 150_000 },
      wallet: { balance: 54_800, totalDeposited: 160_000, totalWithdrawn: 105_200, earningRate: 7.8 },
      positions: clone(basePositions).map((position, index) => ({
        ...position,
        allocation: [28, 34, 22, 8, 8][index],
      })),
      transactions: clone(baseTransactions).map((tx) => ({ ...tx, id: `${tx.id}-p3` })),
      verification: clone(baseVerification),
      dailyPnl: clone(baseDailyPnl),
    },
    "admin-1": {
      summary: { totalValue: 0, totalReturn: 0, dailyChange: 0, netDeposits: 0 },
      wallet: { balance: 0, totalDeposited: 0, totalWithdrawn: 0, earningRate: 0 },
      positions: [],
      transactions: [],
      verification: [],
      dailyPnl: [],
    },
  };

  const users = [
    {
      id: "user-1",
      email: "demo@x-fa.com",
      password: "demo123",
      firstName: "Demo",
      lastName: "User",
      country: "United States",
      role: "user",
      createdAt: "2007-03-12T10:00:00Z",
      bonusPoints: 1_280,
      verificationStatus: "approved",
      membership: "Premier Private Client",
    },
    {
      id: "user-2",
      email: "portfolio@x-fa.com",
      password: "portfolio123",
      firstName: "Morgan",
      lastName: "Blake",
      country: "United Kingdom",
      role: "user",
      createdAt: "2012-07-01T12:00:00Z",
      bonusPoints: 860,
      verificationStatus: "approved",
      membership: "Institutional Desk",
    },
    {
      id: "user-3",
      email: "yield@x-fa.com",
      password: "yield123",
      firstName: "Casey",
      lastName: "Rivera",
      country: "Singapore",
      role: "user",
      createdAt: "2018-11-20T08:30:00Z",
      bonusPoints: 1_540,
      verificationStatus: "approved",
      membership: "Yield Strategies",
    },
    {
      id: "admin-1",
      email: "admin@x-fa.com",
      password: "XFAadmin2026!",
      firstName: "Alex",
      lastName: "Hayes",
      country: "Switzerland",
      role: "admin",
      createdAt: "2005-01-01T00:00:00Z",
      bonusPoints: 0,
      verificationStatus: "approved",
      membership: "XFA Operations",
    },
  ];

  const tokens = [
    { id: "btc", symbol: "BTC", name: "Bitcoin", price: 68_215, change: 2.84, marketCap: 1_342_000_000_000 },
    { id: "eth", symbol: "ETH", name: "Ethereum", price: 3_620, change: 1.63, marketCap: 435_000_000_000 },
    { id: "sol", symbol: "SOL", name: "Solana", price: 189, change: -0.42, marketCap: 84_200_000_000 },
  ];

  const verificationHistory = [];
  const notifications = [];

  const content = [
    {
      id: generateId("content"),
      key: "nav.brand",
      locale: "en",
      value: "XFA",
      description: "Primary brand label shown in the top navigation.",
    },
    {
      id: generateId("content"),
      key: "nav.links.dashboard",
      locale: "en",
      value: "Dashboard",
      description: "Navigation label for dashboard link.",
    },
    {
      id: generateId("content"),
      key: "nav.links.market",
      locale: "en",
      value: "Markets",
      description: "Navigation label for market overview.",
    },
    {
      id: generateId("content"),
      key: "nav.links.portfolio",
      locale: "en",
      value: "Portfolio",
      description: "Navigation label for portfolio view.",
    },
    {
      id: generateId("content"),
      key: "nav.links.pnl",
      locale: "en",
      value: "Daily P&L",
      description: "Navigation label for daily profit and loss.",
    },
    {
      id: generateId("content"),
      key: "nav.links.support",
      locale: "en",
      value: "Support",
      description: "Navigation label for support/help center.",
    },
    {
      id: generateId("content"),
      key: "nav.actions.login",
      locale: "en",
      value: "Login",
      description: "Primary login button copy.",
    },
    {
      id: generateId("content"),
      key: "nav.actions.signup",
      locale: "en",
      value: "Get Started",
      description: "Primary signup button copy.",
    },
    {
      id: generateId("content"),
      key: "nav.links.admin",
      locale: "en",
      value: "Admin",
      description: "Navigation label for admin dashboard entry.",
    },
    {
      id: generateId("content"),
      key: "auth.login.title",
      locale: "en",
      value: "Welcome back",
      description: "Login page primary heading.",
    },
    {
      id: generateId("content"),
      key: "auth.login.subtitle",
      locale: "en",
      value: "Sign in with your XFA credentials to access your workspace.",
      description: "Login page subheading.",
    },
    {
      id: generateId("content"),
      key: "auth.login.submit",
      locale: "en",
      value: "Sign in",
      description: "Login button label.",
    },
    {
      id: generateId("content"),
      key: "auth.login.keepSignedIn",
      locale: "en",
      value: "Keep me signed in",
      description: "Checkbox copy for persistent login.",
    },
    {
      id: generateId("content"),
      key: "auth.login.forgotPassword",
      locale: "en",
      value: "Forgot password?",
      description: "Forgot password link copy.",
    },
    {
      id: generateId("content"),
      key: "auth.login.noAccount",
      locale: "en",
      value: "Don't have an account?",
      description: "Prompt for account creation on login page.",
    },
    {
      id: generateId("content"),
      key: "auth.login.createAccount",
      locale: "en",
      value: "Create one",
      description: "Signup link label on login page.",
    },
    {
      id: generateId("content"),
      key: "footer.resources.knowledge",
      locale: "en",
      value: "Knowledge Base",
      description: "Footer link for knowledge base resources.",
    },
    {
      id: generateId("content"),
      key: "footer.resources.community",
      locale: "en",
      value: "Community",
      description: "Footer link for community section.",
    },
    {
      id: generateId("content"),
      key: "footer.platform.dashboard",
      locale: "en",
      value: "Dashboard",
      description: "Footer link for dashboard navigation.",
    },
    {
      id: generateId("content"),
      key: "footer.platform.portfolio",
      locale: "en",
      value: "Portfolio",
      description: "Footer link for portfolio navigation.",
    },
    {
      id: generateId("content"),
      key: "footer.platform.market",
      locale: "en",
      value: "Markets",
      description: "Footer link for markets navigation.",
    },
    {
      id: generateId("content"),
      key: "footer.resources.viewCertificate",
      locale: "en",
      value: "View Certificate",
      description: "Footer link for compliance certificate.",
    },
    {
      id: generateId("content"),
      key: "footer.support.status",
      locale: "en",
      value: "Status",
      description: "Footer link to status page.",
    },
    {
      id: generateId("content"),
      key: "footer.support.help",
      locale: "en",
      value: "Help Center",
      description: "Footer link to help center.",
    },
    {
      id: generateId("content"),
      key: "footer.support.security",
      locale: "en",
      value: "Security",
      description: "Footer link to security page.",
    },
  ];

  return { users, accounts, tokens, content, verificationHistory, notifications };
})();

function createNotificationFor(state, userId, { type = "info", title = "", body = "", meta = {} } = {}) {
  const note = {
    id: generateId("note"),
    userId: userId,
    type,
    title,
    body,
    meta: clone(meta),
    read: false,
    createdAt: new Date().toISOString(),
  };
  if (!Array.isArray(state.notifications)) state.notifications = [];
  state.notifications.unshift(note);
  return note;
}

function getState() {
  if (typeof window === "undefined") {
    return clone(DEFAULT_STATE);
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (error) {
    logger.warn("Failed to parse Invisphere state", error);
  }
  const initial = clone(DEFAULT_STATE);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function setState(next) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
}

function withState(mutator) {
  const current = getState();
  const result = mutator(current) ?? current;
  setState(result);
  return clone(result);
}

function getActiveUserId() {
  if (typeof window === "undefined") return null;
  
  let userId = null;
  
  // Try localStorage first
  if (IS_LOCAL_STORAGE_AVAILABLE) {
    try {
      userId = window.localStorage.getItem("authUserId");
      if (userId) return userId;
    } catch (e) {
      logger.warn("Unable to read authUserId from localStorage", e);
    }
  }
  
  // Fallback to sessionStorage
  if (IS_SESSION_STORAGE_AVAILABLE) {
    try {
      userId = window.sessionStorage.getItem("authUserId");
      if (userId) return userId;
    } catch (e) {
      logger.warn("Unable to read authUserId from sessionStorage", e);
    }
  }
  
  return null;
}

function setActiveUserSession(user, token, refreshToken = null, refreshExpiresAt = null) {
  setAuthToken(token);
  
  if (typeof window === "undefined") return;
  
  // Helper to set item with fallback
  const setStorageItem = (key, value) => {
    let stored = false;
    
    // Try localStorage
    if (IS_LOCAL_STORAGE_AVAILABLE) {
      try {
        window.localStorage.setItem(key, value);
        stored = true;
      } catch (e) {
        logger.warn(`localStorage.setItem(${key}) failed`, e);
      }
    }
    
    // Fallback to sessionStorage
    if (!stored && IS_SESSION_STORAGE_AVAILABLE) {
      try {
        window.sessionStorage.setItem(key, value);
        stored = true;
      } catch (e) {
        logger.warn(`sessionStorage.setItem(${key}) failed`, e);
      }
    }
    
    // For mobile, always try to sync to sessionStorage as backup
    if (IS_MOBILE && stored && IS_SESSION_STORAGE_AVAILABLE) {
      try {
        window.sessionStorage.setItem(key, value);
      } catch (error) {
        logger.debug("Session storage mirror write failed", {
          key,
          message: error?.message,
        });
      }
    }
    
    return stored;
  };
  
  // Helper to remove item from all storage
  const removeStorageItem = (key) => {
    if (IS_LOCAL_STORAGE_AVAILABLE) {
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        logger.debug(`localStorage.removeItem(${key}) failed`, {
          message: error?.message,
        });
      }
    }
    if (IS_SESSION_STORAGE_AVAILABLE) {
      try {
        window.sessionStorage.removeItem(key);
      } catch (error) {
        logger.debug(`sessionStorage.removeItem(${key}) failed`, {
          message: error?.message,
        });
      }
    }
  };
  
  try {
    // Store token, userId, and refresh token for session management
    setStorageItem("authToken", token);
    setStorageItem("authUserId", user.id);
    
    // Store refresh token and expiration if provided
    if (refreshToken) {
      setStorageItem("refreshToken", refreshToken);
      if (refreshExpiresAt) {
        setStorageItem("refreshExpiresAt", refreshExpiresAt);
      }
    }
    
    // Clean up legacy user object storage
    removeStorageItem("auth_user");
    removeStorageItem("user");
    
    logger.info("User session stored successfully", { 
      userId: user.id,
      hasRefreshToken: !!refreshToken,
      storageType: IS_LOCAL_STORAGE_AVAILABLE ? "localStorage" : (IS_SESSION_STORAGE_AVAILABLE ? "sessionStorage" : "in-memory")
    });
  } catch (storageError) {
    logger.error("Unable to persist auth session", storageError);
  }
}

function requireUser(state, userId) {
  const user = state.users.find((item) => item.id === userId);
  if (!user) {
    throw new Error("AUTH_REQUIRED");
  }
  return user;
}

function requireAccount(state, userId) {
  const account = state.accounts[userId];
  if (!account) {
    throw new Error("ACCOUNT_NOT_FOUND");
  }
  return account;
}

function addDailyPnlEntry(account, { date, realized = 0, unrealized = 0, notes = "" } = {}) {
  if (!account) return null;
  const entry = {
    id: generateId("pnl"),
    date: date ?? new Date().toISOString().split("T")[0],
    realized: Number(realized) || 0,
    unrealized: Number(unrealized) || 0,
    notes: notes ?? "",
  };
  const existing = Array.isArray(account.dailyPnl) ? account.dailyPnl : [];
  account.dailyPnl = [entry, ...existing].slice(0, 120);
  return entry;
}

function createPendingTransaction(type, payload) {
  return {
    id: generateId("txn"),
    type,
    asset: payload.asset ?? payload.assetName ?? (payload.symbol ?? "USD"),
    symbol: payload.symbol ?? (payload.assetSymbol ?? "USD"),
    amount: Number(payload.amount ?? 0),
    price: Number(payload.price ?? 1),
    total: Number(payload.total ?? payload.amount ?? 0),
    status: "pending",
    direction: payload.direction ?? (type === "Deposit" ? "in" : "out"),
    method: payload.method ?? (type === "Deposit" ? "crypto" : undefined),
    reference: payload.reference,
    destination: payload.destination,
    memo: payload.memo,
    walletAddress: payload.walletAddress,
    walletLabel: payload.walletLabel,
    network: payload.network,
    metadata: (() => {
      const meta = { ...(payload.metadata ?? payload.meta ?? {}) };
      if (payload.cryptoAmount !== undefined) {
        meta.cryptoAmount = Number(payload.cryptoAmount);
      }
      if (payload.fiatAmount !== undefined) {
        meta.fiatAmount = Number(payload.fiatAmount);
      }
      if (payload.walletLabel && !meta.walletLabel) {
        meta.walletLabel = payload.walletLabel;
      }
      if (payload.walletAddress && !meta.walletAddress) {
        meta.walletAddress = payload.walletAddress;
      }
      if (payload.network && !meta.network) {
        meta.network = payload.network;
      }
      return Object.keys(meta).length ? meta : undefined;
    })(),
    requestedAt: new Date().toISOString(),
  };
}

function applyCompletedTransaction(account, transaction) {
  const amount = Number(transaction.total ?? transaction.amount ?? 0);
  const formattedAmount = Number.isFinite(amount)
    ? amount.toLocaleString("en-US", { style: "currency", currency: "USD" })
    : String(amount ?? 0);
  if (transaction.type === "Deposit") {
    account.wallet.balance += amount;
    account.wallet.totalDeposited += amount;
    account.summary.totalValue += amount;
    account.summary.netDeposits += amount;
    addDailyPnlEntry(account, {
      notes: `Treasury cleared deposit ${transaction.symbol ?? ""} (${formattedAmount})`,
      realized: 0,
      unrealized: 0,
    });
  } else if (transaction.type === "Withdrawal" || transaction.type === "Transfer") {
    if (account.wallet.balance < amount) {
      throw new Error("Insufficient balance to approve transaction.");
    }
    account.wallet.balance -= amount;
    if (transaction.type === "Withdrawal") {
      account.wallet.totalWithdrawn += amount;
    }
    account.summary.totalValue = Math.max(account.summary.totalValue - amount, 0);
    addDailyPnlEntry(account, {
      notes: `Treasury processed ${transaction.type.toLowerCase()} ${transaction.symbol ?? ""} (${formattedAmount})`,
      realized: 0,
      unrealized: 0,
    });
  }
  else if (transaction.type === "Investment" || transaction.type === "Buy") {
    // Approve an investment: create a portfolio position and update summary
    const amount = Number(transaction.total ?? transaction.amount ?? 0) || 0;
    const planId = transaction.metadata?.planId ?? transaction.reference ?? transaction.symbol ?? "investment";
    const planTitle = transaction.metadata?.planTitle ?? transaction.asset ?? "Investment";
    const position = {
      id: generateId("pos"),
      name: String(planTitle),
      symbol: String(planId).toUpperCase(),
      allocation: 0,
      amount: Number(transaction.amount ?? transaction.total) || 0,
      currentValue: amount,
      pnl: 0,
      pnlPercent: 0,
    };
    account.positions = [position, ...(Array.isArray(account.positions) ? account.positions : [])];
    account.summary.totalValue = (Number(account.summary.totalValue) || 0) + amount;
    account.wallet.totalDeposited = (Number(account.wallet.totalDeposited) || 0) + amount;
    addDailyPnlEntry(account, {
      notes: `Investment approved: ${planTitle} (${position.symbol}) for ${amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}`,
      realized: 0,
      unrealized: 0,
    });
  }
}

export async function createInvestment(payload) {
  if (ENABLE_MOCK) {
    const normalized = {
      amount: Number(payload.amount) || 0,
      total: Number(payload.amount) || 0,
      assetName: payload.assetName ?? payload.planTitle ?? "Investment",
      assetSymbol: payload.assetSymbol ?? payload.planId ?? "INV",
      walletAddress: payload.walletAddress,
      walletLabel: payload.walletLabel,
      network: payload.network,
      metadata: {
        planId: payload.planId,
        planTitle: payload.planTitle ?? payload.assetName,
        cryptoAmount: payload.cryptoAmount,
        transactionHash: payload.transactionHash,
      },
    };
    const { state, user, account } = ensureAuthenticatedState();
    if (user.role === "admin") {
      throw new Error("Admins cannot create investments.");
    }
    const transaction = createPendingTransaction("Investment", normalized);
    account.transactions.unshift(transaction);
    addDailyPnlEntry(account, {
      notes: `Investment instruction submitted for ${normalized.metadata.planTitle ?? normalized.assetSymbol}`,
      realized: 0,
      unrealized: 0,
    });
    // create a user-facing notification that the payment is pending
    createNotificationFor(state, user.id, {
      type: "pending",
      title: "Payment pending",
      body: `Your investment instruction for ${normalized.metadata.planTitle ?? normalized.assetSymbol} is pending approval by the treasury.`,
      meta: { transactionId: transaction.id, planId: normalized.metadata.planId },
    });
    state.accounts[user.id] = account;
    setState(state);
    await delay(220);
    return buildDashboardPayload(user, account);
  }
  return networkRequest("investments/create", { method: "POST", body: JSON.stringify(payload) });
}

function findTransaction(state, transactionId) {
  for (const user of state.users) {
    const account = state.accounts[user.id];
    if (!account) continue;
    const index = account.transactions.findIndex((tx) => tx.id === transactionId);
    if (index !== -1) {
      return { user, account, index, transaction: account.transactions[index] };
    }
  }
  return null;
}

function listPendingTransactions(state) {
  const pending = [];
  for (const user of state.users) {
    if (user.role === "admin") continue;
    const account = state.accounts[user.id];
    if (!account) continue;
    account.transactions
      .filter((tx) => tx.status === "pending")
      .forEach((tx) => {
        pending.push({
          userId: user.id,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          transaction: tx,
        });
      });
  }
  return pending.sort(
    (a, b) => new Date(b.transaction.requestedAt).getTime() - new Date(a.transaction.requestedAt).getTime(),
  );
}

function buildDashboardPayload(user, account) {
  const pendingTransactions = account.transactions.filter((tx) => tx.status === "pending");
  const globalState = getState();
  const notificationsForUser = Array.isArray(globalState?.notifications)
    ? globalState.notifications.filter((n) => n.userId === user.id)
    : [];
  return {
    user: clone({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? "",
      timezone: user.timezone ?? "UTC",
      country: user.country,
      role: user.role,
      createdAt: user.createdAt,
      bonusPoints: user.bonusPoints ?? 0,
      verificationStatus: user.verificationStatus ?? "pending",
      membership: user.membership,
    }),
    summary: clone(account.summary),
    wallet: clone(account.wallet),
    positions: clone(account.positions),
    transactions: clone(account.transactions),
    verification: clone(account.verification),
    dailyPnl: clone(account.dailyPnl),
    pendingTransactions: clone(pendingTransactions),
    notifications: clone(notificationsForUser ?? []),
  };
}

function ensureAuthenticatedState() {
  const userId = getActiveUserId();
  if (!userId) {
    throw new Error("AUTH_REQUIRED");
  }
  const state = getState();
  const user = requireUser(state, userId);
  const account = requireAccount(state, userId);
  return { state, user, account };
}

// ---------- Public API (mock + network) ----------

export async function login(payload) {
  // All logins should go through the API so server-side authentication and
  // admin seeding are authoritative. The client must not special-case admin
  // credentials here.
  const response = await networkRequest("auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (typeof window !== "undefined") {
    setActiveUserSession(
      response.user, 
      response.token,
      response.refreshToken,
      response.refreshExpiresAt
    );
  }
  return response;
}

export async function refreshAccessToken() {
  if (typeof window === "undefined") {
    throw new Error("Cannot refresh token in non-browser environment");
  }

  // Try to get refresh token from storage fallback chain
  let refreshToken = null;
  
  if (IS_LOCAL_STORAGE_AVAILABLE) {
    try {
      refreshToken = window.localStorage.getItem("refreshToken");
    } catch (e) {
      logger.warn("Unable to read refreshToken from localStorage", e);
    }
  }
  
  if (!refreshToken && IS_SESSION_STORAGE_AVAILABLE) {
    try {
      refreshToken = window.sessionStorage.getItem("refreshToken");
    } catch (e) {
      logger.warn("Unable to read refreshToken from sessionStorage", e);
    }
  }
  
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  try {
    const response = await networkRequest("auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });

    // Update the access token
    if (response.token) {
      setAuthToken(response.token);
      logger.info("Access token refreshed successfully");
    }

    return response;
  } catch (error) {
    // If refresh fails, clear all auth data from all storage types
    logger.error("Failed to refresh access token", error);
    
    const keysToRemove = [
      "auth_token",
      "authToken",
      "refreshToken",
      "refreshExpiresAt",
      "authUserId",
      "auth_user_cache"
    ];
    
    // Clear from localStorage
    if (IS_LOCAL_STORAGE_AVAILABLE) {
      keysToRemove.forEach(key => {
        try {
          window.localStorage.removeItem(key);
        } catch (error) {
          logger.debug(`localStorage.removeItem(${key}) failed during refresh cleanup`, {
            message: error?.message,
          });
        }
      });
    }
    
    // Clear from sessionStorage
    if (IS_SESSION_STORAGE_AVAILABLE) {
      keysToRemove.forEach(key => {
        try {
          window.sessionStorage.removeItem(key);
        } catch (error) {
          logger.debug(`sessionStorage.removeItem(${key}) failed during refresh cleanup`, {
            message: error?.message,
          });
        }
      });
    }
    
    // Clear in-memory token
    inMemoryAuthToken = null;
    
    throw error;
  }
}

export async function signup(payload) {
  if (ENABLE_MOCK) {
    const nextState = withState((state) => {
      const id = generateId("user");
      const user = {
        id,
        email: payload.email.toLowerCase(),
        password: payload.password,
        firstName: payload.firstName ?? "New",
        lastName: payload.lastName ?? "Investor",
        country: payload.country ?? "",
        phone: payload.phone ?? "",
        timezone: payload.timezone ?? "UTC",
        role: "user",
        createdAt: new Date().toISOString(),
        bonusPoints: 0,
        verificationStatus: "pending",
        membership: "Unassigned",
      };

      state.users.push(user);
      state.accounts[id] = {
        summary: { totalValue: 0, totalReturn: 0, dailyChange: 0, netDeposits: 0 },
        wallet: { balance: 0, totalDeposited: 0, totalWithdrawn: 0, earningRate: 0 },
        positions: [],
        transactions: [],
        verification: [],
        dailyPnl: [],
      };
      return state;
    });

    const user = nextState.users.find((candidate) => candidate.email === payload.email.toLowerCase());
    const token = `mock-token-${user.id}-${Date.now()}`;
    setActiveUserSession(user, token);
    await delay();
    return { token, user: buildDashboardPayload(user, nextState.accounts[user.id]).user };
  }

  const response = await networkRequest("auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (typeof window !== "undefined") {
    setActiveUserSession(
      response.user, 
      response.token, 
      response.refreshToken, 
      response.refreshExpiresAt
    );
  }
  return response;
}

export async function requestPasswordReset(email) {
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  if (ENABLE_MOCK) {
    await delay(100);
    return { message: "If the account exists, password reset instructions have been sent." };
  }

  return networkRequest("auth/password/forgot", {
    method: "POST",
    body: JSON.stringify({ email: normalizedEmail }),
  });
}

export async function resetPassword({ token, password }) {
  if (!token) {
    throw new Error("Reset token is required.");
  }
  if (!password) {
    throw new Error("Password is required.");
  }

  if (ENABLE_MOCK) {
    await delay(100);
    return { message: "Password has been reset successfully." };
  }

  return networkRequest("auth/password/reset", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export async function fetchUserProfile() {
  if (ENABLE_MOCK) {
    const { user } = ensureAuthenticatedState();
    await delay(150);
    return { user: buildDashboardPayload(user, getState().accounts[user.id]).user };
  }
  return networkRequest("user/profile");
}

export async function fetchDashboardSummary() {
  if (ENABLE_MOCK) {
    const { user, account } = ensureAuthenticatedState();
    await delay(180);
    return buildDashboardPayload(user, account);
  }
  return networkRequest("dashboard/summary");
}

export async function fetchMarketTop() {
  if (ENABLE_MOCK) {
    const state = getState();
    const baseAssets = state.tokens.map((token) => ({
      id: token.id,
      symbol: token.symbol,
      name: token.name,
      currentPrice: token.price,
      priceChangePercentage24h: token.change,
      marketCap: token.marketCap,
      totalVolume: token.volume ?? 0,
    }));
    await delay(160);
    return baseAssets;
  }
  const response = await networkRequest("market/top");
  return response.assets;
}

export async function fetchStockQuotes({ symbols } = {}) {
  const list = Array.isArray(symbols) ? symbols.filter(Boolean) : null;
  if (ENABLE_MOCK) {
    if (!list || list.length === 0) {
      return DEFAULT_STOCK_QUOTES;
    }
    const upper = list.map((item) => item.toUpperCase());
    return DEFAULT_STOCK_QUOTES.filter((quote) => upper.includes(quote.symbol));
  }
  const params = new URLSearchParams();
  if (list && list.length > 0) {
    params.set("symbols", list.join(","));
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const response = await networkRequest(`market/stocks/quotes${suffix}`);
  return Array.isArray(response?.quotes) ? response.quotes : [];
}

export async function fetchStockHistory(symbol, range = "1mo") {
  if (!symbol) {
    throw new Error("Symbol is required.");
  }
  if (ENABLE_MOCK) {
    const history =
      DEFAULT_STOCK_HISTORY[symbol.toUpperCase()] ?? DEFAULT_STOCK_HISTORY.AAPL;
    return {
      ...history,
      symbol: symbol.toUpperCase(),
      range,
    };
  }
  const params = new URLSearchParams({ range });
  return networkRequest(`market/stocks/${encodeURIComponent(symbol)}/history?${params.toString()}`);
}

export async function logPnlEntry(entry) {
  if (ENABLE_MOCK) {
    const { state, user, account } = ensureAuthenticatedState();
    if (user.role === "admin") {
      throw new Error("Admins cannot record P&L entries.");
    }
    addDailyPnlEntry(account, {
      date: entry.date,
      realized: entry.realized,
      unrealized: entry.unrealized,
      notes: entry.notes,
    });
    state.accounts[user.id] = account;
    setState(state);
    await delay(150);
    return clone(account.dailyPnl);
  }
  const response = await networkRequest("analytics/daily-pnl", {
    method: "POST",
    body: JSON.stringify(entry),
  });
  return response.entries;
}

export async function updateDailyPnlEntry({ userId, entryId, updates }) {
  if (ENABLE_MOCK) {
    const { state } = await requireAdminState();
    const account = state.accounts[userId];
    if (!account) {
      throw new Error("ACCOUNT_NOT_FOUND");
    }
    const index = account.dailyPnl.findIndex((entry) => entry.id === entryId);
    if (index === -1) {
      throw new Error("PNL_ENTRY_NOT_FOUND");
    }
    const entry = account.dailyPnl[index];
    if (updates?.date) {
      entry.date = updates.date;
    }
    if (typeof updates?.realized !== "undefined") {
      entry.realized = Number(updates.realized) || 0;
    }
    if (typeof updates?.unrealized !== "undefined") {
      entry.unrealized = Number(updates.unrealized) || 0;
    }
    if (typeof updates?.notes !== "undefined") {
      entry.notes = updates.notes ?? "";
    }
    account.dailyPnl.splice(index, 1, entry);
    setState(state);
    await delay(150);
    return fetchAdminOverview();
  }
  return networkRequest("admin/pnl/update", {
    method: "POST",
    body: JSON.stringify({ userId, entryId, updates }),
  });
}

export async function deleteDailyPnlEntry({ userId, entryId }) {
  if (ENABLE_MOCK) {
    const { state } = await requireAdminState();
    const account = state.accounts[userId];
    if (!account) {
      throw new Error("ACCOUNT_NOT_FOUND");
    }
    const index = account.dailyPnl.findIndex((entry) => entry.id === entryId);
    if (index === -1) {
      throw new Error("PNL_ENTRY_NOT_FOUND");
    }
    account.dailyPnl.splice(index, 1);
    setState(state);
    await delay(120);
    return fetchAdminOverview();
  }
  return networkRequest("admin/pnl/delete", {
    method: "POST",
    body: JSON.stringify({ userId, entryId }),
  });
}
export async function submitVerificationDocuments({ files = [], notes = "" } = {}) {
  if (ENABLE_MOCK) {
    const normalizedFiles = files.map((file, index) => ({
      name: file?.name ?? `document-${index + 1}`,
      size: Number(file?.size ?? 0),
      type: file?.type ?? "application/octet-stream",
    }));
    const { state, user, account } = ensureAuthenticatedState();
    if (user.role === "admin") {
      throw new Error("Admins cannot submit verification documents.");
    }
    const eventTimestamp = new Date().toISOString();
    const pendingEvent = {
      id: generateId("verif"),
      title: "Identity verification",
      description: "Documents submitted. Awaiting compliance review.",
      status: "pending",
      timestamp: eventTimestamp,
      files: normalizedFiles,
      notes,
    };
    account.verification = [pendingEvent, ...account.verification];
    const userRecord = state.users.find((candidate) => candidate.id === user.id);
    if (userRecord) {
      // Keep as "pending" until admin approves
      userRecord.verificationStatus = "pending";
    }
    
    // Create notification for user - documents received
    createNotificationFor(state, user.id, {
      type: "info",
      title: "Documents received",
      body: "Your verification documents have been received and are under review by our compliance team. You will be notified once the review is complete.",
      meta: { kind: "verification_submitted" },
    });
    
    state.accounts[user.id] = account;
    const historyEntry = {
      id: generateId("verif-history"),
      userId: user.id,
      email: user.email,
      action: "submitted",
      status: "pending",
      timestamp: eventTimestamp,
      files: normalizedFiles,
      notes,
    };
    state.verificationHistory = [
      historyEntry,
      ...(state.verificationHistory ?? []),
    ].slice(0, 100);
    setState(state);
    await delay(180);
    return buildDashboardPayload(user, account);
  }
  const formData = new FormData();
  files.forEach((file) => {
    if (file) {
      formData.append("documents", file, file.name ?? "document.pdf");
    }
  });
  if (notes) {
    formData.append("notes", notes);
  }
  return networkRequest("verification/documents", {
    method: "POST",
    body: formData,
  });
}

export async function uploadTransactionScreenshots(transactionId, { files = [], notes = "" } = {}) {
  if (!transactionId) {
    throw new Error("TRANSACTION_ID_REQUIRED");
  }
  if (ENABLE_MOCK) {
    // Reuse submitVerificationDocuments mock path but include transaction id in notes
    return submitVerificationDocuments({ files, notes: `${notes} (transaction:${transactionId})` });
  }
  const formData = new FormData();
  files.forEach((file) => {
    if (file) {
      formData.append("documents", file, file.name ?? "screenshot.png");
    }
  });
  if (notes) formData.append("notes", notes);
  return networkRequest(`verification/transactions/${encodeURIComponent(transactionId)}/documents`, {
    method: "POST",
    body: formData,
  });
}

function normalizeDepositPayload(input = {}) {
  const amount = Number(input.amount ?? input.fiatAmount ?? 0);
  if (Number.isNaN(amount) || amount <= 0) {
    throw new Error("Deposit amount must be greater than zero.");
  }
  const symbol = (input.assetSymbol ?? input.symbol ?? "").toUpperCase();
  const assetName = input.assetName ?? input.asset ?? symbol;
  const cryptoAmount =
    input.cryptoAmount !== undefined
      ? Number(input.cryptoAmount)
      : input.price
        ? Number(input.amount) / Number(input.price)
        : undefined;
  return {
    amount,
    assetSymbol: symbol || "USD",
    assetName,
    walletAddress: input.walletAddress ?? "",
    walletLabel: input.walletLabel ?? "",
    network: input.network ?? "",
    method: input.method ?? "crypto",
    transactionHash: input.transactionHash ?? input.txHash ?? "",
    reference: input.reference ?? "",
    cryptoAmount: Number.isFinite(cryptoAmount) ? Number(cryptoAmount) : undefined,
  };
}

async function recordMockDeposit(payload) {
  const normalized = normalizeDepositPayload(payload);
  const { state, user, account } = ensureAuthenticatedState();
  if (user.role === "admin") {
    throw new Error("Admins cannot initiate deposits.");
  }
  const transaction = createPendingTransaction("Deposit", {
    amount: normalized.amount,
    total: normalized.amount,
    method: "crypto",
    reference: normalized.reference,
    asset: normalized.assetName,
    symbol: normalized.assetSymbol,
    walletAddress: normalized.walletAddress,
    walletLabel: normalized.walletLabel,
    network: normalized.network,
    cryptoAmount: normalized.cryptoAmount,
    metadata: {
      transactionHash: normalized.transactionHash,
    },
  });
  account.transactions.unshift(transaction);
  const formattedAmount = Number.isFinite(normalized.amount)
    ? normalized.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })
    : String(normalized.amount ?? 0);
  addDailyPnlEntry(account, {
    notes: `Deposit instruction (${normalized.assetSymbol}) submitted for ${formattedAmount}`,
    realized: 0,
    unrealized: 0,
  });
  state.accounts[user.id] = account;
  setState(state);
  await delay(220);
  return buildDashboardPayload(user, account);
}

export async function depositFunds(payload) {
  if (ENABLE_MOCK) {
    return recordMockDeposit(payload);
  }
  const normalized = normalizeDepositPayload(payload);
  try {
    const response = await networkRequest("wallet/deposit", {
      method: "POST",
      body: JSON.stringify(normalized),
    });
    // server returns { message, transaction, dashboard }
    return response;
  } catch (error) {
    if (error?.status === 404 || error?.status === 501) {
      logger.warn("Deposit endpoint unavailable, falling back to mock handler", error);
      return recordMockDeposit(payload);
    }
    throw error;
  }
}

export async function markNotificationRead(notificationId) {
  if (ENABLE_MOCK) {
    const state = getState();
    if (!Array.isArray(state.notifications)) return null;
    const index = state.notifications.findIndex((n) => n.id === notificationId);
    if (index === -1) return null;
    state.notifications[index].read = true;
    setState(state);
    await delay(100);
    return state.notifications[index];
  }
  return networkRequest(`notifications/${notificationId}/read`, { method: "POST" });
}

export async function archiveNotification(notificationId) {
  if (ENABLE_MOCK) {
    const state = getState();
    if (!Array.isArray(state.notifications)) return null;
    const index = state.notifications.findIndex((n) => n.id === notificationId);
    if (index === -1) return null;
    state.notifications[index].archived = true;
    state.notifications[index].read = true;
    setState(state);
    await delay(100);
    return state.notifications[index];
  }
  return networkRequest(`notifications/${notificationId}/archive`, { method: "PATCH" });
}

export async function deleteNotification(notificationId) {
  if (ENABLE_MOCK) {
    const state = getState();
    if (!Array.isArray(state.notifications)) return null;
    const index = state.notifications.findIndex((n) => n.id === notificationId);
    if (index === -1) return null;
    state.notifications.splice(index, 1);
    setState(state);
    await delay(100);
    return { success: true };
  }
  return networkRequest(`notifications/${notificationId}`, { method: "DELETE" });
}

export async function clearReadNotifications() {
  if (ENABLE_MOCK) {
    const state = getState();
    if (!Array.isArray(state.notifications)) return { deleted: 0 };
    const initialCount = state.notifications.length;
    state.notifications = state.notifications.filter((n) => !n.read);
    setState(state);
    await delay(100);
    return { success: true, deleted: initialCount - state.notifications.length };
  }
  return networkRequest("notifications/read/clear", { method: "DELETE" });
}

export async function clearArchivedNotifications({ olderThanDays } = {}) {
  if (ENABLE_MOCK) {
    const state = getState();
    if (!Array.isArray(state.notifications)) return { deleted: 0 };
    const cutoffMs =
      Number.isFinite(olderThanDays) && olderThanDays > 0
        ? Date.now() - olderThanDays * 24 * 60 * 60 * 1000
        : null;
    const initialCount = state.notifications.length;
    state.notifications = state.notifications.filter((n) => {
      if (!n.archived) return true;
      if (!cutoffMs) {
        return false;
      }
      const createdAt = new Date(n.createdAt ?? 0).getTime();
      if (Number.isNaN(createdAt)) {
        return false;
      }
      return createdAt > cutoffMs;
    });
    setState(state);
    await delay(100);
    return { success: true, deleted: initialCount - state.notifications.length };
  }
  const params = new URLSearchParams();
  if (Number.isFinite(olderThanDays) && olderThanDays > 0) {
    params.set("olderThanDays", olderThanDays);
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return networkRequest(`notifications/archived/clear${suffix}`, { method: "DELETE" });
}

export async function fetchCryptoDepositOptions() {
  if (ENABLE_MOCK) {
    return clone(DEFAULT_CRYPTO_DEPOSIT_OPTIONS);
  }
  try {
    const response = await networkRequest("wallet/crypto-options");
    if (Array.isArray(response)) {
      return response;
    }
    if (response?.options && Array.isArray(response.options)) {
      return response.options;
    }
  } catch (error) {
    logger.warn("Falling back to default crypto deposit options", error);
  }
  return clone(DEFAULT_CRYPTO_DEPOSIT_OPTIONS);
}

export async function withdrawFunds({ amount, method, reference }) {
  if (ENABLE_MOCK) {
    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error("Amount must be greater than zero.");
    }
    const { state, user, account } = ensureAuthenticatedState();
    if (user.role === "admin") {
      throw new Error("Admins cannot initiate withdrawals.");
    }
    const transaction = createPendingTransaction("Withdrawal", {
      amount: numericAmount,
      method: method ?? "bank_transfer",
      reference,
      direction: "out",
    });
    account.transactions.unshift(transaction);
    // notify user that withdrawal is pending
    createNotificationFor(state, user.id, {
      type: "pending",
      title: "Withdrawal requested",
      body: `Your withdrawal request for ${numericAmount.toLocaleString("en-US", { style: "currency", currency: "USD" })} is pending admin approval.`,
      meta: { transactionId: transaction.id },
    });
    state.accounts[user.id] = account;
    setState(state);
    await delay(200);
    return buildDashboardPayload(user, account);
  }
  return networkRequest("wallet/withdraw", {
    method: "POST",
    body: JSON.stringify({ amount, method, reference }),
  });
}

export async function transferFunds({ amount, destination, memo }) {
  if (ENABLE_MOCK) {
    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error("Amount must be greater than zero.");
    }
    const { state, user, account } = ensureAuthenticatedState();
    if (user.role === "admin") {
      throw new Error("Admins cannot initiate transfers.");
    }
    const transaction = createPendingTransaction("Transfer", {
      amount: numericAmount,
      destination,
      memo,
      direction: "out",
    });
    account.transactions.unshift(transaction);
    state.accounts[user.id] = account;
    setState(state);
    await delay(200);
    return buildDashboardPayload(user, account);
  }
  return networkRequest("wallet/transfer", {
    method: "POST",
    body: JSON.stringify({ amount, destination, memo }),
  });
}

export async function executeTrade(payload) {
  if (ENABLE_MOCK) {
    const { state, user, account } = ensureAuthenticatedState();
    if (user.role === "admin") {
      throw new Error("Admins cannot execute trades.");
    }

    const transaction = createPendingTransaction(payload.side === "sell" ? "Sell" : "Buy", {
      amount: Number(payload.quantity) || 0,
      price: Number(payload.price) || 0,
      asset: payload.name || payload.symbol,
      symbol: payload.symbol,
      metadata: { side: payload.side },
    });

    account.transactions.unshift(transaction);
    createNotificationFor(state, user.id, {
      type: "pending",
      title: `${payload.side === "sell" ? "Sell" : "Buy"} order submitted`,
      body: `Your ${payload.side} order for ${payload.quantity} ${payload.symbol} is pending admin approval.`,
      meta: { transactionId: transaction.id },
    });
    
    state.accounts[user.id] = account;
    setState(state);
    await delay(180);
    return {
      status: "pending",
      message: "Order submitted for admin approval.",
      dashboard: buildDashboardPayload(user, account),
    };
  }
  const response = await networkRequest("trade/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response?.dashboard ?? response;
}

// ---------- Admin functions ----------

async function requireAdminState() {
  const userId = getActiveUserId();
  if (!userId) {
    throw new Error("AUTH_REQUIRED");
  }
  const state = getState();
  const user = requireUser(state, userId);
  if (user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED");
  }
  return { state, admin: user };
}

export async function fetchAdminOverview() {
  if (ENABLE_MOCK) {
    const { state, admin } = await requireAdminState();
    const pending = listPendingTransactions(state);
    const verificationQueue = state.users
      .filter((user) => user.role !== "admin" && user.verificationStatus !== "approved")
      .map((user) => ({
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        verificationStatus: user.verificationStatus,
        createdAt: user.createdAt,
      }));
    const userSummaries = state.users
      .filter((user) => user.role !== "admin")
      .map((user) => ({
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        bonusPoints: user.bonusPoints ?? 0,
        verificationStatus: user.verificationStatus,
        createdAt: user.createdAt,
        membership: user.membership,
        summary: clone(state.accounts[user.id]?.summary ?? {}),
        wallet: clone(state.accounts[user.id]?.wallet ?? {}),
      }));
    await delay(120);
    return {
      admin: {
        id: admin.id,
        email: admin.email,
        name: `${admin.firstName} ${admin.lastName}`,
      },
      pendingTransactions: pending,
      verificationQueue,
      users: userSummaries,
      tokens: clone(state.tokens),
      verificationHistory: clone(state.verificationHistory ?? []),
    };
  }
  return networkRequest("admin/overview");
}

export async function fetchVerificationDocuments(userId) {
  if (!userId) {
    throw new Error("USER_ID_REQUIRED");
  }
  if (ENABLE_MOCK) {
    return { documents: [], events: [] };
  }
  return networkRequest(`admin/verification/${userId}/documents`);
}

export async function approveTransaction({ transactionId, note }) {
  if (ENABLE_MOCK) {
    const { state } = await requireAdminState();
    const located = findTransaction(state, transactionId);
    if (!located) {
      throw new Error("TRANSACTION_NOT_FOUND");
    }
    const { account, transaction } = located;
    if (transaction.status !== "pending") {
      throw new Error("Transaction already resolved.");
    }
    applyCompletedTransaction(account, transaction);
    transaction.status = "completed";
    transaction.adminNote = note ?? "";
    transaction.completedAt = new Date().toISOString();
    // notify the user their transaction was completed
    createNotificationFor(state, located.user.id, {
      type: "success",
      title: "Payment received",
      body: `Your instruction ${transaction.id} has been confirmed by the treasury.`,
      meta: { transactionId: transaction.id },
    });
    setState(state);
    await delay(180);
    return fetchAdminOverview();
  }
  return networkRequest(`admin/transactions/${encodeURIComponent(transactionId)}/approve`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export async function rejectTransaction({ transactionId, reason }) {
  if (ENABLE_MOCK) {
    const { state } = await requireAdminState();
    const located = findTransaction(state, transactionId);
    if (!located) {
      throw new Error("TRANSACTION_NOT_FOUND");
    }
    const { transaction } = located;
    if (transaction.status !== "pending") {
      throw new Error("Transaction already resolved.");
    }
    transaction.status = "rejected";
    transaction.adminNote = reason ?? "";
    transaction.completedAt = new Date().toISOString();
    setState(state);
    await delay(160);
    return fetchAdminOverview();
  }
  return networkRequest(`admin/transactions/${encodeURIComponent(transactionId)}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function approveTradeTransaction({ transactionId, note }) {
  if (!transactionId) {
    throw new Error("TRANSACTION_ID_REQUIRED");
  }
  return networkRequest(`admin/trades/${encodeURIComponent(transactionId)}/approve`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export async function rejectTradeTransaction({ transactionId, reason }) {
  if (!transactionId) {
    throw new Error("TRANSACTION_ID_REQUIRED");
  }
  return networkRequest(`admin/trades/${encodeURIComponent(transactionId)}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function approveDepositTransaction({ transactionId, note }) {
  if (!transactionId) {
    throw new Error("TRANSACTION_ID_REQUIRED");
  }
  return networkRequest(`admin/deposits/${encodeURIComponent(transactionId)}/approve`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export async function rejectDepositTransaction({ transactionId, reason }) {
  if (!transactionId) {
    throw new Error("TRANSACTION_ID_REQUIRED");
  }
  return networkRequest(`admin/deposits/${encodeURIComponent(transactionId)}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function approveInvestmentRequest({ investmentId, note }) {
  if (!investmentId) {
    throw new Error("INVESTMENT_ID_REQUIRED");
  }
  return networkRequest(`admin/investments/${encodeURIComponent(investmentId)}/approve`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export async function rejectInvestmentRequest({ investmentId, reason }) {
  if (!investmentId) {
    throw new Error("INVESTMENT_ID_REQUIRED");
  }
  return networkRequest(`admin/investments/${encodeURIComponent(investmentId)}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function updateUserAccount(userId, updates) {
  if (ENABLE_MOCK) {
    const { state } = await requireAdminState();
    const user = state.users.find((candidate) => candidate.id === userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }
    if (user.role === "admin") {
      throw new Error("Cannot modify admin accounts.");
    }
    const account = state.accounts[userId];
    if (!account) {
      throw new Error("ACCOUNT_NOT_FOUND");
    }
    if (typeof updates.bonusPoints !== "undefined") {
      user.bonusPoints = Number(updates.bonusPoints);
    }
    if (updates.membership) {
      user.membership = updates.membership;
    }
    if (updates.summary) {
      account.summary = { ...account.summary, ...updates.summary };
    }
    if (updates.wallet) {
      account.wallet = { ...account.wallet, ...updates.wallet };
    }
    if (updates.verificationStatus) {
      user.verificationStatus = updates.verificationStatus;
    }
    setState(state);
    await delay(160);
    return fetchAdminOverview();
  }
  return networkRequest(`admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteUser(userId) {
  if (ENABLE_MOCK) {
    const { state } = await requireAdminState();
    const user = state.users.find((candidate) => candidate.id === userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }
    if (user.role === "admin") {
      throw new Error("Cannot delete an admin account.");
    }
    state.users = state.users.filter((candidate) => candidate.id !== userId);
    delete state.accounts[userId];
    setState(state);
    await delay(160);
    return fetchAdminOverview();
  }
  return networkRequest(`admin/users/${userId}`, { method: "DELETE" });
}

export async function approveVerification(userId) {
  if (ENABLE_MOCK) {
    const { state, admin } = await requireAdminState();
    const user = state.users.find((candidate) => candidate.id === userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }
    if (user.verificationStatus === "approved") {
      return fetchAdminOverview();
    }
    user.verificationStatus = "approved";
    const account = state.accounts[userId];
    const approvalTimestamp = new Date().toISOString();
    account.verification.push({
      id: generateId("verif"),
      title: "Verification approved",
      description: "Your account verification has been completed successfully.",
      status: "completed",
      timestamp: approvalTimestamp,
    });
    
    // Create notification for user
    createNotificationFor(state, userId, {
      type: "success",
      title: "Account Verified",
      body: "Congratulations! Your account has been fully verified. You now have access to all platform features and higher transaction limits.",
      meta: { kind: "verification_approved" },
    });
    
    const historyEntry = {
      id: generateId("verif-history"),
      userId,
      email: user.email,
      adminId: admin.id,
      adminEmail: admin.email,
      action: "approved",
      status: "completed",
      timestamp: approvalTimestamp,
    };
    state.verificationHistory = [
      historyEntry,
      ...(state.verificationHistory ?? []),
    ].slice(0, 100);
    setState(state);
    await delay(120);
    return fetchAdminOverview();
  }
  return networkRequest(`admin/users/${userId}/verification`, { method: "POST" });
}

export async function createToken(payload) {
  if (ENABLE_MOCK) {
    const { state } = await requireAdminState();
    state.tokens.push({
      id: generateId("token"),
      symbol: payload.symbol?.toUpperCase() ?? "TKN",
      name: payload.name ?? "New Token",
      price: Number(payload.price ?? 0),
      change: Number(payload.change ?? 0),
      marketCap: Number(payload.marketCap ?? 0),
      volume: Number(payload.volume ?? 0),
    });
    setState(state);
    await delay(140);
    return fetchAdminOverview();
  }
  return networkRequest("admin/tokens", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------- Content management ----------

function normalizeLocale(locale) {
  return (locale ?? "en").toLowerCase();
}

function mergeContentEntries(primary, fallback) {
  const index = new Map();
  for (const entry of fallback) {
    index.set(entry.key, entry);
  }
  for (const entry of primary) {
    index.set(entry.key, entry);
  }
  return Array.from(index.values());
}

function buildLocalSiteContent(locale = "en") {
  const state = getState();
  const active = normalizeLocale(locale);
  const fallback = "en";
  const primary = state.content.filter((entry) => normalizeLocale(entry.locale) === active);
  const fallbackEntries =
    active === fallback
      ? []
      : state.content.filter((entry) => normalizeLocale(entry.locale) === fallback);
  const entries = mergeContentEntries(primary, fallbackEntries).map((entry) => ({
    key: entry.key,
    value: entry.value,
    locale: normalizeLocale(entry.locale),
    description: entry.description ?? "",
  }));
  return { locale: active, entries };
}

export async function fetchSiteContent(locale = "en") {
  if (ENABLE_MOCK) {
    return buildLocalSiteContent(locale);
  }
  const params = new URLSearchParams({ locale });
  try {
    return await networkRequest(`content?${params.toString()}`);
  } catch (error) {
    const isNetworkError = error?.status === 0;
    if (isNetworkError) {
      logger.warn("Site content request failed - using local defaults", {
        locale,
        message: error?.message,
      });
      return buildLocalSiteContent(locale);
    }
    throw error;
  }
}

export async function fetchAdminSiteContent(locale) {
  if (ENABLE_MOCK) {
    const { state } = await requireAdminState();
    const filterLocale = locale ? normalizeLocale(locale) : null;
    const entries = state.content
      .filter((entry) => (filterLocale ? normalizeLocale(entry.locale) === filterLocale : true))
      .map((entry) => ({
        id: entry.id,
        key: entry.key,
        locale: normalizeLocale(entry.locale),
        value: entry.value,
        description: entry.description ?? "",
        tags: entry.tags ?? [],
      }))
      .sort((a, b) => {
        if (a.key === b.key) {
          return a.locale.localeCompare(b.locale);
        }
        return a.key.localeCompare(b.key);
      });
    return { entries, locale: filterLocale };
  }
  const params = new URLSearchParams();
  if (locale) {
    params.set("locale", locale);
  }
  const query = params.toString();
  const suffix = query ? `?${query}` : "";
  return networkRequest(`admin/content${suffix}`);
}

export async function saveSiteContentEntry({ key, value, locale = "en", description = "", tags = [] }) {
  if (!key) {
    throw new Error("Key is required");
  }
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Value must be provided");
  }
  if (ENABLE_MOCK) {
    const { state } = await requireAdminState();
    const normalized = normalizeLocale(locale);
    const entry = state.content.find(
      (candidate) => candidate.key === key && normalizeLocale(candidate.locale) === normalized,
    );
    if (entry) {
      entry.value = value;
      entry.description = description ?? entry.description ?? "";
      entry.tags = Array.isArray(tags) ? [...tags] : [];
    } else {
      state.content.push({
        id: generateId("content"),
        key,
        locale: normalized,
        value,
        description,
        tags: Array.isArray(tags) ? [...tags] : [],
      });
    }
    setState(state);
    await delay(120);
    return {
      key,
      locale: normalized,
      value,
      description,
      tags: Array.isArray(tags) ? [...tags] : [],
    };
  }
  return networkRequest(`admin/content/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: JSON.stringify({ value, locale, description, tags }),
  });
}

// ---------- Utilities ----------

function networkRequest(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}/${path.replace(/^\//, "")}`;
  
  // Add cache busting for GET requests to prevent mobile browser caching
  const finalUrl = options.method === "GET" || !options.method
    ? `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`
    : url;
  
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    // Prevent caching at the request level
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    ...options.headers,
  };
  const body = options.body;
  if (typeof FormData !== "undefined" && body instanceof FormData) {
    delete headers["Content-Type"];
  }
  const token = getAuthToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }
  const fetchOptions = {
    ...options,
    headers,
    // Force no caching in fetch options
    cache: "no-store",
  };
  
  return fetch(finalUrl, fetchOptions)
    .then(async (response) => {
      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");
      
      if (response.status === 304) {
        return null;
      }

      if (!response.ok) {
        let errorData;
        try {
          errorData = isJson ? await response.json() : await response.text();
        } catch {
          errorData = { error: `HTTP ${response.status}` };
        }
        
        const error = new Error(
          typeof errorData === "object" && errorData.error
            ? errorData.error
            : typeof errorData === "string"
            ? errorData
            : `HTTP ${response.status}`
        );
        error.status = response.status;
        error.url = url;
        error.details = typeof errorData === "object" ? errorData : undefined;
        throw error;
      }
      
      return isJson ? response.json() : response.text();
    })
    .catch((error) => {
      // Network errors (CORS, connection refused, etc.)
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        // In production, show a generic message without exposing internal URLs
        const isDevelopment = import.meta.env?.DEV;
        
        // Determine if we should show detailed error or generic message
        const showDetailedError = isDevelopment && typeof window !== "undefined" && window.location.hostname === "localhost";
        
        const errorMessage = showDetailedError
          ? `Unable to connect to API server. Please ensure the backend is running.`
          : "Unable to connect to the server. Please check your internet connection or try again later.";
        
        const networkError = new Error(errorMessage);
        networkError.status = 0;
        networkError.url = url;
        networkError.originalError = error;
        
        // Only log detailed info in development mode
        if (isDevelopment && showDetailedError) {
          logger.warn("API connection failed - backend may not be running", { url, error: error.message });
        }
        
        throw networkError;
      }
      
      // Re-throw errors that already have our custom format
      if (error.status !== undefined) {
        throw error;
      }
      
      // Wrap unexpected errors
      const wrappedError = new Error(error.message || "Request failed");
      wrappedError.status = 0;
      wrappedError.url = url;
      wrappedError.originalError = error;
      
      // Only log in development
      if (import.meta.env?.DEV) {
        logger.error("Unexpected request error", { url, error: error.message });
      }
      
      throw wrappedError;
    });
}

async function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchTreasuryOptions() {
  if (ENABLE_MOCK) {
    return { options: DEFAULT_CRYPTO_DEPOSIT_OPTIONS };
  }
  return networkRequest("admin/treasury");
}

export async function updateTreasuryOptions(options) {
  if (ENABLE_MOCK) {
    await delay(500);
    return { success: true, message: "Treasury options updated successfully", options };
  }
  return networkRequest("admin/treasury", {
    method: "PUT",
    body: JSON.stringify({ options }),
  });
}

export const apiClient = {
  login,
  signup,
  requestPasswordReset,
  resetPassword,
  fetchUserProfile,
  fetchDashboardSummary,
  fetchMarketTop,
  fetchStockQuotes,
  fetchStockHistory,
  logPnlEntry,
  updateDailyPnlEntry,
  deleteDailyPnlEntry,
  submitVerificationDocuments,
  depositFunds,
  withdrawFunds,
  transferFunds,
  executeTrade,
  fetchAdminOverview,
  approveTransaction,
  rejectTransaction,
  updateUserAccount,
  deleteUser,
  approveVerification,
  createToken,
  fetchVerificationDocuments,
  fetchSiteContent,
  fetchAdminSiteContent,
  saveSiteContentEntry,
  fetchCryptoDepositOptions,
  approveTradeTransaction,
  rejectTradeTransaction,
  approveDepositTransaction,
  rejectDepositTransaction,
  approveInvestmentRequest,
  rejectInvestmentRequest,
  uploadTransactionScreenshots,
  fetchTreasuryOptions,
  updateTreasuryOptions,
  config: {
    apiBaseUrl: API_BASE_URL,
    enableMockData: ENABLE_MOCK,
  },
};


