-- CreateTable
CREATE TABLE "CronState" (
    "id" TEXT NOT NULL,
    "lastRanAt" TIMESTAMP(3),

    CONSTRAINT "CronState_pkey" PRIMARY KEY ("id")
);
