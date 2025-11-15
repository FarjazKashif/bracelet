-- CreateEnum
CREATE TYPE "Shape" AS ENUM ('Round', 'Square', 'Diamond');

-- CreateEnum
CREATE TYPE "Color" AS ENUM ('FFB6C1', 'B19CD9', 'AEEEEE', 'FFD700', 'FF6F61', 'E0BBE4', '98FB98', 'F5DEB3', 'C0C0C0', '000000');

-- CreateEnum
CREATE TYPE "Material" AS ENUM ('Rubber', 'Thread');

-- CreateEnum
CREATE TYPE "Pendant" AS ENUM ('Knot', 'Heart');

-- CreateTable
CREATE TABLE "Configuration" (
    "id" SERIAL NOT NULL,
    "shape" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "pendant" TEXT NOT NULL,

    CONSTRAINT "Configuration_pkey" PRIMARY KEY ("id")
);
