import bcrypt from "bcryptjs";
import { MatchRequestStatus, PrismaClient, RequestInitiator, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

async function upsertSkill(name: string) {
  return prisma.skill.upsert({
    where: { name },
    update: {},
    create: { name }
  });
}

async function main() {
  await prisma.session.deleteMany();
  await prisma.serviceHourForm.deleteMany();
  await prisma.matchRequest.deleteMany();
  await prisma.application.deleteMany();
  await prisma.match.deleteMany();
  await prisma.studentSkill.deleteMany();
  await prisma.opportunitySkill.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.orgProfile.deleteMany();
  await prisma.user.deleteMany();

  const speaking = await upsertSkill("public speaking");
  const entertainer = await upsertSkill("entertainer");
  const music = await upsertSkill("music");
  const conversation = await upsertSkill("conversation");

  const studentUser = await prisma.user.create({
    data: {
      email: "student1@example.com",
      passwordHash: await hashPassword("studentpass123"),
      role: UserRole.STUDENT,
      student: {
        create: {
          fullName: "Maya Brooks",
          school: "Desert Ridge High",
          zipCode: "85004",
          city: "Phoenix",
          state: "AZ",
          lat: 33.451,
          lng: -112.073,
          maxDistanceKm: 20,
          availability: "Tue 16:00-18:00; Sat 10:00-12:00",
          personalStatement: "I enjoy speaking with older adults and leading social activities.",
          letterOfRecUrl: "https://example.org/letters/maya-brooks.pdf",
          programAffiliation: "National Honor Society",
          parentConsent: true,
          phone: "602-555-0101"
        }
      }
    },
    include: {
      student: true
    }
  });

  const studentUser2 = await prisma.user.create({
    data: {
      email: "student2@example.com",
      passwordHash: await hashPassword("studentpass123"),
      role: UserRole.STUDENT,
      student: {
        create: {
          fullName: "Jordan Patel",
          school: "Central High",
          zipCode: "85008",
          city: "Phoenix",
          state: "AZ",
          lat: 33.467,
          lng: -111.99,
          maxDistanceKm: 18,
          availability: "Wed 15:00-17:00; Sat 10:00-12:00",
          personalStatement: "I like music sessions and one-on-one conversations.",
          programAffiliation: "Student Council",
          parentConsent: true,
          phone: "602-555-0142"
        }
      }
    },
    include: {
      student: true
    }
  });

  const orgUser1 = await prisma.user.create({
    data: {
      email: "sunrise-home@example.com",
      passwordHash: await hashPassword("orgpass123"),
      role: UserRole.ORG,
      org: {
        create: {
          organization: "Sunrise Senior Home",
          category: "Senior Home",
          zipCode: "85006",
          city: "Phoenix",
          state: "AZ",
          lat: 33.465,
          lng: -112.048,
          description: "Weekly social events and conversation circles.",
          contactName: "Alicia Reynolds",
          contactEmail: "volunteers@sunrisehome.org",
          contactPhone: "602-555-0188",
          websiteUrl: "https://sunrisehome.org",
          volunteerNotes: "Best fit for students comfortable with small-group facilitation."
        }
      }
    },
    include: { org: true }
  });

  const orgUser2 = await prisma.user.create({
    data: {
      email: "oakview-home@example.com",
      passwordHash: await hashPassword("orgpass123"),
      role: UserRole.ORG,
      org: {
        create: {
          organization: "Oakview Senior Residence",
          category: "Senior Home",
          zipCode: "85201",
          city: "Mesa",
          state: "AZ",
          lat: 33.432,
          lng: -111.94,
          description: "Arts, music, and memory-support engagement sessions.",
          contactName: "Marcus Lee",
          contactEmail: "programs@oakviewresidence.org",
          contactPhone: "480-555-0117",
          websiteUrl: "https://oakviewresidence.org",
          volunteerNotes: "Musical and entertaining students are a strong fit."
        }
      }
    },
    include: { org: true }
  });

  if (!studentUser.student || !studentUser2.student || !orgUser1.org || !orgUser2.org) {
    throw new Error("Expected seed entities were not created");
  }

  await prisma.studentSkill.createMany({
    data: [
      { studentId: studentUser.student.id, skillId: speaking.id },
      { studentId: studentUser.student.id, skillId: entertainer.id },
      { studentId: studentUser.student.id, skillId: conversation.id },
      { studentId: studentUser2.student.id, skillId: music.id },
      { studentId: studentUser2.student.id, skillId: conversation.id }
    ]
  });

  const opp1 = await prisma.opportunity.create({
    data: {
      orgProfileId: orgUser1.org.id,
      title: "Conversation & Story Hour",
      description: "Lead group storytelling and conversational sessions with residents.",
      requiredCommitment: "2 hours/week",
      availability: "Tue 16:00-18:00",
      contactEmail: orgUser1.org.contactEmail,
      contactPhone: orgUser1.org.contactPhone,
      radiusKm: 15
    }
  });

  const opp2 = await prisma.opportunity.create({
    data: {
      orgProfileId: orgUser2.org.id,
      title: "Music & Entertainment Volunteer",
      description: "Bring music, games, and uplifting entertainment to residents.",
      requiredCommitment: "One-time event",
      availability: "Sat 10:00-12:00",
      contactEmail: orgUser2.org.contactEmail,
      contactPhone: orgUser2.org.contactPhone,
      radiusKm: 25
    }
  });

  await prisma.opportunitySkill.createMany({
    data: [
      { opportunityId: opp1.id, skillId: speaking.id, required: true },
      { opportunityId: opp1.id, skillId: conversation.id, required: true },
      { opportunityId: opp2.id, skillId: entertainer.id, required: true },
      { opportunityId: opp2.id, skillId: music.id, required: false }
    ]
  });

  const acceptedRequest = await prisma.matchRequest.create({
    data: {
      studentId: studentUser.student.id,
      orgProfileId: orgUser1.org.id,
      opportunityId: opp1.id,
      initiatedBy: RequestInitiator.STUDENT,
      status: MatchRequestStatus.ACCEPTED,
      message: "I would love to help with conversation circles.",
      respondedAt: new Date()
    }
  });

  await prisma.matchRequest.create({
    data: {
      studentId: studentUser2.student.id,
      orgProfileId: orgUser2.org.id,
      opportunityId: opp2.id,
      initiatedBy: RequestInitiator.ORG,
      status: MatchRequestStatus.PENDING,
      message: "Your music background is a strong fit."
    }
  });

  await prisma.serviceHourForm.create({
    data: {
      matchRequestId: acceptedRequest.id,
      serviceDate: new Date("2026-02-21T17:00:00.000Z"),
      hoursCompleted: 2.5,
      activityNotes: "Led storytelling and resident conversation sessions.",
      filledByName: "Alicia Reynolds",
      studentName: studentUser.student.fullName,
      studentEmail: studentUser.email,
      orgName: orgUser1.org.organization,
      orgEmail: orgUser1.org.contactEmail,
      opportunity: opp1.title,
      generatedText:
        "Volunteer service completed for Conversation & Story Hour. Student Maya Brooks completed 2.5 hours."
    }
  });

  console.log("Seed complete", {
    demoAccounts: {
      student: "student1@example.com / studentpass123",
      org: "sunrise-home@example.com / orgpass123"
    },
    studentIds: [studentUser.student.id, studentUser2.student.id],
    opportunityIds: [opp1.id, opp2.id],
    seedMatchRequests: "1 accepted + 1 pending"
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
