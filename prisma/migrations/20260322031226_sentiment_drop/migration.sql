/*
  Warnings:

  - You are about to drop the column `sentimentScore` on the `InboundCall` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "InboundCall" DROP COLUMN "sentimentScore";
