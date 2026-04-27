import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const vehicles = await prisma.vehicle.findMany({
    where: session.user.role === "Customer" ? { userId } : {},
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(vehicles);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "Customer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { brand, model, year, plateNo, vin, color } = body;

  if (!brand || !model || !plateNo) {
    return NextResponse.json({ error: "Brand, model and plate number are required" }, { status: 400 });
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      userId: parseInt(session.user.id),
      brand, model,
      year: year ? parseInt(year) : null,
      plateNo, vin, color,
    },
  });

  return NextResponse.json(vehicle, { status: 201 });
}
