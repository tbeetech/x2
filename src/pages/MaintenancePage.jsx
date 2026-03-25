import { AlertTriangle } from "lucide-react";

export function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Error Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 md:p-12 shadow-2xl">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border-2 border-red-500/30">
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
          </div>

          {/* Error Code */}
          <div className="text-center mb-8">
            <h1 className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">
              404
            </h1>
          </div>
        </div>

        {/* Logo/Branding */}
        <div className="text-center mt-8">
          <p className="text-slate-600 text-sm">
            XFA Platform | Crypto Investment Platform
          </p>
        </div>
      </div>
    </div>
  );
}
