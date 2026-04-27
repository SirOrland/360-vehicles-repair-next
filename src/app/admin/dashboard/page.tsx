import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatTime, getStatusBadgeClass, formatStatus } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard - 360 Vehicles Repair" };

export default async function AdminDashboardPage() {
  const session = await auth();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = new Date(now.toISOString().split("T")[0]);

  const [
    pending, inProgress, todayCount, customers, mechanics,
    revenueAgg, completedMonth, lowStock, recentAppointments,
  ] = await Promise.all([
    prisma.appointment.count({ where: { status: "Pending" } }),
    prisma.appointment.count({ where: { status: "InProgress" } }),
    prisma.appointment.count({ where: { appointmentDate: today } }),
    prisma.user.count({ where: { role: "Customer", status: "Active" } }),
    prisma.user.count({ where: { role: "Mechanic", status: "Active" } }),
    prisma.appointment.aggregate({
      where: { status: "Completed", appointmentDate: { gte: startOfMonth } },
      _sum: { finalCost: true },
    }),
    prisma.appointment.count({ where: { status: "Completed", appointmentDate: { gte: startOfMonth } } }),
    prisma.inventoryPart.count({ where: { status: "Active", quantityInStock: { lte: 10 } } }),
    prisma.appointment.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        service: { select: { serviceName: true } },
        vehicle: { select: { brand: true, model: true, plateNo: true } },
      },
    }),
  ]);

  const stats = [
    { icon: "fa-clock", color: "orange", value: pending, label: "Pending Appointments" },
    { icon: "fa-tools", color: "blue", value: inProgress, label: "In Progress" },
    { icon: "fa-calendar-day", color: "green", value: todayCount, label: "Today's Appointments" },
    { icon: "fa-users", color: "red", value: customers, label: "Total Customers" },
    { icon: "fa-user-cog", color: "blue", value: mechanics, label: "Active Mechanics" },
    { icon: "fa-dollar-sign", color: "green", value: formatCurrency(revenueAgg._sum.finalCost?.toString()), label: "Revenue This Month" },
    { icon: "fa-check-circle", color: "orange", value: completedMonth, label: "Completed This Month" },
    { icon: "fa-exclamation-triangle", color: "red", value: lowStock, label: "Low Stock Items" },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-content" style={{ width: "100%" }}>
        <div className="container">
          <div className="dashboard-header">
            <h1>Admin Dashboard</h1>
            <p>Welcome back, {session?.user?.name}! Here&apos;s your shop overview</p>
          </div>

          <div className="stats-grid">
            {stats.map((s) => (
              <div className="stat-card" key={s.label}>
                <div className={`stat-icon ${s.color}`}><i className={`fas ${s.icon}`} /></div>
                <div className="stat-details">
                  <h3>{s.value}</h3>
                  <p>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2><i className="fas fa-bolt" /> Quick Actions</h2>
            </div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link href="/admin/appointments" className="btn btn-primary"><i className="fas fa-calendar-check" /> Manage Appointments</Link>
              <Link href="/admin/users" className="btn btn-secondary"><i className="fas fa-users" /> Manage Users</Link>
              <Link href="/admin/inventory" className="btn btn-secondary"><i className="fas fa-boxes" /> Manage Inventory</Link>
              <Link href="/admin/reports" className="btn btn-secondary"><i className="fas fa-chart-bar" /> View Reports</Link>
            </div>
          </div>

          {/* Alerts */}
          {(pending > 0 || lowStock > 0) && (
            <div className="dashboard-section">
              <div className="section-header"><h2><i className="fas fa-bell" /> Alerts</h2></div>
              {pending > 0 && (
                <div className="alert alert-warning">
                  <i className="fas fa-exclamation-triangle" />
                  You have <strong>{pending}</strong> pending appointment(s) waiting for approval.{" "}
                  <Link href="/admin/appointments">Review Now</Link>
                </div>
              )}
              {lowStock > 0 && (
                <div className="alert alert-danger">
                  <i className="fas fa-box-open" />
                  <strong>{lowStock}</strong> item(s) are running low on stock.{" "}
                  <Link href="/admin/inventory">View Items</Link>
                </div>
              )}
            </div>
          )}

          {/* Recent Appointments */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2><i className="fas fa-calendar-alt" /> Recent Appointments</h2>
              <Link href="/admin/appointments" className="btn btn-sm btn-secondary">View All</Link>
            </div>
            {recentAppointments.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-calendar-times" /><h3>No Appointments Yet</h3>
                <p>Appointments will appear here once customers start booking</p>
              </div>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th><th>Customer</th><th>Service</th><th>Vehicle</th><th>Date & Time</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAppointments.map((a) => (
                      <tr key={a.id}>
                        <td>#{a.id}</td>
                        <td>{a.customer.name}</td>
                        <td>{a.service.serviceName}</td>
                        <td>
                          {a.vehicle.brand} {a.vehicle.model}<br />
                          <small style={{ color: "var(--light-text)" }}>{a.vehicle.plateNo}</small>
                        </td>
                        <td>
                          {formatDate(a.appointmentDate)}<br />
                          <small style={{ color: "var(--light-text)" }}>{formatTime(a.appointmentTime)}</small>
                        </td>
                        <td><span className={getStatusBadgeClass(a.status)}>{formatStatus(a.status)}</span></td>
                        <td>
                          <Link href={`/admin/appointments?view=${a.id}`} className="btn btn-sm btn-secondary">
                            <i className="fas fa-eye" /> View
                          </Link>
                        </td>
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
