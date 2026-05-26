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

  const currentAppt = await prisma.appointment.findUnique({
    where: { id: apptId },
    include: { service: { select: { serviceName: true } } },
  });

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

  const notificationsToCreate: { userId: number; title: string; message: string; type: string }[] = [];
  const serviceName = currentAppt?.service?.serviceName ?? "Service";

  // Customer: status change with a specific message per status
  if (status && status !== currentAppt?.status) {
    const statusMessages: Record<string, { title: string; message: string; type: string }> = {
      Approved: {
        title: "Appointment Approved",
        message: `Good news! Your appointment #${id} for ${serviceName} has been approved.`,
        type: "Success",
      },
      InProgress: {
        title: "Service In Progress",
        message: `Your ${serviceName} (appointment #${id}) is now underway. We'll notify you when it's done.`,
        type: "Info",
      },
      Completed: {
        title: "Service Completed",
        message: `Your ${serviceName} (appointment #${id}) is complete. Thank you for choosing us!`,
        type: "Success",
      },
      Cancelled: {
        title: "Appointment Cancelled",
        message: `Your appointment #${id} for ${serviceName} has been cancelled by the shop. Please contact us for details.`,
        type: "Error",
      },
    };
    const notification = statusMessages[status] ?? {
      title: "Appointment Updated",
      message: `Your appointment #${id} status has changed to ${status}.`,
      type: "Info",
    };
    notificationsToCreate.push({ userId: updated.userId, ...notification });
  }

  // Customer: rescheduled
  if (appointmentDate || appointmentTime) {
    notificationsToCreate.push({
      userId: updated.userId,
      title: "Appointment Rescheduled",
      message: `Your appointment #${id} for ${serviceName} has been rescheduled by the shop. Please check the new date and time.`,
      type: "Info",
    });
  }

  // Customer: final cost set or updated
  if (finalCost !== undefined && finalCost !== null && finalCost !== currentAppt?.finalCost) {
    notificationsToCreate.push({
      userId: updated.userId,
      title: "Final Cost Updated",
      message: `The final cost for your ${serviceName} (appointment #${id}) has been set to AED ${Number(finalCost).toFixed(2)}.`,
      type: "Info",
    });
  }

  // Customer: admin added or changed notes
  if (notes !== undefined && notes !== currentAppt?.notes && notes !== "") {
    notificationsToCreate.push({
      userId: updated.userId,
      title: "Note Added to Your Appointment",
      message: `The shop added a note to appointment #${id}: "${notes}"`,
      type: "Info",
    });
  }

  // Mechanic: newly assigned
  const newMechanicId = mechanicId ? parseInt(mechanicId) : null;
  if (newMechanicId && newMechanicId !== currentAppt?.mechanicId) {
    notificationsToCreate.push({
      userId: newMechanicId,
      title: "New Job Assigned",
      message: `You have been assigned to appointment #${id} — ${serviceName}.`,
      type: "Info",
    });
  }

  if (notificationsToCreate.length > 0) {
    await prisma.notification.createMany({ data: notificationsToCreate });
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
