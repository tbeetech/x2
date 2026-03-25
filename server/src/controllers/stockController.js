import { fetchStockQuotes, fetchStockHistory, defaultStockSymbols } from "../services/stockDataService.js";
import logger from "../lib/logger.js";

export async function getStockQuotes(req, res) {
  const symbolsParam = req.query.symbols;
  const symbols = symbolsParam ? String(symbolsParam).split(",").map((item) => item.trim()).filter(Boolean) : defaultStockSymbols;
  try {
    const quotes = await fetchStockQuotes(symbols);
    res.json({ symbols, quotes });
  } catch (error) {
    logger.error({ err: error }, "getStockQuotes error");
    res.status(502).json({ error: "Unable to fetch stock quotes." });
  }
}

export async function getStockHistory(req, res) {
  const { symbol } = req.params;
  const range = req.query.range ?? "1mo";
  if (!symbol) {
    return res.status(400).json({ error: "Symbol is required." });
  }
  try {
    const history = await fetchStockHistory(symbol, range);
    res.json(history);
  } catch (error) {
    logger.error({ err: error }, "getStockHistory error");
    res.status(502).json({ error: "Unable to fetch stock history." });
  }
}
