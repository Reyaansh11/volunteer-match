/**
 * One-time migration: update lat/lng for all existing student and org profiles
 * using real ZIP code centroids from the Zippopotam.us free API.
 *
 * Run with:   npx tsx scripts/fix-geocoding.ts
 * Requires:   DATABASE_URL in your environment (copy from .env.local)
 *
 * Safe to run multiple times — it just overwrites with the same correct values.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function lookupZip(zip: string): Promise<{ lat: number; lng: number } | null> {
  const safe = zip.replace(/\D/g, "").slice(0, 5).padStart(5, "0");
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${safe}`, {
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return null;
    const data = await res.json() as { places?: { latitude: string; longitude: string }[] };
    const place = data.places?.[0];
    if (place?.latitude && place?.longitude) {
      return { lat: parseFloat(place.latitude), lng: parseFloat(place.longitude) };
    }
  } catch {
    // timeout or network error
  }
  return null;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const students = await prisma.studentProfile.findMany({ select: { id: true, zipCode: true } });
  const orgs = await prisma.orgProfile.findMany({ select: { id: true, zipCode: true } });

  console.log(`Found ${students.length} students, ${orgs.length} orgs`);

  let fixed = 0;
  let failed = 0;

  for (const s of students) {
    const coords = await lookupZip(s.zipCode);
    if (coords) {
      await prisma.studentProfile.update({ where: { id: s.id }, data: coords });
      console.log(`  ✓ Student ${s.id} (${s.zipCode}) → ${coords.lat}, ${coords.lng}`);
      fixed++;
    } else {
      console.log(`  ✗ Student ${s.id} (${s.zipCode}) — lookup failed, skipped`);
      failed++;
    }
    await sleep(150); // stay well under free API rate limits
  }

  for (const o of orgs) {
    const coords = await lookupZip(o.zipCode);
    if (coords) {
      await prisma.orgProfile.update({ where: { id: o.id }, data: coords });
      console.log(`  ✓ Org ${o.id} (${o.zipCode}) → ${coords.lat}, ${coords.lng}`);
      fixed++;
    } else {
      console.log(`  ✗ Org ${o.id} (${o.zipCode}) — lookup failed, skipped`);
      failed++;
    }
    await sleep(150);
  }

  console.log(`\nDone: ${fixed} updated, ${failed} failed`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
