import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const apptId = parseInt(id);
  const body = await req.json();

  // Customer can only cancel their own Pending or Approved appointments
  if (session.user.role === "Customer") {
    const appt = await prisma.appointment.findFirst({
      where: { id: apptId, userId: parseInt(session.user.id) },
    });
    if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!["Pending", "Approved"].includes(appt.status)) {
      return NextResponse.json({ error: "This appointment cannot be cancelled" }, { status: 400 });
    }
    const updated = await prisma.appointment.update({
      where: { id: apptId },
      data: { status: "Cancelled" },
    });
    await prisma.notification.create({
      data: {
        userId: parseInt(session.user.id),
        title: "Appointment Cancelled",
        message: `Your appointment #${id} has been cancelled successfully.`,
        type: "Info",
      },
    });
    return NextResponse.json(updated);
  }

  if (!["Admin", "Mechanic"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status, mechanicId, notes, finalCost, appointmentDate, appointmentTime } = body;

  const updated = await prisma.appointment.update({
    where: { id: apptId },
    data: {
      ...(status && { status }),
      ...(mechanicId !== undefined && { mechanicId: mechanicId ? parseInt(mechanicId) : null }),
      ...(notes !== undefined && { notes }),
      ...(finalCost !== undefined && { finalCost }),
      ...(appointmentDate && { appointmentDate: new Date(appointmentDate) }),
      ...(appointmentTime && { appointmentTime }),
    },
    include: { customer: { select: { id: true, name: true } } },
  });

  if (status) {
    await prisma.notification.create({
      data: {
        userId: updated.userId,
        title: "Appointment Status Updated",
        message: `Your appointment #${id} has been updated to: ${status === "InProgress" ? "In Progress" : status}.`,
        type: status === "Completed" ? "Success" : status === "Cancelled" ? "Error" : "Info",
      },
    });
  }

  if (appointmentDate || appointmentTime) {
    await prisma.notification.create({
      data: {
        userId: updated.userId,
        title: "Appointment Rescheduled",
        message: `Your appointment #${id} has been rescheduled by the shop.`,
        type: "Info",
      },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.appointment.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
