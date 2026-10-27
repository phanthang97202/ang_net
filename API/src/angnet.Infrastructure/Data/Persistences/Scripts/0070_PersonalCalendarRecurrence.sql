ALTER TABLE "PersonalCalendarEvent" ADD COLUMN "RepeatDays" integer NOT NULL DEFAULT 0;
ALTER TABLE "PersonalCalendarEvent" ADD COLUMN "RepeatUntil" date NULL;

CREATE INDEX "IX_PersonalCalendarEvent_OwnerId_RepeatUntil" ON "PersonalCalendarEvent" ("OwnerId", "RepeatUntil") WHERE "RepeatDays" <> 0;
