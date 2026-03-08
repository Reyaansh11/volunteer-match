import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const PROTECTED_STUDENT_NAME = "reyaansh tomar";
const DEMO_STUDENT_NAMES = ["Maya Brooks", "Jordan Patel"];
const DEMO_STUDENT_EMAILS = ["student1@example.com", "student2@example.com"];
const DEMO_OPPORTUNITY_TITLES = ["Conversation & Story Hour", "Music & Entertainment Volunteer"];
const DEMO_ORG_NAMES = ["Sunrise Senior Home", "Oakview Senior Residence"];
const DEMO_ORG_EMAILS = ["sunrise-home@example.com", "oakview-home@example.com"];

async function main() {
  const reyaanshStudents = await prisma.studentProfile.findMany({
    where: {
      fullName: {
        equals: PROTECTED_STUDENT_NAME,
        mode: "insensitive"
      }
    },
    select: { id: true, fullName: true, userId: true },
    orderBy: { id: "asc" }
  });

  const keptReyaansh = reyaanshStudents[0] ?? null;
  const protectedUserIds = keptReyaansh ? [keptReyaansh.userId] : [];
  const duplicateReyaanshUserIds = reyaanshStudents.slice(1).map((student) => student.userId);

  const deletedOpportunities = await prisma.opportunity.deleteMany({
    where: {
      OR: [
        { title: { in: DEMO_OPPORTUNITY_TITLES } },
        { title: { contains: "test", mode: "insensitive" } },
        { title: { contains: "demo", mode: "insensitive" } },
        { orgProfile: { organization: { in: DEMO_ORG_NAMES } } },
        { orgProfile: { organization: { contains: "test", mode: "insensitive" } } },
        { orgProfile: { organization: { contains: "demo", mode: "insensitive" } } }
      ]
    }
  });

  const deletedStudentUsers = await prisma.user.deleteMany({
    where: {
      role: UserRole.STUDENT,
      id: { notIn: protectedUserIds },
      OR: [
        { id: { in: duplicateReyaanshUserIds } },
        { email: { in: DEMO_STUDENT_EMAILS } },
        { email: { contains: "example.com", mode: "insensitive" } },
        { email: { contains: "test", mode: "insensitive" } },
        { email: { contains: "demo", mode: "insensitive" } },
        {
          student: {
            fullName: { in: DEMO_STUDENT_NAMES }
          }
        },
        {
          student: {
            fullName: { contains: "test", mode: "insensitive" }
          }
        },
        {
          student: {
            fullName: { contains: "demo", mode: "insensitive" }
          }
        }
      ]
    }
  });

  const deletedOrgUsers = await prisma.user.deleteMany({
    where: {
      role: UserRole.ORG,
      OR: [
        { email: { in: DEMO_ORG_EMAILS } },
        { email: { contains: "example.com", mode: "insensitive" } },
        { email: { contains: "test", mode: "insensitive" } },
        { email: { contains: "demo", mode: "insensitive" } },
        {
          org: {
            organization: { in: DEMO_ORG_NAMES }
          }
        },
        {
          org: {
            organization: { contains: "test", mode: "insensitive" }
          }
        },
        {
          org: {
            organization: { contains: "demo", mode: "insensitive" }
          }
        }
      ]
    }
  });

  const remainingStudents = await prisma.studentProfile.findMany({
    where: {
      fullName: {
        equals: PROTECTED_STUDENT_NAME,
        mode: "insensitive"
      }
    },
    select: {
      id: true,
      fullName: true,
      user: {
        select: {
          email: true
        }
      }
    }
  });

  console.log("Cleanup complete");
  console.log({
    deletedOpportunities: deletedOpportunities.count,
    deletedStudentUsers: deletedStudentUsers.count,
    deletedOrgUsers: deletedOrgUsers.count,
    preservedStudents: remainingStudents
  });
}

main()
  .catch((error) => {
    console.error("Cleanup failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
