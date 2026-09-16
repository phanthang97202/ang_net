-- Luu ket qua gui thu bao bai moi theo tung nguoi nhan.
-- Pending = da tao ban ghi va dang cho worker; Succeeded = SMTP da chap nhan;
-- Failed = khong dua duoc vao queue hoac da gui loi sau so lan thu toi da.

CREATE TABLE "EmailDelivery" (
    "DeliveryId" text NOT NULL,
    "NewsId" text NOT NULL,
    "SubscriberId" text NOT NULL,
    "Email" character varying(256) NOT NULL,
    "Status" character varying(20) NOT NULL DEFAULT 'Pending',
    "AttemptCount" integer NOT NULL DEFAULT 0,
    "LastError" character varying(2000) NULL,
    "SentAt" timestamp with time zone NULL,
    "FlagActive" boolean NOT NULL DEFAULT true,
    "CreatedBy" text NOT NULL DEFAULT '',
    "UpdatedBy" text NOT NULL DEFAULT '',
    "CreatedDTime" timestamp with time zone NOT NULL,
    "UpdatedDTime" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_EmailDelivery" PRIMARY KEY ("DeliveryId"),
    CONSTRAINT "FK_EmailDelivery_News_NewsId"
        FOREIGN KEY ("NewsId") REFERENCES "News" ("NewsId") ON DELETE CASCADE,
    CONSTRAINT "FK_EmailDelivery_Subscriber_SubscriberId"
        FOREIGN KEY ("SubscriberId") REFERENCES "Subscriber" ("SubscriberId") ON DELETE RESTRICT,
    CONSTRAINT "CK_EmailDelivery_Status"
        CHECK ("Status" IN ('Pending', 'Succeeded', 'Failed'))
);

CREATE UNIQUE INDEX "IX_EmailDelivery_NewsId_SubscriberId"
    ON "EmailDelivery" ("NewsId", "SubscriberId");

CREATE INDEX "IX_EmailDelivery_Status_CreatedDTime"
    ON "EmailDelivery" ("Status", "CreatedDTime" DESC);
