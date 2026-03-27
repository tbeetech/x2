import { Link, Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-slate-950 text-slate-100 md:grid-cols-[1fr_480px]">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950 md:flex md:flex-col md:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#3b82f620,transparent_60%)]" />
        <div className="relative p-12">
          <div className="flex items-center gap-2 text-white">
            <div className="flex flex-col leading-none">
              <span className="text-2xl font-black tracking-widest">XFA</span>
              <span className="text-[0.55rem] tracking-widest uppercase text-blue-300">A division of Marex</span>
            </div>
          </div>
          <div className="mt-16 space-y-6">
            <h1 className="text-3xl font-semibold leading-tight text-white md:text-4xl">
              Navigate the market with confidence.
            </h1>
            <p className="text-sm text-slate-300">
              Track your assets, monitor transactions, and unlock AI-powered
              insights designed for serious digital asset investors.
            </p>
          </div>
        </div>
        <div className="relative space-y-8 bg-slate-950/30 p-12 backdrop-blur-lg">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
              Trusted by investors across the globe
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-300">
              <span>• Institutional grade reports</span>
              <span>• Automated compliance</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center overflow-hidden px-6 py-10 md:px-16">
        <Link to="/" className="mb-10 flex items-center gap-2 text-white md:hidden">
          <div className="flex flex-col leading-none">
            <span className="text-xl font-black tracking-widest">XFA</span>
            <span className="text-[0.5rem] tracking-widest uppercase text-blue-400">A division of Marex</span>
          </div>
        </Link>
        <div className="w-full max-w-md md:mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
