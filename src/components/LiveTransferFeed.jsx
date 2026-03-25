import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const TRANSFER_EVENTS = [
  { actor: "Ariana (Zurich)", amount: 12500, asset: "USDC", destination: "Prime custody" },
  { actor: "Nova Capital", amount: 582000, asset: "BTC", destination: "Cold vault" },
  { actor: "Helios DAO", amount: 98000, asset: "ETH", destination: "Derivatives desk" },
  { actor: "Evergreen Family Office", amount: 41000, asset: "SOL", destination: "Yield vault" },
  { actor: "QuantX", amount: 755000, asset: "USDT", destination: "Liquidity pool" },
  { actor: "Skyline Ventures", amount: 238000, asset: "MATIC", destination: "On-chain treasury" },
  { actor: "Aurora Partners", amount: 167500, asset: "BTC", destination: "Futures margin" },
];

function formatAmount(value, asset) {
  return `${new Intl.NumberFormat("en-US", { notation: "compact" }).format(value)} ${asset}`;
}

export function LiveTransferFeed() {
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const events = useMemo(() => TRANSFER_EVENTS, []);

  useEffect(() => {
    if (!user) {
      setEvent(null);
      setVisible(false);
      return undefined;
    }

    const showEvent = () => {
      const next = events[Math.floor(Math.random() * events.length)];
      const jitter = 0.9 + Math.random() * 0.2;
      const payload = {
        ...next,
        amount: Math.round(next.amount * jitter),
        id: `${next.actor}-${Date.now()}`,
      };
      setEvent(payload);
      setVisible(true);
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
      }, 2600);
    };

    showEvent();
    intervalRef.current = setInterval(showEvent, 10_000);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [events, user]);

  if (!user || !event) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <div
        className={`pointer-events-auto relative w-72 rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 shadow-xl backdrop-blur transition-all duration-300 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <button
          type="button"
          aria-label="Dismiss live transfer"
          onClick={() => setVisible(false)}
          className="absolute right-2 top-2 rounded-full border border-white/10 p-1 text-slate-400 transition hover:border-white/30 hover:text-white"
        >
          <X className="size-3" />
        </button>
        <p className="text-xs uppercase tracking-[0.35em] text-blue-300">Live transfer</p>
        <p className="mt-2 text-sm font-semibold text-white">{event.actor}</p>
        <p className="mt-1 text-xs text-slate-400">Moved {formatAmount(event.amount, event.asset)}</p>
        <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-blue-200">
          <ArrowUpRight className="size-3" />
          {event.destination}
        </div>
      </div>
    </div>
  );
}
