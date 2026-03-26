import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, Search, Loader2, RotateCcw } from "lucide-react";
import { Line } from "react-chartjs-2";
import "../services/chartConfig";
import { apiClient } from "../services/apiClient";
import { LoaderOverlay } from "../components/LoaderOverlay";
import { useAccountData } from "../context/AccountDataContext.jsx";
import { TradeProcessingModal } from "../components/TradeProcessingModal";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const POLL_INTERVAL_MS = 5_000;
const STOCK_POLL_INTERVAL_MS = 30_000;
const HISTORY_PRELOAD_MS = 600;

const fallbackStocks = [
  { symbol: "AAPL", shortName: "Apple Inc.", regularMarketPrice: 195.12, regularMarketChangePercent: 0.94, regularMarketVolume: 53_200_000, marketCap: 3_020_000_000_000, regularMarketChange: 1.82 },
  { symbol: "GOOGL", shortName: "Alphabet Inc.", regularMarketPrice: 174.5, regularMarketChangePercent: -0.49, regularMarketVolume: 18_200_000, marketCap: 2_170_000_000_000, regularMarketChange: -0.86 },
  { symbol: "AMZN", shortName: "Amazon.com, Inc.", regularMarketPrice: 183.44, regularMarketChangePercent: 1.48, regularMarketVolume: 41_200_000, marketCap: 1_900_000_000_000, regularMarketChange: 2.67 },
  { symbol: "NFLX", shortName: "Netflix, Inc.", regularMarketPrice: 642.18, regularMarketChangePercent: 0.74, regularMarketVolume: 7_200_000, marketCap: 280_000_000_000, regularMarketChange: 4.71 },
  { symbol: "PYPL", shortName: "PayPal Holdings, Inc.", regularMarketPrice: 76.32, regularMarketChangePercent: -0.55, regularMarketVolume: 9_400_000, marketCap: 84_000_000_000, regularMarketChange: -0.42 },
  { symbol: "TSLA", shortName: "Tesla, Inc.", regularMarketPrice: 251.45, regularMarketChangePercent: 1.59, regularMarketVolume: 51_200_000, marketCap: 800_000_000_000, regularMarketChange: 3.92 },
];

const fallbackStockHistory = {
  symbol: "AAPL",
  range: "1mo",
  candles: [
    { time: "2025-09-20T14:30:00.000Z", close: 188.9 },
    { time: "2025-09-27T14:30:00.000Z", close: 190.8 },
    { time: "2025-10-04T14:30:00.000Z", close: 192.7 },
    { time: "2025-10-11T14:30:00.000Z", close: 195.1 },
    { time: "2025-10-18T14:30:00.000Z", close: 198.4 },
  ],
};

const historyRanges = ["1d", "5d", "1mo", "6mo", "1y"];

const fallbackCoins = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", current_price: 68215, price_change_percentage_24h: 2.84, market_cap: 1_342_000_000_000, total_volume: 18_320_000_000, two_hour_change: null },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", current_price: 3620, price_change_percentage_24h: 1.63, market_cap: 435_000_000_000, total_volume: 12_450_000_000, two_hour_change: null },
  { id: "solana", symbol: "SOL", name: "Solana", current_price: 189, price_change_percentage_24h: -0.42, market_cap: 84_200_000_000, total_volume: 3_900_000_000, two_hour_change: null },
  { id: "ripple", symbol: "XRP", name: "XRP", current_price: 1.02, price_change_percentage_24h: 0.71, market_cap: 56_100_000_000, total_volume: 1_640_000_000, two_hour_change: null },
  { id: "cardano", symbol: "ADA", name: "Cardano", current_price: 0.74, price_change_percentage_24h: -1.9, market_cap: 26_400_000_000, total_volume: 870_000_000, two_hour_change: null },
];

function computeTwoHourChange(prices = []) {
  if (!Array.isArray(prices) || prices.length < 3) {
    return null;
  }
  const lastPrice = Number(prices[prices.length - 1]);
  const comparePrice = Number(prices[Math.max(0, prices.length - 3)]);
  if (!Number.isFinite(lastPrice) || !Number.isFinite(comparePrice) || comparePrice === 0) {
    return null;
  }
  return ((lastPrice - comparePrice) / comparePrice) * 100;
}

