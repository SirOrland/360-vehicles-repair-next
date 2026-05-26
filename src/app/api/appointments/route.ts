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
  const { vehicleId, serviceIds, appointmentDate, appointmentTime, customerNotes } = body;

  if (!vehicleId || !serviceIds?.length || !appointmentDate || !appointmentTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const allServiceIds: number[] = serviceIds.map(Number);

  const [services, vehicle] = await Promise.all([
    prisma.service.findMany({ where: { id: { in: allServiceIds } } }),
    prisma.vehicle.findUnique({ where: { id: parseInt(vehicleId) } }),
  ]);

  if (services.length === 0) return NextResponse.json({ error: "No valid services found" }, { status: 404 });

  const totalEstimatedCost = services.reduce((sum, s) => sum + (s.basePrice ? Number(s.basePrice) : 0), 0);
  const primaryServiceId = allServiceIds[0];

  const appointment = await prisma.appointment.create({
    data: {
      userId: parseInt(session.user.id),
      vehicleId: parseInt(vehicleId),
      serviceId: primaryServiceId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      customerNotes,
      estimatedCost: totalEstimatedCost,
      status: "Pending",
    },
  });

  // Store all selected services in the junction table
  await prisma.appointmentService.createMany({
    data: allServiceIds.map((sid) => ({ appointmentId: appointment.id, serviceId: sid })),
    skipDuplicates: true,
  });

  const admins = await prisma.user.findMany({ where: { role: "Admin" }, select: { id: true } });
  const vehicleLabel = vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : "vehicle";
  const dateLabel = new Date(appointmentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const serviceNames = services.map((s) => s.serviceName).join(", ");

  await prisma.notification.createMany({
    data: [
      {
        userId: parseInt(session.user.id),
        title: "Appointment Booked",
        message: `Your appointment for ${serviceNames} has been submitted and is pending approval.`,
        type: "Success",
      },
      ...admins.map((admin) => ({
        userId: admin.id,
        title: "New Appointment Request",
        message: `${session.user.name} booked ${serviceNames} for their ${vehicleLabel} on ${dateLabel}.`,
        type: "Info",
      })),
    ],
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
