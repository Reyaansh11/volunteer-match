import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

export async function requireRole(role: UserRole) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== role) {
    redirect(user.role === UserRole.STUDENT ? "/dashboard/student" : "/dashboard/org");
  }
  return user;
}
