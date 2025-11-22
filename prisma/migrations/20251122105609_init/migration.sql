/*
  Warnings:

  - You are about to drop the `Configuration` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."Configuration";

-- CreateTable
CREATE TABLE "bracelets" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "bracelet1ImageUrl" TEXT NOT NULL,
    "bracelet2ImageUrl" TEXT NOT NULL,
    "bracelet1Config" JSONB NOT NULL,
    "bracelet2Config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bracelets_pkey" PRIMARY KEY ("id")
);
