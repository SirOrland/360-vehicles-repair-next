import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const part = await prisma.inventoryPart.update({
    where: { id: parseInt(id) },
    data: body,
  });

  // Notify admins if stock dropped to or below reorder level
  if (part.status === "Active" && part.quantityInStock <= part.reorderLevel) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const alreadyNotified = await prisma.notification.findFirst({
      where: {
        title: "Low Stock Alert",
        message: { contains: part.partName },
        createdAt: { gte: since },
      },
    });

    if (!alreadyNotified) {
      const admins = await prisma.user.findMany({ where: { role: "Admin" }, select: { id: true } });
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: "Low Stock Alert",
          message: `${part.partName} is running low — ${part.quantityInStock} units left (reorder level: ${part.reorderLevel}).`,
          type: "Warning",
        })),
      });
    }
  }

  return NextResponse.json(part);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  // Soft delete to preserve history references
  await prisma.inventoryPart.update({ where: { id: parseInt(id) }, data: { status: "Inactive" } });
  return NextResponse.json({ success: true });
}
