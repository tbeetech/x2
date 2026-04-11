import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * Reusable collapsible section component
 * @param {boolean} isCollapsed - Whether the section is collapsed
 * @param {function} onToggle - Function to toggle collapse state
 * @param {string} title - Section title
 * @param {React.ReactNode} actions - Optional action buttons (e.g., Refresh)
 * @param {React.ReactNode} badge - Optional badge component
 * @param {React.ReactNode} children - Section content
 */
export function CollapsibleSection({ 
  isCollapsed, 
  onToggle, 
  title, 
  actions, 
  badge, 
  children,
  className = ""
}) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-white/5 shadow-lg backdrop-blur ${className}`}>
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={onToggle}
              className="rounded-full border border-slate-600/50 bg-slate-800/50 p-1.5 text-slate-300 transition hover:bg-slate-700/60 hover:text-white shrink-0"
              aria-label={isCollapsed ? "Expand section" : "Collapse section"}
            >
              {isCollapsed ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronUp className="size-4" />
              )}
            </button>
            <h2 className="text-base sm:text-lg font-semibold text-white min-w-0 truncate">{title}</h2>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
        
        {/* Collapsible Content */}
        {!isCollapsed && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
