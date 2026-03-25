import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Shield,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiClient } from "../services/apiClient.js";
import { LoaderOverlay } from "./LoaderOverlay";
import { logger } from "../services/logger";

const formatUsd = (value = 0) =>
  `$${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

function shortAddress(address = "") {
  if (!address) return "";
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)} - ${address.slice(-6)}`;
}

export function InvestmentModal({ plan, show, onClose, onSubmit }) {
  const [amount, setAmount] = useState("");
  const [options, setOptions] = useState([]);
  const [quotes, setQuotes] = useState(new Map());
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [txHash, setTxHash] = useState("");
  const [copiedAddressId, setCopiedAddressId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const positiveFeatures = plan?.features?.filter((item) => item.included) ?? [];
  const negativeFeatures = plan?.features?.filter((item) => !item.included) ?? [];

  useEffect(() => {
    if (!show) return undefined;
    let mounted = true;
    async function load() {
      setLoadingAssets(true);
      try {
        const [walletOptions, marketAssets] = await Promise.all([
          apiClient.fetchCryptoDepositOptions(),
          apiClient.fetchMarketTop().catch(() => []),
        ]);
        if (!mounted) return;
        setOptions(walletOptions ?? []);
        const map = new Map();
        (marketAssets ?? []).forEach((asset) => {
          const symbol = (asset.symbol ?? asset.symbol)?.toUpperCase?.() ?? asset.symbol;
          const price =
            asset.currentPrice ??
            asset.current_price ??
            asset.price ??
            asset.lastPrice ??
            undefined;
          if (symbol && price) {
            map.set(symbol, Number(price));
          }
        });
        setQuotes(map);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err : new Error("Unable to load crypto payment options."));
      } finally {
        if (mounted) setLoadingAssets(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [show]);

  useEffect(() => {
    if (plan?.amount) {
      setAmount(plan.amount);
    } else {
      setAmount("");
    }
    setSelectedAssetId(null);
    setTxHash("");
    setSuccess(false);
    setError(null);
  }, [plan, show]);

  useEffect(() => {
    if (!selectedAssetId && options.length) {
      setSelectedAssetId(options[0].id ?? options[0].symbol);
    }
  }, [options, selectedAssetId]);

  const selectedAsset = useMemo(() => {
    if (!selectedAssetId) return null;
    return options.find(
      (option) =>
        option.id === selectedAssetId ||
        option.symbol?.toUpperCase?.() === selectedAssetId?.toUpperCase?.(),
    );
  }, [options, selectedAssetId]);

  const estimatedCoinAmount = useMemo(() => {
    if (!selectedAsset) return null;
    const price = quotes.get((selectedAsset.symbol ?? "").toUpperCase());
    const value = Number(amount);
    if (!price || Number.isNaN(value) || value <= 0) {
      return null;
    }
    return value / price;
  }, [amount, quotes, selectedAsset]);

  async function handleCopy(addressId, address) {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddressId(addressId);
      setTimeout(() => setCopiedAddressId(null), 2000);
    } catch (copyError) {
      logger.warn("Clipboard copy failed", copyError);
    }
  }

  async function handleMarkPaid(address) {
    if (!plan || !onSubmit) return;
    const value = Number(amount);
    if (Number.isNaN(value) || value <= 0) {
      setError(new Error("Enter an investment amount before confirming payment."));
      return;
    }
    if (plan.minAmount && value < Number(plan.minAmount)) {
      setError(new Error(`Minimum contribution for ${plan.title} is ${formatUsd(plan.minAmount)}.`));
      return;
    }
    if (selectedAsset?.minAmountUsd && value < Number(selectedAsset.minAmountUsd)) {
      setError(
        new Error(
          `Minimum deposit for ${selectedAsset.symbol} is ${formatUsd(
            selectedAsset.minAmountUsd,
          )}.`,
        ),
      );
      return;
    }
    
    // Show toast notification
    toast.info("Order processing at the back office", {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      icon: <XCircle className="h-5 w-5" />,
    });
    
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        amount: value,
        planId: plan.id,
        planTitle: plan.title,
        duration: `${plan.duration} days`,
        expectedReturn: plan.maxReturn ?? plan.minReturn ?? 0,
        assetSymbol: selectedAsset.symbol,
        assetName: `${plan.title} - ${selectedAsset.name}`,
        network: address.network ?? selectedAsset.network,
        walletAddress: address.address,
        walletLabel: address.label,
        cryptoAmount: estimatedCoinAmount ?? undefined,
        transactionHash: txHash,
        reference: txHash,
      });
      setSuccess(true);
      setTimeout(onClose, 1800);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unable to record investment payment."));
    } finally {
      setSubmitting(false);
    }
  }

  if (!show || !plan) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/85 p-4 backdrop-blur">
      <LoaderOverlay show={submitting} label="Recording payment..." />
      <div className="my-8 w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur">
        <div className="relative bg-gradient-to-br from-blue-600/30 via-indigo-500/10 to-slate-900/50 px-4 py-4 sm:px-10 sm:py-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 rounded-full border border-white/10 bg-slate-900/50 p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex flex-wrap items-start justify-between gap-4 pr-12">
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-[0.4em] text-white/70">{plan.badge}</p>
              <h2 className="mt-3 text-2xl sm:text-3xl font-semibold text-white">{plan.title}</h2>
              <p className="mt-2 text-sm text-slate-200/80">{plan.subtitle}</p>
            </div>
            <div className="w-full sm:w-auto rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-right text-xs text-slate-100/80">
              <p>
                <span className="text-emerald-300">Projected APY:</span>{" "}
                <strong>
                  {plan.minReturn}% - {plan.maxReturn}%
                </strong>
              </p>
              <p className="mt-1">
                Tenor: <strong>{plan.duration} days</strong>
              </p>
              <p className="mt-1">
                Minimum ticket:{" "}
                <strong>{formatUsd(plan.amount ?? plan.minAmount ?? 0)}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
          <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Select cryptocurrency</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {loadingAssets &&
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
                  ))}
                {!loadingAssets &&
                  options.map((option) => {
                    const symbol = option.symbol ?? option.id;
                    const isActive =
                      selectedAssetId === option.id ||
                      selectedAssetId === option.symbol ||
                      selectedAssetId === symbol;
                    return (
                      <button
                        type="button"
                        key={option.id ?? option.symbol}
                        onClick={() => setSelectedAssetId(option.id ?? option.symbol)}
                        className={`flex flex-col gap-2 rounded-2xl border px-4 py-3 text-left transition ${
                          isActive
                            ? "border-blue-400/70 bg-blue-500/15 text-white shadow-blue-500/10"
                            : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {option.name} <span className="text-xs text-slate-400">{symbol}</span>
                            </p>
                            <p className="text-xs text-slate-400">{option.network}</p>
                          </div>
                          {isActive && <Check className="size-4 text-blue-300" />}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Minimum: {formatUsd(option.minAmountUsd ?? 0)}
                        </p>
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Investment ticket</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-xs uppercase tracking-wide text-slate-400">
                  Amount (USD)
                  <input
                    type="number"
                    min={plan.minAmount ?? plan.amount ?? 0}
                    step="0.01"
                    value={amount}
                    onChange={(event) => {
                      setAmount(event.target.value);
                      setSuccess(false);
                    }}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    placeholder="Enter ticket size"
                  />
                </label>
                <label className="block text-xs uppercase tracking-wide text-slate-400">
                  Tx hash / reference (optional)
                  <input
                    value={txHash}
                    onChange={(event) => setTxHash(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    placeholder="Paste on-chain hash or reference"
                  />
                </label>
              </div>
              {selectedAsset && (
                <div className="mt-4 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4 text-xs text-blue-100">
                  <p className="font-semibold text-blue-200">Settlement guidance</p>
                  <p className="mt-1 leading-relaxed text-blue-100/80">
                    Once you broadcast the transfer, click <strong>Mark paid</strong>. XFA Platform
                    treasury will prioritise confirmation.
                  </p>
                  {estimatedCoinAmount && (
                    <p className="mt-2 text-blue-100">
                      Estimated transfer:{" "}
                      <span className="font-semibold">
                        {estimatedCoinAmount.toFixed(6)} {selectedAsset.symbol}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Plan highlights</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {positiveFeatures.map((feature) => (
                  <div
                    key={`${plan.id}-${feature.label}-positive`}
                    className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 flex-shrink-0 text-emerald-300" />
                    {feature.label}
                  </div>
                ))}
                {negativeFeatures.map((feature) => (
                  <div
                    key={`${plan.id}-${feature.label}-negative`}
                    className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100"
                  >
                    <XCircle className="mt-0.5 size-4 flex-shrink-0 text-rose-300" />
                    {feature.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Treasury wallets</p>
              <p className="text-xs text-slate-500">
                Use any address below. Mark the payment once funds are on-chain.
              </p>
              <div className="mt-4 space-y-3">
                {selectedAsset?.addresses?.slice(0, 6).map((address) => (
                  <div
                    key={address.id ?? address.address}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{address.label}</p>
                        <p className="text-xs text-slate-400">
                          {shortAddress(address.address)} - {address.network ?? selectedAsset.network}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(address.id ?? address.address, address.address)}
                          className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold text-slate-200 transition hover:bg-white/10"
                        >
                          <Copy className="size-3" />
                          {copiedAddressId === (address.id ?? address.address) ? "Copied" : "Copy"}
                        </button>
                      {address.deeplink && (
                        <a
                          href={address.deeplink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold text-blue-200 transition hover:bg-white/10"
                        >
                          Pay via Trust
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleMarkPaid(address)}
                        className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1 text-[11px] font-semibold text-white shadow transition hover:from-blue-400 hover:to-purple-500"
                      >
                        Mark paid
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 break-all rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                      {address.address}
                    </p>
                  </div>
                ))}
                {!selectedAsset && (
                  <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-xs text-slate-400">
                    Select a cryptocurrency to view treasury wallets.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 size-4 text-blue-300" />
                <p>
                  XFA Platform Prime desks monitor settlements continuously. Keep your transaction hash
                  handy so verification can be expedited.
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>

        {error && (
          <div className="mx-4 mb-4 sm:mx-6 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            <AlertCircle className="mt-0.5 size-4 flex-shrink-0" />
            <p>{error.message ?? String(error)}</p>
          </div>
        )}

        {success && (
          <div className="mx-4 mb-4 sm:mx-6 flex items-start gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 className="mt-0.5 size-4 flex-shrink-0" />
            <p>Payment recorded. Treasury will confirm once funds settle.</p>
          </div>
        )}
      </div>
    </div>
  );
}
