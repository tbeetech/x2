import { useState, useEffect } from "react";
import { X, Copy, Check, DollarSign, Loader2, AlertCircle, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { apiClient } from "../services/apiClient";

function formatUsd(value = 0) {
  return `$${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function DepositModal({ show, asset, onClose, onMarkPaid }) {
  const [walletAddresses, setWalletAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [amountUsd, setAmountUsd] = useState("");
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    if (!show || !asset) {
      setWalletAddresses([]);
      setSelectedAddress(null);
      return;
    }

    async function loadAddresses() {
      setLoading(true);
      try {
        const response = await apiClient.fetchCryptoDepositOptions();
        const options = response ?? [];
        const match = options.find((opt) => opt.symbol === asset.symbol);
        if (match?.addresses) {
          setWalletAddresses(match.addresses);
          setSelectedAddress(match.addresses[0] || null);
        }
      } catch (err) {
        console.error("Failed to load wallet addresses:", err);
        setAlertMessage(`Failed to load wallet addresses: ${err.message || "Unknown error"}`);
        setShowAlert(true);
      } finally {
        setLoading(false);
      }
    }

    loadAddresses();
  }, [show, asset]);

  const handleCopy = (addressId, address) => {
    navigator.clipboard.writeText(address);
    setCopiedId(addressId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMarkPaid = async () => {
    if (!amountUsd || parseFloat(amountUsd) <= 0) {
      setAlertMessage("Enter the USD value you are depositing before marking as paid.");
      setShowAlert(true);
      return;
    }

    if (!selectedAddress) {
      setAlertMessage("Please select a wallet address");
      setShowAlert(true);
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

    try {
      if (onMarkPaid) {
        await onMarkPaid({
          asset,
          address: selectedAddress,
          amountUsd: parseFloat(amountUsd),
          shouldRedirectToBalance: false, // Don't redirect, show modal instead
        });
        
        // Close deposit modal - processing modal will be shown by parent
        onClose();
      }
    } catch (error) {
      setAlertMessage(error?.message || "Deposit request issue. Please try again.");
      setShowAlert(true);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-900/95 px-6 py-4 backdrop-blur">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Deposit {asset?.name || "Crypto"}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Send funds to the wallet address below
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Flash Card Alert */}
          {showAlert && (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <AlertCircle className="size-5 text-rose-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-rose-200">
                  Deposit request issue
                </p>
                <p className="mt-1 text-xs text-rose-100/80">
                  {alertMessage}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAlert(false)}
                className="flex-shrink-0 rounded-full p-1 text-rose-300 transition hover:bg-white/10"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* Amount Input */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Deposit Amount (USD)
            </label>
            <div className="mt-2 flex items-center gap-2">
              <DollarSign className="size-5 text-slate-400" />
              <input
                type="number"
                min={asset?.minAmountUsd || 0}
                step="0.01"
                value={amountUsd}
                onChange={(e) => setAmountUsd(e.target.value)}
                placeholder="Enter amount"
                className="flex-1 bg-transparent text-2xl font-semibold text-white outline-none placeholder:text-slate-600"
              />
            </div>
            {asset?.minAmountUsd && (
              <p className="mt-2 text-xs text-slate-500">
                Minimum: {formatUsd(asset.minAmountUsd)}
              </p>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-8 animate-spin text-blue-400" />
            </div>
          )}

          {/* Wallet Addresses */}
          {!loading && walletAddresses.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Select Wallet Address
                </h3>
                <span className="text-xs text-slate-500">
                  {asset?.network || "Network"}
                </span>
              </div>

              {walletAddresses.map((addr) => {
                const isSelected = selectedAddress?.id === addr.id;
                return (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddress(addr)}
                    className={`cursor-pointer rounded-2xl border p-4 transition ${
                      isSelected
                        ? "border-blue-400/60 bg-blue-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">
                          {addr.label}
                        </p>
                        <p className="mt-1 break-all rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-slate-300">
                          {addr.address}
                        </p>
                        {addr.network && (
                          <p className="mt-2 text-xs text-slate-400">
                            Network: {addr.network}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(addr.id, addr.address);
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                      >
                        {copiedId === addr.id ? (
                          <>
                            <Check className="size-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Info Box */}
          <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3">
            <p className="text-xs font-semibold text-blue-200">Important</p>
            <ul className="mt-2 space-y-1 text-xs text-blue-100/80">
              <li>• Send only {asset?.symbol} to this address</li>
              <li>• Minimum deposit: {formatUsd(asset?.minAmountUsd || 0)}</li>
              <li>• Funds will be credited after network confirmation</li>
              <li>• Click "Mark Paid" after sending to notify our team</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleMarkPaid}
              disabled={!selectedAddress || !amountUsd || parseFloat(amountUsd) <= 0}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:from-blue-400 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mark Paid
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
