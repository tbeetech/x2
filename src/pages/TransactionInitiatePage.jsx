import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  DollarSign,
  FileText,
  Info,
  Loader2,
} from "lucide-react";
import { useAccountData } from "../context/AccountDataContext.jsx";
import { apiClient } from "../services/apiClient.js";
import { logger } from "../services/logger";
import { LoaderOverlay } from "../components/LoaderOverlay";
import { DepositModal } from "../components/DepositModal";
import { PaymentSuccessModal } from "../components/PaymentSuccessModal";

function formatUsd(value = 0) {
  return `$${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function shortAddress(address = "") {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)} - ${address.slice(-6)}`;
}

function BUILD_INVOICE_HTML_TEMPLATE({ user, asset, amountUsd, coinAmount, address }) {
  const invoiceId = `INV-${Date.now().toString(36).toUpperCase()}`;
  const issuedAt = new Date().toLocaleString();
  const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString();
  const userName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "XFA Platform Client";
  const customerEmail = user?.email ?? "support@x-fa.com";
  const customerCountry = user?.country ?? "Not specified";
  const network = asset?.network ?? "Network";
  const assetName = asset?.name ?? asset?.symbol ?? "Asset";
  const instructions = asset?.description ?? "Follow the standard XFA Platform treasury funding instructions.";
  const walletLabel = address?.label ?? `${assetName} wallet`;
  const walletAddress = address?.address ?? "N/A";
  const deeplink = address?.deeplink ?? "";
  const formattedUsd = formatUsd(amountUsd);
  const formattedCoin = coinAmount
    ? `${coinAmount.toFixed(8)} ${asset?.symbol ?? ""}`.trim()
    : "Pending quote";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>XFA Platform Invoice ${invoiceId}</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      body {
        margin: 0;
        padding: 0;
        background: #020617;
        color: #e2e8f0;
      }
      .shell {
        max-width: 720px;
        margin: 0 auto;
        padding: 48px 32px 64px;
      }
      .card {
        border-radius: 28px;
        border: 1px solid rgba(148, 163, 184, 0.15);
        background: radial-gradient(circle at top right, rgba(60, 99, 255, 0.18), rgba(2, 6, 23, 0.9));
        padding: 32px;
        box-shadow: 0 35px 120px rgba(15, 23, 42, 0.65);
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 14px;
        border-radius: 999px;
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        background: rgba(129, 140, 248, 0.15);
        color: #c7d2fe;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 18px;
      }
      .panel {
        padding: 18px;
        border-radius: 20px;
        border: 1px solid rgba(148, 163, 184, 0.18);
        background: rgba(15, 23, 42, 0.55);
      }
      .panel h4 {
        margin: 0;
        font-size: 13px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: rgba(148, 163, 184, 0.85);
      }
      .panel p {
        margin: 6px 0 0;
        font-size: 15px;
        font-weight: 600;
        color: #f8fafc;
      }
      .footer {
        margin-top: 32px;
        font-size: 12px;
        color: rgba(148, 163, 184, 0.8);
      }
      a {
        color: #93c5fd;
      }
      code {
        display: block;
        word-break: break-all;
        padding: 12px;
        border-radius: 16px;
        background: rgba(2, 6, 23, 0.7);
        border: 1px dashed rgba(148, 163, 184, 0.4);
        font-size: 13px;
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:18px;">
          <div>
            <div class="badge">XFA Platform Treasury</div>
            <h1 style="margin:16px 0 0;font-size:28px;">Funding invoice</h1>
            <p style="margin:6px 0 0;color:rgba(148,163,184,0.9);">Invoice <strong>${invoiceId}</strong></p>
          </div>
          <div style="text-align:right;">
            <p style="margin:0;font-size:13px;color:rgba(148,163,184,0.8);">Issued ${issuedAt}</p>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(148,163,184,0.8);">Due ${dueAt}</p>
          </div>
        </div>

        <section style="margin-top:24px;">
          <h3 style="margin:0 0 12px;font-size:15px;color:#e2e8f0;">Account holder</h3>
          <div class="grid">
            <div class="panel">
              <h4>Name</h4>
              <p>${userName}</p>
            </div>
            <div class="panel">
              <h4>Email</h4>
              <p>${customerEmail}</p>
            </div>
            <div class="panel">
              <h4>Country</h4>
              <p>${customerCountry}</p>
            </div>
          </div>
        </section>

        <section style="margin-top:32px;">
          <h3 style="margin:0 0 12px;font-size:15px;color:#e2e8f0;">Funding summary</h3>
          <div class="grid">
            <div class="panel">
              <h4>Asset</h4>
              <p>${assetName} (${asset?.symbol ?? "N/A"})</p>
            </div>
            <div class="panel">
              <h4>USD amount</h4>
              <p>${formattedUsd}</p>
            </div>
            <div class="panel">
              <h4>Estimated coin</h4>
              <p>${formattedCoin}</p>
            </div>
            <div class="panel">
              <h4>Network</h4>
              <p>${network}</p>
            </div>
          </div>
        </section>

        <section style="margin-top:32px;">
          <h3 style="margin:0 0 12px;font-size:15px;color:#e2e8f0;">Wallet instructions</h3>
          <div class="panel">
            <h4>${walletLabel}</h4>
            <p style="font-size:14px;font-weight:400;color:rgba(226,232,240,0.9);margin-top:6px;">${instructions}</p>
            <code>${walletAddress}</code>
            ${
              deeplink
                ? `<p style="margin:12px 0 0;font-size:13px;">Deep link: <a href="${deeplink}">${deeplink}</a></p>`
                : ""
            }
          </div>
        </section>

        <section style="margin-top:22px;">
          <p style="margin:0;font-size:13px;line-height:1.5;color:rgba(226,232,240,0.85);">
            Please include the invoice ID (<strong>${invoiceId}</strong>) and your XFA Platform account
            email when submitting proof of payment. Treasury will mark your deposit as "cleared" once on-chain confirmations
            are final. For priority handling email <a href="mailto:support@x-fa.com">support@x-fa.com</a>.
          </p>
        </section>

        <p class="footer">Generated automatically by XFA Platform Console Â· ${new Date().getFullYear()}</p>
      </div>
    </div>
  </body>
</html>`;
}

function DOWNLOAD_INVOICE(html, fileName) {
  if (typeof window === "undefined") return;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function TransactionInitiatePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { wallet, actions } = useAccountData();

  const mode = (params.get("type") ?? "deposit").toLowerCase();
  const isDeposit = mode === "deposit";

  const [options, setOptions] = useState([]);
  const [quotes, setQuotes] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [amountUsd, setAmountUsd] = useState("");
  const [txHash, setTxHash] = useState("");
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotNotes, setScreenshotNotes] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState(null);
  const [copiedAddressId, setCopiedAddressId] = useState(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  
  // Bank details for withdrawal
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    swiftCode: "",
  });

  useEffect(() => {
    // No redirect; we support both deposit and withdraw modes in this page.
  }, [isDeposit, navigate]);

  useEffect(() => {
    if (!isDeposit) return undefined;
    let mounted = true;
    async function load() {
      setLoading(true);
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
        setError(err instanceof Error ? err : new Error("Unable to load deposit options."));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [isDeposit]);

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
  const walletAddresses = selectedAsset?.addresses ?? [];

  const estimatedCoinAmount = useMemo(() => {
    if (!selectedAsset) return null;
    const price = quotes.get((selectedAsset.symbol ?? "").toUpperCase());
    const value = Number(amountUsd);
    if (!price || Number.isNaN(value) || value <= 0) {
      return null;
    }
    return value / price;
  }, [amountUsd, quotes, selectedAsset]);

  async function handleCopy(addressId, address) {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddressId(addressId);
      setTimeout(() => setCopiedAddressId(null), 2000);
    } catch (copyError) {
      logger.warn("Clipboard copy failed", copyError);
    }
  }

  async function handlePaid(address) {
    if (!selectedAsset) return;
    const value = Number(amountUsd);
    if (Number.isNaN(value) || value <= 0) {
      setError(new Error("Enter the USD value you are depositing before marking as paid."));
      return;
    }
    if (selectedAsset?.minAmountUsd && value < Number(selectedAsset.minAmountUsd)) {
      setError(
        new Error(
          `Minimum deposit for ${selectedAsset.symbol} is ${formatUsd(selectedAsset.minAmountUsd)}.`,
        ),
      );
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await actions.deposit({
        amount: value,
        assetSymbol: selectedAsset.symbol,
        assetName: selectedAsset.name,
        network: address.network ?? selectedAsset.network,
        walletAddress: address.address,
        walletLabel: address.label,
        transactionHash: txHash,
        cryptoAmount: estimatedCoinAmount ?? undefined,
        reference: txHash,
      });
      setSuccess(true);
      
      // Show processing modal
      setShowProcessingModal(true);
      
      // If the server returned a transaction id, keep it so the user can attach screenshots
      const tx = result?.transaction ?? null;
      if (tx) {
        setPendingTransaction(tx);
      }
      // do not navigate away immediately â€” allow upload of screenshot
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unable to submit payment confirmation."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUploadScreenshot() {
    if (!pendingTransaction) {
      setError(new Error("No pending transaction to attach screenshot to."));
      return;
    }
    if (!screenshotFile) {
      setError(new Error("Please choose an image or PDF to upload as proof of payment."));
      return;
    }
    setSubmitting(true);
    try {
      // create a preview URL locally so the user sees what was uploaded
      try {
        if (uploadedPreviewUrl) {
          URL.revokeObjectURL(uploadedPreviewUrl);
        }
      } catch {
        // ignore
      }
      const preview = typeof window !== "undefined" && screenshotFile ? URL.createObjectURL(screenshotFile) : null;
      setUploadedPreviewUrl(preview);
      await actions.uploadTransactionScreenshot(pendingTransaction._id ?? pendingTransaction.id, {
        files: [screenshotFile],
        notes: screenshotNotes,
      });
      setUploadSuccess(true);
      setScreenshotFile(null);
      setScreenshotNotes("");
      // keep preview visible for a short while, then navigate to transactions
      setTimeout(() => navigate("/transactions"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to upload screenshot."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWithdrawSubmit() {
    const value = Number(amountUsd);
    if (Number.isNaN(value) || value <= 0) {
      setError(new Error("Enter a valid withdraw amount."));
      return;
    }

    // Validate bank details
    if (!bankDetails.accountHolderName || !bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.routingNumber) {
      setError(new Error("Please fill in all required bank details (marked with *)"));
      return;
    }

  // Get available balance from account data (wallet.balance is authoritative)
  const availableBalance = parseFloat(wallet?.balance || "0");
    
    if (value > availableBalance) {
      setError(new Error(`Insufficient balance. Available: ${formatUsd(availableBalance)}`));
      return;
    }

    const confirmed = window.confirm(
      `Confirm withdrawal of ${formatUsd(value)} to ${bankDetails.bankName} account ending in ${bankDetails.accountNumber.slice(-4)}?`
    );

    if (!confirmed) return;

    setError(null);
    setSubmitting(true);
    try {
      await actions.withdraw({ 
        amount: value, 
        method: "bank_transfer", 
        reference: JSON.stringify({ ...bankDetails, notes: txHash })
      });
      setSuccess(true);
      setTimeout(() => navigate("/transactions"), 1400);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unable to submit withdraw request."));
    } finally {
      setSubmitting(false);
    }
  }

  // Render deposit UI when deposit mode, otherwise show withdraw form

  if (isDeposit) {
    return (
      <div className="mx-auto min-h-[85vh] max-w-6xl px-6 py-8">
      <LoaderOverlay show={submitting} label="Submitting deposit request..." />
      
      {/* Simplified Deposit Modal */}
      <DepositModal
        show={showDepositModal}
        asset={selectedAsset}
        onClose={() => setShowDepositModal(false)}
        onMarkPaid={async (data) => {
          try {
            setSubmitting(true);
            setError(null);
            const result = await actions.deposit({
              amount: data.amountUsd,
              assetSymbol: data.asset.symbol,
              assetName: data.asset.name,
              walletAddress: data.address.address,
              walletLabel: data.address.label,
              network: data.address.network || data.asset.network,
              reference: data.address.address,
              method: "crypto",
            });
            setSuccess(true);
            setShowDepositModal(false);
            
            // Store pending transaction if returned
            if (result?.transaction) {
              setPendingTransaction(result.transaction);
            }
            
            // Show processing modal instead of redirecting
            setShowProcessingModal(true);
          } catch (err) {
            setError(err);
          } finally {
            setSubmitting(false);
          }
        }}
      />

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-white">Fund account with crypto</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Choose a supported asset, copy a dedicated treasury wallet, and mark the transfer as paid
          once it is sent. XFA Platform treasury will confirm and credit your account.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <Info className="mt-0.5 size-4 flex-shrink-0" />
          <div>
            <p className="font-semibold">Deposit request issue</p>
            <p className="text-xs text-rose-100/80">{error.message ?? String(error)}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 size-4 flex-shrink-0" />
          <div>
            <p className="font-semibold">Deposit queued for review</p>
            <p className="text-xs text-emerald-100/80">
              Treasury has been notified. You will see the confirmation in transactions once the
              payment clears.
            </p>
          </div>
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Supported assets</p>
              <p className="text-xs text-slate-500">Select the network you plan to use.</p>
            </div>
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-200">
              {options.length} assets
            </span>
          </header>

          <div className="mt-5 grid gap-3">
            {loading && (
              <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-6 text-sm text-slate-300">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Loading deposit methods...
              </div>
            )}
            {!loading &&
              options.map((option) => {
                const symbol = option.symbol ?? option.id;
                const price = quotes.get(symbol?.toUpperCase?.());
                const isActive =
                  selectedAssetId === option.id ||
                  selectedAssetId === option.symbol ||
                  selectedAssetId === symbol;
                return (
                  <button
                    type="button"
                    key={option.id ?? option.symbol}
                    onClick={() => {
                      setSelectedAssetId(option.id ?? option.symbol);
                      setSuccess(false);
                      if (isDeposit) {
                        setShowDepositModal(true);
                      }
                    }}
                    className={`flex flex-col gap-2 rounded-2xl border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-blue-400/60 bg-blue-500/10 text-white shadow-blue-500/10"
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
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-[11px] text-slate-300">
                        <DollarSign className="size-3 text-blue-300" />
                        Min {formatUsd(option.minAmountUsd ?? 0)}
                      </span>
                      {price && (
                        <span className="text-[11px] uppercase text-slate-400">
                          Spot price: {formatUsd(price)}
                        </span>
                      )}
                    </div>
                    {option.description && (
                      <p className="text-xs text-slate-400">{option.description}</p>
                    )}
                  </button>
                );
              })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
            <p className="text-sm font-semibold text-white">Deposit details</p>
            <div className="mt-4 space-y-4">
              <label className="block text-xs uppercase tracking-wide text-slate-500">
                Deposit amount (USD equivalent)
                <input
                  type="number"
                  min={selectedAsset?.minAmountUsd ?? 0}
                  step="0.01"
                  value={amountUsd}
                  onChange={(event) => {
                    setAmountUsd(event.target.value);
                    setSuccess(false);
                  }}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Enter the USD amount you are sending"
                />
              </label>
              <label className="block text-xs uppercase tracking-wide text-slate-500">
                Transaction hash / reference (optional)
                <input
                  value={txHash}
                  onChange={(event) => setTxHash(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Paste the on-chain transaction hash or reference"
                />
              </label>
              {selectedAsset && (
                <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-xs text-blue-100">
                  <p className="font-semibold text-blue-200">Heads up</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-blue-100/80">
                    Once payment is made simply click the <strong>Mark paid</strong> button so our
                    treasury desk can confirm settlement.
                  </p>
                  {estimatedCoinAmount && (
                    <p className="mt-2 text-[11px] text-blue-100">
                      Estimated transfer:{" "}
                      <span className="font-semibold">
                        {estimatedCoinAmount.toFixed(6)} {selectedAsset.symbol}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
            <header className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Wallet addresses</p>
              <span className="text-xs text-slate-500">
                Up to 8 treasury addresses per asset. Use any single address.
              </span>
            </header>
            <div className="space-y-4">
              {walletAddresses.slice(0, 8).map((address) => (
                <div
                  key={address.id ?? address.address}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
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
                      <button
                        type="button"
                        onClick={() => handlePaid(address)}
                        className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1 text-[11px] font-semibold text-white shadow transition hover:from-blue-400 hover:to-purple-500"
                      >
                        Mark paid
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 break-all rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                    {address.address}
                  </p>
                  
                  {/* Upload Screenshot Section - Shows after marking paid */}
                  {pendingTransaction && (
                    <div className="mt-4 rounded-xl border border-blue-400/20 bg-blue-500/5 px-4 py-4">
                      <p className="text-sm font-semibold text-blue-200 mb-3">Payment Confirmation</p>
                      <p className="text-xs text-slate-400 mb-2">
                        Transaction ID: <span className="font-mono text-xs text-slate-200">{pendingTransaction.id ?? pendingTransaction._id ?? pendingTransaction.transactionId}</span>
                      </p>
                      <p className="text-xs text-slate-400 mb-3">
                        Status: <span className="font-semibold text-xs text-blue-200 uppercase">{(pendingTransaction.status ?? "pending").toLowerCase()}</span>
                      </p>
                      <p className="text-xs text-slate-300 mb-3">Attach payment screenshot to speed up admin review:</p>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setScreenshotFile(e.target.files?.[0] ?? null)}
                        className="mb-3 w-full text-xs text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-blue-500/20 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-blue-200 hover:file:bg-blue-500/30"
                      />
                      {screenshotFile && (
                        <div className="mb-3 flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                          {screenshotFile.type?.startsWith("image/") ? (
                            <img src={URL.createObjectURL(screenshotFile)} alt="preview" className="h-20 w-28 rounded-md object-cover" />
                          ) : (
                            <div className="h-20 w-28 rounded-md bg-white/10 flex items-center justify-center text-xs text-slate-300">
                              <FileText className="size-6" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-slate-200">{screenshotFile.name}</p>
                            <p className="text-xs text-slate-400">{(screenshotFile.size / 1024).toFixed(0)} KB</p>
                          </div>
                        </div>
                      )}
                      <textarea
                        value={screenshotNotes}
                        onChange={(e) => setScreenshotNotes(e.target.value)}
                        placeholder="Optional notes for treasury team..."
                        rows={2}
                        className="w-full mb-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleUploadScreenshot}
                          disabled={!screenshotFile}
                          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:from-blue-400 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FileText className="size-3" />
                          Upload Proof
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate("/transactions")}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                        >
                          View Transactions
                        </button>
                      </div>
                      {uploadSuccess && (
                        <div className="mt-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="size-5 text-emerald-200" />
                            <div>
                              <div className="font-semibold">Proof Uploaded Successfully</div>
                              <div className="text-[11px] text-emerald-100/80 mt-1">Your payment screenshot has been submitted. The treasury team will review and approve your deposit shortly.</div>
                            </div>
                          </div>
                          {uploadedPreviewUrl && (
                            <div className="mt-3">
                              <img src={uploadedPreviewUrl} alt="uploaded preview" className="h-32 rounded-md object-contain border border-emerald-500/20" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {!selectedAsset && (
                <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-xs text-slate-400">
                  Select a cryptocurrency above to view dedicated wallet addresses.
                </p>
              )}
              {selectedAsset && walletAddresses.length === 0 && (
                <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-6 text-xs text-amber-200">
                  Wallet coordinates for {selectedAsset.name ?? selectedAsset.symbol} are not available yet. Contact support@x-fa.com for expedited funding instructions.
                </p>
              )}
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Need help?{" "}
            <Link className="text-blue-300 underline transition hover:text-blue-200" to="/help-center">
              Contact support
            </Link>{" "}
            with the on-chain hash so we can fast-track your confirmation.
          </div>
        </div>
      </section>
    </div>
    );
  }

  // Withdraw UI
  return (
    <div className="mx-auto min-h-[85vh] max-w-6xl px-6 py-8">
      <LoaderOverlay show={submitting} label="Submitting withdraw request..." />

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-white">Withdraw funds</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Request a withdrawal from your available balance. Withdrawals are queued for treasury
          approval and will be processed after review.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <Info className="mt-0.5 size-4 flex-shrink-0" />
          <div>
            <p className="font-semibold">Withdraw request issue</p>
            <p className="text-xs text-rose-100/80">{error.message ?? String(error)}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 size-4 flex-shrink-0" />
          <div>
            <p className="font-semibold">Withdrawal queued for review</p>
            <p className="text-xs text-emerald-100/80">Your withdraw request was submitted and is pending admin approval.</p>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-white">Withdrawal details</p>
            <div className="text-right">
            <p className="text-xs text-slate-400">Available Balance</p>
            <p className="text-sm font-semibold text-emerald-400">{formatUsd(wallet?.balance || 0)}</p>
          </div>
        </div>
        
        {/* Amount */}
        <div className="mt-4">
          <label className="block text-xs uppercase tracking-wide text-slate-500">
            Amount (USD) *
            <input
              type="number"
              min={0.01}
              step="0.01"
              value={amountUsd}
              onChange={(e) => setAmountUsd(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Enter amount to withdraw"
              required
            />
          </label>
        </div>

        {/* Bank Details Section */}
        <div className="mt-6 border-t border-white/10 pt-6">
          <p className="text-sm font-semibold text-white mb-4">Bank Account Details</p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-xs uppercase tracking-wide text-slate-500">
              Account Holder Name *
              <input
                type="text"
                value={bankDetails.accountHolderName}
                onChange={(e) => setBankDetails(prev => ({ ...prev, accountHolderName: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="Full name on bank account"
                required
              />
            </label>
            <label className="block text-xs uppercase tracking-wide text-slate-500">
              Bank Name *
              <input
                type="text"
                value={bankDetails.bankName}
                onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="Name of your bank"
                required
              />
            </label>
            <label className="block text-xs uppercase tracking-wide text-slate-500">
              Account Number *
              <input
                type="text"
                value={bankDetails.accountNumber}
                onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="Bank account number"
                required
              />
            </label>
            <label className="block text-xs uppercase tracking-wide text-slate-500">
              Routing Number / Sort Code *
              <input
                type="text"
                value={bankDetails.routingNumber}
                onChange={(e) => setBankDetails(prev => ({ ...prev, routingNumber: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="9-digit routing or sort code"
                required
              />
            </label>
            <label className="block text-xs uppercase tracking-wide text-slate-500 md:col-span-2">
              SWIFT / BIC Code (International transfers)
              <input
                type="text"
                value={bankDetails.swiftCode}
                onChange={(e) => setBankDetails(prev => ({ ...prev, swiftCode: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="SWIFT/BIC code for international wires"
              />
            </label>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs uppercase tracking-wide text-slate-500">
            Reference / Notes (optional)
            <textarea
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Add any special instructions or reference"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleWithdrawSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:from-rose-400 hover:to-pink-500"
          >
            Request Withdraw
          </button>
        </div>
      </div>
      
      {/* Payment Success Modal */}
      <PaymentSuccessModal
        show={showProcessingModal}
        onClose={() => setShowProcessingModal(false)}
      />
    </div>
  );
}
