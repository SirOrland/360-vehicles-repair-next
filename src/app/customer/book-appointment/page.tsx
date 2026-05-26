"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Vehicle = { id: number; brand: string; model: string; year?: number; plateNo: string };
type Service = { id: number; serviceName: string; description?: string; basePrice?: number; estimatedDuration?: number };

const TIMES = [
  { value: "08:00:00", label: "8:00 AM" }, { value: "09:00:00", label: "9:00 AM" },
  { value: "10:00:00", label: "10:00 AM" }, { value: "11:00:00", label: "11:00 AM" },
  { value: "12:00:00", label: "12:00 PM" }, { value: "13:00:00", label: "1:00 PM" },
  { value: "14:00:00", label: "2:00 PM" }, { value: "15:00:00", label: "3:00 PM" },
  { value: "16:00:00", label: "4:00 PM" }, { value: "17:00:00", label: "5:00 PM" },
];

function getDayOfWeek(dateStr: string): number {
  // Parse as local date to avoid UTC offset shifting the day
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay(); // 0=Sun, 6=Sat
}

function getValidTimes(dateStr: string) {
  if (!dateStr) return TIMES;
  const dow = getDayOfWeek(dateStr);
  if (dow === 0) return []; // Sunday — closed
  if (dow === 6) return TIMES.filter(t => t.value >= "09:00:00" && t.value <= "15:00:00"); // Sat 9AM–3PM (last slot)
  return TIMES; // Mon–Fri 8AM–5PM
}

