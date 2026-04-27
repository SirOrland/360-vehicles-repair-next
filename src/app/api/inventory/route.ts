import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter");

  const allParts = await prisma.inventoryPart.findMany({
    include: { supplier: { select: { supplierName: true } } },
    orderBy: { partName: "asc" },
  });

  const parts =
    filter === "low_stock"
      ? allParts.filter(
          (p) => p.status === "Active" && p.quantityInStock <= p.reorderLevel
        )
      : allParts;

  return NextResponse.json(parts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const part = await prisma.inventoryPart.create({ data: body });
  return NextResponse.json(part, { status: 201 });
}
