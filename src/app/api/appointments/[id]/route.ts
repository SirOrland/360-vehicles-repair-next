import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["Admin", "Mechanic"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, mechanicId, notes, finalCost } = body;

  const updated = await prisma.appointment.update({
    where: { id: parseInt(id) },
    data: {
      ...(status && { status }),
      ...(mechanicId !== undefined && { mechanicId: mechanicId ? parseInt(mechanicId) : null }),
      ...(notes !== undefined && { notes }),
      ...(finalCost !== undefined && { finalCost }),
    },
    include: { customer: { select: { id: true, name: true } } },
  });

  if (status) {
    await prisma.notification.create({
      data: {
        userId: updated.userId,
        title: "Appointment Status Updated",
        message: `Your appointment #${id} status has been updated to: ${status.replace("InProgress", "In Progress")}`,
        type: status === "Completed" ? "Success" : status === "Cancelled" ? "Error" : "Info",
      },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.appointment.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
