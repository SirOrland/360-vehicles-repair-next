import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Metadata } from "next";

function svcNames(appt: { service: { serviceName: string } }) {
  const svcs = (appt as { additionalServices?: { service: { serviceName: string } }[] }).additionalServices;
  return svcs?.length ? svcs.map(s => s.service.serviceName).join(", ") : appt.service.serviceName;
}

export const metadata: Metadata = { title: "Reports - Admin" };

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session || session.user.role !== "Admin") return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalCompleted, totalRevenue, byService, recentCompleted, lowStock] = await Promise.all([
    prisma.appointment.count({ where: { status: "Completed" } }),
    prisma.appointment.aggregate({ where: { status: "Completed" }, _sum: { finalCost: true } }),
    prisma.appointment.groupBy({
      by: ["serviceId"],
      where: { status: "Completed" },
      _count: { id: true },
      _sum: { finalCost: true },
    }),
    prisma.appointment.findMany({
      where: { status: "Completed", appointmentDate: { gte: startOfMonth } },
      include: { customer: { select: { name: true } }, service: { select: { serviceName: true } }, vehicle: { select: { brand: true, model: true } }, additionalServices: { include: { service: { select: { serviceName: true } } } } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.inventoryPart.findMany({
      where: { status: "Active", quantityInStock: { lte: 10 } },
    }),
  ]);

  const serviceIds = byService.map(b => b.serviceId);
  const services = await prisma.service.findMany({ where: { id: { in: serviceIds } } });
  const serviceMap = Object.fromEntries(services.map(s => [s.id, s.serviceName]));

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
      <div className="dashboard-header">
        <h1><i className="fas fa-chart-bar" /> Reports</h1>
        <p>Business performance overview</p>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid" style={{ marginBottom: "2rem" }}>
        <div className="stat-card">
          <div className="stat-icon green"><i className="fas fa-check-circle" /></div>
          <div className="stat-details"><h3>{totalCompleted}</h3><p>Total Completed</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><i className="fas fa-dollar-sign" /></div>
          <div className="stat-details"><h3>{formatCurrency(totalRevenue._sum.finalCost?.toString())}</h3><p>Total Revenue</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><i className="fas fa-exclamation-triangle" /></div>
          <div className="stat-details"><h3>{lowStock.length}</h3><p>Low Stock Items</p></div>
        </div>
      </div>

      <div className="row">
        {/* Revenue by Service */}
        <div className="col-6">
          <div className="card">
            <div className="card-header"><h3 className="card-title">Revenue by Service</h3></div>
            <div className="card-body">
              {byService.sort((a, b) => Number(b._sum.finalCost || 0) - Number(a._sum.finalCost || 0)).map(row => (
                <div key={row.serviceId} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--light-bg)" }}>
                  <span>{serviceMap[row.serviceId] || "Unknown"}</span>
                  <span>
                    <strong>{row._count.id}</strong> jobs &nbsp;
                    <strong style={{ color: "var(--secondary-color)" }}>{formatCurrency(row._sum.finalCost?.toString())}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="col-6">
          <div className="card">
            <div className="card-header"><h3 className="card-title" style={{ color: "var(--danger-color)" }}>⚠ Low Stock Alert</h3></div>
            <div className="card-body">
              {lowStock.length === 0 ? (
                <p style={{ color: "var(--light-text)" }}>All items are well-stocked.</p>
              ) : lowStock.map(p => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--light-bg)" }}>
                  <span>{p.partName}</span>
                  <span style={{ color: "var(--danger-color)", fontWeight: 600 }}>{p.quantityInStock} left (reorder at {p.reorderLevel})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* This Month Completed */}
      <div className="dashboard-section">
        <div className="section-header"><h2>Completed This Month</h2></div>
        {recentCompleted.length === 0 ? (
          <div className="empty-state"><i className="fas fa-calendar-times" /><h3>No completed appointments this month</h3></div>
        ) : (
          <div className="data-table">
            <table>
              <thead><tr><th>ID</th><th>Customer</th><th>Service</th><th>Vehicle</th><th>Date</th><th>Final Cost</th></tr></thead>
              <tbody>
                {recentCompleted.map(a => (
                  <tr key={a.id}>
                    <td>#{a.id}</td>
                    <td>{a.customer.name}</td>
                    <td>{svcNames(a)}</td>
                    <td>{a.vehicle.brand} {a.vehicle.model}</td>
                    <td>{formatDate(a.appointmentDate)}</td>
                    <td>{a.finalCost ? formatCurrency(a.finalCost.toString()) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
