"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDate, formatTime, getStatusBadgeClass, formatStatus, formatCurrency } from "@/lib/utils";

type Job = {
  id: number; status: string; appointmentDate: string; appointmentTime: string;
  estimatedCost: number | null; finalCost: number | null; notes: string | null; customerNotes: string | null;
  customer: { name: string; contact?: string };
  service: { serviceName: string; estimatedDuration?: number };
  vehicle: { brand: string; model: string; plateNo: string; color?: string; year?: number };
};

const isToday = (dateStr: string) => {
  const d = new Date(dateStr);
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
};

export default function MechanicJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Job | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("All");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/appointments");
    setJobs(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateStatus() {
    if (!selected || !newStatus) return;
    setSaving(true);
    await fetch(`/api/appointments/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setSaving(false);
    setSelected(null);
    load();
  }

  const filters = ["All", "Today", "Approved", "InProgress", "Completed"];

  const filtered = jobs.filter(j => {
    if (filter === "Today") return isToday(j.appointmentDate) && j.status !== "Cancelled";
    if (filter === "All") return true;
    return j.status === filter;
  });

  const todayCount = jobs.filter(j => isToday(j.appointmentDate) && j.status !== "Cancelled").length;

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
      <div className="dashboard-header">
        <h1><i className="fas fa-tools" /> My Jobs</h1>
        <p>All jobs assigned to you</p>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-secondary"}`} style={{ position: "relative" }}>
            {f === "InProgress" ? "In Progress" : f}
            {f === "Today" && todayCount > 0 && (
              <span style={{ position: "absolute", top: -6, right: -6, background: "var(--danger-color)", color: "white", borderRadius: "50%", width: 18, height: 18, fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                {todayCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {filter === "Today" && todayCount === 0 && !loading && (
        <div className="alert alert-info" style={{ marginBottom: "1rem" }}>
          <i className="fas fa-calendar-check" /> No jobs scheduled for today.
        </div>
      )}

      {loading ? (
        <div className="empty-state"><i className="fas fa-spinner fa-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><i className="fas fa-clipboard-check" /><h3>No jobs found</h3></div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr><th>ID</th><th>Customer</th><th>Service</th><th>Vehicle</th><th>Date & Time</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(j => (
                <tr key={j.id} style={isToday(j.appointmentDate) && j.status !== "Completed" && j.status !== "Cancelled"
                  ? { borderLeft: "3px solid var(--secondary-color)" } : {}}>
                  <td>#{j.id}</td>
                  <td>
                    {j.customer.name}
                    {j.customer.contact && <><br /><small style={{ color: "var(--light-text)" }}><i className="fas fa-phone" /> {j.customer.contact}</small></>}
                  </td>
                  <td>{j.service.serviceName}<br /><small style={{ color: "var(--light-text)" }}>~{j.service.estimatedDuration} min</small></td>
                  <td>{j.vehicle.brand} {j.vehicle.model}<br /><small style={{ color: "var(--light-text)" }}>{j.vehicle.plateNo}</small></td>
                  <td>
                    {isToday(j.appointmentDate) && (
                      <span style={{ fontSize: "0.7rem", background: "var(--secondary-color)", color: "white", borderRadius: 3, padding: "1px 5px", marginBottom: 3, display: "inline-block" }}>TODAY</span>
                    )}
                    <br style={isToday(j.appointmentDate) ? {} : { display: "none" }} />
                    {formatDate(j.appointmentDate)}<br /><small style={{ color: "var(--light-text)" }}>{formatTime(j.appointmentTime)}</small>
                  </td>
                  <td><span className={getStatusBadgeClass(j.status)}>{formatStatus(j.status)}</span></td>
                  <td>
                    {j.status !== "Completed" && j.status !== "Cancelled" ? (
                      <button onClick={() => { setSelected(j); setNewStatus(j.status); }} className="btn btn-sm btn-secondary">
                        <i className="fas fa-edit" /> Update
                      </button>
                    ) : (
                      <button onClick={() => { setSelected(j); setNewStatus(j.status); }} className="btn btn-sm btn-secondary">
                        <i className="fas fa-eye" /> View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="card" style={{ width: "100%", maxWidth: 560 }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="card-title">Job #{selected.id}{isToday(selected.appointmentDate) && <span style={{ marginLeft: 8, fontSize: "0.7rem", background: "var(--secondary-color)", color: "white", borderRadius: 3, padding: "2px 6px" }}>TODAY</span>}</h3>
              <button onClick={() => setSelected(null)} className="btn btn-sm btn-danger"><i className="fas fa-times" /></button>
            </div>
            <div className="card-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", background: "var(--light-bg)", padding: "1rem", borderRadius: 5, marginBottom: "1.5rem" }}>
                <div><strong>Customer:</strong> {selected.customer.name}</div>
                <div><strong>Phone:</strong> {selected.customer.contact || "—"}</div>
                <div><strong>Service:</strong> {selected.service.serviceName}</div>
                <div><strong>Duration:</strong> ~{selected.service.estimatedDuration} min</div>
                <div><strong>Vehicle:</strong> {selected.vehicle.brand} {selected.vehicle.model}</div>
                <div><strong>Plate:</strong> {selected.vehicle.plateNo}</div>
                <div><strong>Date:</strong> {formatDate(selected.appointmentDate)}</div>
                <div><strong>Time:</strong> {formatTime(selected.appointmentTime)}</div>
                {selected.estimatedCost && <div><strong>Est. Cost:</strong> {formatCurrency(selected.estimatedCost.toString())}</div>}
              </div>

              {selected.customerNotes && (
                <div className="alert alert-info"><strong>Customer Notes:</strong> {selected.customerNotes}</div>
              )}
              {selected.notes && (
                <div className="alert alert-warning"><strong>Shop Notes:</strong> {selected.notes}</div>
              )}

              {selected.status !== "Completed" && selected.status !== "Cancelled" ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Update Status</label>
                    <select className="form-control" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                      <option value="Approved">Approved</option>
                      <option value="InProgress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button onClick={updateStatus} className="btn btn-primary" disabled={saving}>
                      {saving ? "Saving..." : <><i className="fas fa-save" /> Update Status</>}
                    </button>
                    <button onClick={() => setSelected(null)} className="btn btn-secondary">Close</button>
                  </div>
                </>
              ) : (
                <button onClick={() => setSelected(null)} className="btn btn-secondary">Close</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
