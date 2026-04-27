"use client";

import { useState, useEffect, useCallback } from "react";

type Vehicle = { id: number; brand: string; model: string; year?: number; plateNo: string; vin?: string; color?: string };

export default function MyVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ brand: "", model: "", year: "", plateNo: "", vin: "", color: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/vehicles");
    setVehicles(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) { const j = await res.json(); setError(j.error || "Failed to add vehicle"); return; }
    setShowAdd(false);
    setForm({ brand: "", model: "", year: "", plateNo: "", vin: "", color: "" });
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this vehicle?")) return;
    await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div className="dashboard-header" style={{ margin: 0 }}>
          <h1><i className="fas fa-car" /> My Vehicles</h1>
          <p>Manage your registered vehicles</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary">
          <i className="fas fa-plus" /> Add Vehicle
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><i className="fas fa-spinner fa-spin" /></div>
      ) : vehicles.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-car" /><h3>No Vehicles Yet</h3>
          <p>Add your first vehicle to start booking appointments</p>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary mt-2">Add Vehicle</button>
        </div>
      ) : (
        <div className="row">
          {vehicles.map(v => (
            <div className="col-4" key={v.id}>
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: "2.5rem", color: "var(--secondary-color)" }}>
                    <i className="fas fa-car" />
                  </div>
                  <button onClick={() => handleDelete(v.id)} className="btn btn-sm btn-danger">
                    <i className="fas fa-trash" />
                  </button>
                </div>
                <h3 style={{ color: "var(--primary-color)", marginTop: "0.5rem" }}>{v.brand} {v.model}</h3>
                {[
                  { label: "Year", value: v.year || "—" },
                  { label: "Plate", value: v.plateNo },
                  { label: "Color", value: v.color || "—" },
                  { label: "VIN", value: v.vin || "—" },
                ].map(f => (
                  <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.25rem 0", borderBottom: "1px solid var(--light-bg)" }}>
                    <span style={{ color: "var(--light-text)", fontSize: "0.875rem" }}>{f.label}:</span>
                    <span style={{ fontWeight: 600 }}>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="card" style={{ width: "100%", maxWidth: 500 }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between" }}>
              <h3 className="card-title">Add Vehicle</h3>
              <button onClick={() => setShowAdd(false)} className="btn btn-sm btn-danger"><i className="fas fa-times" /></button>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleAdd}>
                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Brand *</label>
                      <input className="form-control" required value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} placeholder="e.g. Toyota" />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Model *</label>
                      <input className="form-control" required value={form.model} onChange={e => setForm({...form, model: e.target.value})} placeholder="e.g. Camry" />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Year</label>
                      <input type="number" className="form-control" value={form.year} onChange={e => setForm({...form, year: e.target.value})} placeholder="e.g. 2020" />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Plate Number *</label>
                      <input className="form-control" required value={form.plateNo} onChange={e => setForm({...form, plateNo: e.target.value})} placeholder="e.g. ABC-1234" />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Color</label>
                      <input className="form-control" value={form.color} onChange={e => setForm({...form, color: e.target.value})} placeholder="e.g. Silver" />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">VIN</label>
                      <input className="form-control" value={form.vin} onChange={e => setForm({...form, vin: e.target.value})} placeholder="Optional" />
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Add Vehicle"}</button>
                  <button type="button" onClick={() => setShowAdd(false)} className="btn btn-secondary">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
