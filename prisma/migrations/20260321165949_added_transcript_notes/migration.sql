/*
  Warnings:

  - Added the required column `notes` to the `InboundCall` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InboundCall" ADD COLUMN     "notes" JSONB NOT NULL;
