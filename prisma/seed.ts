import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@360vehicles.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@360vehicles.com",
      password: adminPassword,
      contact: "1234567890",
      role: "Admin",
      status: "Active",
    },
  });

  const services = [
    { serviceName: "Oil Change", description: "Complete oil and filter change service", estimatedDuration: 30, basePrice: 49.99 },
    { serviceName: "Brake Inspection", description: "Comprehensive brake system inspection", estimatedDuration: 45, basePrice: 79.99 },
    { serviceName: "Tire Rotation", description: "Rotate and balance all four tires", estimatedDuration: 30, basePrice: 39.99 },
    { serviceName: "Engine Diagnostic", description: "Computer diagnostic scan and analysis", estimatedDuration: 60, basePrice: 89.99 },
    { serviceName: "Battery Replacement", description: "Battery testing and replacement", estimatedDuration: 30, basePrice: 129.99 },
    { serviceName: "Transmission Service", description: "Transmission fluid change and inspection", estimatedDuration: 90, basePrice: 149.99 },
    { serviceName: "Air Conditioning Service", description: "AC system inspection and recharge", estimatedDuration: 60, basePrice: 99.99 },
    { serviceName: "Wheel Alignment", description: "Four-wheel alignment service", estimatedDuration: 60, basePrice: 89.99 },
    { serviceName: "Brake Pad Replacement", description: "Replace brake pads and resurface rotors", estimatedDuration: 120, basePrice: 199.99 },
    { serviceName: "General Inspection", description: "Complete vehicle safety inspection", estimatedDuration: 45, basePrice: 59.99 },
  ];

  for (const svc of services) {
    await prisma.service.upsert({
      where: { id: services.indexOf(svc) + 1 },
      update: {},
      create: svc,
    });
  }

  const settings = [
    { settingKey: "shop_name", settingValue: "360 Vehicles Mechanic Repair LLC", description: "Shop name" },
    { settingKey: "shop_email", settingValue: "technicalservices.360serv@outlook.com", description: "Shop contact email" },
    { settingKey: "shop_phone", settingValue: "", description: "Shop contact phone" },
    { settingKey: "shop_address", settingValue: "Al Sawari 9 St - Musaffah - M13 - Abu Dhabi - United Arab Emirates", description: "Shop physical address" },
    { settingKey: "business_hours", settingValue: "Mon-Fri: 8AM-6PM, Sat: 9AM-4PM, Sun: Closed", description: "Business operating hours" },
    { settingKey: "low_stock_threshold", settingValue: "10", description: "Alert threshold for low stock" },
    { settingKey: "appointment_buffer", settingValue: "30", description: "Minutes between appointments" },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { settingKey: setting.settingKey },
      update: {},
      create: setting,
    });
  }

  console.log("Database seeded successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
