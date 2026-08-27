-- CreateTable
CREATE TABLE "staff_rotas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sundayHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mondayHours" DOUBLE PRECISION NOT NULL DEFAULT 7.5,
    "tuesdayHours" DOUBLE PRECISION NOT NULL DEFAULT 7.5,
    "wednesdayHours" DOUBLE PRECISION NOT NULL DEFAULT 7.5,
    "thursdayHours" DOUBLE PRECISION NOT NULL DEFAULT 7.5,
    "fridayHours" DOUBLE PRECISION NOT NULL DEFAULT 7.5,
    "saturdayHours" DOUBLE PRECISION NOT NULL DEFAULT 4,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_rotas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_rotas_userId_key" ON "staff_rotas"("userId");

-- AddForeignKey
ALTER TABLE "staff_rotas" ADD CONSTRAINT "staff_rotas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
