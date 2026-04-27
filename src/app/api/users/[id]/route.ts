import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const isOwnProfile = session.user.id === id;
  const isAdmin = session.user.role === "Admin";

  if (!isOwnProfile && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (body.name) data.name = body.name;
  if (body.contact !== undefined) data.contact = body.contact;
  if (isAdmin && body.status) data.status = body.status;
  if (isAdmin && body.role) data.role = body.role;
  if (body.password) data.password = await bcrypt.hash(body.password, 12);

  const user = await prisma.user.update({
    where: { id: parseInt(id) },
    data,
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  return NextResponse.json(user);
}
