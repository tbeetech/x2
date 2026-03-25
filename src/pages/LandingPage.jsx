import { useMemo, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useMarketData } from "../hooks/useMarketData";
import "../services/chartConfig";

const timeframes = ["24h", "7d", "30d"];

function formatCurrency(value) {
  return value
    ? `$${Intl.NumberFormat("en-US", { notation: "compact" }).format(value)}`
    : "$0";
}

export function LandingPage() {
  const [timeframe, setTimeframe] = useState("24h");
  const { loading, globalStats, topCryptos } = useMarketData(timeframe);

  const marketCapChart = useMemo(() => {
    const labels = topCryptos.map((coin) => coin.symbol.toUpperCase());
    return {
      labels,
      datasets: [
        {
          label: "Market Cap",
          data: topCryptos.map((coin) => coin.market_cap),
          backgroundColor: [
            "#38bdf8",
            "#a855f7",
            "#f97316",
            "#34d399",
            "#f43f5e",
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [topCryptos]);

  const priceChangeChart = useMemo(() => {
    const labels = topCryptos.map((coin) => coin.symbol.toUpperCase());
    return {
      labels,
      datasets: [
        {
          label: "Change (%)",
          data: topCryptos.map((coin) => coin.price_change_percentage_24h),
          backgroundColor: topCryptos.map((coin) =>
            coin.price_change_percentage_24h >= 0 ? "#22c55e" : "#ef4444",
          ),
          borderWidth: 0,
        },
      ],
    };
  }, [topCryptos]);

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_55%)]" />
      <section className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-20 pt-8 text-white md:pt-12">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-1 text-sm font-medium text-blue-200">
              <Sparkles className="size-4" /> Quantum AI Assisted
              Allocations
            </div>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl lg:text-6xl">
              Invest in the Future of{" "}
              <span className="text-gradient-primary">Digital Currency</span>
            </h1>
            <p className="max-w-xl text-lg text-slate-300">
              Join millions of investors building wealth with our secure platform and Quantum AI.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-400 hover:to-purple-500"
              >
                Get Started
                <ArrowRight className="ml-2 size-4" />
              </Link>
              <Link
                to="/learn"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-3 text-sm font-semibold text-slate-200 transition hover:border-blue-400 hover:text-blue-300"
              >
                Learn More
              </Link>
            </div>
            <dl className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur">
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  Total Market Cap
                </dt>
                <dd className="mt-2 text-xl font-semibold text-white">
                  {loading ? "Loading..." : formatCurrency(globalStats.total_market_cap)}
                </dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur">
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  24h Volume
                </dt>
                <dd className="mt-2 text-xl font-semibold text-white">
                  {loading ? "Loading..." : formatCurrency(globalStats.total_volume_24h)}
                </dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur">
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  Active Assets
                </dt>
                <dd className="mt-2 text-xl font-semibold text-white">
                  {loading ? "Loading..." : globalStats.active_cryptocurrencies.toLocaleString()}{/*  */}
                </dd>
              </div>
            </dl>
          </div>
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-950/70 to-slate-900/60 p-6 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">
                Live Market Overview
              </span>
              <TrendingUp className="size-5 text-emerald-400" />
            </div>
            <div className="mt-6 space-y-6">
              {topCryptos.slice(0, 3).map((coin) => (
                <div
                  key={coin.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-5 py-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {coin.name}
                      <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-slate-300">
                        {coin.symbol.toUpperCase()}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400">Market Cap</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">
                      {formatCurrency(coin.current_price)}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        coin.price_change_percentage_24h >= 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {coin.price_change_percentage_24h?.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 grid gap-4 text-sm">
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-200">
                <ShieldCheck className="size-5" />
                Institutional grade security & compliance
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-blue-200">
                <Wallet className="size-5" />
                Automated multi-wallet monitoring
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-20">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            Live market intelligence
          </h2>
          <div className="flex gap-2 rounded-full border border-white/10 bg-white/5 p-1 text-sm font-medium text-slate-300">
            {timeframes.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTimeframe(value)}
                className={`rounded-full px-4 py-1 transition ${
                  value === timeframe ? "bg-blue-500 text-white" : "hover:bg-white/10"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-blue-900/10 backdrop-blur">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="pb-3">Asset</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3">24h Change</th>
                    <th className="pb-3">24h Volume</th>
                    <th className="pb-3">Market Cap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {topCryptos.map((coin) => (
                    <tr key={coin.id} className="transition hover:bg-white/5">
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-white">{coin.name}</p>
                          <p className="text-xs text-slate-400">
                            {coin.symbol?.toUpperCase()}
                          </p>
                        </div>
                      </td>
                      <td className="py-3">{formatCurrency(coin.current_price)}</td>
                      <td
                        className={`py-3 font-medium ${
                          coin.price_change_percentage_24h >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {coin.price_change_percentage_24h?.toFixed(2)}%
                      </td>
                      <td className="py-3">{formatCurrency(coin.total_volume)}</td>
                      <td className="py-3">{formatCurrency(coin.market_cap)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
              <h3 className="text-sm font-semibold text-white">
                Market capitalisation share
              </h3>
              <div className="mt-4 h-56">
                <Doughnut
                  data={marketCapChart}
                  options={{
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          color: "rgba(226,232,240,0.8)",
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
              <h3 className="text-sm font-semibold text-white">
                24h performance snapshot
              </h3>
              <div className="mt-4 h-56">
                <Bar
                  data={priceChangeChart}
                  options={{
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      x: {
                        ticks: { color: "rgba(148,163,184,0.7)" },
                        grid: { color: "rgba(148,163,184,0.1)" },
                      },
                      y: {
                        ticks: { color: "rgba(148,163,184,0.7)" },
                        grid: { color: "rgba(148,163,184,0.1)" },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Unified portfolio intelligence",
              description:
                "Aggregate assets across exchanges, wallets, and custody providers with streaming market data.",
              icon: TrendingUp,
            },
            {
              title: "Compliance without compromise",
              description:
                "Automated KYC, AML, and verification workflows keep you enterprise-compliant from day one.",
              icon: ShieldCheck,
            },
            {
              title: "Intelligent automations",
              description:
                "Trigger alerts, rebalance portfolios, and monitor risk signals with AI-assisted workflows.",
              icon: Sparkles,
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur"
            >
              <feature.icon className="size-10 rounded-xl bg-blue-500/10 p-2 text-blue-300" />
              <h3 className="mt-4 text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-5xl px-6 pb-24">
        <div className="rounded-3xl border border-blue-500/40 bg-gradient-to-r from-blue-600/30 via-blue-500/20 to-purple-600/30 p-10 text-white shadow-2xl shadow-blue-600/20 backdrop-blur">
          <div className="grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.35em] text-blue-200">
                Ready to invest smarter?
              </p>
              <h2 className="text-3xl font-semibold">
                Launch your XFA workspace in minutes.
              </h2>
              <p className="text-sm text-blue-100">
                Join a growing community of investors optimising their digital
                asset strategies with intelligent automation and deep analytics.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-blue-600 transition hover:bg-slate-100"
              >
                Create free account
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/50 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                View console
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
