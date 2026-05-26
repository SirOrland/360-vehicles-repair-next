import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email, otp } = await req.json();
  if (!email || !otp) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = await prisma.user.findUnique({ where: { email } }) as any;

  if (!user || user.otpCode !== String(otp)) {
    return NextResponse.json({ error: "Invalid code. Please try again." }, { status: 400 });
  }

  if (!user.otpExpiry || user.otpExpiry < new Date()) {
    return NextResponse.json({ error: "Code has expired. Please go back and login again." }, { status: 400 });
  }

  // Issue a short-lived verified token — NextAuth authorize will consume it
  const verifiedToken = crypto.randomBytes(32).toString("hex");
  const verifiedExpiry = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes

  await prisma.user.update({
    where: { id: user.id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { otpCode: null, otpExpiry: null, otpVerifiedToken: verifiedToken, otpVerifiedExpiry: verifiedExpiry } as any,
  });

  return NextResponse.json({ verifiedToken });
}
