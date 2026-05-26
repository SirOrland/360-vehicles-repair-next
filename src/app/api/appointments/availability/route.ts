import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Slots per day of week (0=Sun … 6=Sat)
const SLOTS_BY_DOW = [0, 10, 10, 10, 10, 10, 7]; // Sun closed, Mon–Fri 10 slots, Sat 7 slots

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date"); // expects YYYY-MM-DD

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const [y, m, d] = date.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();

  // Sunday — closed entirely
  if (dow === 0) return NextResponse.json({ bookedTimes: [], fullyBooked: true });

  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T23:59:59.999Z`);

  const appointments = await prisma.appointment.findMany({
    where: {
      appointmentDate: { gte: start, lte: end },
      status: { not: "Cancelled" },
    },
    select: { appointmentTime: true },
  });

  const bookedTimes = appointments.map((a) => a.appointmentTime);
  const fullyBooked = bookedTimes.length >= SLOTS_BY_DOW[dow];

  return NextResponse.json({ bookedTimes, fullyBooked });
}
