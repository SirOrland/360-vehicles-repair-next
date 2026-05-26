"use client";

import { useState, useEffect, useCallback } from "react";
import { timeAgo } from "@/lib/utils";

type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

const typeIcon: Record<string, string> = {
  Info: "fa-info-circle",
  Success: "fa-check-circle",
  Warning: "fa-exclamation-triangle",
  Error: "fa-times-circle",
};

const typeClass: Record<string, string> = {
  Info: "alert-info",
  Success: "alert-success",
  Warning: "alert-warning",
  Error: "alert-danger",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markRead(id?: number) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : { markAll: true }),
    });
    load();
  }

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div className="dashboard-header" style={{ margin: 0 }}>
          <h1><i className="fas fa-bell" /> Notifications</h1>
          <p>{unread > 0 ? `${unread} unread notification(s)` : "All caught up!"}</p>
        </div>
        {unread > 0 && (
          <button onClick={() => markRead()} className="btn btn-secondary btn-sm">
            <i className="fas fa-check-double" /> Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="empty-state"><i className="fas fa-spinner fa-spin" /><p>Loading...</p></div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-bell-slash" /><h3>No Notifications</h3><p>You have no notifications yet.</p>
        </div>
      ) : (
        <div>
          {notifications.map(n => (
            <div key={n.id} className={`alert ${typeClass[n.type] || "alert-info"}`}
              style={{ opacity: n.isRead ? 0.7 : 1, cursor: "pointer", justifyContent: "space-between" }}
              onClick={() => !n.isRead && markRead(n.id)}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <i className={`fas ${typeIcon[n.type] || "fa-info-circle"}`} style={{ marginTop: 2 }} />
                <div>
                  <strong>{n.title}</strong>
                  {!n.isRead && <span className="badge" style={{ marginLeft: 8 }}>New</span>}
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem" }}>{n.message}</p>
                </div>
              </div>
              <small style={{ whiteSpace: "nowrap", marginLeft: "1rem" }}>{timeAgo(n.createdAt)}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
