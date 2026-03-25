import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { logger } from "../services/logger";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const TIMEFRAME_MAP = {
  "24h": "24h",
  "7d": "7d",
  "30d": "30d",
};

const ENABLE_LIVE_MARKET_DATA = (() => {
  const explicit =
    import.meta.env.VITE_ENABLE_LIVE_MARKET_DATA ??
    import.meta.env.VITE_ENABLE_LIVE_MARKET_FEED ??
    globalThis?.__APP_CONFIG__?.enableLiveMarketData ??
    globalThis?.__ENV__?.VITE_ENABLE_LIVE_MARKET_DATA;

  if (typeof explicit !== "undefined") {
    return explicit.toString().toLowerCase() !== "false";
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return false;
    }
    return true;
  }

  return false;
})();

const fallbackTopCryptos = [
  {
    id: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    current_price: 68215,
    market_cap: 1_342_000_000_000,
    price_change_percentage_24h: 2.84,
    total_volume: 18_320_000_000,
  },
  {
    id: "ethereum",
    symbol: "eth",
    name: "Ethereum",
    current_price: 3620,
    market_cap: 435_000_000_000,
    price_change_percentage_24h: 1.63,
    total_volume: 12_450_000_000,
  },
  {
    id: "solana",
    symbol: "sol",
    name: "Solana",
    current_price: 189,
    market_cap: 84_200_000_000,
    price_change_percentage_24h: -0.42,
    total_volume: 3_900_000_000,
  },
  {
    id: "ripple",
    symbol: "xrp",
    name: "XRP",
    current_price: 1.02,
    market_cap: 56_100_000_000,
    price_change_percentage_24h: 0.71,
    total_volume: 1_640_000_000,
  },
  {
    id: "cardano",
    symbol: "ada",
    name: "Cardano",
    current_price: 0.74,
    market_cap: 26_400_000_000,
    price_change_percentage_24h: -1.9,
    total_volume: 870_000_000,
  },
];

const fallbackGlobalStats = {
  total_market_cap: 2_215_000_000_000,
  total_volume_24h: 98_400_000_000,
  market_cap_change_percentage_24h_usd: 1.92,
  active_cryptocurrencies: 12394,
};

async function fetchJSON(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json();
}

export function useMarketData(timeframe = "24h") {
  const [allowLiveRequests, setAllowLiveRequests] = useState(() => {
    if (!ENABLE_LIVE_MARKET_DATA) {
      return false;
    }
    if (typeof window === "undefined") {
      return true;
    }
    return window.navigator.onLine;
  });
  const [loading, setLoading] = useState(allowLiveRequests);
  const [error, setError] = useState(null);
  const [globalStats, setGlobalStats] = useState(fallbackGlobalStats);
  const [topCryptos, setTopCryptos] = useState(fallbackTopCryptos);
  const offlineNoticeLogged = useRef(false);
  const [pageCursor, setPageCursor] = useState(0);
  const latestSnapshotRef = useRef(fallbackTopCryptos);

  const priceField = useMemo(() => {
    const mapped = TIMEFRAME_MAP[timeframe] ?? "24h";
    return mapped === "24h" ? "24h" : `${mapped}`;
  }, [timeframe]);

  const rotatingPage = useMemo(() => ((pageCursor % 3) + 1).toString(), [pageCursor]);

  const fallbackSlice = useMemo(() => {
    const chunkSize = 5;
    const total = fallbackTopCryptos.length;
    if (total <= chunkSize) {
      return fallbackTopCryptos;
    }
    const slices = Math.ceil(total / chunkSize);
    const offset = (pageCursor % slices) * chunkSize;
    const rotated = fallbackTopCryptos.slice(offset, offset + chunkSize);
    if (rotated.length === chunkSize) {
      return rotated;
    }
    return rotated.concat(fallbackTopCryptos.slice(0, chunkSize - rotated.length));
  }, [pageCursor]);

  useEffect(() => {
    if (typeof window === "undefined" || !ENABLE_LIVE_MARKET_DATA) {
      return;
    }

    function handleOnline() {
      setAllowLiveRequests(true);
    }

    function handleOffline() {
      setAllowLiveRequests(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (allowLiveRequests) {
      offlineNoticeLogged.current = false;
    }
  }, [allowLiveRequests]);

  const fetchMarketData = useCallback(async () => {
    if (!allowLiveRequests) {
      if (!offlineNoticeLogged.current) {
        logger.info("Live market data feed unavailable. Using cached market data.");
        offlineNoticeLogged.current = true;
      }
      setError(null);
      setGlobalStats(fallbackGlobalStats);
      setTopCryptos(fallbackSlice);
      latestSnapshotRef.current = fallbackSlice;
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      vs_currency: "usd",
      order: "market_cap_desc",
      per_page: "5",
      page: rotatingPage,
      sparkline: "false",
      price_change_percentage: priceField,
    });

    try {
      const [globalResponse, topResponse] = await Promise.all([
        fetchJSON(`${COINGECKO_BASE}/global`),
        fetchJSON(`${COINGECKO_BASE}/coins/markets?${params.toString()}`),
      ]);

      if (globalResponse?.data) {
        setGlobalStats({
          total_market_cap: globalResponse.data.total_market_cap?.usd ?? fallbackGlobalStats.total_market_cap,
          total_volume_24h: globalResponse.data.total_volume?.usd ?? fallbackGlobalStats.total_volume_24h,
          market_cap_change_percentage_24h_usd: globalResponse.data.market_cap_change_percentage_24h_usd ?? fallbackGlobalStats.market_cap_change_percentage_24h_usd,
          active_cryptocurrencies: globalResponse.data.active_cryptocurrencies ?? fallbackGlobalStats.active_cryptocurrencies,
        });
      }

      if (Array.isArray(topResponse)) {
        setTopCryptos(topResponse);
        latestSnapshotRef.current = topResponse;
      }
    } catch (requestError) {
      if (!offlineNoticeLogged.current) {
        logger.warn("Falling back to mock market data", requestError);
        offlineNoticeLogged.current = true;
      }
      setError(requestError);
      setGlobalStats(fallbackGlobalStats);
      setTopCryptos(fallbackSlice);
      latestSnapshotRef.current = fallbackSlice;
    } finally {
      setLoading(false);
    }
  }, [allowLiveRequests, priceField, rotatingPage, fallbackSlice]);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPageCursor((prev) => prev + 1);
    }, 20_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setPageCursor(0);
  }, [timeframe]);

  useEffect(() => {
    latestSnapshotRef.current = allowLiveRequests ? latestSnapshotRef.current : fallbackSlice;
  }, [allowLiveRequests, fallbackSlice]);

  useEffect(() => {
    const jitter = setInterval(() => {
      setTopCryptos((prev) => {
        if (!prev.length) {
          return prev;
        }
        const reference = latestSnapshotRef.current ?? prev;
        return prev.map((coin) => {
          const base = reference.find((candidate) => candidate.id === coin.id) ?? coin;
          const price = base.current_price ?? coin.current_price ?? 0;
          const drift = price * (Math.random() - 0.5) * 0.003; // ±0.15%
          const nextPrice = Math.max(0, price + drift);
          const change = (coin.price_change_percentage_24h ?? 0) + (Math.random() - 0.5) * 0.12;
          return {
            ...coin,
            current_price: Number(nextPrice.toFixed(2)),
            price_change_percentage_24h: Number(change.toFixed(2)),
          };
        });
      });
    }, 5_000);
    return () => clearInterval(jitter);
  }, []);

  return {
    loading,
    error,
    globalStats,
    topCryptos,
    refresh: fetchMarketData,
  };
}
