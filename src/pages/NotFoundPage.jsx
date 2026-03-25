import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 text-center text-slate-200">
      <Compass className="size-16 text-blue-400" />
      <h1 className="mt-6 text-3xl font-semibold text-white">We lost this page</h1>
      <p className="mt-3 text-sm text-slate-400">
        The route you followed does not exist. Use the navigation links or head back to the landing page.
      </p>
      <div className="mt-6 flex gap-4">
        <Link
          to="/"
          className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-blue-400 hover:to-purple-500"
        >
          Go home
        </Link>
        <Link
          to="/dashboard"
          className="rounded-full border border-white/10 px-6 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
        >
          Open dashboard
        </Link>
      </div>
    </div>
  );
}
