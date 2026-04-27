"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (password && password !== confirm) { setError("Passwords do not match"); return; }
    setSaving(true);
    const res = await fetch(`/api/users/${session?.user?.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, contact, ...(password ? { password } : {}) }),
    });
    setSaving(false);
    if (res.ok) { setSuccess("Profile updated successfully!"); setPassword(""); setConfirm(""); }
    else { const j = await res.json(); setError(j.error || "Update failed"); }
  }

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
      <div className="dashboard-header">
        <h1><i className="fas fa-user" /> My Profile</h1>
        <p>Manage your account information</p>
      </div>

      <div style={{ maxWidth: 600 }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Account Information</h3>
          </div>
          <div className="card-body">
            {success && <div className="alert alert-success"><i className="fas fa-check-circle" /> {success}</div>}
            {error && <div className="alert alert-danger"><i className="fas fa-exclamation-circle" /> {error}</div>}

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem", padding: "1rem", background: "var(--light-bg)", borderRadius: 8 }}>
              <div style={{ width: 70, height: 70, background: "var(--secondary-color)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", color: "white", fontWeight: 700 }}>
                {session?.user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: 0, color: "var(--primary-color)" }}>{session?.user?.name}</h3>
                <p style={{ margin: 0, color: "var(--light-text)" }}>{session?.user?.email}</p>
                <span className="badge-success">{session?.user?.role}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label"><i className="fas fa-user" /> Full Name</label>
                <input className="form-control" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label"><i className="fas fa-envelope" /> Email Address</label>
                <input className="form-control" value={session?.user?.email || ""} disabled style={{ opacity: 0.6 }} />
                <small style={{ color: "var(--light-text)" }}>Email cannot be changed</small>
              </div>
              <div className="form-group">
                <label className="form-label"><i className="fas fa-phone" /> Contact Number</label>
                <input className="form-control" value={contact} onChange={e => setContact(e.target.value)} placeholder="Enter phone number" />
              </div>

              <hr style={{ margin: "1.5rem 0", borderColor: "var(--light-bg)" }} />
              <h4 style={{ marginBottom: "1rem", color: "var(--primary-color)" }}>Change Password</h4>
              <div className="form-group">
                <label className="form-label"><i className="fas fa-lock" /> New Password</label>
                <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} placeholder="Leave blank to keep current" />
              </div>
              <div className="form-group">
                <label className="form-label"><i className="fas fa-lock" /> Confirm Password</label>
                <input type="password" className="form-control" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm new password" />
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : <><i className="fas fa-save" /> Save Changes</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
