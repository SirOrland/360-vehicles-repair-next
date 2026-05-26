import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || !["Admin", "Mechanic"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const parts = await prisma.partsUsage.findMany({
    where: { appointmentId: parseInt(id) },
    include: { part: { select: { partName: true, partNumber: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(parts);
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || !["Admin", "Mechanic"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const apptId = parseInt(id);
  const { partId, quantity } = await req.json();

  if (!partId || !quantity || quantity < 1) {
    return NextResponse.json({ error: "Invalid part or quantity" }, { status: 400 });
  }

  const part = await prisma.inventoryPart.findUnique({ where: { id: parseInt(partId) } });
  if (!part || part.status !== "Active") {
    return NextResponse.json({ error: "Part not found" }, { status: 404 });
  }
  if (part.quantityInStock < quantity) {
    return NextResponse.json({ error: `Only ${part.quantityInStock} units in stock` }, { status: 400 });
  }

  const unitPrice = part.unitPrice;
  const totalPrice = Number(unitPrice) * quantity;

  // Create parts usage, decrement stock, and log stock movement in parallel
  await Promise.all([
    prisma.partsUsage.create({
      data: { appointmentId: apptId, partId: parseInt(partId), quantityUsed: quantity, unitPrice, totalPrice },
    }),
    prisma.inventoryPart.update({
      where: { id: parseInt(partId) },
      data: { quantityInStock: { decrement: quantity } },
    }),
    prisma.stockMovement.create({
      data: {
        partId: parseInt(partId),
        movementType: "Out",
        quantity,
        referenceType: "Appointment",
        referenceId: apptId,
        notes: `Used in appointment #${apptId}`,
        createdBy: parseInt(session.user.id),
      },
    }),
  ]);

  // Recalculate finalCost = estimatedCost + all parts total
  const appt = await prisma.appointment.findUnique({
    where: { id: apptId },
    include: { partsUsage: true },
  });
  const partsCost = (appt?.partsUsage ?? []).reduce((sum, p) => sum + Number(p.totalPrice), 0);
  const baseCost = Number(appt?.estimatedCost ?? 0);
  const newFinalCost = baseCost + partsCost;

  await prisma.appointment.update({
    where: { id: apptId },
    data: { finalCost: newFinalCost },
  });

  // Low-stock notification for admins (24h dedup)
  const updatedPart = await prisma.inventoryPart.findUnique({ where: { id: parseInt(partId) } });
  if (updatedPart && updatedPart.quantityInStock <= updatedPart.reorderLevel) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const alreadyNotified = await prisma.notification.findFirst({
      where: { title: "Low Stock Alert", message: { contains: updatedPart.partName }, createdAt: { gte: since } },
    });
    if (!alreadyNotified) {
      const admins = await prisma.user.findMany({ where: { role: "Admin" }, select: { id: true } });
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: "Low Stock Alert",
          message: `${updatedPart.partName} is running low — ${updatedPart.quantityInStock} units left (reorder level: ${updatedPart.reorderLevel}).`,
          type: "Warning",
        })),
      });
    }
  }

  // Notify customer of updated cost
  if (appt) {
    await prisma.notification.create({
      data: {
        userId: appt.userId,
        title: "Parts Added to Your Appointment",
        message: `${quantity}x ${part.partName} was added to your appointment #${apptId}. Updated total: AED ${newFinalCost.toFixed(2)}.`,
        type: "Info",
      },
    });
  }

  return NextResponse.json({ success: true, finalCost: newFinalCost });
}
