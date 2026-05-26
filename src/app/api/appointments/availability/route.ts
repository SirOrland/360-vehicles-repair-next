import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TOTAL_SLOTS = 10; // matches the TIMES array in the booking page

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date"); // expects YYYY-MM-DD

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

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
  const fullyBooked = bookedTimes.length >= TOTAL_SLOTS;

  return NextResponse.json({ bookedTimes, fullyBooked });
}
