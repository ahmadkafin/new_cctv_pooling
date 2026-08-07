-- CreateTable
CREATE TABLE "Camera" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "rtspUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Camera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordingChunk" (
    "id" TEXT NOT NULL,
    "cameraId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecordingChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Camera_name_key" ON "Camera"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RecordingChunk_filePath_key" ON "RecordingChunk"("filePath");

-- CreateIndex
CREATE INDEX "RecordingChunk_cameraId_startTime_idx" ON "RecordingChunk"("cameraId", "startTime");

-- AddForeignKey
ALTER TABLE "RecordingChunk" ADD CONSTRAINT "RecordingChunk_cameraId_fkey" FOREIGN KEY ("cameraId") REFERENCES "Camera"("id") ON DELETE CASCADE ON UPDATE CASCADE;
