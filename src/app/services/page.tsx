import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Services - 360 Vehicles Repair LLC" };

export default async function ServicesPage() {
  const services = await prisma.service.findMany({
    where: { status: "Active" },
    orderBy: { serviceName: "asc" },
  });

  return (
    <div className="container">
      <div style={{ padding: "3rem 0" }}>
        <div className="text-center mb-4">
          <h1 style={{ color: "var(--primary-color)", fontSize: "2.5rem", marginBottom: "1rem" }}>
            <i className="fas fa-tools" /> Our Services
          </h1>
          <p style={{ color: "var(--light-text)", fontSize: "1.125rem" }}>
            Comprehensive automotive repair and maintenance services
          </p>
        </div>

        <div className="row">
          {services.map((service) => (
            <div className="col-4" key={service.id}>
              <div className="card">
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                  <div style={{ width: 50, height: 50, background: "linear-gradient(135deg, var(--accent-color), var(--secondary-color))", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1.5rem" }}>
                    <i className="fas fa-wrench" />
                  </div>
                  <h3 style={{ color: "var(--primary-color)", margin: 0 }}>{service.serviceName}</h3>
                </div>
                <p style={{ color: "var(--light-text)", marginBottom: "1.5rem" }}>{service.description}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--light-bg)", paddingTop: "1rem" }}>
                  <div>
                    <span style={{ color: "var(--secondary-color)", fontWeight: 700, fontSize: "1.25rem" }}>
                      {formatCurrency(service.basePrice?.toString())}
                    </span>
                    <span style={{ color: "var(--light-text)", fontSize: "0.75rem", display: "block" }}>Starting price</span>
                  </div>
                  <span style={{ color: "var(--light-text)", fontSize: "0.875rem" }}>
                    <i className="fas fa-clock" /> ~{service.estimatedDuration} min
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: "linear-gradient(135deg, var(--primary-color), var(--accent-color))", borderRadius: 10, padding: "3rem", textAlign: "center", color: "white", marginTop: "2rem" }}>
          <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Ready to Book a Service?</h2>
          <p style={{ fontSize: "1.125rem", marginBottom: "2rem" }}>Create an account and schedule your appointment today</p>
          <a href="/auth/register" className="btn" style={{ backgroundColor: "white", color: "var(--primary-color)" }}>
            <i className="fas fa-calendar-plus" /> Book Now
          </a>
        </div>
      </div>
    </div>
  );
}
