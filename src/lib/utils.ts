export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount == null) return "AED 0.00";
  return `AED ${Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    month: "short", day: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function timeAgo(date: Date | string): string {
  const timestamp = typeof date === "string" ? new Date(date).getTime() : date.getTime();
  const diff = Math.floor((Date.now() - timestamp) / 1000);

  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return formatDate(date);
}

export function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    Pending: "badge-warning",
    Approved: "badge-info",
    InProgress: "badge-primary",
    "In Progress": "badge-primary",
    Completed: "badge-success",
    Cancelled: "badge-danger",
    Active: "badge-success",
    Inactive: "badge-secondary",
    Discontinued: "badge-secondary",
  };
  return map[status] ?? "badge-secondary";
}

export function formatStatus(status: string): string {
  return status === "InProgress" ? "In Progress" : status;
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}