function formatCurrency(value) {
  return `$${Intl.NumberFormat("en-US", { notation: "compact" }).format(value ?? 0)}`;
}

function formatUsd(value, fractionDigits = 2) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return "$0.00";
  }
  return `$${numeric.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}

export function MarketPage() {
  const [assets, setAssets] = useState(fallbackCoins);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const offlineNoticeLogged = useRef(false);
  const latestSnapshotRef = useRef(fallbackCoins);
  const pageCursorRef = useRef(0);
  const initialLoadRef = useRef(true);
  const { actions, wallet } = useAccountData();
  const [stockQuotes, setStockQuotes] = useState(fallbackStocks);
  const [stockLoading, setStockLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState(fallbackStocks[0]?.symbol ?? "AAPL");
  const [historyRange, setHistoryRange] = useState("1mo");
  const [stockHistory, setStockHistory] = useState(fallbackStockHistory);
  const [historyLoading, setHistoryLoading] = useState(false);
  const historyDelayRef = useRef(null);
  const selectedStockRef = useRef(fallbackStocks[0]?.symbol ?? "AAPL");
  const [tradeSide, setTradeSide] = useState("buy");
  const [tradeQuantity, setTradeQuantity] = useState("");
  const [tradeSubmitting, setTradeSubmitting] = useState(false);
  const [tradeMessage, setTradeMessage] = useState(null);
  const [tradeError, setTradeError] = useState(null);
  const [showTradeProcessingModal, setShowTradeProcessingModal] = useState(false);
  const canTrade = Boolean(actions?.trade);

  const filteredAssets = useMemo(() => {
    const lowercaseQuery = query.trim().toLowerCase();
    if (!lowercaseQuery) {
      return assets;
    }
    return assets.filter(
      (coin) =>
        coin.name.toLowerCase().includes(lowercaseQuery) ||
        coin.symbol.toLowerCase().includes(lowercaseQuery),
    );
  }, [assets, query]);

  const topMovers = useMemo(() => {
    const sorted = [...assets].sort(
      (a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0),
    );
    return {
      gainers: sorted.slice(0, 3),
      losers: [...sorted].reverse().slice(0, 3),
    };
  }, [assets]);

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdated) {
      return "â€”";
    }
    return new Date(lastUpdated).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [lastUpdated]);

  const selectedQuote = useMemo(() => {
    return stockQuotes.find((quote) => quote.symbol === selectedStock) ?? stockQuotes[0] ?? null;
  }, [stockQuotes, selectedStock]);

  const tradeNotional = useMemo(() => {
    const quantity = Number(tradeQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return 0;
    }
    return quantity * (selectedQuote?.regularMarketPrice ?? 0);
  }, [tradeQuantity, selectedQuote]);

  const stockChartData = useMemo(() => {
    const candles = stockHistory?.candles ?? [];
    if (!candles.length) {
      return null;
    }
    const labels = candles.map((candle) => {
      const date = new Date(candle.time);
      if (historyRange === "1d" || historyRange === "5d") {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      return date.toLocaleDateString();
    });
    const data = candles.map((candle) => Number(candle.close ?? candle.open ?? 0));
    return {
      labels,
      datasets: [
        {
          label: `${selectedStock} price`,
          data,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,0.15)",
          fill: true,
          tension: 0.25,
          pointRadius: 0,
        },
      ],
    };
  }, [stockHistory, historyRange, selectedStock]);

  const stockChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: "#94a3b8", maxTicksLimit: 8 },
          grid: { color: "rgba(148,163,184,0.1)" },
        },
        y: {
          ticks: { color: "#94a3b8" },
          grid: { color: "rgba(148,163,184,0.08)" },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `$${Number(context.parsed.y ?? 0).toFixed(2)}`,
          },
        },
      },
    }),
    [],
  );

  const handleTradeSubmit = async (event) => {
    event.preventDefault();
    if (!canTrade || !actions?.trade) {
      setTradeError("Trading is currently disabled for this workspace.");
      return;
    }
    const quantity = Number(tradeQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setTradeError("Enter a valid share quantity before submitting.");
      return;
    }
    if (!selectedQuote?.symbol) {
      setTradeError("No equity is selected for trading.");
      return;
    }

    // Calculate required amount
    const requiredAmount = quantity * (selectedQuote.regularMarketPrice ?? 0);
    const currentBalance = wallet?.balance ?? 0;
    
    // Check if user has sufficient balance (only for buy orders)
    if (tradeSide === "buy" && currentBalance < requiredAmount) {
      setTradeError(
        `Insufficient funds. Your order requires $${requiredAmount.toFixed(2)} but you only have $${currentBalance.toFixed(2)} available. Please deposit funds to continue.`
      );
      return;
    }

    setTradeSubmitting(true);
    setTradeError(null);
    setTradeMessage(null);
    try {
      const response = await actions.trade({
        symbol: selectedQuote.symbol,
        name: selectedQuote.shortName ?? selectedQuote.symbol,
        side: tradeSide,
        quantity,
        price: selectedQuote.regularMarketPrice,
      });
      if (response?.status === "pending") {
        setTradeMessage("âœ“ Your order is processing. You'll be notified once an admin reviews your request.");
        setShowTradeProcessingModal(true);
      } else {
        setTradeMessage(
          `âœ“ ${tradeSide === "buy" ? "Purchased" : "Sold"} ${quantity} shares of ${selectedQuote.symbol} at $${(
            selectedQuote.regularMarketPrice ?? 0
          ).toFixed(2)} per share.`,
        );
      }
      setTradeQuantity("");
    } catch (error) {
      setTradeError(error?.message ?? "Unable to execute trade.");
    } finally {
      setTradeSubmitting(false);
    }
  };

  const selectFallbackAssets = useCallback(() => {
    const chunkSize = 25;
    const total = fallbackCoins.length;
    if (total <= chunkSize) {
      return fallbackCoins;
    }
    const slices = Math.ceil(total / chunkSize);
    const cursor = pageCursorRef.current % slices;
    const offset = cursor * chunkSize;
    const rotated = fallbackCoins.slice(offset, offset + chunkSize);
    if (rotated.length === chunkSize) {
      return rotated;
    }
    return rotated.concat(fallbackCoins.slice(0, chunkSize - rotated.length));
  }, []);

  const fetchFromCoinGecko = useCallback(async () => {
    const params = new URLSearchParams({
      vs_currency: "usd",
      order: "market_cap_desc",
      per_page: "25",
      page: ((pageCursorRef.current % 4) + 1).toString(),
      sparkline: "true",
      price_change_percentage: "1h,24h",
    });
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(`${COINGECKO_BASE}/coins/markets?${params.toString()}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        return [];
      }
      return data
        .map((coin) => {
          const symbol = coin.symbol?.toUpperCase?.() ?? coin.symbol ?? "";
          if (!symbol) return null;
          return {
            id: coin.id ?? symbol,
            symbol,
            name: coin.name ?? symbol,
            current_price: Number(coin.current_price ?? 0),
            price_change_percentage_24h: Number(coin.price_change_percentage_24h ?? 0),
            price_change_percentage_1h: Number(
              coin.price_change_percentage_1h_in_currency ?? coin.price_change_percentage_1h ?? 0,
            ),
            market_cap: Number(coin.market_cap ?? 0),
            total_volume: Number(coin.total_volume ?? 0),
            two_hour_change: computeTwoHourChange(coin.sparkline_in_7d?.price),
          };
        })
        .filter(Boolean);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        // Silently fail on timeout - don't spam console
        return [];
      }
      throw error;
    }
  }, []);

  const fetchAssets = useCallback(
    async (manual = false) => {
      const shouldShowLoader = initialLoadRef.current || manual;
      if (shouldShowLoader) {
        setLoading(true);
      }
      let nextAssets = null;
      let usedFallback = false;

      try {
        const geckoAssets = await fetchFromCoinGecko();
        if (Array.isArray(geckoAssets) && geckoAssets.length) {
          nextAssets = geckoAssets;
        }
      } catch {
        // Silently fail - CoinGecko API may be rate-limited or unavailable
        // Don't spam console with errors
      }

      if (!nextAssets) {
        try {
          const apiAssets = await apiClient.fetchMarketTop();
          if (Array.isArray(apiAssets) && apiAssets.length) {
            nextAssets = apiAssets.map((asset) => ({
              id: asset.id ?? asset.symbol,
              symbol: asset.symbol?.toUpperCase?.() ?? asset.symbol ?? "",
              name: asset.name ?? asset.symbol,
              current_price: Number(asset.currentPrice ?? asset.current_price ?? 0),
              price_change_percentage_24h: Number(
                asset.priceChangePercentage24h ?? asset.price_change_percentage_24h ?? 0,
              ),
              market_cap: Number(asset.marketCap ?? asset.market_cap ?? 0),
              total_volume: Number(asset.totalVolume ?? asset.total_volume ?? 0),
              two_hour_change: Number(asset.twoHourChange ?? asset.two_hour_change ?? 0),
            }));
          }
        } catch {
          // Silently fail - fallback will be used
        }
      }

      if (!nextAssets) {
        nextAssets = selectFallbackAssets();
        usedFallback = true;
      }

      if (usedFallback && !offlineNoticeLogged.current) {
        // Only log once that we're using fallback data
        offlineNoticeLogged.current = true;
      }
      setAssets(nextAssets);
      latestSnapshotRef.current = nextAssets;
      setLastUpdated(Date.now());
      offlineNoticeLogged.current = usedFallback;
      initialLoadRef.current = false;
      pageCursorRef.current = pageCursorRef.current + 1;

      if (shouldShowLoader) {
        setLoading(false);
      }
    },
    [fetchFromCoinGecko, selectFallbackAssets],
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      await fetchAssets(false);
    };
    void load();
    const interval = setInterval(() => {
      if (!cancelled) {
        void fetchAssets(false);
      }
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [fetchAssets]);

  useEffect(() => {
    selectedStockRef.current = selectedStock;
  }, [selectedStock]);

  useEffect(() => {
    let cancelled = false;

    const loadQuotes = async () => {
      setStockLoading(true);
      try {
        const quotes = await apiClient.fetchStockQuotes({});
        if (cancelled) {
          return;
        }
        if (Array.isArray(quotes) && quotes.length) {
          setStockQuotes(quotes);
          if (!quotes.some((quote) => quote.symbol === selectedStockRef.current)) {
            setSelectedStock(quotes[0].symbol);
          }
        } else {
          setStockQuotes(fallbackStocks);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("Stock quote fetch failed, using fallback dataset.", error);
          setStockQuotes(fallbackStocks);
        }
      } finally {
        if (!cancelled) {
          setStockLoading(false);
        }
      }
    };

    void loadQuotes();
    const interval = setInterval(() => {
      void loadQuotes();
    }, STOCK_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!selectedStock) {
      return undefined;
    }
    let cancelled = false;

    const preload = new Promise((resolve) => {
      const timeout = setTimeout(() => {
        historyDelayRef.current = null;
        resolve();
      }, HISTORY_PRELOAD_MS);
      historyDelayRef.current = timeout;
    });

    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const history = await apiClient.fetchStockHistory(selectedStock, historyRange);
        await preload;
        if (cancelled) {
          return;
        }
        if (history?.candles?.length) {
          setStockHistory(history);
        } else {
          setStockHistory({ ...fallbackStockHistory, symbol: selectedStock });
        }
      } catch (error) {
        console.warn("Stock history fetch failed, using fallback data.", error);
        if (!cancelled) {
          setStockHistory({ ...fallbackStockHistory, symbol: selectedStock });
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      cancelled = true;
      if (historyDelayRef.current) {
        clearTimeout(historyDelayRef.current);
        historyDelayRef.current = null;
      }
    };
  }, [selectedStock, historyRange]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="mb-8 space-y-4 sm:mb-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">Market overview</h1>
            <p className="text-sm text-slate-400">
              Track real-time performance and liquidity across top assets.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchAssets(true)}
            className="inline-flex items-center gap-2 rounded-full border border-blue-400/40 px-4 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/10"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TopMoverCard title="Top gainers" icon={ArrowUpCircle} accent="text-emerald-400" movers={topMovers.gainers} />
          <TopMoverCard title="Top decliners" icon={ArrowDownCircle} accent="text-rose-400" movers={topMovers.losers} />
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-slate-500" />
            <input
              value={query}
              onChange={(event) => {
                const next = event.target.value;
                if (query.trim() && !next.trim()) {
                  setLastQuery(query.trim());
                }
                setQuery(next);
              }}
              placeholder="Search assets, e.g. BTC or Bitcoin"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          {lastQuery && !query.trim() && (
            <button
              onClick={() => setQuery(lastQuery)}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition hover:border-blue-400/40 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 whitespace-nowrap"
              title={`Redo last search: "${lastQuery}"`}
            >
              <RotateCcw className="size-3" />
              Redo last query
            </button>
          )}
          <p className="text-xs text-slate-500 text-center sm:text-right">
            Market prices sourced from CoinGecko and refresh automatically every 5 seconds. Last update {lastUpdatedLabel}.
          </p>
        </div>

        <div className="table-container overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-3 px-2 sm:px-0">Asset</th>
                <th className="py-3 px-2">Price</th>
                <th className="py-3 px-2">2h Change</th>
                <th className="py-3 px-2">24h Change</th>
                <th className="py-3 px-2">Market Cap</th>
                <th className="py-3 px-2">24h Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAssets.map((coin) => (
                <tr key={coin.id} className="transition hover:bg-white/5">
                  <td className="py-4 px-2 sm:px-0">
                    <div>
                      <p className="font-semibold text-white">{coin.name}</p>
                      <p className="text-xs text-slate-400">{coin.symbol?.toUpperCase()}</p>
                    </div>
                  </td>
                  <td className="py-4 px-2">{formatCurrency(coin.current_price)}</td>
                  <td
                    className={`py-4 px-2 font-semibold ${
                      (coin.two_hour_change ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {coin.two_hour_change != null ? coin.two_hour_change.toFixed(2) : "â€”"}%
                  </td>
                  <td
                    className={`py-4 px-2 font-semibold ${
                      (coin.price_change_percentage_24h ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {(coin.price_change_percentage_24h ?? 0).toFixed(2)}%
                  </td>
                  <td className="py-4 px-2">{formatCurrency(coin.market_cap)}</td>
                  <td className="py-4 px-2">{formatCurrency(coin.total_volume)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <section className="mt-8 grid gap-6 sm:mt-12 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">High-volatility equities</h2>
              <p className="text-xs text-slate-400">Live market intelligence with configurable horizon.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {stockLoading && (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
                  <Loader2 className="size-3 animate-spin" /> Syncing
                </span>
              )}
              {historyRanges.map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setHistoryRange(range)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    historyRange === range
                      ? "border-blue-400/70 bg-blue-500/20 text-blue-200"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-blue-400/40 hover:text-blue-200"
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[2.3fr_1.7fr] lg:gap-6">
            <div className="relative rounded-2xl border border-white/10 bg-slate-900/40 p-3 sm:p-4">
              <LoaderOverlay show={historyLoading} label="Loading equity history..." />
              {stockChartData ? (
                <div className="h-60 sm:h-72">
                  <Line data={stockChartData} options={stockChartOptions} />
                </div>
              ) : (
                <div className="flex h-60 items-center justify-center text-sm text-slate-400 sm:h-72">
                  No historical data available.
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                <span>Symbol</span>
                <span className="flex gap-4 sm:gap-6">
                  <span>Price</span>
                  <span>24h %</span>
                </span>
              </div>
              <div className="space-y-2">
                {(stockQuotes.length ? stockQuotes : fallbackStocks).map((quote) => {
                  const isActive = quote.symbol === selectedStock;
                  const change = Number(quote.regularMarketChangePercent ?? 0);
                  const changeClass = change >= 0 ? "text-emerald-400" : "text-rose-400";
                  return (
                    <button
                      key={quote.symbol}
                      type="button"
                      onClick={() => setSelectedStock(quote.symbol)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition sm:px-4 ${
                        isActive
                          ? "border-blue-400/60 bg-blue-500/10 text-white"
                          : "border-white/10 bg-white/5 text-slate-200 hover:border-blue-400/30"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{quote.shortName ?? quote.symbol}</p>
                        <p className="text-xs text-slate-400">{quote.symbol}</p>
                      </div>
                      <div className="flex items-center gap-3 text-sm font-semibold sm:gap-6">
                        <span>{formatUsd(quote.regularMarketPrice ?? quote.regularMarketClose ?? 0)}</span>
                        <span className={changeClass}>{change.toFixed(2)}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur sm:p-6">
          <h2 className="text-xl font-semibold text-white">Execute trade</h2>
          <p className="mt-2 text-xs text-slate-400">
            Submit instant equity orders against your XFA Platform balance. Quotes refresh every 30 seconds.
          </p>
          <form onSubmit={handleTradeSubmit} className="mt-4 space-y-4 sm:mt-6">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setTradeSide("buy");
                  setTradeError(null);
                }}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  tradeSide === "buy"
                    ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
                    : "border-white/10 bg-white/5 text-slate-200 hover:border-emerald-400/40"
                }`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => {
                  setTradeSide("sell");
                  setTradeError(null);
                }}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  tradeSide === "sell"
                    ? "border-rose-400/60 bg-rose-500/10 text-rose-200"
                    : "border-white/10 bg-white/5 text-slate-200 hover:border-rose-400/40"
                }`}
              >
                Sell
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="trade-quantity">
                Quantity (shares)
              </label>
              <input
                id="trade-quantity"
                type="number"
                min="0"
                step="0.01"
                value={tradeQuantity}
                onChange={(event) => {
                  setTradeQuantity(event.target.value);
                  setTradeError(null);
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200 sm:px-4">
              <div className="flex items-center justify-between">
                <span>Instrument</span>
                <span className="font-semibold text-white">{selectedQuote?.symbol ?? "â€”"}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span>Last price</span>
                <span className="font-semibold text-white">{formatUsd(selectedQuote?.regularMarketPrice ?? 0)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span>Estimated notional</span>
                <span className="font-semibold text-white">{formatUsd(tradeNotional ?? 0)}</span>
              </div>
            </div>

            {tradeMessage && (
              <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 sm:px-4">
                {tradeMessage}
              </div>
            )}
            {tradeError && (
              <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 sm:px-4">
                {tradeError}
              </div>
            )}

            <button
              type="submit"
              disabled={!canTrade || tradeSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:from-blue-400 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {tradeSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Placing order...
                </span>
              ) : (
                `Confirm ${tradeSide} order`
              )}
            </button>

            {!canTrade && (
              <p className="text-xs text-slate-500">
                Trading requires an authenticated session with funding permissions.
              </p>
            )}
          </form>
        </div>
      </section>

      {/* Trade Processing Modal */}
      <TradeProcessingModal
        show={showTradeProcessingModal}
        onClose={() => setShowTradeProcessingModal(false)}
        tradeSide={tradeSide}
      />
    </div>
  );
}

function TopMoverCard({ title, movers, icon: IconComponent, accent }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">{title}</p>
        <IconComponent className={`size-5 ${accent}`} />
      </div>
      <div className="mt-4 space-y-3 text-sm text-slate-300">
        {movers.map((coin) => (
          <div key={coin.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3">
            <div>
              <p className="font-medium text-white">{coin.name}</p>
              <p className="text-xs text-slate-400">{coin.symbol?.toUpperCase()}</p>
            </div>
            <p
              className={`text-sm font-semibold ${
                (coin.price_change_percentage_24h ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {(coin.price_change_percentage_24h ?? 0).toFixed(2)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
