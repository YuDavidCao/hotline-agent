-- CreateTable
CREATE TABLE "InboundCall" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "agentVersion" INTEGER NOT NULL,
    "agentName" TEXT NOT NULL,
    "retellVariables" JSONB NOT NULL,
    "startTime" BIGINT NOT NULL,
    "endTime" BIGINT NOT NULL,
    "duration" BIGINT NOT NULL,
    "transcript" JSONB NOT NULL,
    "recordingURL" TEXT NOT NULL,
    "disconnectionReason" TEXT NOT NULL,
    "fromNumber" TEXT NOT NULL,
    "toNumber" TEXT NOT NULL,
    "direction" TEXT NOT NULL,

    CONSTRAINT "InboundCall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InboundCall_callId_key" ON "InboundCall"("callId");
