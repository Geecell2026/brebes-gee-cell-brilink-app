import { db } from "@/lib/db";

const SETTINGS_ID = "singleton";

export async function getAppSettings() {
  try {
    return await db.appSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: { id: SETTINGS_ID },
    });
  } catch {
    const existing = await db.appSettings.findUnique({ where: { id: SETTINGS_ID } });
    if (existing) return existing;
    throw new Error("Gagal membuat/mengambil AppSettings");
  }
}
