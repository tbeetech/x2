const QUOTE_ENDPOINT = "https://query1.finance.yahoo.com/v7/finance/quote";
const CHART_ENDPOINT = "https://query1.finance.yahoo.com/v8/finance/chart";

const DEFAULT_SYMBOLS = [
  "AAPL",
  "GOOGL",
  "AMZN",
  "NFLX",
  "PYPL",
  "TSLA",
  "MSFT",
  "NVDA",
  "JPM",
  "XOM",
];

function normalizeQuote(raw) {
  return {
    symbol: raw.symbol,
    shortName: raw.shortName ?? raw.displayName ?? raw.symbol,
    regularMarketPrice: Number(raw.regularMarketPrice ?? raw.ask ?? 0),
    regularMarketChange: Number(raw.regularMarketChange ?? 0),
    regularMarketChangePercent: Number(raw.regularMarketChangePercent ?? 0),
    regularMarketVolume: Number(raw.regularMarketVolume ?? 0),
    regularMarketTime: raw.regularMarketTime ? new Date(raw.regularMarketTime * 1000).toISOString() : null,
    fiftyTwoWeekHigh: Number(raw.fiftyTwoWeekHigh ?? 0),
    fiftyTwoWeekLow: Number(raw.fiftyTwoWeekLow ?? 0),
    marketCap: Number(raw.marketCap ?? 0),
    trailingPE: Number(raw.trailingPE ?? 0),
    previousClose: Number(raw.regularMarketPreviousClose ?? raw.previousClose ?? 0),
    currency: raw.currency ?? "USD",
  };
}

export async function fetchStockQuotes(symbols = DEFAULT_SYMBOLS) {
  const list = Array.isArray(symbols) && symbols.length ? symbols : DEFAULT_SYMBOLS;
  const params = new URLSearchParams({
    symbols: list.join(","),
  });
  const response = await fetch(`${QUOTE_ENDPOINT}?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Quote request failed with status ${response.status}`);
  }
  const payload = await response.json();
  if (!payload?.quoteResponse?.result) {
    return [];
  }
  return payload.quoteResponse.result.map(normalizeQuote);
}

function selectInterval(range) {
  switch (range) {
    case "1d":
      return "5m";
    case "5d":
      return "15m";
    case "1mo":
      return "1h";
    case "3mo":
    case "6mo":
      return "1d";
    case "1y":
      return "1wk";
    case "5y":
    case "max":
      return "1mo";
    default:
      return "1d";
  }
}

export async function fetchStockHistory(symbol, range = "1mo") {
  if (!symbol) {
    throw new Error("Symbol is required.");
  }
  const params = new URLSearchParams({
    range,
    interval: selectInterval(range),
    includePrePost: "false",
    events: "div,split",
  });
  const response = await fetch(`${CHART_ENDPOINT}/${encodeURIComponent(symbol)}?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Chart request failed with status ${response.status}`);
  }
  const payload = await response.json();
  const result = payload?.chart?.result?.[0];
  if (!result?.timestamp || !result?.indicators?.quote?.[0]) {
    return { symbol, candles: [] };
  }

  const timestamps = result.timestamp;
  const quote = result.indicators.quote[0];

  const candles = timestamps.map((ts, index) => ({
    time: new Date(ts * 1000).toISOString(),
    open: quote.open?.[index] ?? null,
    high: quote.high?.[index] ?? null,
    low: quote.low?.[index] ?? null,
    close: quote.close?.[index] ?? null,
    volume: quote.volume?.[index] ?? null,
  }));

  return {
    symbol: result.meta?.symbol ?? symbol,
    currency: result.meta?.currency ?? "USD",
    range,
    candles: candles.filter((candle) => candle.close !== null),
  };
}

export const defaultStockSymbols = DEFAULT_SYMBOLS;
