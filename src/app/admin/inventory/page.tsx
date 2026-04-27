"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency, getStatusBadgeClass } from "@/lib/utils";

type Part = {
  id: number;
  partName: string;
  partNumber: string | null;
  brand: string | null;
  category: string | null;
  unitPrice: number;
  quantityInStock: number;
  reorderLevel: number;
  status: string;
  supplier?: { supplierName: string } | null;
};

export default function AdminInventoryPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ partName: "", partNumber: "", brand: "", category: "", unitPrice: "", quantityInStock: "0", reorderLevel: "10" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/inventory");
    setParts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        unitPrice: parseFloat(form.unitPrice),
        quantityInStock: parseInt(form.quantityInStock),
        reorderLevel: parseInt(form.reorderLevel),
      }),
    });
    setSaving(false);
    setShowAdd(false);
    setForm({ partName: "", partNumber: "", brand: "", category: "", unitPrice: "", quantityInStock: "0", reorderLevel: "10" });
    load();
  }

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div className="dashboard-header" style={{ margin: 0 }}>
          <h1><i className="fas fa-boxes" /> Inventory</h1>
          <p>Manage parts and stock levels</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary">
          <i className="fas fa-plus" /> Add Part
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><i className="fas fa-spinner fa-spin" /><p>Loading...</p></div>
      ) : parts.length === 0 ? (
        <div className="empty-state"><i className="fas fa-boxes" /><h3>No parts in inventory</h3></div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr><th>Part Name</th><th>Part #</th><th>Brand</th><th>Category</th><th>Unit Price</th><th>In Stock</th><th>Reorder At</th><th>Status</th></tr>
            </thead>
            <tbody>
              {parts.map(p => (
                <tr key={p.id} style={p.quantityInStock <= p.reorderLevel ? { backgroundColor: "#fff3cd" } : {}}>
                  <td>{p.partName}</td>
                  <td>{p.partNumber || "—"}</td>
                  <td>{p.brand || "—"}</td>
                  <td>{p.category || "—"}</td>
                  <td>{formatCurrency(p.unitPrice.toString())}</td>
                  <td>
                    <strong style={{ color: p.quantityInStock <= p.reorderLevel ? "var(--danger-color)" : "inherit" }}>
                      {p.quantityInStock}
                    </strong>
                    {p.quantityInStock <= p.reorderLevel && <span style={{ marginLeft: 4, color: "var(--danger-color)", fontSize: "0.75rem" }}>⚠ Low</span>}
                  </td>
                  <td>{p.reorderLevel}</td>
                  <td><span className={getStatusBadgeClass(p.status)}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="card" style={{ width: "100%", maxWidth: 550, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between" }}>
              <h3 className="card-title">Add Part</h3>
              <button onClick={() => setShowAdd(false)} className="btn btn-sm btn-danger"><i className="fas fa-times" /></button>
            </div>
            <div className="card-body">
              <form onSubmit={handleAdd}>
                <div className="form-group">
                  <label className="form-label">Part Name *</label>
                  <input className="form-control" required value={form.partName} onChange={e => setForm({...form, partName: e.target.value})} />
                </div>
                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Part Number</label>
                      <input className="form-control" value={form.partNumber} onChange={e => setForm({...form, partNumber: e.target.value})} />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Brand</label>
                      <input className="form-control" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input className="form-control" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
                </div>
                <div className="row">
                  <div className="col-4">
                    <div className="form-group">
                      <label className="form-label">Unit Price *</label>
                      <input type="number" step="0.01" className="form-control" required value={form.unitPrice} onChange={e => setForm({...form, unitPrice: e.target.value})} />
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="form-group">
                      <label className="form-label">Qty in Stock</label>
                      <input type="number" className="form-control" value={form.quantityInStock} onChange={e => setForm({...form, quantityInStock: e.target.value})} />
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="form-group">
                      <label className="form-label">Reorder Level</label>
                      <input type="number" className="form-control" value={form.reorderLevel} onChange={e => setForm({...form, reorderLevel: e.target.value})} />
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Add Part"}</button>
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
