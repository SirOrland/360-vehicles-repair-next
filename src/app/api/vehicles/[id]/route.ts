import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const vehicle = await prisma.vehicle.update({
    where: { id: parseInt(id) },
    data: {
      brand: body.brand,
      model: body.model,
      year: body.year ? parseInt(body.year) : null,
      plateNo: body.plateNo,
      vin: body.vin,
      color: body.color,
    },
  });
  return NextResponse.json(vehicle);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.vehicle.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
