import { UserRole } from "@prisma/client";
import { OrgOnboardingGuide } from "@/components/org-onboarding-guide";
import { requireRole } from "@/lib/guards";

export default async function OrgOnboardingPage() {
  await requireRole(UserRole.ORG);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <OrgOnboardingGuide closeHref="/dashboard/org" />
    </main>
  );
}
