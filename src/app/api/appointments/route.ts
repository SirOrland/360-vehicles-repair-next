import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: Record<string, unknown> = {};
  if (session.user.role === "Customer") where.userId = parseInt(session.user.id);
  if (session.user.role === "Mechanic") where.mechanicId = parseInt(session.user.id);
  if (status) where.status = status;

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      customer: { select: { name: true, email: true, contact: true } },
      vehicle: true,
      service: true,
      mechanic: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "Customer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { vehicleId, serviceId, appointmentDate, appointmentTime, customerNotes } = body;

  if (!vehicleId || !serviceId || !appointmentDate || !appointmentTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const service = await prisma.service.findUnique({ where: { id: parseInt(serviceId) } });
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const appointment = await prisma.appointment.create({
    data: {
      userId: parseInt(session.user.id),
      vehicleId: parseInt(vehicleId),
      serviceId: parseInt(serviceId),
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      customerNotes,
      estimatedCost: service.basePrice,
      status: "Pending",
    },
  });

  await prisma.notification.create({
    data: {
      userId: parseInt(session.user.id),
      title: "Appointment Booked",
      message: "Your appointment has been submitted and is pending approval.",
      type: "Success",
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: parseInt(session.user.id),
      action: "Appointment Booked",
      description: `Booked appointment #${appointment.id}`,
    },
  });

  return NextResponse.json(appointment, { status: 201 });
}
