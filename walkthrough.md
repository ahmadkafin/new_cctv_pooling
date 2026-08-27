# Migration & Fix Walkthrough: Sequelize CCTV Pooling Backend

The backend has been transitioned from Prisma to **Sequelize ORM**, obsolete files and dependencies have been purged, and the MediaMTX recording webhook, playback, camera management, and retention cleanup logic have been updated.

## Key Changes Made

### 1. Prisma Clean Removal
- **Deleted**:
  - `prisma/` directory (`schema.prisma`, migrations)
  - `prisma.config.ts`
  - `app/config/prisma.js`
- **Updated `package.json` & `package-lock.json`**: Removed `prisma` CLI and dependencies (`npm prune`).
- **Updated `dockerfile`**: Replaced Prisma generate and migration steps with a clean Node.js runner container.
- **Updated `.env`**: Cleaned up Prisma comments and standardized PostgreSQL dialect and connection parameters.

---

### 2. Sequelize Configuration & Models
- **[sequelize.js](file:///Users/user/development/Codes/JavaScript/new_api_pooling/app/config/sequelize.js)**: Configured Sequelize connection options with pool settings and support for `DATABASE_URL` or individual environment variables (`PGSQL_HOST`, `PGSQL_USER`, `PGSQL_PASS`, `PGSQL_DB`, `PGSQL_PORT`, `PGSQL_SCHEMA`).
- **[index.js](file:///Users/user/development/Codes/JavaScript/new_api_pooling/app/models/index.js)**: Configured Sequelize connection initialization, dialect settings, model registration, and associations.
- **[Camera.model.js](file:///Users/user/development/Codes/JavaScript/new_api_pooling/app/models/Camera.model.js)**:
  - UUID `id` primary key
  - Unique `name`, `location`, `rtsp_url` (`rtspUrl`)
  - 1-to-many relationship with `RecordingChunks` (`as: 'recordings'`)
  - Integrated `sequelize-paginate`
- **[RecordingChunks.model.js](file:///Users/user/development/Codes/JavaScript/new_api_pooling/app/models/RecordingChunks.model.js)**:
  - UUID `id` primary key
  - `camera_id` (`cameraId`), `file_path` (`filePath` unique), `file_name` (`fileName`), `file_size` (`fileSize` BIGINT), `start_time` (`startTime` DATE)
  - Composite index on `(camera_id, start_time)`
  - Belongs-to relationship with `Camera` (`as: 'camera'`)

---

### 3. MediaMTX Webhooks, Recording Service & Controllers
- **[recording.controller.js](file:///Users/user/development/Codes/JavaScript/new_api_pooling/app/controllers/recording.controller.js)**:
  - **Fixed critical bug**: Inverted condition `if (filePath)` was rejecting requests where `filePath` was provided. Fixed to `if (!filePath)`.
  - Flexible parameter extraction matching MediaMTX hooks (`path`, `name`, `file`, `filePath`, `segmentPath`, `size`, `time`).
  - Safe file stat reading (`fs.statSync`) with error handling.
  - Formats responses to handle BigInt `fileSize` and string IDs without serialization issues.
- **[recording.service.js](file:///Users/user/development/Codes/JavaScript/new_api_pooling/app/services/recording.service.js)**:
  - Fixed typo `deafults` -> `defaults`.
  - Fixed model attribute mismatches (`cameraid` -> `cameraId`, `start_time` -> `startTime`).
  - Returns actual created chunk records instead of boolean.
  - Implemented `saveChunk`, `getRecordingsByDate`, `getAllCameras`, and `cleanOldRecordings`.
- **[recording.routes.js](file:///Users/user/development/Codes/JavaScript/new_api_pooling/app/routes/recording.routes.js)**:
  - `POST /webhooks/segment-created` - Ingestion webhook for MediaMTX
  - `GET /recordings/:cameraName?date=YYYY-MM-DD` & `GET /:cameraName?date=YYYY-MM-DD` - Playback queries
  - `GET /cameras` - Camera list with recording counts
- **[cleanup.job.js](file:///Users/user/development/Codes/JavaScript/new_api_pooling/app/jobs/cleanup.job.js)**:
  - Automated retention cron job using `node-cron` to purge recordings and files older than `RETENTION_DAYS` (default 7 days).

---

### 4. Server & Application Initialization
- **[app.js](file:///Users/user/development/Codes/JavaScript/new_api_pooling/app.js)**: Enabled `cors()`, static file hosting for recordings under `/recordings`, and JSON payload parsing up to 100MB.
- **[server.js](file:///Users/user/development/Codes/JavaScript/new_api_pooling/server.js)**: Authenticates with Sequelize, synchronizes tables (`db.sequelize.sync({ alter: true })`), starts the retention job, and includes graceful shutdown handlers (`SIGINT`/`SIGTERM`).

---

## API Summary

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/webhooks/segment-created` | Webhook called by MediaMTX when a recording chunk/segment completes |
| `GET` | `/recordings/:cameraName?date=YYYY-MM-DD` | Returns all recording segments for a camera on a specific date |
| `GET` | `/:cameraName?date=YYYY-MM-DD` | Alias route for daily playback queries |
| `GET` | `/cameras` | Returns all pooled cameras and recording counts |
| `GET` | `/recordings/*` | Static file serving for recording segments |
| `GET` | `/` | Health check endpoint |

---

## Example MediaMTX Configuration (`mediamtx.yml`)

To hook MediaMTX segment recordings directly into this backend:

```yaml
paths:
  all_others:
    record: yes
    recordPath: ./recordings/%path/%Y-%m-%d_%H-%M-%S-%f.mp4
    recordFormat: fmp4
    recordPartDuration: 1s
    recordSegmentDuration: 60s
    runOnRecordSegmentComplete: curl -s -X POST http://localhost:3002/webhooks/segment-created -H "Content-Type: application/json" -d '{"path":"$MTX_PATH","file":"$MTX_SEGMENT_PATH"}'
```

---

## Verification Results

- **Syntax Verification**: Passed across all JavaScript source files (`node -c`).
- **Sequelize Models & Associations**: Verified `Camera` <-> `RecordingChunks` 1-to-many associations.
- **Controller Validation & Routing**: Verified 400 validations for missing `filePath` and invalid date formats.
- **Dependency Cleanliness**: Confirmed 0 remaining Prisma imports or configuration artifacts.
