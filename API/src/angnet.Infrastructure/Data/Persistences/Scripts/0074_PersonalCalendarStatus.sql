-- Trang thai cong viec cua lich ca nhan: todo, in_progress, urgent, done, cancelled.
-- Su kien cu mac dinh "todo". Chuoi lap luu trang thai rieng cua tung buoi o bang
-- duoi; buoi chua doi rieng dung trang thai cua su kien.
ALTER TABLE "PersonalCalendarEvent" ADD COLUMN "Status" varchar(16) NOT NULL DEFAULT 'todo';

CREATE TABLE "PersonalCalendarOccurrenceStatus" (
  "EventId" varchar(36) NOT NULL REFERENCES "PersonalCalendarEvent" ("EventId") ON DELETE CASCADE,
  "OccurrenceDate" date NOT NULL,
  "Status" varchar(16) NOT NULL,
  "UpdatedAt" timestamptz NOT NULL,
  PRIMARY KEY ("EventId", "OccurrenceDate")
);
