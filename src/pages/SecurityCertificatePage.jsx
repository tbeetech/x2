import { useMemo, useState } from "react";
import { ShieldCheck, FileText, Download, ArrowRight } from "lucide-react";

const CERT_DOCS = [
  {
    id: "iso-iec-27001",
    title: "ISO/IEC 27001:2022",
    subtitle: "Information Security Management System",
    description:
      "Audited controls, risk registers, and monitoring practices that govern XFA Platform infrastructure and client data.",
    highlights: [
      "Scope: global trading, analytics, and custody services",
      "Issued: October 2025 Â· Valid through October 2028",
      "Auditor: Continental Assurance (Tï¿½ï¿½V partner)",
    ],
    file: "/certificates/iso-iec-27001.pdf",
  },
  {
    id: "soc2-type2",
    title: "SOC 2 Type II",
    subtitle: "Trust Services Criteria Â· Security & Availability",
    description:
      "Independent attestation covering operational effectiveness of access controls, monitoring, and incident response.",
    highlights: [
      "12-month observation window",
      "Reports available under NDA",
      "Auditor: Maxwell & Rose LLP",
    ],
    file: "/certificates/soc2-type2.pdf",
  },
];

export function SecurityCertificatePage() {
  const [activeId, setActiveId] = useState(CERT_DOCS[0].id);
  const activeDoc = useMemo(() => CERT_DOCS.find((doc) => doc.id === activeId) ?? CERT_DOCS[0], [activeId]);

  return (
    <div className="mx-auto max-w-6xl px-6 pb-20 pt-10">
      <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/70 p-8 shadow-2xl shadow-blue-500/20">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-blue-200">
              <ShieldCheck className="size-4" /> Certified Assurance
            </div>
            <h1 className="text-3xl font-semibold text-white">Independently verified infrastructure</h1>
            <p className="text-sm text-slate-300">
              XFA Platform maintains continuous audit coverage to validate our control environment, treasury operations, and custodial
              safeguards. Download the latest attestations or preview them securely below.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-400">Coverage summary</p>
            <ul className="mt-3 space-y-2 text-xs text-slate-200">
              <li>â€¢ ISO/IEC 27001 + SOC 2 Type II controls</li>
              <li>â€¢ 24/7 security operations center</li>
              <li>â€¢ Custodial key ceremonies & disaster recovery</li>
            </ul>
          </div>
        </div>
      </header>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-4">
          {CERT_DOCS.map((doc) => {
            const isActive = doc.id === activeDoc.id;
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => setActiveId(doc.id)}
                className={`w-full rounded-3xl border px-5 py-5 text-left transition hover:border-blue-400/60 ${
                  isActive ? "border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/20" : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-blue-300">{doc.subtitle}</p>
                    <h2 className="mt-1 text-xl font-semibold text-white">{doc.title}</h2>
                    <p className="mt-2 text-sm text-slate-300">{doc.description}</p>
                  </div>
                  <FileText className="size-5 text-blue-300" />
                </div>
                <ul className="mt-4 space-y-1 text-xs text-slate-400">
                  {doc.highlights.map((point) => (
                    <li key={point}>â€¢ {point}</li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-[11px] text-slate-200">
                    <ArrowRight className="size-3" /> {isActive ? "Currently displayed" : "Preview in viewer"}
                  </span>
                  <a
                    href={doc.file}
                    download
                    className="inline-flex items-center gap-1 rounded-full border border-blue-400/40 px-3 py-1 text-[11px] font-semibold text-blue-200 transition hover:bg-blue-500/10"
                  >
                    <Download className="size-3" /> Download PDF
                  </a>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-inner">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Secure preview</p>
              <p className="text-sm font-semibold text-white">{activeDoc.title}</p>
            </div>
            <a
              href={activeDoc.file}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200 transition hover:border-blue-400/40 hover:text-blue-200"
            >
              Open in new tab <ArrowRight className="size-3" />
            </a>
          </div>
          <div className="mt-4 h-[520px] overflow-hidden rounded-2xl border border-white/5 bg-slate-950/60">
            <iframe
              title={activeDoc.title}
              src={`${activeDoc.file}#toolbar=0&navpanes=0`}
              className="h-full w-full"
              loading="lazy"
            />
          </div>
          <p className="mt-3 text-xs text-slate-400">
            PDF rendering is sandboxed inside the browser. Download the original artifact for offline review or to share with third-party
            due diligence teams.
          </p>
        </div>
      </section>
    </div>
  );
}

export default SecurityCertificatePage;
