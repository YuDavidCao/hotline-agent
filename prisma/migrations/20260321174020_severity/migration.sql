/*
  Warnings:

  - Added the required column `severity` to the `InboundCall` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InboundCall" ADD COLUMN     "severity" INTEGER NOT NULL;
