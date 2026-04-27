"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { formatDate, formatTime, getStatusBadgeClass, formatStatus, formatCurrency } from "@/lib/utils";
import Link from "next/link";

type Appointment = {
  id: number; status: string; appointmentDate: string; appointmentTime: string;
  estimatedCost: number | null; finalCost: number | null; customerNotes: string | null; notes: string | null;
  service: { serviceName: string }; vehicle: { brand: string; model: string; plateNo: string };
  mechanic?: { name: string } | null;
};

export default function MyAppointmentsPage() {
  const params = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [success] = useState(params.get("booked") ? "Appointment booked! Waiting for approval." : "");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/appointments");
    setAppointments(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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
            <thead><tr><th>ID</th><th>Service</th><th>Vehicle</th><th>Date & Time</th><th>Mechanic</th><th>Status</th><th>Cost</th></tr></thead>
            <tbody>
              {appointments.map(a => (
                <tr key={a.id}>
                  <td>#{a.id}</td>
                  <td>{a.service.serviceName}</td>
                  <td>{a.vehicle.brand} {a.vehicle.model}<br /><small style={{ color: "var(--light-text)" }}>{a.vehicle.plateNo}</small></td>
                  <td>{formatDate(a.appointmentDate)}<br /><small style={{ color: "var(--light-text)" }}>{formatTime(a.appointmentTime)}</small></td>
                  <td>{a.mechanic?.name || <em style={{ color: "var(--light-text)" }}>Not assigned</em>}</td>
                  <td><span className={getStatusBadgeClass(a.status)}>{formatStatus(a.status)}</span></td>
                  <td>{a.finalCost ? formatCurrency(a.finalCost.toString()) : a.estimatedCost ? <><span style={{ color: "var(--light-text)", fontSize: "0.75rem" }}>Est. </span>{formatCurrency(a.estimatedCost.toString())}</> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
