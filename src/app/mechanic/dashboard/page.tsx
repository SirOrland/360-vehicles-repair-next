import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime, getStatusBadgeClass, formatStatus } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mechanic Dashboard - 360 Vehicles Repair" };

export default async function MechanicDashboardPage() {
  const session = await auth();
  const mechanicId = parseInt(session!.user.id);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [assigned, inProgress, completed, todayJobs, activeJobs] = await Promise.all([
    prisma.appointment.count({ where: { mechanicId, status: "Approved" } }),
    prisma.appointment.count({ where: { mechanicId, status: "InProgress" } }),
    prisma.appointment.count({ where: { mechanicId, status: "Completed" } }),
    prisma.appointment.findMany({
      where: {
        mechanicId,
        status: { notIn: ["Cancelled"] },
        appointmentDate: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { appointmentTime: "asc" },
      include: {
        customer: { select: { name: true, contact: true } },
        service: { select: { serviceName: true, estimatedDuration: true } },
        vehicle: { select: { brand: true, model: true, plateNo: true, color: true } },
      },
    }),
    prisma.appointment.findMany({
      where: { mechanicId, status: { in: ["Approved", "InProgress"] } },
      take: 10,
      orderBy: { appointmentDate: "asc" },
      include: {
        customer: { select: { name: true, contact: true } },
        service: { select: { serviceName: true, estimatedDuration: true } },
        vehicle: { select: { brand: true, model: true, plateNo: true, color: true } },
      },
    }),
  ]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-content" style={{ width: "100%" }}>
        <div className="container">
          <div className="dashboard-header">
            <h1>Mechanic Dashboard</h1>
            <p>Welcome, {session?.user?.name}! Here are your assigned jobs</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon orange"><i className="fas fa-clipboard-list" /></div>
              <div className="stat-details"><h3>{assigned}</h3><p>Assigned Jobs</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue"><i className="fas fa-tools" /></div>
              <div className="stat-details"><h3>{inProgress}</h3><p>In Progress</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><i className="fas fa-check-circle" /></div>
              <div className="stat-details"><h3>{completed}</h3><p>Completed</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: "linear-gradient(135deg, #6f42c1, #9b59b6)" }}>
                <i className="fas fa-calendar-day" />
              </div>
              <div className="stat-details"><h3>{todayJobs.length}</h3><p>Today&apos;s Jobs</p></div>
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2><i className="fas fa-calendar-day" /> Today&apos;s Schedule</h2>
              <Link href="/mechanic/jobs?filter=Today" className="btn btn-sm btn-secondary">View All</Link>
            </div>
            {todayJobs.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-calendar-check" /><h3>No Jobs Today</h3><p>You have no jobs scheduled for today</p>
              </div>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr><th>ID</th><th>Customer</th><th>Service</th><th>Vehicle</th><th>Time</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {todayJobs.map(j => (
                      <tr key={j.id} style={{ borderLeft: "3px solid var(--secondary-color)" }}>
                        <td>#{j.id}</td>
                        <td>
                          {j.customer.name}
                          {j.customer.contact && <><br /><small style={{ color: "var(--light-text)" }}>{j.customer.contact}</small></>}
                        </td>
                        <td>{j.service.serviceName}<br /><small style={{ color: "var(--light-text)" }}>~{j.service.estimatedDuration} min</small></td>
                        <td>{j.vehicle.brand} {j.vehicle.model}<br /><small style={{ color: "var(--light-text)" }}>{j.vehicle.plateNo}</small></td>
                        <td><strong>{formatTime(j.appointmentTime)}</strong></td>
                        <td><span className={getStatusBadgeClass(j.status)}>{formatStatus(j.status)}</span></td>
                        <td><Link href="/mechanic/jobs" className="btn btn-sm btn-secondary"><i className="fas fa-edit" /> Update</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Jobs */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2><i className="fas fa-tools" /> Active Jobs</h2>
              <Link href="/mechanic/jobs" className="btn btn-sm btn-secondary">All Jobs</Link>
            </div>
            {activeJobs.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-clipboard-check" /><h3>No Active Jobs</h3><p>You have no assigned jobs at the moment</p>
              </div>
            ) : (
              <div className="data-table">
                <table>
                  <thead><tr><th>ID</th><th>Customer</th><th>Service</th><th>Vehicle</th><th>Date & Time</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {activeJobs.map(j => (
                      <tr key={j.id}>
                        <td>#{j.id}</td>
                        <td>{j.customer.name}<br /><small style={{ color: "var(--light-text)" }}>{j.customer.contact || ""}</small></td>
                        <td>{j.service.serviceName}<br /><small style={{ color: "var(--light-text)" }}>~{j.service.estimatedDuration} min</small></td>
                        <td>{j.vehicle.brand} {j.vehicle.model}<br /><small style={{ color: "var(--light-text)" }}>{j.vehicle.plateNo} · {j.vehicle.color || ""}</small></td>
                        <td>{formatDate(j.appointmentDate)}<br /><small style={{ color: "var(--light-text)" }}>{formatTime(j.appointmentTime)}</small></td>
                        <td><span className={getStatusBadgeClass(j.status)}>{formatStatus(j.status)}</span></td>
                        <td><Link href="/mechanic/jobs" className="btn btn-sm btn-secondary"><i className="fas fa-edit" /> Update</Link></td>
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
