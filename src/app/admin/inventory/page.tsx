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
};

const emptyForm = { partName: "", partNumber: "", brand: "", category: "", unitPrice: "", quantityInStock: "0", reorderLevel: "10", status: "Active" };

export default function AdminInventoryPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Part | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<Part | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/inventory");
    setParts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setForm(emptyForm);
    setEditing(null);
    setModal("add");
  }

  function openEdit(p: Part) {
    setForm({
      partName: p.partName,
      partNumber: p.partNumber || "",
      brand: p.brand || "",
      category: p.category || "",
      unitPrice: p.unitPrice.toString(),
      quantityInStock: p.quantityInStock.toString(),
      reorderLevel: p.reorderLevel.toString(),
      status: p.status,
    });
    setEditing(p);
    setModal("edit");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const data = {
      partName: form.partName,
      partNumber: form.partNumber || null,
      brand: form.brand || null,
      category: form.category || null,
      unitPrice: parseFloat(form.unitPrice),
      quantityInStock: parseInt(form.quantityInStock),
      reorderLevel: parseInt(form.reorderLevel),
      status: form.status,
    };
    if (modal === "add") {
      await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    } else if (editing) {
      await fetch(`/api/inventory/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    }
    setSaving(false);
    setModal(null);
    load();
  }

  async function handleDelete(p: Part) {
    await fetch(`/api/inventory/${p.id}`, { method: "DELETE" });
    setConfirm(null);
    load();
  }

  const lowStockCount = parts.filter(p => p.status === "Active" && p.quantityInStock <= p.reorderLevel).length;

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div className="dashboard-header" style={{ margin: 0 }}>
          <h1><i className="fas fa-boxes" /> Inventory</h1>
          <p>Manage parts and stock levels{lowStockCount > 0 && <span style={{ color: "var(--danger-color)", marginLeft: 8 }}>⚠ {lowStockCount} low stock item{lowStockCount !== 1 ? "s" : ""}</span>}</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
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
              <tr><th>Part Name</th><th>Part #</th><th>Brand</th><th>Category</th><th>Unit Price</th><th>In Stock</th><th>Reorder At</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {parts.map(p => (
                <tr key={p.id} style={p.quantityInStock <= p.reorderLevel && p.status === "Active" ? { backgroundColor: "#fff3cd" } : {}}>
                  <td><strong>{p.partName}</strong></td>
                  <td>{p.partNumber || "—"}</td>
                  <td>{p.brand || "—"}</td>
                  <td>{p.category || "—"}</td>
                  <td>{formatCurrency(p.unitPrice.toString())}</td>
                  <td>
                    <strong style={{ color: p.quantityInStock <= p.reorderLevel && p.status === "Active" ? "var(--danger-color)" : "inherit" }}>
                      {p.quantityInStock}
                    </strong>
                    {p.quantityInStock <= p.reorderLevel && p.status === "Active" && (
                      <span style={{ marginLeft: 4, color: "var(--danger-color)", fontSize: "0.75rem" }}>⚠ Low</span>
                    )}
                  </td>
                  <td>{p.reorderLevel}</td>
                  <td><span className={getStatusBadgeClass(p.status)}>{p.status}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button onClick={() => openEdit(p)} className="btn btn-sm btn-secondary">
                        <i className="fas fa-edit" /> Edit
                      </button>
                      <button onClick={() => setConfirm(p)} className="btn btn-sm btn-danger">
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="card" style={{ width: "100%", maxWidth: 580, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="card-title">{modal === "add" ? "Add Part" : "Edit Part"}</h3>
              <button onClick={() => setModal(null)} className="btn btn-sm btn-danger"><i className="fas fa-times" /></button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="form-label">Part Name *</label>
                  <input className="form-control" required value={form.partName} onChange={e => setForm({ ...form, partName: e.target.value })} />
                </div>
                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Part Number</label>
                      <input className="form-control" value={form.partNumber} onChange={e => setForm({ ...form, partNumber: e.target.value })} />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Brand</label>
                      <input className="form-control" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
                </div>
                <div className="row">
                  <div className="col-4">
                    <div className="form-group">
                      <label className="form-label">Unit Price *</label>
                      <input type="number" step="0.01" min="0" className="form-control" required value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} />
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="form-group">
                      <label className="form-label">Qty in Stock</label>
                      <input type="number" min="0" className="form-control" value={form.quantityInStock} onChange={e => setForm({ ...form, quantityInStock: e.target.value })} />
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="form-group">
                      <label className="form-label">Reorder Level</label>
                      <input type="number" min="0" className="form-control" value={form.reorderLevel} onChange={e => setForm({ ...form, reorderLevel: e.target.value })} />
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
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : modal === "add" ? "Add Part" : "Save Changes"}</button>
                  <button type="button" onClick={() => setModal(null)} className="btn btn-secondary">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Deactivate */}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="card" style={{ width: "100%", maxWidth: 420 }}>
            <div className="card-header">
              <h3 className="card-title"><i className="fas fa-exclamation-triangle" style={{ color: "var(--danger-color)" }} /> Deactivate Part</h3>
            </div>
            <div className="card-body">
              <p>Are you sure you want to deactivate <strong>{confirm.partName}</strong>? It will no longer appear in active inventory.</p>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button onClick={() => handleDelete(confirm)} className="btn btn-danger">Deactivate</button>
                <button onClick={() => setConfirm(null)} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
