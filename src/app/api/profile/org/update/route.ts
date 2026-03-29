import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { estimateLatLngFromZip, getCurrentUser, requireSameOrigin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function redirectWithNotice(request: Request, key: "error" | "success", value: string) {
  const url = new URL("/dashboard/org", request.url);
  url.searchParams.set(key, value);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "ORG" || !user.org) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const formData = await request.formData();
  const organization = String(formData.get("organization") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const zipCode = String(formData.get("zipCode") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const contactName = String(formData.get("contactName") || "").trim();
  const contactTitle = String(formData.get("contactTitle") || "").trim();
  const contactEmail = String(formData.get("contactEmail") || "").trim().toLowerCase();
  const contactPhone = String(formData.get("contactPhone") || "").trim();
  const websiteUrl = String(formData.get("websiteUrl") || "").trim();
  const volunteerNotes = String(formData.get("volunteerNotes") || "").trim();

  if (!organization || !zipCode || !contactName || !contactTitle || !contactEmail) {
    return redirectWithNotice(request, "error", "Please complete all required fields.");
  }

  const latLng = estimateLatLngFromZip(zipCode);

  try {
    await prisma.orgProfile.update({
      where: { id: user.org.id },
      data: {
        organization,
        category: category || "Community Program",
        zipCode,
        city: city || null,
        state: state || null,
        description: description || null,
        contactName,
        contactTitle,
        contactEmail,
        contactPhone: contactPhone || null,
        websiteUrl: websiteUrl || null,
        volunteerNotes: volunteerNotes || null,
        lat: latLng.lat,
        lng: latLng.lng
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return redirectWithNotice(request, "error", "Could not update profile right now.");
    }
    return redirectWithNotice(request, "error", "Unable to update profile.");
  }

  return redirectWithNotice(request, "success", "Profile updated.");
}
