import { env } from "../config/env.js";
import logger from "../lib/logger.js";
import { MarketAssetModel } from "../models/MarketAsset.js";
import { isPrimaryWorker } from "../lib/processRole.js";

const COINGECKO_ENDPOINT = "https://api.coingecko.com/api/v3/coins/markets";
const DEFAULT_LIMIT = Number(process.env.MARKET_SYNC_LIMIT ?? 25);
const DEFAULT_INTERVAL_MS = Number(process.env.MARKET_SYNC_INTERVAL_MS ?? 300_000);
const DEFAULT_TIMEOUT_MS = Number(process.env.MARKET_SYNC_TIMEOUT_MS ?? 10_000);

let intervalHandle = null;
let refreshInFlight = false;

function normalizeAsset(raw) {
  const symbol = raw?.symbol?.toUpperCase?.() ?? raw?.symbol ?? "";
  if (!symbol || !raw?.name) {
    return null;
  }
  return {
    id: raw?.id ?? symbol,
    symbol,
    name: raw.name,
    currentPrice: Number(raw.current_price ?? raw.currentPrice ?? 0),
    marketCap: Number(raw.market_cap ?? raw.marketCap ?? 0),
    priceChangePercentage24h: Number(
      raw.price_change_percentage_24h ?? raw.priceChangePercentage24h ?? 0,
    ),
    totalVolume: Number(raw.total_volume ?? raw.totalVolume ?? 0),
  };
}

async function fetchFromCoinGecko(limit = DEFAULT_LIMIT) {
  const params = new URLSearchParams({
    vs_currency: "usd",
    order: "market_cap_desc",
    per_page: String(limit),
    page: "1",
    sparkline: "false",
    price_change_percentage: "24h",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${COINGECKO_ENDPOINT}?${params.toString()}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`CoinGecko responded with status ${response.status}`);
    }
    const payload = await response.json();
    if (!Array.isArray(payload)) {
      return [];
    }
    const assets = payload
      .map((item) => normalizeAsset(item))
      .filter((asset) => asset && asset.symbol);
    return assets;
  } finally {
    clearTimeout(timeout);
  }
}

async function persistAssets(assets) {
  if (!assets.length) return;
  const operations = assets.map((asset) => ({
    updateOne: {
      filter: { symbol: asset.symbol },
      update: {
        $set: {
          name: asset.name,
          currentPrice: asset.currentPrice,
          marketCap: asset.marketCap,
          priceChangePercentage24h: asset.priceChangePercentage24h,
          totalVolume: asset.totalVolume,
        },
        $setOnInsert: { symbol: asset.symbol },
      },
      upsert: true,
    },
  }));

  await MarketAssetModel.bulkWrite(operations, { ordered: false });

  const symbols = assets.map((asset) => asset.symbol);
  await MarketAssetModel.deleteMany({ symbol: { $nin: symbols } }).exec();
}

export async function refreshMarketData({ limit = DEFAULT_LIMIT } = {}) {
  if (env.useSampleData) {
    return [];
  }

  try {
    const assets = await fetchFromCoinGecko(limit);
    if (!assets.length) {
      logger.warn("CoinGecko returned no market data assets.");
      return [];
    }

    await persistAssets(assets);
    logger.info({ count: assets.length }, "Market data cache refreshed from CoinGecko.");
    return assets;
  } catch (error) {
    logger.warn({ err: error }, "CoinGecko refresh failed; retaining existing market data snapshot.");
    const fallback = await MarketAssetModel.find()
      .sort({ marketCap: -1 })
      .limit(limit)
      .lean()
      .exec();
    return fallback.map((asset) => ({
      id: asset.symbol,
      symbol: asset.symbol,
      name: asset.name,
      currentPrice: asset.currentPrice,
      marketCap: asset.marketCap,
      priceChangePercentage24h: asset.priceChangePercentage24h,
      totalVolume: asset.totalVolume,
    }));
  }
}

export function startMarketDataUpdater({
  intervalMs = DEFAULT_INTERVAL_MS,
  limit = DEFAULT_LIMIT,
} = {}) {
  if (env.useSampleData) {
    logger.info("Sample data mode enabled; skipping market data updater.");
    return () => {};
  }

  if (!isPrimaryWorker()) {
    logger.info(
      { worker: process.env.pm_id ?? process.env.NODE_APP_INSTANCE ?? process.pid },
      "Skipping market data updater in secondary worker.",
    );
    return () => {};
  }

  if (intervalHandle) {
    logger.warn("Market data updater already running.");
    return () => {
      clearInterval(intervalHandle);
      intervalHandle = null;
    };
  }

  const executeRefresh = async () => {
    if (refreshInFlight) {
      return;
    }
    refreshInFlight = true;
    try {
      await refreshMarketData({ limit });
    } finally {
      refreshInFlight = false;
    }
  };

  void executeRefresh();

  intervalHandle = setInterval(() => {
    void executeRefresh();
  }, intervalMs);

  if (typeof intervalHandle.unref === "function") {
    intervalHandle.unref();
  }

  logger.info({ intervalMs, limit }, "Market data updater scheduled.");

  return () => {
    if (intervalHandle) {
      clearInterval(intervalHandle);
      intervalHandle = null;
      logger.info("Market data updater stopped.");
    }
  };
}
