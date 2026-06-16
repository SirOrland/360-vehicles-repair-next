import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import ReceiptActions from "./ReceiptActions";

async function getSettings() {
  const rows = await prisma.systemSetting.findMany({
    where: { settingKey: { in: ["vat_rate", "trn_number", "shop_address", "shop_email", "shop_name"] } },
  });
  const map: Record<string, string> = {
    vat_rate: "5",
    trn_number: "104902025600001",
    shop_address: "Al Sawari 9 St - Musaffah - M13 - Abu Dhabi - United Arab Emirates",
    shop_email: "technicalservices.360serv@outlook.com",
    shop_name: "360 Vehicles Repair",
  };
  for (const r of rows) if (r.settingValue) map[r.settingKey] = r.settingValue;
  return map;
}

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/auth/login");

  const apptId = parseInt(id);
  const [appt, settings] = await Promise.all([
    prisma.appointment.findUnique({
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
    }),
    getSettings(),
  ]);

  if (!appt) notFound();

  if (session.user.role === "Customer" && appt.userId !== parseInt(session.user.id)) {
    redirect("/customer/dashboard");
  }
  if (session.user.role === "Mechanic") redirect("/mechanic/dashboard");

  const partsCost = appt.partsUsage.reduce((s, p) => s + Number(p.totalPrice), 0);
  const serviceCost = Number(appt.estimatedCost ?? 0);
  const baseTotal = Number(appt.finalCost ?? serviceCost + partsCost);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const discountAmt = Number((appt as any).discount ?? 0);
  const vatRate = parseFloat(settings.vat_rate) || 0;
  const subtotalAfterDiscount = Math.max(0, baseTotal - discountAmt);
  const vatAmt = subtotalAfterDiscount * vatRate / 100;
  const grandTotal = subtotalAfterDiscount + vatAmt;

  const receiptNo = `INV-${String(apptId).padStart(5, "0")}`;
  const issuedDate = formatDate(new Date());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const additionalServices: any[] = (appt as any).additionalServices ?? [];
  const allServices = [
    appt.service,
    ...additionalServices.filter((as: { serviceId: number }) => as.serviceId !== appt.serviceId).map((as: { service: unknown }) => as.service),
  ];

  const hasExtra = appt.partsUsage.length > 0;

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
              <i className="fas fa-car-side" style={{ color: "var(--primary-color, #e63946)" }} /> {settings.shop_name}
            </div>
            <div style={{ color: "#666", fontSize: "0.85rem", marginTop: "0.25rem" }}>Your Trusted Auto Service Center</div>
            <div style={{ color: "#888", fontSize: "0.78rem", marginTop: "0.15rem" }}>{settings.shop_address}</div>
            <div style={{ color: "#888", fontSize: "0.78rem" }}>{settings.shop_email}</div>
            {settings.trn_number && (
              <div style={{ color: "#888", fontSize: "0.78rem" }}>TRN: {settings.trn_number}</div>
            )}
          </div>

          <hr className="receipt-divider" />

          {/* Receipt Meta */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Tax Invoice</div>
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <tr key={i}><td>{(svc as any).serviceName}{(svc as any).description ? <><br /><small style={{ color: "#888" }}>{(svc as any).description}</small></> : null}</td>
                  <td>{(svc as any).estimatedDuration ? `~${(svc as any).estimatedDuration} min` : "—"}</td>
                  <td>{(svc as any).basePrice ? formatCurrency((svc as any).basePrice.toString()) : "—"}</td>
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
                    <td>{p.part.partName}{p.part.partNumber && <><br /><small style={{ color: "#888" }}>#{p.part.partNumber}</small></>}</td>
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
                <td colSpan={hasExtra ? 3 : 1} style={{ color: "#555" }}>Service Subtotal</td>
                <td style={{ textAlign: "right" }}>{formatCurrency(serviceCost.toString())}</td>
              </tr>
              {partsCost > 0 && (
                <tr>
                  <td colSpan={3} style={{ color: "#555" }}>Parts Subtotal</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(partsCost.toString())}</td>
                </tr>
              )}
              {discountAmt > 0 && (
                <tr>
                  <td colSpan={hasExtra ? 3 : 1} style={{ color: "#28a745" }}>
                    <i className="fas fa-tag" style={{ marginRight: 4 }} />Discount
                  </td>
                  <td style={{ textAlign: "right", color: "#28a745" }}>- {formatCurrency(discountAmt.toString())}</td>
                </tr>
              )}
              {vatRate > 0 && (
                <tr>
                  <td colSpan={hasExtra ? 3 : 1} style={{ color: "#555" }}>
                    VAT ({vatRate}%)
                  </td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(vatAmt.toFixed(2))}</td>
                </tr>
              )}
              <tr className="total-row">
                <td colSpan={hasExtra ? 3 : 1}>TOTAL DUE</td>
                <td style={{ textAlign: "right", color: "var(--primary-color, #e63946)", fontSize: "1.1rem" }}>{formatCurrency(grandTotal.toFixed(2))}</td>
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
              <div style={{ marginTop: "0.2rem" }}>{settings.shop_email}</div>
            </div>
          </div>

        </div>

        <ReceiptActions receiptNo={receiptNo} />
      </div>
    </>
  );
}
