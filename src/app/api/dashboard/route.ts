import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = new Date(now.toISOString().split("T")[0]);

  const [
    pending, inProgress, todayCount, customers, mechanics,
    monthlyRevenue, completedMonth, lowStock,
  ] = await Promise.all([
    prisma.appointment.count({ where: { status: "Pending" } }),
    prisma.appointment.count({ where: { status: "InProgress" } }),
    prisma.appointment.count({ where: { appointmentDate: today } }),
    prisma.user.count({ where: { role: "Customer", status: "Active" } }),
    prisma.user.count({ where: { role: "Mechanic", status: "Active" } }),
    prisma.appointment.aggregate({
      where: { status: "Completed", appointmentDate: { gte: startOfMonth } },
      _sum: { finalCost: true },
    }),
    prisma.appointment.count({ where: { status: "Completed", appointmentDate: { gte: startOfMonth } } }),
    prisma.inventoryPart.count({ where: { status: "Active", quantityInStock: { lte: 10 } } }),
  ]);

  return NextResponse.json({
    pending, inProgress, todayCount, customers, mechanics,
    monthlyRevenue: monthlyRevenue._sum.finalCost ?? 0,
    completedMonth, lowStock,
  });
}
