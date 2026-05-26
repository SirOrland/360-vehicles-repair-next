import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  if (searchParams.get("count") === "true") {
    const count = await prisma.notification.count({
      where: { userId: parseInt(session.user.id), isRead: false },
    });
    return NextResponse.json({ count });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: parseInt(session.user.id) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, markAll } = await req.json();

  if (markAll) {
    await prisma.notification.updateMany({
      where: { userId: parseInt(session.user.id) },
      data: { isRead: true },
    });
  } else if (id) {
    await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ success: true });
}
