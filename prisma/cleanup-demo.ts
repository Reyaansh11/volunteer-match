import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const PROTECTED_STUDENT_NAME = "reyaansh tomar";
const DEMO_STUDENT_NAMES = ["Maya Brooks", "Jordan Patel"];
const DEMO_STUDENT_EMAILS = ["student1@example.com", "student2@example.com"];
const DEMO_OPPORTUNITY_TITLES = ["Conversation & Story Hour", "Music & Entertainment Volunteer"];

async function main() {
  const protectedStudents = await prisma.studentProfile.findMany({
    where: {
      fullName: {
        equals: PROTECTED_STUDENT_NAME,
        mode: "insensitive"
      }
    },
    select: { id: true, fullName: true, userId: true }
  });

  const protectedStudentIds = protectedStudents.map((student) => student.id);
  const protectedUserIds = protectedStudents.map((student) => student.userId);

  const deletedOpportunities = await prisma.opportunity.deleteMany({
    where: {
      OR: [
        { title: { in: DEMO_OPPORTUNITY_TITLES } },
        { orgProfile: { organization: { in: ["Sunrise Senior Home", "Oakview Senior Residence"] } } }
      ]
    }
  });

  const deletedUsers = await prisma.user.deleteMany({
    where: {
      role: UserRole.STUDENT,
      id: {
        notIn: protectedUserIds
      },
      OR: [
        { email: { in: DEMO_STUDENT_EMAILS } },
        { email: { contains: "test", mode: "insensitive" } },
        {
          student: {
            fullName: { in: DEMO_STUDENT_NAMES }
          }
        },
        {
          student: {
            fullName: { contains: "test", mode: "insensitive" }
          }
        }
      ]
    }
  });

  const remainingStudents = await prisma.studentProfile.findMany({
    where: {
      id: { in: protectedStudentIds }
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
    deletedStudentUsers: deletedUsers.count,
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
