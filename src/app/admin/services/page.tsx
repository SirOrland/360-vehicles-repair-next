"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency, getStatusBadgeClass } from "@/lib/utils";

type Service = {
  id: number;
  serviceName: string;
  description: string | null;
  estimatedDuration: number | null;
  basePrice: number | null;
  status: string;
};

const empty = { serviceName: "", description: "", estimatedDuration: "", basePrice: "", status: "Active" };

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/services");
    setServices(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setForm(empty);
    setEditing(null);
    setModal("add");
  }

  function openEdit(s: Service) {
    setForm({
      serviceName: s.serviceName,
      description: s.description || "",
      estimatedDuration: s.estimatedDuration?.toString() || "",
      basePrice: s.basePrice?.toString() || "",
      status: s.status,
    });
    setEditing(s);
    setModal("edit");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const data = {
      serviceName: form.serviceName,
      description: form.description || null,
      estimatedDuration: form.estimatedDuration ? parseInt(form.estimatedDuration) : null,
      basePrice: form.basePrice ? parseFloat(form.basePrice) : null,
      status: form.status,
    };
    if (modal === "add") {
      await fetch("/api/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    } else if (editing) {
      await fetch(`/api/services/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    }
    setSaving(false);
    setModal(null);
    load();
  }

  async function toggleStatus(s: Service) {
    await fetch(`/api/services/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s.status === "Active" ? "Inactive" : "Active" }),
    });
    load();
  }

  const active = services.filter(s => s.status === "Active").length;

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div className="dashboard-header" style={{ margin: 0 }}>
          <h1><i className="fas fa-tools" /> Services</h1>
          <p>Manage service offerings, pricing and estimated durations — {active} active service{active !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          <i className="fas fa-plus" /> Add Service
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><i className="fas fa-spinner fa-spin" /><p>Loading...</p></div>
      ) : services.length === 0 ? (
        <div className="empty-state"><i className="fas fa-tools" /><h3>No services yet</h3><p>Add your first service to get started</p></div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr><th>Service Name</th><th>Description</th><th>Duration</th><th>Base Price</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id} style={s.status === "Inactive" ? { opacity: 0.6 } : {}}>
                  <td><strong>{s.serviceName}</strong></td>
                  <td style={{ maxWidth: 240, color: "var(--light-text)", fontSize: "0.875rem" }}>{s.description || "—"}</td>
                  <td>{s.estimatedDuration ? `${s.estimatedDuration} min` : "—"}</td>
                  <td>{s.basePrice != null ? formatCurrency(s.basePrice.toString()) : "—"}</td>
                  <td><span className={getStatusBadgeClass(s.status)}>{s.status}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button onClick={() => openEdit(s)} className="btn btn-sm btn-secondary">
                        <i className="fas fa-edit" /> Edit
                      </button>
                      <button onClick={() => toggleStatus(s)} className={`btn btn-sm ${s.status === "Active" ? "btn-warning" : "btn-success"}`}>
                        {s.status === "Active" ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="card" style={{ width: "100%", maxWidth: 560 }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="card-title">{modal === "add" ? <><i className="fas fa-plus" /> Add Service</> : <><i className="fas fa-edit" /> Edit Service</>}</h3>
              <button onClick={() => setModal(null)} className="btn btn-sm btn-danger"><i className="fas fa-times" /></button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="form-label">Service Name *</label>
                  <input className="form-control" required value={form.serviceName} onChange={e => setForm({ ...form, serviceName: e.target.value })} placeholder="e.g. Oil Change" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description of what this service includes..." />
                </div>
                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Duration (minutes)</label>
                      <input type="number" min="1" className="form-control" value={form.estimatedDuration} onChange={e => setForm({ ...form, estimatedDuration: e.target.value })} placeholder="e.g. 60" />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Base Price (AED)</label>
                      <input type="number" step="0.01" min="0" className="form-control" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: e.target.value })} placeholder="e.g. 150.00" />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving..." : modal === "add" ? "Add Service" : "Save Changes"}
                  </button>
                  <button type="button" onClick={() => setModal(null)} className="btn btn-secondary">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
