import React, { useMemo, useState } from "react";
import { useAccountData } from "../context/AccountDataContext";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";

const ARCHIVE_CLEAR_OPTIONS = [
  { label: "Older than 7 days", value: "7" },
  { label: "Older than 30 days", value: "30" },
  { label: "Older than 90 days", value: "90" },
  { label: "All archived notifications", value: "all" },
];

export function NotificationsPage() {
  const { notifications = [], actions, loading } = useAccountData();
  const [processingIds, setProcessingIds] = useState(new Set());
  const [archivedClearOption, setArchivedClearOption] = useState("30");
  const [clearingArchived, setClearingArchived] = useState(false);

  const activeNotifications = (notifications ?? []).filter((n) => !n.archived);
  const archivedNotifications = (notifications ?? []).filter((n) => n.archived);
  const unreadCount = activeNotifications.filter((n) => !n.read).length;
  const archivedCount = archivedNotifications.length;

  const archiveSelectOptions = useMemo(
    () =>
      ARCHIVE_CLEAR_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      )),
    [],
  );

  const handleArchive = async (noteId) => {
    if (processingIds.has(noteId)) return;
    
    setProcessingIds(prev => new Set(prev).add(noteId));
    try {
      if (actions?.archiveNotification) {
        await actions.archiveNotification(noteId);
      }
    } catch (error) {
      console.error("Failed to archive notification:", error);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(noteId);
        return newSet;
      });
    }
  };

  const handleDelete = async (noteId) => {
    if (processingIds.has(noteId)) return;

    setProcessingIds((prev) => new Set(prev).add(noteId));
    try {
      if (actions?.deleteNotification) {
        await actions.deleteNotification(noteId);
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      if (actions?.markAllNotificationsRead) {
        await actions.markAllNotificationsRead();
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleClearArchived = async () => {
    if (!actions?.clearArchivedNotifications || archivedCount === 0) {
      return;
    }
    setClearingArchived(true);
    try {
      const selectedValue = archivedClearOption === "all" ? null : Number(archivedClearOption);
      await actions.clearArchivedNotifications({ olderThanDays: selectedValue ?? undefined });
    } catch (error) {
      console.error("Failed to clear archived notifications:", error);
    } finally {
      setClearingArchived(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Notifications</h1>
          <p className="mt-1 text-sm text-slate-400">You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/transactions" className="text-sm text-blue-300">View transactions</Link>
          <button
            type="button"
            className="rounded px-3 py-2 text-sm font-semibold bg-blue-600 text-white disabled:opacity-60 hover:bg-blue-500 transition"
            onClick={handleMarkAllRead}
            disabled={loading || unreadCount === 0}
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Active Notifications */}
      <div className="mt-6 space-y-3">
        <h2 className="text-lg font-semibold text-white">Active Notifications</h2>
        {activeNotifications.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">No active notifications</div>
        ) : (
          activeNotifications.map((note) => {
            const isProcessing = processingIds.has(note.id);
            return (
              <div
                key={note.id}
                className={`rounded-xl border border-white/10 p-4 bg-slate-900/60 transition-opacity ${
                  note.read ? "opacity-70" : "bg-white/5"
                } ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{note.title || note.type}</p>
                    <p className="mt-1 text-sm text-slate-300">{note.body}</p>
                    {note.meta?.transactionId && (
                      <p className="mt-2 text-xs text-slate-400">
                        Related: <Link to={`/transactions`} className="text-blue-300 hover:text-blue-200">{note.meta.transactionId}</Link>
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-500">{new Date(note.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition disabled:opacity-50"
                      onClick={() => handleArchive(note.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "..." : "Archive"}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition disabled:opacity-50"
                      onClick={() => handleDelete(note.id)}
                      disabled={isProcessing}
                    >
                      <Trash2 className="size-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Archived Notifications */}
      {archivedNotifications.length > 0 && (
        <div className="mt-8 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-slate-400">Archived Notifications</h2>
            <div className="flex flex-col gap-2 text-sm text-slate-400 md:flex-row md:items-center">
              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-slate-500">Remove</span>
                <select
                  value={archivedClearOption}
                  onChange={(event) => setArchivedClearOption(event.target.value)}
                  className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  {archiveSelectOptions}
                </select>
              </label>
              <button
                type="button"
                onClick={handleClearArchived}
                disabled={clearingArchived || archivedCount === 0}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="size-4" />
                {clearingArchived ? "Clearing..." : "Clear archived"}
              </button>
            </div>
          </div>
          {archivedNotifications.map((note) => {
            const isProcessing = processingIds.has(note.id);
            return (
              <div
                key={note.id}
                className="rounded-xl border border-white/5 p-4 bg-slate-900/30 opacity-60"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-400">{note.title || note.type}</p>
                    <p className="mt-1 text-sm text-slate-500">{note.body}</p>
                    {note.meta?.transactionId && (
                      <p className="mt-2 text-xs text-slate-500">
                        Related: <Link to={`/transactions`} className="text-slate-400 hover:text-slate-300">{note.meta.transactionId}</Link>
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-600">{new Date(note.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 italic">Archived</span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-white/10 transition disabled:opacity-50"
                      onClick={() => handleDelete(note.id)}
                      disabled={isProcessing}
                    >
                      <Trash2 className="size-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
