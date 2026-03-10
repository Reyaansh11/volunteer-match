import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();
const TARGET_NAME = "reyaansh tomar";

async function main() {
  const matches = await prisma.studentProfile.findMany({
    where: {
      fullName: {
        equals: TARGET_NAME,
        mode: "insensitive"
      }
    },
    select: {
      id: true,
      fullName: true,
      userId: true,
      user: {
        select: {
          email: true
        }
      }
    },
    orderBy: {
      id: "asc"
    }
  });

  if (matches.length === 0) {
    throw new Error("No student named 'Reyaansh Tomar' found. Aborting destructive cleanup.");
  }

  const keeper = matches[0];

  const deletedOpportunities = await prisma.opportunity.deleteMany({});

  const deletedOrgUsers = await prisma.user.deleteMany({
    where: {
      role: UserRole.ORG
    }
  });

  const deletedStudentUsers = await prisma.user.deleteMany({
    where: {
      role: UserRole.STUDENT,
      id: {
        not: keeper.userId
      }
    }
  });

  const remainingStudents = await prisma.studentProfile.findMany({
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

  const remainingOrgs = await prisma.orgProfile.count();
  const remainingOpportunities = await prisma.opportunity.count();

  console.log("Prune complete");
  console.log({
    keptStudent: keeper,
    deletedOpportunities: deletedOpportunities.count,
    deletedOrgUsers: deletedOrgUsers.count,
    deletedStudentUsers: deletedStudentUsers.count,
    remainingStudents,
    remainingOrgs,
    remainingOpportunities
  });
}

main()
  .catch((error) => {
    console.error("Prune failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
