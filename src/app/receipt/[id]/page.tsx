import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import ReceiptActions from "./ReceiptActions";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/auth/login");

  const apptId = parseInt(id);
  const appt = await prisma.appointment.findUnique({
    where: { id: apptId },
    include: {
      customer: { select: { name: true, email: true, contact: true } },
      vehicle: true,
      service: true,
      mechanic: { select: { name: true } },
      partsUsage: {
        include: { part: { select: { partName: true, partNumber: true } } },
        orderBy: { createdAt: "asc" },
      },
      additionalServices: { include: { service: true } },
    },
  });

  if (!appt) notFound();

  // Authorization: customer can only see their own, admin sees all
  if (session.user.role === "Customer" && appt.userId !== parseInt(session.user.id)) {
    redirect("/customer/dashboard");
  }
  if (session.user.role === "Mechanic") redirect("/mechanic/dashboard");

  const partsCost = appt.partsUsage.reduce((s, p) => s + Number(p.totalPrice), 0);
  const serviceCost = Number(appt.estimatedCost ?? 0);
  const total = Number(appt.finalCost ?? serviceCost + partsCost);
  const receiptNo = `INV-${String(apptId).padStart(5, "0")}`;
  const issuedDate = formatDate(new Date());

  // Collect all services (primary + additional)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const additionalServices: any[] = (appt as any).additionalServices ?? [];
  const allServices = [
    appt.service,
    ...additionalServices.filter(as => as.serviceId !== appt.serviceId).map(as => as.service),
  ];

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .receipt-wrapper { box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
        }
        .receipt-wrapper { max-width: 680px; margin: 2rem auto; background: white; padding: 2rem; box-shadow: 0 2px 16px rgba(0,0,0,0.12); border-radius: 8px; }
        .receipt-divider { border: none; border-top: 1px dashed #ccc; margin: 1.25rem 0; }
        .receipt-table { width: 100%; border-collapse: collapse; }
        .receipt-table th { text-align: left; padding: 0.4rem 0.5rem; font-size: 0.8rem; text-transform: uppercase; color: #666; border-bottom: 1px solid #eee; }
        .receipt-table td { padding: 0.5rem; font-size: 0.9rem; border-bottom: 1px solid #f4f4f4; }
        .receipt-table td:last-child, .receipt-table th:last-child { text-align: right; }
        .total-row td { font-weight: 700; font-size: 1rem; border-top: 2px solid #333; border-bottom: none; padding-top: 0.75rem; }
      `}</style>

      <div style={{ background: "#f5f5f5", minHeight: "100vh", padding: "1rem" }}>
        {/* Back link — hidden when printing */}
        <div className="no-print" style={{ maxWidth: 680, margin: "0 auto 1rem" }}>
          <a href={session.user.role === "Admin" ? "/admin/appointments" : "/customer/my-appointments"}
            style={{ color: "var(--primary-color)", textDecoration: "none", fontSize: "0.9rem" }}>
            <i className="fas fa-arrow-left" /> Back to Appointments
          </a>
        </div>

        <div className="receipt-wrapper" id="receipt-content">
          {/* Shop Header */}
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1a1a2e", letterSpacing: 1 }}>
              <i className="fas fa-car-side" style={{ color: "var(--primary-color, #e63946)" }} /> 360 Vehicles Repair
            </div>
            <div style={{ color: "#666", fontSize: "0.85rem", marginTop: "0.25rem" }}>Your Trusted Auto Service Center</div>
          </div>

          <hr className="receipt-divider" />

          {/* Receipt Meta */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Service Receipt</div>
              <div style={{ color: "#666", fontSize: "0.85rem", marginTop: "0.2rem" }}>Receipt No: <strong>{receiptNo}</strong></div>
              <div style={{ color: "#666", fontSize: "0.85rem" }}>Date Issued: <strong>{issuedDate}</strong></div>
              <div style={{ color: "#666", fontSize: "0.85rem" }}>Service Date: <strong>{formatDate(appt.appointmentDate)}</strong> at <strong>{formatTime(appt.appointmentTime)}</strong></div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ background: appt.status === "Completed" ? "#28a745" : "#ffc107", color: appt.status === "Completed" ? "white" : "#333", padding: "4px 12px", borderRadius: 4, fontSize: "0.8rem", fontWeight: 700 }}>
                {appt.status.toUpperCase()}
              </span>
            </div>
          </div>

          <hr className="receipt-divider" />

          {/* Bill To + Vehicle */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
            <div>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#888", marginBottom: "0.4rem", fontWeight: 600 }}>Bill To</div>
              <div style={{ fontWeight: 600 }}>{appt.customer.name}</div>
              {appt.customer.email && <div style={{ fontSize: "0.85rem", color: "#555" }}>{appt.customer.email}</div>}
              {appt.customer.contact && <div style={{ fontSize: "0.85rem", color: "#555" }}>{appt.customer.contact}</div>}
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#888", marginBottom: "0.4rem", fontWeight: 600 }}>Vehicle</div>
              <div style={{ fontWeight: 600 }}>{appt.vehicle.brand} {appt.vehicle.model}{appt.vehicle.year ? ` (${appt.vehicle.year})` : ""}</div>
              <div style={{ fontSize: "0.85rem", color: "#555" }}>Plate: {appt.vehicle.plateNo}</div>
              {appt.vehicle.color && <div style={{ fontSize: "0.85rem", color: "#555" }}>Color: {appt.vehicle.color}</div>}
              {appt.vehicle.vin && <div style={{ fontSize: "0.85rem", color: "#555" }}>VIN: {appt.vehicle.vin}</div>}
            </div>
          </div>

          <hr className="receipt-divider" />

          {/* Services */}
          <table className="receipt-table" style={{ marginBottom: "1rem" }}>
            <thead>
              <tr><th>Service</th><th>Duration</th><th>Price</th></tr>
            </thead>
            <tbody>
              {allServices.map((svc, i) => (
                <tr key={i}>
                  <td>{svc.serviceName}{svc.description ? <><br /><small style={{ color: "#888" }}>{svc.description}</small></> : null}</td>
                  <td>{svc.estimatedDuration ? `~${svc.estimatedDuration} min` : "—"}</td>
                  <td>{svc.basePrice ? formatCurrency(svc.basePrice.toString()) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Parts */}
          {appt.partsUsage.length > 0 && (
            <table className="receipt-table" style={{ marginBottom: "1rem" }}>
              <thead>
                <tr><th>Part</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
              </thead>
              <tbody>
                {appt.partsUsage.map(p => (
                  <tr key={p.id}>
                    <td>
                      {p.part.partName}
                      {p.part.partNumber && <><br /><small style={{ color: "#888" }}>#{p.part.partNumber}</small></>}
                    </td>
                    <td>{p.quantityUsed}</td>
                    <td>{formatCurrency(p.unitPrice.toString())}</td>
                    <td>{formatCurrency(p.totalPrice.toString())}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Totals */}
          <table className="receipt-table">
            <tbody>
              <tr>
                <td style={{ color: "#555" }}>Service Subtotal</td>
                <td></td>
                {appt.partsUsage.length > 0 && <td></td>}
                <td style={{ textAlign: "right" }}>{formatCurrency(serviceCost.toString())}</td>
              </tr>
              {partsCost > 0 && (
                <tr>
                  <td style={{ color: "#555" }}>Parts Subtotal</td>
                  <td></td>
                  <td></td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(partsCost.toString())}</td>
                </tr>
              )}
              <tr className="total-row">
                <td colSpan={appt.partsUsage.length > 0 ? 3 : 1}>TOTAL DUE</td>
                <td style={{ textAlign: "right", color: "var(--primary-color, #e63946)", fontSize: "1.1rem" }}>{formatCurrency(total.toString())}</td>
              </tr>
            </tbody>
          </table>

          <hr className="receipt-divider" />

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontSize: "0.85rem", color: "#555" }}>
              {appt.mechanic && <div>Serviced by: <strong>{appt.mechanic.name}</strong></div>}
              {appt.notes && <div style={{ marginTop: "0.25rem" }}>Notes: {appt.notes}</div>}
            </div>
            <div style={{ textAlign: "right", fontSize: "0.8rem", color: "#888" }}>
              <div>Thank you for choosing us!</div>
              <div style={{ marginTop: "0.2rem" }}>info@360vehicles.com</div>
            </div>
          </div>

        </div>

        {/* Print / Download buttons — outside receipt-content so they don't appear in the PDF */}
        <ReceiptActions receiptNo={receiptNo} />
      </div>
    </>
  );
}
