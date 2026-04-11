import { useState, useEffect } from "react";
import {
  Plus,
  Save,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { apiClient } from "../services/apiClient";

export function AdminTreasuryManager() {
  const [treasuryOptions, setTreasuryOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newCrypto, setNewCrypto] = useState({
    id: "",
    symbol: "",
    name: "",
    network: "",
    minAmountUsd: 250,
    description: "",
    addresses: [
      {
        id: "",
        label: "",
        address: "",
        deeplink: "",
      },
    ],
  });

  useEffect(() => {
    loadTreasuryOptions();
  }, []);

  async function loadTreasuryOptions() {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.fetchCryptoDepositOptions();
      setTreasuryOptions(response?.options || []);
    } catch (err) {
      setError(err?.message || "Failed to load treasury options");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveTreasury() {
    try {
      setSaving(true);
      setError(null);

      // Validate
      const validOptions = treasuryOptions.filter((opt) => {
        return (
          opt.symbol &&
          opt.name &&
          opt.addresses &&
          opt.addresses.length > 0 &&
          opt.addresses.some((addr) => addr.address)
        );
      });

      if (validOptions.length === 0) {
        throw new Error("No valid treasury options to save");
      }

      // Save to server
      await apiClient.updateTreasuryOptions(validOptions);

      setSuccess("Treasury configuration saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err?.message || "Failed to save treasury options");
    } finally {
      setSaving(false);
    }
  }

  function handleAddCrypto() {
    if (!newCrypto.symbol || !newCrypto.name || !newCrypto.addresses[0]?.address) {
      setError("Symbol, name, and at least one address are required");
      return;
    }

    const cryptoToAdd = {
      ...newCrypto,
      id: newCrypto.id || newCrypto.symbol.toLowerCase(),
      addresses: newCrypto.addresses.map((addr, idx) => ({
        ...addr,
        id: addr.id || `${newCrypto.symbol.toLowerCase()}-addr-${idx}`,
      })),
    };

    setTreasuryOptions([...treasuryOptions, cryptoToAdd]);
    setShowAddForm(false);
    setNewCrypto({
      id: "",
      symbol: "",
      name: "",
      network: "",
      minAmountUsd: 250,
      description: "",
      addresses: [{ id: "", label: "", address: "", deeplink: "" }],
    });
    setSuccess("Crypto added! Remember to save changes.");
  }

  function handleUpdateCrypto(index, field, value) {
    const updated = [...treasuryOptions];
    updated[index] = { ...updated[index], [field]: value };
    setTreasuryOptions(updated);
  }

  function handleUpdateAddress(cryptoIndex, addrIndex, field, value) {
    const updated = [...treasuryOptions];
    const addresses = [...updated[cryptoIndex].addresses];
    addresses[addrIndex] = { ...addresses[addrIndex], [field]: value };
    updated[cryptoIndex] = { ...updated[cryptoIndex], addresses };
    setTreasuryOptions(updated);
  }

  function handleAddAddress(cryptoIndex) {
    const updated = [...treasuryOptions];
    updated[cryptoIndex].addresses = [
      ...updated[cryptoIndex].addresses,
      {
        id: `${updated[cryptoIndex].symbol.toLowerCase()}-addr-${Date.now()}`,
        label: "",
        address: "",
        deeplink: "",
      },
    ];
    setTreasuryOptions(updated);
  }

  function handleRemoveAddress(cryptoIndex, addrIndex) {
    const updated = [...treasuryOptions];
    updated[cryptoIndex].addresses = updated[cryptoIndex].addresses.filter(
      (_, i) => i !== addrIndex
    );
    setTreasuryOptions(updated);
  }

  function handleRemoveCrypto(index) {
    if (window.confirm("Remove this cryptocurrency from treasury options?")) {
      setTreasuryOptions(treasuryOptions.filter((_, i) => i !== index));
      setSuccess("Crypto removed! Remember to save changes.");
    }
  }

  function handleCopyAddress(address) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(address)
        .then(() => {
          setSuccess(`Copied: ${address}`);
          setTimeout(() => setSuccess(null), 2000);
        })
        .catch(() => {
          setError("Failed to copy address");
        });
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        <p className="mt-4 text-sm text-slate-400">Loading treasury configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-white">Treasury Wallet Management</h2>
          <p className="mt-1 text-sm text-slate-400">
            Configure cryptocurrency wallets and treasury addresses for deposits
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-600/50 bg-slate-800/60 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700/70 hover:text-white min-h-[40px]"
          >
            <Plus className="size-4 shrink-0" />
            Add Crypto
          </button>
          <button
            type="button"
            onClick={handleSaveTreasury}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:from-blue-400 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50 min-h-[40px]"
          >
            <Save className="size-4 shrink-0" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 size-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 size-5 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Add New Crypto Form */}
      {showAddForm && (
        <div className="rounded-3xl border border-blue-400/30 bg-blue-500/5 p-4 sm:p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Add New Cryptocurrency</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-slate-400">Symbol *</span>
              <input
                type="text"
                value={newCrypto.symbol}
                onChange={(e) => setNewCrypto({ ...newCrypto, symbol: e.target.value.toUpperCase() })}
                placeholder="BTC"
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-slate-400">Name *</span>
              <input
                type="text"
                value={newCrypto.name}
                onChange={(e) => setNewCrypto({ ...newCrypto, name: e.target.value })}
                placeholder="Bitcoin"
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-slate-400">Network</span>
              <input
                type="text"
                value={newCrypto.network}
                onChange={(e) => setNewCrypto({ ...newCrypto, network: e.target.value })}
                placeholder="Bitcoin"
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-slate-400">Min Amount (USD)</span>
              <input
                type="number"
                value={newCrypto.minAmountUsd}
                onChange={(e) => setNewCrypto({ ...newCrypto, minAmountUsd: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs uppercase tracking-wide text-slate-400">Description</span>
              <textarea
                value={newCrypto.description}
                onChange={(e) => setNewCrypto({ ...newCrypto, description: e.target.value })}
                rows={2}
                placeholder="Description for users..."
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-y"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs uppercase tracking-wide text-slate-400">Wallet Label *</span>
              <input
                type="text"
                value={newCrypto.addresses[0]?.label || ""}
                onChange={(e) =>
                  setNewCrypto({
                    ...newCrypto,
                    addresses: [{ ...newCrypto.addresses[0], label: e.target.value }],
                  })
                }
                placeholder="Treasury BTC Wallet"
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs uppercase tracking-wide text-slate-400">Wallet Address *</span>
              <input
                type="text"
                value={newCrypto.addresses[0]?.address || ""}
                onChange={(e) =>
                  setNewCrypto({
                    ...newCrypto,
                    addresses: [{ ...newCrypto.addresses[0], address: e.target.value }],
                  })
                }
                placeholder="bc1q..."
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 break-all"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs uppercase tracking-wide text-slate-400">Trust Wallet Deeplink</span>
              <input
                type="text"
                value={newCrypto.addresses[0]?.deeplink || ""}
                onChange={(e) =>
                  setNewCrypto({
                    ...newCrypto,
                    addresses: [{ ...newCrypto.addresses[0], deeplink: e.target.value }],
                  })
                }
                placeholder="https://link.trustwallet.com/send?..."
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 break-all"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 min-h-[40px]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddCrypto}
              className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 min-h-[40px]"
            >
              Add Crypto
            </button>
          </div>
        </div>
      )}

      {/* Treasury Options List */}
      <div className="space-y-4">
        {treasuryOptions.map((crypto, cryptoIdx) => (
          <div
            key={crypto.id || cryptoIdx}
            className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6"
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex size-12 items-center justify-center rounded-full bg-blue-500/20 shrink-0">
                  <Wallet className="size-6 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  {editingId === crypto.id ? (
                    <input
                      type="text"
                      value={crypto.name}
                      onChange={(e) => handleUpdateCrypto(cryptoIdx, "name", e.target.value)}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-lg font-semibold text-white focus:border-blue-400 focus:outline-none w-full"
                    />
                  ) : (
                    <h3 className="text-lg font-semibold text-white break-words">
                      {crypto.name} ({crypto.symbol})
                    </h3>
                  )}
                  <p className="text-xs text-slate-400 break-words">Network: {crypto.network}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingId(editingId === crypto.id ? null : crypto.id)}
                  className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  {editingId === crypto.id ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <Edit2 className="size-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveCrypto(cryptoIdx)}
                  className="rounded-full border border-rose-500/40 p-2 text-rose-400 transition hover:bg-rose-500/10 min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            {editingId === crypto.id && (
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs text-slate-400">Min Amount (USD)</span>
                  <input
                    type="number"
                    value={crypto.minAmountUsd}
                    onChange={(e) => handleUpdateCrypto(cryptoIdx, "minAmountUsd", Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs text-slate-400">Description</span>
                  <textarea
                    value={crypto.description}
                    onChange={(e) => handleUpdateCrypto(cryptoIdx, "description", e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white resize-y"
                  />
                </label>
              </div>
            )}

            {/* Addresses */}
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="text-sm font-semibold text-slate-300">Wallet Addresses</h4>
                {editingId === crypto.id && (
                  <button
                    type="button"
                    onClick={() => handleAddAddress(cryptoIdx)}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/10 min-h-[32px] shrink-0"
                  >
                    <Plus className="size-3 shrink-0" />
                    Add Address
                  </button>
                )}
              </div>

              {crypto.addresses.map((addr, addrIdx) => (
                <div
                  key={addr.id || addrIdx}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  {editingId === crypto.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={addr.label}
                        onChange={(e) =>
                          handleUpdateAddress(cryptoIdx, addrIdx, "label", e.target.value)
                        }
                        placeholder="Label"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                      />
                      <input
                        type="text"
                        value={addr.address}
                        onChange={(e) =>
                          handleUpdateAddress(cryptoIdx, addrIdx, "address", e.target.value)
                        }
                        placeholder="Address"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white break-all"
                      />
                      <input
                        type="text"
                        value={addr.deeplink || ""}
                        onChange={(e) =>
                          handleUpdateAddress(cryptoIdx, addrIdx, "deeplink", e.target.value)
                        }
                        placeholder="Trust Wallet deeplink"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white break-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAddress(cryptoIdx, addrIdx)}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 px-3 py-1 text-xs text-rose-400 transition hover:bg-rose-500/10 min-h-[32px]"
                      >
                        <XCircle className="size-3 shrink-0" />
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold text-white break-words min-w-0 flex-1">{addr.label}</p>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyAddress(addr.address)}
                            className="rounded-full border border-white/10 p-1 text-slate-400 transition hover:bg-white/10 hover:text-white min-h-[32px] min-w-[32px] flex items-center justify-center"
                            title="Copy address"
                          >
                            <Copy className="size-3" />
                          </button>
                          {addr.deeplink && (
                            <a
                              href={addr.deeplink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-full border border-white/10 p-1 text-slate-400 transition hover:bg-white/10 hover:text-white min-h-[32px] min-w-[32px] flex items-center justify-center"
                              title="Open in Trust Wallet"
                            >
                              <ExternalLink className="size-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 break-all rounded-lg bg-white/5 px-2 py-1 font-mono text-xs text-slate-300">
                        {addr.address}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {treasuryOptions.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <Wallet className="mx-auto size-12 text-slate-600" />
          <p className="mt-4 text-sm text-slate-400">No treasury options configured</p>
          <p className="mt-1 text-xs text-slate-500">Click "Add Crypto" to get started</p>
        </div>
      )}
    </div>
  );
}
