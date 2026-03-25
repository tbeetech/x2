import { useState, useRef, useEffect } from "react";
import { Bell, CheckCircle2, AlertCircle, Info, XCircle, X } from "lucide-react";
import { useDashboardData } from "../hooks/useDashboardData";

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  pending: AlertCircle,
  approved: CheckCircle2,
  rejected: XCircle,
};

const colorMap = {
  success: "text-emerald-400",
  error: "text-rose-400",
  warning: "text-amber-400",
  info: "text-blue-400",
  pending: "text-amber-400",
  approved: "text-emerald-400",
  rejected: "text-rose-400",
};

export function NotificationBell() {
  const { notifications = [], actions } = useDashboardData();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  async function handleNotificationClick(notification) {
    if (actions?.markNotificationRead && !notification.read) {
      try {
        await actions.markNotificationRead(notification.id);
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
  }

  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        aria-label="Notifications"
      >
        <Bell className="size-6" />
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex size-5 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="max-h-[480px] overflow-y-auto">
            {sortedNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                <Bell className="mx-auto mb-2 size-8 opacity-30" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {sortedNotifications.slice(0, 20).map((notification) => {
                  const Icon = iconMap[notification.type] || Info;
                  const iconColor = colorMap[notification.type] || "text-slate-400";

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full px-4 py-3 text-left transition hover:bg-white/5 ${
                        !notification.read ? "bg-blue-500/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`mt-0.5 size-5 flex-shrink-0 ${iconColor}`} />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-semibold text-white">
                            {notification.title}
                            {!notification.read && (
                              <span className="ml-2 inline-block size-2 rounded-full bg-blue-400" />
                            )}
                          </p>
                          <p className="text-xs text-slate-400">{notification.body}</p>
                          <p className="text-[11px] text-slate-500">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {sortedNotifications.length > 0 && (
            <div className="border-t border-white/10 px-4 py-2 text-center">
              <p className="text-xs text-slate-400">
                Showing {Math.min(sortedNotifications.length, 20)} of {sortedNotifications.length} notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