export default function BookAppointmentPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ vehicleId: "", appointmentDate: "", appointmentTime: "", customerNotes: "" });
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([""]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [fullyBooked, setFullyBooked] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    Promise.all([fetch("/api/vehicles"), fetch("/api/services")])
      .then(([v, s]) => Promise.all([v.json(), s.json()]))
      .then(([vData, sData]) => { setVehicles(vData); setServices(sData); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!form.appointmentDate) { setBookedTimes([]); setFullyBooked(false); return; }
    setCheckingAvailability(true);
    fetch(`/api/appointments/availability?date=${form.appointmentDate}`)
      .then((r) => r.json())
      .then((data) => { setBookedTimes(data.bookedTimes || []); setFullyBooked(data.fullyBooked || false); })
      .catch(() => { setBookedTimes([]); setFullyBooked(false); })
      .finally(() => setCheckingAvailability(false));
  }, [form.appointmentDate]);

  const updateServiceRow = (idx: number, value: string) => {
    const updated = [...selectedServiceIds];
    updated[idx] = value;
    setSelectedServiceIds(updated);
  };

  const addServiceRow = () => setSelectedServiceIds([...selectedServiceIds, ""]);

  const removeServiceRow = (idx: number) =>
    setSelectedServiceIds(selectedServiceIds.filter((_, i) => i !== idx));

  const takenIds = (excludeIdx: number) =>
    selectedServiceIds.filter((id, i) => i !== excludeIdx && id !== "").map(Number);

  const chosenServices = selectedServiceIds
    .filter(Boolean)
    .map((id) => services.find((s) => s.id === parseInt(id)))
    .filter(Boolean) as Service[];

  const totalCost = chosenServices.reduce((sum, s) => sum + (s.basePrice ? Number(s.basePrice) : 0), 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const serviceIds = selectedServiceIds.filter(Boolean).map(Number);
    if (serviceIds.length === 0) { setError("Please select at least one service."); return; }
    if (new Date(form.appointmentDate) < new Date(today)) { setError("Please select a future date."); return; }
    setSubmitting(true);
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, serviceIds }),
    });
    setSubmitting(false);
    if (!res.ok) { const j = await res.json(); setError(j.error || "Failed to book"); return; }
    router.push("/customer/my-appointments?booked=1");
  }

  if (loading) return <div className="container"><div className="empty-state"><i className="fas fa-spinner fa-spin" /></div></div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-content" style={{ width: "100%" }}>
        <div className="container">
          <div className="dashboard-header">
            <h1><i className="fas fa-calendar-plus" /> Book Appointment</h1>
            <p>Schedule a service for your vehicle</p>
          </div>

          {error && <div className="alert alert-danger"><i className="fas fa-exclamation-circle" /> {error}</div>}

          {vehicles.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <i className="fas fa-car" /><h3>No Vehicles Found</h3>
                <p>Please add a vehicle before booking an appointment</p>
                <Link href="/customer/my-vehicles" className="btn btn-primary mt-2">
                  <i className="fas fa-plus" /> Add Vehicle
                </Link>
              </div>
            </div>
          ) : (
            <div className="row">
              <div className="col-8">
                <div className="card">
                  <div className="card-header"><h3 className="card-title">Appointment Details</h3></div>
                  <div className="card-body">
                    <form onSubmit={handleSubmit}>

                      {/* Vehicle */}
                      <div className="form-group">
                        <label className="form-label"><i className="fas fa-car" /> Select Vehicle *</label>
                        <select className="form-control" required value={form.vehicleId} onChange={e => setForm({ ...form, vehicleId: e.target.value })}>
                          <option value="">Choose a vehicle...</option>
                          {vehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plateNo})</option>)}
                        </select>
                      </div>

                      {/* Services — multiple rows */}
                      <div className="form-group">
                        <label className="form-label"><i className="fas fa-wrench" /> Services *</label>

                        {selectedServiceIds.map((sid, idx) => {
                          const taken = takenIds(idx);
                          const available = services.filter(s => !taken.includes(s.id));
                          const chosen = sid ? services.find(s => s.id === parseInt(sid)) : null;
                          return (
                            <div key={idx} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                              <div style={{ flex: 1 }}>
                                <select
                                  className="form-control"
                                  required={idx === 0}
                                  value={sid}
                                  onChange={e => updateServiceRow(idx, e.target.value)}
                                >
                                  <option value="">Choose a service...</option>
                                  {available.map(s => (
                                    <option key={s.id} value={s.id}>
                                      {s.serviceName} — AED {s.basePrice}
                                    </option>
                                  ))}
                                </select>
                                {chosen && (
                                  <small style={{ color: "var(--light-text)", display: "block", marginTop: "0.25rem" }}>
                                    {chosen.estimatedDuration && <><i className="fas fa-clock" /> {chosen.estimatedDuration} min &nbsp;</>}
                                    {chosen.description && <span>{chosen.description}</span>}
                                  </small>
                                )}
                              </div>
                              {selectedServiceIds.length > 1 && (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  style={{ marginTop: "0.25rem" }}
                                  onClick={() => removeServiceRow(idx)}
                                  title="Remove service"
                                >
                                  <i className="fas fa-times" />
                                </button>
                              )}
                            </div>
                          );
                        })}

                        {selectedServiceIds.length < services.length && (
                          <button type="button" className="btn btn-secondary btn-sm" onClick={addServiceRow} style={{ marginTop: "0.25rem" }}>
                            <i className="fas fa-plus" /> Add Another Service
                          </button>
                        )}

                        {chosenServices.length > 1 && (
                          <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "var(--light-bg)", borderRadius: 5 }}>
                            <strong>Estimated Total: AED {totalCost.toFixed(2)}</strong>
                            <span style={{ color: "var(--light-text)", fontSize: "0.85rem", marginLeft: "0.5rem" }}>({chosenServices.length} services)</span>
                          </div>
                        )}
                      </div>

                      {/* Date & Time */}
                      <div className="row">
                        <div className="col-6">
                          <div className="form-group">
                            <label className="form-label"><i className="fas fa-calendar" /> Date *</label>
                            <input
                              type="date"
                              className="form-control"
                              required
                              min={today}
                              value={form.appointmentDate}
                              onChange={e => {
                                const val = e.target.value;
                                if (val && getDayOfWeek(val) === 0) {
                                  setError("We are closed on Sundays. Please select another day.");
                                  return;
                                }
                                setError("");
                                setForm({ ...form, appointmentDate: val, appointmentTime: "" });
                              }}
                            />
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="form-group">
                            <label className="form-label"><i className="fas fa-clock" /> Time *</label>
                            <select
                              className="form-control"
                              required
                              disabled={!form.appointmentDate || checkingAvailability || fullyBooked}
                              value={form.appointmentTime}
                              onChange={e => setForm({ ...form, appointmentTime: e.target.value })}
                            >
                              <option value="">
                                {checkingAvailability ? "Checking availability…" : "Select time…"}
                              </option>
                              {getValidTimes(form.appointmentDate).map(t => (
                                <option key={t.value} value={t.value} disabled={bookedTimes.includes(t.value)}>
                                  {t.label}{bookedTimes.includes(t.value) ? " — Booked" : ""}
                                </option>
                              ))}
                            </select>
                            <small style={{ color: "var(--light-text)" }}>Business hours: 8:00 AM – 6:00 PM</small>
                          </div>
                        </div>
                      </div>

                      {fullyBooked && (
                        <div className="alert alert-warning">
                          <i className="fas fa-exclamation-triangle" /> This date is fully booked. Please choose a different date.
                        </div>
                      )}

                      {/* Notes */}
                      <div className="form-group">
                        <label className="form-label"><i className="fas fa-comment" /> Additional Notes (Optional)</label>
                        <textarea className="form-control" rows={4} placeholder="Any specific concerns or requests..." value={form.customerNotes} onChange={e => setForm({ ...form, customerNotes: e.target.value })} />
                      </div>

                      <div style={{ display: "flex", gap: "1rem" }}>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                          {submitting ? "Booking..." : <><i className="fas fa-check" /> Book Appointment</>}
                        </button>
                        <Link href="/customer/dashboard" className="btn btn-secondary">Cancel</Link>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="col-4">
                <div className="card">
                  <div className="card-header"><h3 className="card-title">Important Information</h3></div>
                  <div className="card-body">
                    <div style={{ marginBottom: "1rem" }}>
                      <h4 style={{ color: "var(--primary-color)", marginBottom: "0.5rem" }}><i className="fas fa-clock" /> Business Hours</h4>
                      <p style={{ margin: 0, color: "var(--light-text)" }}>Monday – Friday: 8:00 AM – 6:00 PM<br />Saturday: 9:00 AM – 4:00 PM<br />Sunday: Closed</p>
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                      <h4 style={{ color: "var(--primary-color)", marginBottom: "0.5rem" }}><i className="fas fa-info-circle" /> What to Expect</h4>
                      <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "var(--light-text)" }}>
                        <li>Your appointment will be reviewed by our team</li>
                        <li>You&apos;ll receive a confirmation notification</li>
                        <li>Bring your vehicle at the scheduled time</li>
                      </ul>
                    </div>
                    <div>
                      <h4 style={{ color: "var(--primary-color)", marginBottom: "0.5rem" }}><i className="fas fa-phone" /> Need Help?</h4>
                      <p style={{ margin: 0, color: "var(--light-text)" }}>Call us: (555) 123-4567<br />info@360vehicles.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
