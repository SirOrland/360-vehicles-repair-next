import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatTime, getStatusBadgeClass, formatStatus } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Customer Dashboard - 360 Vehicles Repair" };

export default async function CustomerDashboardPage() {
  const session = await auth();
  const userId = parseInt(session!.user.id);

  const [vehicles, recentAppointments, unreadCount] = await Promise.all([
    prisma.vehicle.count({ where: { userId } }),
    prisma.appointment.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { service: { select: { serviceName: true } }, vehicle: { select: { brand: true, model: true, plateNo: true } } },
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  const pending = recentAppointments.filter(a => a.status === "Pending").length;
  const completed = recentAppointments.filter(a => a.status === "Completed").length;

  return (
    <div className="dashboard-container">
      <div className="dashboard-content" style={{ width: "100%" }}>
        <div className="container">
          <div className="dashboard-header">
            <h1>Welcome, {session?.user?.name}!</h1>
            <p>Here&apos;s an overview of your vehicle service history</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue"><i className="fas fa-car" /></div>
              <div className="stat-details"><h3>{vehicles}</h3><p>My Vehicles</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange"><i className="fas fa-clock" /></div>
              <div className="stat-details"><h3>{pending}</h3><p>Pending Appointments</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><i className="fas fa-check-circle" /></div>
              <div className="stat-details"><h3>{completed}</h3><p>Completed Services</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red"><i className="fas fa-bell" /></div>
              <div className="stat-details"><h3>{unreadCount}</h3><p>Unread Notifications</p></div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dashboard-section">
            <div className="section-header"><h2><i className="fas fa-bolt" /> Quick Actions</h2></div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link href="/customer/book-appointment" className="btn btn-primary"><i className="fas fa-calendar-plus" /> Book Appointment</Link>
              <Link href="/customer/my-vehicles" className="btn btn-secondary"><i className="fas fa-car" /> My Vehicles</Link>
              <Link href="/customer/my-appointments" className="btn btn-secondary"><i className="fas fa-list" /> My Appointments</Link>
            </div>
          </div>

          {vehicles === 0 && (
            <div className="alert alert-warning">
              <i className="fas fa-car" />
              <div>
                <strong>No vehicles added yet!</strong> Add your vehicle to start booking service appointments.{" "}
                <Link href="/customer/my-vehicles">Add Vehicle</Link>
              </div>
            </div>
          )}

          {/* Recent Appointments */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2><i className="fas fa-calendar-alt" /> Recent Appointments</h2>
              <Link href="/customer/my-appointments" className="btn btn-sm btn-secondary">View All</Link>
            </div>
            {recentAppointments.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-calendar-times" /><h3>No Appointments Yet</h3>
                <p>Book your first service appointment to get started</p>
                <Link href="/customer/book-appointment" className="btn btn-primary mt-2">Book Now</Link>
              </div>
            ) : (
              <div className="data-table">
                <table>
                  <thead><tr><th>ID</th><th>Service</th><th>Vehicle</th><th>Date & Time</th><th>Status</th><th>Cost</th></tr></thead>
                  <tbody>
                    {recentAppointments.map(a => (
                      <tr key={a.id}>
                        <td>#{a.id}</td>
                        <td>{a.service.serviceName}</td>
                        <td>{a.vehicle.brand} {a.vehicle.model}<br /><small style={{ color: "var(--light-text)" }}>{a.vehicle.plateNo}</small></td>
                        <td>{formatDate(a.appointmentDate)}<br /><small style={{ color: "var(--light-text)" }}>{formatTime(a.appointmentTime)}</small></td>
                        <td><span className={getStatusBadgeClass(a.status)}>{formatStatus(a.status)}</span></td>
                        <td>{a.finalCost ? formatCurrency(a.finalCost.toString()) : a.estimatedCost ? formatCurrency(a.estimatedCost.toString()) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
