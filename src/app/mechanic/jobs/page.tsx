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

type PartUsage = {
  id: number; quantityUsed: number; unitPrice: number | string; totalPrice: number | string;
  part: { partName: string; partNumber?: string | null };
};

type InventoryItem = {
  id: number; partName: string; partNumber?: string | null;
  unitPrice: number | string; quantityInStock: number; category?: string | null;
};

const isToday = (dateStr: string) => {
  const d = new Date(dateStr); const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
};

export default function MechanicJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Job | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("All");

  // Parts state
  const [parts, setParts] = useState<PartUsage[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [partsLoading, setPartsLoading] = useState(false);
  const [addPartForm, setAddPartForm] = useState({ partId: "", quantity: "1" });
  const [addingPart, setAddingPart] = useState(false);
  const [partError, setPartError] = useState("");
  const [currentFinalCost, setCurrentFinalCost] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/appointments");
    setJobs(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openJob(job: Job) {
    setSelected(job);
    setNewStatus(job.status);
    setCurrentFinalCost(job.finalCost);
    setAddPartForm({ partId: "", quantity: "1" });
    setPartError("");
    setPartsLoading(true);
    const [partsRes, invRes] = await Promise.all([
      fetch(`/api/appointments/${job.id}/parts`),
      fetch("/api/inventory"),
    ]);
    const [partsData, invData] = await Promise.all([partsRes.json(), invRes.json()]);
    setParts(Array.isArray(partsData) ? partsData : []);
    setInventory(Array.isArray(invData) ? invData : []);
    setPartsLoading(false);
  }

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

  async function addPart() {
    if (!selected || !addPartForm.partId || !addPartForm.quantity) return;
    setPartError("");
    setAddingPart(true);
    const res = await fetch(`/api/appointments/${selected.id}/parts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partId: parseInt(addPartForm.partId), quantity: parseInt(addPartForm.quantity) }),
    });
    const data = await res.json();
    setAddingPart(false);
    if (!res.ok) { setPartError(data.error || "Failed to add part"); return; }

    // Update cost and refresh parts list
    setCurrentFinalCost(data.finalCost);
    setAddPartForm({ partId: "", quantity: "1" });
    const [partsRes, invRes] = await Promise.all([
      fetch(`/api/appointments/${selected.id}/parts`),
      fetch("/api/inventory"),
    ]);
    const [partsData, invData] = await Promise.all([partsRes.json(), invRes.json()]);
    setParts(Array.isArray(partsData) ? partsData : []);
    setInventory(Array.isArray(invData) ? invData : []);
  }

  const filters = ["All", "Today", "Approved", "InProgress", "Completed"];
  const filtered = jobs.filter(j => {
    if (filter === "Today") return isToday(j.appointmentDate) && j.status !== "Cancelled";
    if (filter === "All") return true;
    return j.status === filter;
  });
  const todayCount = jobs.filter(j => isToday(j.appointmentDate) && j.status !== "Cancelled").length;

  const selectedPart = inventory.find(p => p.id === parseInt(addPartForm.partId));
  const partsTotalCost = parts.reduce((sum, p) => sum + Number(p.totalPrice), 0);

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
                    <button onClick={() => openJob(j)} className="btn btn-sm btn-secondary">
                      <i className={`fas fa-${j.status !== "Completed" && j.status !== "Cancelled" ? "edit" : "eye"}`} />
                      {" "}{j.status !== "Completed" && j.status !== "Cancelled" ? "Update" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Job Modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="card" style={{ width: "100%", maxWidth: 640, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>

            {/* Header */}
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <h3 className="card-title">
                Job #{selected.id}
                {isToday(selected.appointmentDate) && <span style={{ marginLeft: 8, fontSize: "0.7rem", background: "var(--secondary-color)", color: "white", borderRadius: 3, padding: "2px 6px" }}>TODAY</span>}
              </h3>
              <button onClick={() => setSelected(null)} className="btn btn-sm btn-danger"><i className="fas fa-times" /></button>
            </div>

            {/* Scrollable body */}
            <div className="card-body" style={{ overflowY: "auto", flex: 1 }}>

              {/* Job Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", background: "var(--light-bg)", padding: "1rem", borderRadius: 5, marginBottom: "1rem" }}>
                <div><strong>Customer:</strong> {selected.customer.name}</div>
                <div><strong>Phone:</strong> {selected.customer.contact || "—"}</div>
                <div><strong>Service:</strong> {selected.service.serviceName}</div>
                <div><strong>Duration:</strong> ~{selected.service.estimatedDuration} min</div>
                <div><strong>Vehicle:</strong> {selected.vehicle.brand} {selected.vehicle.model}</div>
                <div><strong>Plate:</strong> {selected.vehicle.plateNo}</div>
                <div><strong>Date:</strong> {formatDate(selected.appointmentDate)}</div>
                <div><strong>Time:</strong> {formatTime(selected.appointmentTime)}</div>
              </div>

              {selected.customerNotes && <div className="alert alert-info" style={{ marginBottom: "1rem" }}><strong>Customer Notes:</strong> {selected.customerNotes}</div>}
              {selected.notes && <div className="alert alert-warning" style={{ marginBottom: "1rem" }}><strong>Shop Notes:</strong> {selected.notes}</div>}

              {/* Parts Section */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ marginBottom: "0.75rem" }}><i className="fas fa-boxes" /> Parts Used</h4>

                {partsLoading ? (
                  <div style={{ textAlign: "center", padding: "1rem", color: "var(--light-text)" }}><i className="fas fa-spinner fa-spin" /> Loading parts...</div>
                ) : parts.length === 0 ? (
                  <p style={{ color: "var(--light-text)", margin: "0 0 0.75rem" }}>No parts added yet.</p>
                ) : (
                  <div className="data-table" style={{ marginBottom: "0.75rem" }}>
                    <table>
                      <thead>
                        <tr><th>Part</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
                      </thead>
                      <tbody>
                        {parts.map(p => (
                          <tr key={p.id}>
                            <td>
                              {p.part.partName}
                              {p.part.partNumber && <><br /><small style={{ color: "var(--light-text)" }}>#{p.part.partNumber}</small></>}
                            </td>
                            <td>{p.quantityUsed}</td>
                            <td>{formatCurrency(p.unitPrice.toString())}</td>
                            <td><strong>{formatCurrency(p.totalPrice.toString())}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Add Part Form — only for active jobs */}
                {selected.status !== "Completed" && selected.status !== "Cancelled" && (
                  <div style={{ background: "var(--light-bg)", padding: "1rem", borderRadius: 5 }}>
                    <p style={{ margin: "0 0 0.5rem", fontWeight: 600, fontSize: "0.9rem" }}><i className="fas fa-plus-circle" /> Add Part</p>
                    {partError && <div className="alert alert-danger" style={{ padding: "0.5rem 0.75rem", marginBottom: "0.5rem", fontSize: "0.85rem" }}>{partError}</div>}
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                      <div style={{ flex: 2, minWidth: 180 }}>
                        <label style={{ fontSize: "0.8rem", color: "var(--light-text)", display: "block", marginBottom: 2 }}>Part</label>
                        <select
                          className="form-control"
                          value={addPartForm.partId}
                          onChange={e => setAddPartForm({ ...addPartForm, partId: e.target.value, quantity: "1" })}
                        >
                          <option value="">Select part...</option>
                          {inventory.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.partName} — AED {Number(p.unitPrice).toFixed(2)} ({p.quantityInStock} in stock)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ flex: 1, minWidth: 80 }}>
                        <label style={{ fontSize: "0.8rem", color: "var(--light-text)", display: "block", marginBottom: 2 }}>Qty</label>
                        <input
                          type="number"
                          className="form-control"
                          min={1}
                          max={selectedPart?.quantityInStock ?? 999}
                          value={addPartForm.quantity}
                          onChange={e => setAddPartForm({ ...addPartForm, quantity: e.target.value })}
                        />
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={addPart}
                        disabled={addingPart || !addPartForm.partId}
                        style={{ flexShrink: 0 }}
                      >
                        {addingPart ? <><i className="fas fa-spinner fa-spin" /> Adding...</> : <><i className="fas fa-plus" /> Add</>}
                      </button>
                    </div>
                    {selectedPart && addPartForm.quantity && (
                      <small style={{ color: "var(--light-text)", display: "block", marginTop: "0.4rem" }}>
                        Subtotal: <strong>AED {(Number(selectedPart.unitPrice) * parseInt(addPartForm.quantity || "0")).toFixed(2)}</strong>
                      </small>
                    )}
                  </div>
                )}
              </div>

              {/* Cost Summary */}
              <div style={{ background: "var(--light-bg)", padding: "1rem", borderRadius: 5, marginBottom: "1.5rem" }}>
                <h4 style={{ margin: "0 0 0.5rem" }}><i className="fas fa-receipt" /> Cost Summary</h4>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                  <span>Service ({selected.service.serviceName})</span>
                  <span>{formatCurrency((selected.estimatedCost ?? 0).toString())}</span>
                </div>
                {parts.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span>Parts ({parts.length} item{parts.length !== 1 ? "s" : ""})</span>
                    <span>{formatCurrency(partsTotalCost.toString())}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                  <span>Total</span>
                  <span style={{ color: "var(--primary-color)" }}>
                    {formatCurrency((currentFinalCost ?? selected.estimatedCost ?? 0).toString())}
                  </span>
                </div>
              </div>

              {/* Status Update */}
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
