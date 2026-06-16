import { prisma } from "./prisma";

export const SETTING_DEFAULTS: Record<string, string> = {
  shop_name: "360 Vehicles Mechanic Repair LLC",
  shop_address: "Al Sawari 9 St - Musaffah - M13 - Abu Dhabi - United Arab Emirates",
  shop_phone: "",
  shop_email: "technicalservices.360serv@outlook.com",
  vat_rate: "5",
  trn_number: "104902025600001",
};

// Old seed placeholder values that should be replaced on first read
const STALE: Record<string, string> = {
  shop_email: "info@360vehicles.com",
  shop_address: "123 Main Street, City, State 12345",
  shop_phone: "(555) 123-4567",
};

export async function getShopSettings(): Promise<Record<string, string>> {
  // Replace stale seed placeholders with real values (runs once per key)
  for (const [key, staleValue] of Object.entries(STALE)) {
    await prisma.systemSetting.updateMany({
      where: { settingKey: key, settingValue: staleValue },
      data: { settingValue: SETTING_DEFAULTS[key] },
    });
  }

  const rows = await prisma.systemSetting.findMany({
    where: { settingKey: { in: Object.keys(SETTING_DEFAULTS) } },
  });

  const map: Record<string, string> = { ...SETTING_DEFAULTS };
  for (const r of rows) {
    if (r.settingValue !== null) map[r.settingKey] = r.settingValue;
  }
  return map;
}
