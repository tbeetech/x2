import { BookOpenCheck } from "lucide-react";

export function LearnPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 pb-20 text-slate-200">
      <div className="flex flex-col items-center gap-4 text-center">
        <BookOpenCheck className="size-14 text-blue-300" />
        <h1 className="text-3xl font-semibold text-white">Learning hub (coming soon)</h1>
        <p className="text-sm text-slate-400">
          We are curating advanced market briefings, compliance playbooks, and automation recipes designed for digital asset professionals. Check back shortly for the first collection.
        </p>
      </div>
    </div>
  );
}
