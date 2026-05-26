import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ locked: false, attemptsLeft: 5 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = await prisma.user.findUnique({ where: { email } }) as any;
  if (!user) return NextResponse.json({ locked: false, attemptsLeft: 5 });

  const now = new Date();
  if (user.lockedUntil && user.lockedUntil > now) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60000);
    return NextResponse.json({ locked: true, minutesLeft });
  }

  const attemptsLeft = Math.max(0, 5 - (user.failedAttempts ?? 0));
  return NextResponse.json({ locked: false, attemptsLeft });
}
