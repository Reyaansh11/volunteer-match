/*
  Warnings:

  - Made the column `activityNotes` on table `ServiceHourForm` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "OrgProfile" ADD COLUMN     "contactTitle" TEXT;

-- AlterTable
ALTER TABLE "ServiceHourForm" ADD COLUMN     "filledByTitle" TEXT,
ADD COLUMN     "generatedPdf" BYTEA,
ADD COLUMN     "orgPhone" TEXT,
ADD COLUMN     "supervisorSignedAt" TIMESTAMP(3),
ALTER COLUMN "activityNotes" SET NOT NULL;
