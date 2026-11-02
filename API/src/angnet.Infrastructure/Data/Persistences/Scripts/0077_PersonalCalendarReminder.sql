-- Nhật ký giao nhận email nhắc lịch. Khóa chính (OwnerId, ReminderDate) đảm bảo
-- một tài khoản chỉ nhận tối đa một bản tổng hợp trong một ngày, kể cả khi
-- UptimeRobot gọi lại hoặc request trước bị timeout.
CREATE TABLE "PersonalCalendarReminderDelivery" (
  "OwnerId" text NOT NULL REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
  "ReminderDate" date NOT NULL,
  "Status" varchar(16) NOT NULL,
  "AttemptCount" integer NOT NULL,
  "LastError" varchar(2000) NULL,
  "ProviderMessageId" varchar(100) NULL,
  "CreatedAt" timestamp with time zone NOT NULL,
  "UpdatedAt" timestamp with time zone NOT NULL,
  "SentAt" timestamp with time zone NULL,
  CONSTRAINT "PK_PersonalCalendarReminderDelivery" PRIMARY KEY ("OwnerId", "ReminderDate")
);

CREATE INDEX "IX_PersonalCalendarReminderDelivery_Status_UpdatedAt"
  ON "PersonalCalendarReminderDelivery" ("Status", "UpdatedAt");

-- Thời gian được hiểu theo múi giờ Việt Nam. UptimeRobot chỉ đánh thức API;
-- backend luôn đọc hai tham số này trước khi quyết định có gửi hay không.
INSERT INTO "SysParameter" (
  "ParameterCode", "ParameterNameVi", "ParameterNameEn",
  "ParameterValueVi", "ParameterValueEn", "DefaultValueVi", "DefaultValueEn",
  "DataType", "Category", "DescriptionVi", "DescriptionEn",
  "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES
(
  'PERSONAL_CALENDAR_REMINDER_ENABLED',
  'Bật email nhắc lịch cá nhân', 'Enable personal calendar reminder email',
  'true', 'true', 'true', 'true',
  'bool', 'Calendar',
  'Bật hoặc tắt email tổng hợp lịch cần làm hằng ngày.',
  'Enable or disable the daily personal calendar digest email.',
  1, true, 'system', 'system', now(), now()
),
(
  'PERSONAL_CALENDAR_REMINDER_TIME',
  'Giờ gửi email nhắc lịch', 'Calendar reminder email time',
  '08:00', '08:00', '08:00', '08:00',
  'string', 'Calendar',
  'Giờ gửi theo giờ Việt Nam, định dạng HH:mm.',
  'Delivery time in Vietnam time, using HH:mm format.',
  2, true, 'system', 'system', now(), now()
)
ON CONFLICT ("ParameterCode") DO NOTHING;
