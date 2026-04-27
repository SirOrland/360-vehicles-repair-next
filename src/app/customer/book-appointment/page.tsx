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

export default function BookAppointmentPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ vehicleId: "", serviceId: "", appointmentDate: "", appointmentTime: "", customerNotes: "" });
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  useEffect(() => {
    Promise.all([fetch("/api/vehicles"), fetch("/api/services")])
      .then(([v, s]) => Promise.all([v.json(), s.json()]))
      .then(([vData, sData]) => { setVehicles(vData); setServices(sData); setLoading(false); });
  }, []);

  useEffect(() => {
    if (form.serviceId) {
      setSelectedService(services.find(s => s.id === parseInt(form.serviceId)) || null);
    } else {
      setSelectedService(null);
    }
  }, [form.serviceId, services]);

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (new Date(form.appointmentDate) < new Date(today)) {
      setError("Please select a future date"); return;
    }
    setSubmitting(true);
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
                      <div className="form-group">
                        <label className="form-label"><i className="fas fa-car" /> Select Vehicle *</label>
                        <select className="form-control" required value={form.vehicleId} onChange={e => setForm({...form, vehicleId: e.target.value})}>
                          <option value="">Choose a vehicle...</option>
                          {vehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plateNo})</option>)}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label"><i className="fas fa-wrench" /> Select Service *</label>
                        <select className="form-control" required value={form.serviceId} onChange={e => setForm({...form, serviceId: e.target.value})}>
                          <option value="">Choose a service...</option>
                          {services.map(s => <option key={s.id} value={s.id}>{s.serviceName} — AED {s.basePrice}</option>)}
                        </select>
                      </div>

                      {selectedService && (
                        <div style={{ padding: "1rem", background: "var(--light-bg)", borderRadius: 5, marginBottom: "1rem" }}>
                          <p style={{ margin: 0 }}><strong>Service Details:</strong></p>
                          <p style={{ margin: "0.5rem 0" }}>{selectedService.description}</p>
                          <p style={{ margin: 0 }}>
                            <strong>Est. Duration:</strong> {selectedService.estimatedDuration} min &nbsp;|&nbsp;
                            <strong>Base Price:</strong> AED {selectedService.basePrice}
                          </p>
                        </div>
                      )}

                      <div className="row">
                        <div className="col-6">
                          <div className="form-group">
                            <label className="form-label"><i className="fas fa-calendar" /> Date *</label>
                            <input type="date" className="form-control" required min={today} value={form.appointmentDate} onChange={e => setForm({...form, appointmentDate: e.target.value})} />
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="form-group">
                            <label className="form-label"><i className="fas fa-clock" /> Time *</label>
                            <select className="form-control" required value={form.appointmentTime} onChange={e => setForm({...form, appointmentTime: e.target.value})}>
                              <option value="">Select time...</option>
                              {TIMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            <small style={{ color: "var(--light-text)" }}>Business hours: 8:00 AM – 6:00 PM</small>
                          </div>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label"><i className="fas fa-comment" /> Additional Notes (Optional)</label>
                        <textarea className="form-control" rows={4} placeholder="Any specific concerns or requests..." value={form.customerNotes} onChange={e => setForm({...form, customerNotes: e.target.value})} />
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
