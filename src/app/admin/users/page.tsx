"use client";

import { useState, useEffect, useCallback } from "react";
import { getStatusBadgeClass, formatDate } from "@/lib/utils";

type User = { id: number; name: string; email: string; contact?: string; role: string; status: string; createdAt: string };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", contact: "", role: "Customer" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/users${filter !== "All" ? `?role=${filter}` : ""}`);
    setUsers(await res.json());
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function toggleStatus(user: User) {
    await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: user.status === "Active" ? "Inactive" : "Active" }),
    });
    load();
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) { const j = await res.json(); setError(j.error); return; }
    setShowCreate(false);
    setForm({ name: "", email: "", password: "", contact: "", role: "Customer" });
    load();
  }

  const roles = ["All", "Admin", "Mechanic", "Customer"];

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div className="dashboard-header" style={{ margin: 0 }}>
          <h1><i className="fas fa-users" /> Users</h1>
          <p>Manage system users</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary">
          <i className="fas fa-plus" /> Add User
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {roles.map(r => (
          <button key={r} onClick={() => setFilter(r)} className={`btn btn-sm ${filter === r ? "btn-primary" : "btn-secondary"}`}>{r}</button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state"><i className="fas fa-spinner fa-spin" /><p>Loading...</p></div>
      ) : (
        <div className="data-table">
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Contact</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.contact || "—"}</td>
                  <td><span className={`badge-${u.role === "Admin" ? "danger" : u.role === "Mechanic" ? "info" : "success"}`}>{u.role}</span></td>
                  <td><span className={getStatusBadgeClass(u.status)}>{u.status}</span></td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>
                    <button onClick={() => toggleStatus(u)} className={`btn btn-sm ${u.status === "Active" ? "btn-warning" : "btn-success"}`}>
                      {u.status === "Active" ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="card" style={{ width: "100%", maxWidth: 500 }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between" }}>
              <h3 className="card-title">Add New User</h3>
              <button onClick={() => setShowCreate(false)} className="btn btn-sm btn-danger"><i className="fas fa-times" /></button>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={createUser}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-control" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" className="form-control" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input type="password" className="form-control" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact</label>
                  <input className="form-control" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-control" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                    <option>Customer</option><option>Mechanic</option><option>Admin</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Creating..." : "Create User"}</button>
                  <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
