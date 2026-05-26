import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.user.update({
      where: { email },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    await sendMail(
      email,
      "Reset your 360 Vehicles Repair password",
      `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:2rem;">
        <h2 style="color:#1a1a2e;margin-bottom:0.5rem;">Password Reset Request</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>You requested to reset your password. Click the button below — this link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}"
          style="display:inline-block;background:#e63946;color:white;padding:12px 28px;border-radius:4px;text-decoration:none;font-weight:700;margin:1.25rem 0;">
          Reset Password
        </a>
        <p style="color:#666;font-size:0.85rem;">If you didn't request this, you can safely ignore this email.</p>
        <p style="color:#666;font-size:0.85rem;word-break:break-all;">Or copy this link: ${resetUrl}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:1.5rem 0;" />
        <p style="color:#888;font-size:0.8rem;">360 Vehicles Repair &mdash; Your Trusted Auto Service Center</p>
      </div>
      `
    );
  }

  // Always return success to avoid email enumeration
  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      password: hashed,
      resetToken: null,
      resetTokenExpiry: null,
      failedAttempts: 0,
      lockedUntil: null,
    } as any,
  });

  return NextResponse.json({ success: true });
}
