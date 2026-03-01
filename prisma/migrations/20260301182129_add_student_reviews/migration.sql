-- CreateTable
CREATE TABLE "StudentReview" (
    "id" SERIAL NOT NULL,
    "matchRequestId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "orgProfileId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentReview_matchRequestId_key" ON "StudentReview"("matchRequestId");

-- AddForeignKey
ALTER TABLE "StudentReview" ADD CONSTRAINT "StudentReview_matchRequestId_fkey" FOREIGN KEY ("matchRequestId") REFERENCES "MatchRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentReview" ADD CONSTRAINT "StudentReview_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentReview" ADD CONSTRAINT "StudentReview_orgProfileId_fkey" FOREIGN KEY ("orgProfileId") REFERENCES "OrgProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
