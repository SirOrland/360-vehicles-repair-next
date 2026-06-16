"use client";

import { useState, useEffect } from "react";

type Settings = {
  shop_name: string;
  shop_address: string;
  shop_phone: string;
  shop_email: string;
  vat_rate: string;
  trn_number: string;
};

export default function AdminSettingsPage() {
  const [form, setForm] = useState<Settings>({
    shop_name: "", shop_address: "", shop_phone: "",
    shop_email: "", vat_rate: "5", trn_number: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => { setForm(f => ({ ...f, ...data })); setLoading(false); });
  }, []);

  async function handleSave(e: { preventDefault(): void }) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const field = (key: keyof Settings, label: string, placeholder: string, type = "text") => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        type={type}
        className="form-control"
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
      />
    </div>
  );

  if (loading) return <div className="container"><div className="empty-state"><i className="fas fa-spinner fa-spin" /></div></div>;

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
      <div className="dashboard-header">
        <h1><i className="fas fa-cog" /> Shop Settings</h1>
        <p>Configure business information shown on receipts and the website</p>
      </div>

      <div className="row">
        <div className="col-8" style={{ maxWidth: 680 }}>
          <form onSubmit={handleSave}>

            {/* Shop Info */}
            <div className="card" style={{ marginBottom: "1.5rem" }}>
              <div className="card-header"><h3 className="card-title"><i className="fas fa-store" /> Shop Information</h3></div>
              <div className="card-body">
                {field("shop_name", "Shop Name", "e.g. 360 Vehicles Repair")}
                {field("shop_address", "Address", "Street, City, Country")}
                {field("shop_phone", "Phone Number", "e.g. +971 xx xxx xxxx")}
                {field("shop_email", "Business Email", "e.g. info@360vehicles.com", "email")}
              </div>
            </div>

            {/* Tax / VAT */}
            <div className="card" style={{ marginBottom: "1.5rem" }}>
              <div className="card-header"><h3 className="card-title"><i className="fas fa-percent" /> Tax &amp; VAT</h3></div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">VAT Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="form-control"
                    value={form.vat_rate}
                    onChange={e => setForm({ ...form, vat_rate: e.target.value })}
                    placeholder="e.g. 5"
                    style={{ maxWidth: 160 }}
                  />
                  <small style={{ color: "var(--light-text)" }}>Set to 0 to hide VAT on receipts.</small>
                </div>
                {field("trn_number", "TRN (Tax Registration Number)", "e.g. 104902025600001")}
              </div>
            </div>

            {saved && (
              <div className="alert alert-success">
                <i className="fas fa-check-circle" /> Settings saved successfully.
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><i className="fas fa-spinner fa-spin" /> Saving...</> : <><i className="fas fa-save" /> Save Settings</>}
            </button>
          </form>
        </div>

        <div className="col-4">
          <div className="card">
            <div className="card-header"><h3 className="card-title"><i className="fas fa-info-circle" /> Receipt Preview</h3></div>
            <div className="card-body" style={{ fontSize: "0.85rem" }}>
              <p style={{ color: "var(--light-text)" }}>These details appear on every receipt:</p>
              <ul style={{ paddingLeft: "1.2rem", lineHeight: 2 }}>
                <li>Shop name &amp; address</li>
                <li>Business email</li>
                <li>TRN number</li>
                <li>VAT line with calculated amount</li>
                <li>Discount (set per appointment)</li>
              </ul>
              <p style={{ color: "var(--light-text)", marginTop: "0.75rem", fontSize: "0.8rem" }}>
                Discount per appointment is set in the <strong>Manage Appointment</strong> modal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
