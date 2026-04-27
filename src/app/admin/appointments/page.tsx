"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDate, formatTime, getStatusBadgeClass, formatStatus, formatCurrency } from "@/lib/utils";
import Link from "next/link";

type Appointment = {
  id: number;
  status: string;
  appointmentDate: string;
  appointmentTime: string;
  estimatedCost: number | null;
  finalCost: number | null;
  customerNotes: string | null;
  notes: string | null;
  customer: { name: string; email: string; contact?: string };
  service: { serviceName: string; estimatedDuration?: number };
  vehicle: { brand: string; model: string; plateNo: string; year?: number };
  mechanic?: { name: string } | null;
};

type User = { id: number; name: string; role: string };

const STATUSES = ["All", "Pending", "Approved", "InProgress", "Completed", "Cancelled"];

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [mechanics, setMechanics] = useState<User[]>([]);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updateData, setUpdateData] = useState({ status: "", mechanicId: "", notes: "", finalCost: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [aRes, mRes] = await Promise.all([
      fetch("/api/appointments"),
      fetch("/api/users?role=Mechanic"),
    ]);
    const [aData, mData] = await Promise.all([aRes.json(), mRes.json()]);
    setAppointments(aData);
    setMechanics(mData);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openModal = (a: Appointment) => {
    setSelected(a);
    setUpdateData({ status: a.status, mechanicId: String(a.mechanic ? "" : ""), notes: a.notes || "", finalCost: a.finalCost ? String(a.finalCost) : "" });
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setSaving(true);
    await fetch(`/api/appointments/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: updateData.status,
        mechanicId: updateData.mechanicId || null,
        notes: updateData.notes,
        finalCost: updateData.finalCost ? parseFloat(updateData.finalCost) : null,
      }),
    });
    setSaving(false);
    setSelected(null);
    load();
  };

  const filtered = filter === "All" ? appointments : appointments.filter(a => a.status === filter);

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
      <div className="dashboard-header">
        <h1><i className="fas fa-calendar-check" /> Appointments</h1>
        <p>Manage all service appointments</p>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`btn btn-sm ${filter === s ? "btn-primary" : "btn-secondary"}`}>
            {s === "InProgress" ? "In Progress" : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state"><i className="fas fa-spinner fa-spin" /><p>Loading...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><i className="fas fa-calendar-times" /><h3>No appointments found</h3></div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr><th>ID</th><th>Customer</th><th>Service</th><th>Vehicle</th><th>Date & Time</th><th>Status</th><th>Mechanic</th><th>Cost</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>#{a.id}</td>
                  <td>{a.customer.name}<br /><small style={{ color: "var(--light-text)" }}>{a.customer.email}</small></td>
                  <td>{a.service.serviceName}</td>
                  <td>{a.vehicle.brand} {a.vehicle.model}<br /><small style={{ color: "var(--light-text)" }}>{a.vehicle.plateNo}</small></td>
                  <td>{formatDate(a.appointmentDate)}<br /><small style={{ color: "var(--light-text)" }}>{formatTime(a.appointmentTime)}</small></td>
                  <td><span className={getStatusBadgeClass(a.status)}>{formatStatus(a.status)}</span></td>
                  <td>{a.mechanic?.name || <em style={{ color: "var(--light-text)" }}>Unassigned</em>}</td>
                  <td>{a.finalCost ? formatCurrency(a.finalCost.toString()) : a.estimatedCost ? formatCurrency(a.estimatedCost.toString()) : "—"}</td>
                  <td>
                    <button onClick={() => openModal(a)} className="btn btn-sm btn-secondary">
                      <i className="fas fa-edit" /> Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="card" style={{ width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="card-title">Manage Appointment #{selected.id}</h3>
              <button onClick={() => setSelected(null)} className="btn btn-sm btn-danger"><i className="fas fa-times" /></button>
            </div>
            <div className="card-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.5rem", padding: "1rem", background: "var(--light-bg)", borderRadius: 5 }}>
                <div><strong>Customer:</strong> {selected.customer.name}</div>
                <div><strong>Service:</strong> {selected.service.serviceName}</div>
                <div><strong>Vehicle:</strong> {selected.vehicle.brand} {selected.vehicle.model}</div>
                <div><strong>Date:</strong> {formatDate(selected.appointmentDate)} {formatTime(selected.appointmentTime)}</div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={updateData.status} onChange={e => setUpdateData({...updateData, status: e.target.value})}>
                  {["Pending","Approved","InProgress","Completed","Cancelled"].map(s => (
                    <option key={s} value={s}>{s === "InProgress" ? "In Progress" : s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assign Mechanic</label>
                <select className="form-control" value={updateData.mechanicId} onChange={e => setUpdateData({...updateData, mechanicId: e.target.value})}>
                  <option value="">Unassigned</option>
                  {mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Final Cost (AED)</label>
                <input type="number" step="0.01" className="form-control" value={updateData.finalCost} onChange={e => setUpdateData({...updateData, finalCost: e.target.value})} placeholder="e.g. 149.99" />
              </div>

              <div className="form-group">
                <label className="form-label">Internal Notes</label>
                <textarea className="form-control" value={updateData.notes} onChange={e => setUpdateData({...updateData, notes: e.target.value})} rows={3} placeholder="Notes visible to mechanics..." />
              </div>

              {selected.customerNotes && (
                <div className="alert alert-info">
                  <strong>Customer Notes:</strong> {selected.customerNotes}
                </div>
              )}

              <div style={{ display: "flex", gap: "1rem" }}>
                <button onClick={handleUpdate} className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : <><i className="fas fa-save" /> Save Changes</>}
                </button>
                <button onClick={() => setSelected(null)} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
