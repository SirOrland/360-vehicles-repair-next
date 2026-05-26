import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = await prisma.user.findUnique({ where: { email } }) as any;

  if (!user || user.status !== "Active") {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  // Lockout check
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return NextResponse.json({
      error: `Account locked. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.`,
    }, { status: 429 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    const newAttempts = (user.failedAttempts ?? 0) + 1;
    await prisma.user.update({
      where: { id: user.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        failedAttempts: newAttempts,
        ...(newAttempts >= 5 && { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) }),
      } as any,
    });

    if (newAttempts >= 5) {
      return NextResponse.json({ error: "Account locked for 15 minutes due to too many failed attempts." }, { status: 429 });
    }
    const attemptsLeft = 5 - newAttempts;
    return NextResponse.json({
      error: `Invalid email or password.${attemptsLeft <= 2 ? ` ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining.` : ""}`,
    }, { status: 401 });
  }

  // Correct password — generate 6-digit OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { failedAttempts: 0, lockedUntil: null, otpCode: otp, otpExpiry } as any,
  });

  await sendMail(
    email,
    "Your 360 Vehicles Repair login code",
    `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:2rem;">
      <h2 style="color:#1a1a2e;margin-bottom:0.5rem;">Login Verification Code</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>Use the code below to complete your login. It expires in <strong>10 minutes</strong>.</p>
      <div style="font-size:2.5rem;font-weight:900;letter-spacing:0.4em;color:#e63946;
                  text-align:center;padding:1.5rem;background:#f5f5f5;border-radius:8px;margin:1.5rem 0;">
        ${otp}
      </div>
      <p style="color:#666;font-size:0.85rem;">If you didn't try to log in, please
        <a href="${process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
          : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000"}/auth/reset-password" style="color:#e63946;">
        reset your password</a> immediately.</p>
    </div>
    `
  );

  return NextResponse.json({ success: true });
}
