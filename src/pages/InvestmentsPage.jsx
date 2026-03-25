import { useCallback, useState } from "react";
import { CheckCircle2, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { InvestmentModal } from "../components/InvestmentModal";
import { useDashboardData } from "../hooks/useDashboardData";
import { INVESTMENT_PLANS } from "../data/investmentPlans";
import { LoaderOverlay } from "../components/LoaderOverlay";

const formatUSD = (value = 0) => {
  const numeric = Number(value);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;
  return safeValue.toLocaleString("en-US", { style: "currency", currency: "USD" });
};

export function InvestmentsPage() {
  const { actions, loading } = useDashboardData();
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleInvest = useCallback((plan) => {
    setSelectedPlan(plan);
    setShowInvestModal(true);
  }, []);

  return (
    <div className="min-h-[85vh] px-4 py-6 sm:px-6 sm:py-8">
      <LoaderOverlay show={loading} />
      <InvestmentModal
        show={showInvestModal}
        plan={selectedPlan}
        onSubmit={actions?.createInvestment}
        onClose={() => setShowInvestModal(false)}
      />

      <header className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <Sparkles className="size-6 text-blue-400 sm:size-7 lg:size-8" />
          <h1 className="text-2xl font-semibold text-white sm:text-3xl lg:text-4xl">Investment Plans</h1>
        </div>
        <p className="mt-2 text-sm text-slate-400 sm:mt-3 sm:text-base max-w-3xl">
          Choose from our curated investment programs designed for optimal returns and risk management.
        </p>
      </header>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2 xl:grid-cols-3 lg:gap-6">
        {INVESTMENT_PLANS.map((plan) => {
          const positive = plan.features.filter((item) => item.included);
          const negative = plan.features.filter((item) => !item.included);
          const pricingLabel =
            plan.amount != null ? formatUSD(plan.amount) : `From ${formatUSD(plan.minAmount ?? 0)}`;
          
          return (
            <div
              key={plan.id}
              className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5 lg:p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-blue-400/50 hover:shadow-blue-500/20 hover:shadow-xl"
            >
              <div>
                <span className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-blue-500/10 px-3 py-1.5 text-xs sm:text-sm font-semibold uppercase tracking-wide text-blue-200">
                  <ShieldCheck className="size-3 sm:size-4" />
                  {plan.badge}
                </span>
                <h3 className="mt-3 text-lg sm:text-xl lg:text-2xl font-semibold text-white sm:mt-4">{plan.title}</h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-400 sm:mt-2">{plan.subtitle}</p>
                
                <div className="mt-4 sm:mt-5 lg:mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 text-sm text-slate-200">
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Ticket Size</p>
                    <p className="mt-1 text-base sm:text-lg lg:text-xl font-semibold text-white sm:mt-1.5 break-words">{pricingLabel}</p>
                  </div>
                  <div className="flex-1 text-left sm:text-right">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Projected APY</p>
                    <p className="mt-1 text-base sm:text-lg lg:text-xl font-semibold text-emerald-300 sm:mt-1.5">
                      {plan.minReturn}% – {plan.maxReturn}%
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-5 lg:mt-6 grid gap-2 text-xs sm:text-sm sm:gap-2.5">
                  {positive.map((feature) => (
                    <div key={`${plan.id}-${feature.label}-pos`} className="flex items-center gap-2 text-emerald-200 sm:gap-2.5">{<CheckCircle2 className="size-4 flex-shrink-0 text-emerald-300 sm:size-5" />}
                      <span>{feature.label}</span>
                    </div>
                  ))}
                  {negative.map((feature) => (
                    <div key={`${plan.id}-${feature.label}-neg`} className="flex items-center gap-2 text-rose-200/80 sm:gap-2.5">
                      <XCircle className="size-4 flex-shrink-0 text-rose-300 sm:size-5" />
                      <span>{feature.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => handleInvest(plan)}
                className="mt-4 sm:mt-6 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-3 text-sm sm:text-base font-semibold text-white shadow-lg transition-all hover:from-blue-400 hover:to-purple-500 hover:shadow-xl active:scale-95"
              >
                Configure plan
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
