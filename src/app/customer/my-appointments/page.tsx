"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { formatDate, formatTime, getStatusBadgeClass, formatStatus, formatCurrency } from "@/lib/utils";
import Link from "next/link";

type Appointment = {
  id: number; status: string; appointmentDate: string; appointmentTime: string;
  estimatedCost: number | null; finalCost: number | null;
  customerNotes: string | null; notes: string | null;
  service: { serviceName: string; estimatedDuration?: number; description?: string | null };
  vehicle: { brand: string; model: string; plateNo: string; year?: number | null; color?: string | null };
  mechanic?: { name: string; contact?: string | null } | null;
  additionalServices?: { service: { serviceName: string } }[];
};

export default function MyAppointmentsPage() {
  const params = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [success] = useState(params.get("booked") ? "Appointment booked! Waiting for approval." : "");
  const [detail, setDetail] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<Appointment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/appointments");
    setAppointments(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function cancelAppointment(a: Appointment) {
    setCancelling(a.id);
    await fetch(`/api/appointments/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cancel: true }),
    });
    setCancelling(null);
    setCancelConfirm(null);
    load();
  }

  const canCancel = (status: string) => ["Pending", "Approved"].includes(status);

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div className="dashboard-header" style={{ margin: 0 }}>
          <h1><i className="fas fa-calendar-alt" /> My Appointments</h1>
          <p>Track all your service appointments</p>
        </div>
        <Link href="/customer/book-appointment" className="btn btn-primary">
          <i className="fas fa-plus" /> Book New
        </Link>
      </div>

      {success && <div className="alert alert-success"><i className="fas fa-check-circle" /> {success}</div>}

      {loading ? (
        <div className="empty-state"><i className="fas fa-spinner fa-spin" /></div>
      ) : appointments.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-calendar-times" /><h3>No Appointments Yet</h3>
          <Link href="/customer/book-appointment" className="btn btn-primary mt-2">Book Your First Appointment</Link>
        </div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr><th>ID</th><th>Service</th><th>Vehicle</th><th>Date & Time</th><th>Mechanic</th><th>Status</th><th>Cost</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {appointments.map(a => (
                <tr key={a.id}>
                  <td>#{a.id}</td>
                  <td>
                    {(a.additionalServices && a.additionalServices.length > 0)
                      ? a.additionalServices.map(as => as.service.serviceName).join(", ")
                      : a.service.serviceName}
                  </td>
                  <td>{a.vehicle.brand} {a.vehicle.model}<br /><small style={{ color: "var(--light-text)" }}>{a.vehicle.plateNo}</small></td>
                  <td>{formatDate(a.appointmentDate)}<br /><small style={{ color: "var(--light-text)" }}>{formatTime(a.appointmentTime)}</small></td>
                  <td>{a.mechanic?.name || <em style={{ color: "var(--light-text)" }}>Not assigned</em>}</td>
                  <td><span className={getStatusBadgeClass(a.status)}>{formatStatus(a.status)}</span></td>
                  <td>
                    {a.finalCost
                      ? formatCurrency(a.finalCost.toString())
                      : a.estimatedCost
                        ? <><span style={{ color: "var(--light-text)", fontSize: "0.75rem" }}>Est. </span>{formatCurrency(a.estimatedCost.toString())}</>
                        : "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                      <button onClick={() => setDetail(a)} className="btn btn-sm btn-secondary">
                        <i className="fas fa-eye" /> View
                      </button>
                      {a.status === "Completed" && (
                        <Link href={`/receipt/${a.id}`} className="btn btn-sm btn-primary" target="_blank">
                          <i className="fas fa-file-invoice" /> Receipt
                        </Link>
                      )}
                      {canCancel(a.status) && (
                        <button onClick={() => setCancelConfirm(a)} className="btn btn-sm btn-danger" disabled={cancelling === a.id}>
                          {cancelling === a.id ? <i className="fas fa-spinner fa-spin" /> : <><i className="fas fa-times" /> Cancel</>}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="card" style={{ width: "100%", maxWidth: 580, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="card-title"><i className="fas fa-calendar-check" /> Appointment #{detail.id}</h3>
              <button onClick={() => setDetail(null)} className="btn btn-sm btn-danger"><i className="fas fa-times" /></button>
            </div>
            <div className="card-body">
              {/* Status banner */}
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <span className={getStatusBadgeClass(detail.status)} style={{ fontSize: "1rem", padding: "0.5rem 1.5rem" }}>
                  {formatStatus(detail.status)}
                </span>
              </div>

              {/* Service */}
              <div style={{ padding: "1rem", background: "var(--light-bg)", borderRadius: 5, marginBottom: "1rem" }}>
                <h4 style={{ margin: "0 0 0.5rem", color: "var(--primary-color)" }}><i className="fas fa-tools" /> Services</h4>
                {(detail.additionalServices && detail.additionalServices.length > 0)
                  ? detail.additionalServices.map((as, i) => (
                      <p key={i} style={{ margin: "0 0 0.2rem" }}><strong>{as.service.serviceName}</strong></p>
                    ))
                  : <p style={{ margin: "0 0 0.25rem" }}><strong>{detail.service.serviceName}</strong></p>}
                {detail.service.estimatedDuration && <p style={{ margin: 0, color: "var(--light-text)", fontSize: "0.875rem" }}><i className="fas fa-clock" /> ~{detail.service.estimatedDuration} minutes</p>}
              </div>

              {/* Schedule */}
              <div style={{ padding: "1rem", background: "var(--light-bg)", borderRadius: 5, marginBottom: "1rem" }}>
                <h4 style={{ margin: "0 0 0.5rem", color: "var(--primary-color)" }}><i className="fas fa-calendar-alt" /> Schedule</h4>
                <p style={{ margin: "0 0 0.25rem" }}><strong>Date:</strong> {formatDate(detail.appointmentDate)}</p>
                <p style={{ margin: 0 }}><strong>Time:</strong> {formatTime(detail.appointmentTime)}</p>
              </div>

              {/* Vehicle */}
              <div style={{ padding: "1rem", background: "var(--light-bg)", borderRadius: 5, marginBottom: "1rem" }}>
                <h4 style={{ margin: "0 0 0.5rem", color: "var(--primary-color)" }}><i className="fas fa-car" /> Vehicle</h4>
                <p style={{ margin: "0 0 0.25rem" }}><strong>{detail.vehicle.brand} {detail.vehicle.model}</strong>{detail.vehicle.year ? ` (${detail.vehicle.year})` : ""}</p>
                <p style={{ margin: "0 0 0.25rem" }}><strong>Plate:</strong> {detail.vehicle.plateNo}</p>
                {detail.vehicle.color && <p style={{ margin: 0 }}><strong>Color:</strong> {detail.vehicle.color}</p>}
              </div>

              {/* Mechanic */}
              <div style={{ padding: "1rem", background: "var(--light-bg)", borderRadius: 5, marginBottom: "1rem" }}>
                <h4 style={{ margin: "0 0 0.5rem", color: "var(--primary-color)" }}><i className="fas fa-user-cog" /> Assigned Mechanic</h4>
                {detail.mechanic ? (
                  <>
                    <p style={{ margin: "0 0 0.25rem" }}><strong>{detail.mechanic.name}</strong></p>
                    {detail.mechanic.contact && <p style={{ margin: 0 }}><i className="fas fa-phone" /> {detail.mechanic.contact}</p>}
                  </>
                ) : (
                  <p style={{ margin: 0, color: "var(--light-text)" }}>Not yet assigned — waiting for admin approval</p>
                )}
              </div>

              {/* Cost */}
              <div style={{ padding: "1rem", background: "var(--light-bg)", borderRadius: 5, marginBottom: "1rem" }}>
                <h4 style={{ margin: "0 0 0.5rem", color: "var(--primary-color)" }}><i className="fas fa-dollar-sign" /> Cost</h4>
                {detail.finalCost
                  ? <p style={{ margin: 0 }}><strong>Final:</strong> {formatCurrency(detail.finalCost.toString())}</p>
                  : detail.estimatedCost
                    ? <p style={{ margin: 0 }}><strong>Estimated:</strong> {formatCurrency(detail.estimatedCost.toString())} <span style={{ color: "var(--light-text)", fontSize: "0.8rem" }}>(subject to change)</span></p>
                    : <p style={{ margin: 0, color: "var(--light-text)" }}>To be determined</p>}
              </div>

              {/* Notes */}
              {detail.customerNotes && (
                <div className="alert alert-info">
                  <strong>Your Notes:</strong> {detail.customerNotes}
                </div>
              )}
              {detail.notes && (
                <div className="alert alert-warning">
                  <strong>Shop Notes:</strong> {detail.notes}
                </div>
              )}

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                {detail.status === "Completed" && (
                  <Link href={`/receipt/${detail.id}`} className="btn btn-primary" target="_blank">
                    <i className="fas fa-file-invoice" /> View Receipt
                  </Link>
                )}
                {canCancel(detail.status) && (
                  <button onClick={() => { setDetail(null); setCancelConfirm(detail); }} className="btn btn-danger">
                    <i className="fas fa-times" /> Cancel Appointment
                  </button>
                )}
                <button onClick={() => setDetail(null)} className="btn btn-secondary">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirm Modal */}
      {cancelConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="card" style={{ width: "100%", maxWidth: 440 }}>
            <div className="card-header">
              <h3 className="card-title"><i className="fas fa-exclamation-triangle" style={{ color: "var(--danger-color)" }} /> Cancel Appointment</h3>
            </div>
            <div className="card-body">
              <p>Are you sure you want to cancel your <strong>
                {(cancelConfirm.additionalServices && cancelConfirm.additionalServices.length > 0)
                  ? cancelConfirm.additionalServices.map(as => as.service.serviceName).join(", ")
                  : cancelConfirm.service.serviceName}
              </strong> appointment on <strong>{formatDate(cancelConfirm.appointmentDate)}</strong>?</p>
              <p style={{ color: "var(--light-text)", fontSize: "0.875rem" }}>This action cannot be undone.</p>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button onClick={() => cancelAppointment(cancelConfirm)} className="btn btn-danger" disabled={cancelling === cancelConfirm.id}>
                  {cancelling === cancelConfirm.id ? "Cancelling..." : "Yes, Cancel It"}
                </button>
                <button onClick={() => setCancelConfirm(null)} className="btn btn-secondary">Keep Appointment</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
