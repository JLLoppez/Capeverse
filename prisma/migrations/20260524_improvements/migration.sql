-- Add follow-up tracking and booking conversion link to Enquiry
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "followUpDate" TIMESTAMP(3);
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "followUpNote" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "aiChatSummary" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "convertedToBookingId" TEXT;

-- Create TourAvailability table for date blocking and capacity management
CREATE TABLE IF NOT EXISTS "TourAvailability" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "blockedDate" DATE NOT NULL,
    "reason" TEXT,
    "maxCapacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TourAvailability_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TourAvailability_tourId_blockedDate_key" ON "TourAvailability"("tourId", "blockedDate");
CREATE INDEX IF NOT EXISTS "TourAvailability_tourId_idx" ON "TourAvailability"("tourId");
CREATE INDEX IF NOT EXISTS "TourAvailability_blockedDate_idx" ON "TourAvailability"("blockedDate");

ALTER TABLE "TourAvailability" ADD CONSTRAINT "TourAvailability_tourId_fkey"
    FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;
