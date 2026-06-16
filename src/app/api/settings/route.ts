import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULTS: Record<string, string> = {
  shop_name: "360 Vehicles Repair",
  shop_address: "Al Sawari 9 St - Musaffah - M13 - Abu Dhabi - United Arab Emirates",
  shop_phone: "",
  shop_email: "technicalservices.360serv@outlook.com",
  vat_rate: "5",
  trn_number: "104902025600001",
};

export async function GET() {
  const rows = await prisma.systemSetting.findMany();
  const map: Record<string, string> = { ...DEFAULTS };
  for (const r of rows) {
    if (r.settingValue !== null) map[r.settingKey] = r.settingValue;
  }
  return NextResponse.json(map);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const allowed = Object.keys(DEFAULTS);

  for (const key of allowed) {
    if (key in body) {
      await prisma.systemSetting.upsert({
        where: { settingKey: key },
        update: { settingValue: String(body[key]) },
        create: { settingKey: key, settingValue: String(body[key]) },
      });
    }
  }

  return NextResponse.json({ success: true });
}
