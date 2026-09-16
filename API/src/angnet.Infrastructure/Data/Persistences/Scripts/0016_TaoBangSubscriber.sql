-- Bang luu email dang ky nhan bai viet moi.
--
-- Truoc day khoi "Dang ky" ngoai trang chu chi co giao dien: component goi
-- setTimeout roi bao "Dang ky thanh cong", toan bo phan goi API bi comment lai.
-- Nguoi doc nhap email va tin la da dang ky, nhung email bay vao hu khong.

CREATE TABLE "Subscriber" (
    "SubscriberId" text NOT NULL,
    "Email" character varying(256) NOT NULL,
    "UnsubscribeToken" character varying(64) NOT NULL,
    "UnsubscribedDTime" timestamp with time zone NULL,
    "FlagActive" boolean NOT NULL DEFAULT true,
    "CreatedBy" text NOT NULL DEFAULT '',
    "UpdatedBy" text NOT NULL DEFAULT '',
    "CreatedDTime" timestamp with time zone NOT NULL,
    "UpdatedDTime" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Subscriber" PRIMARY KEY ("SubscriberId")
);

-- Chan trung email ngay o DB thay vi chi kiem tra trong code: hai request dang ky
-- cung luc cung mot email deu thay "chua ton tai" roi cung ghi vao.
CREATE UNIQUE INDEX "IX_Subscriber_Email" ON "Subscriber" ("Email");

-- Link huy dang ky trong mail tra cuu theo token nay.
CREATE INDEX "IX_Subscriber_UnsubscribeToken" ON "Subscriber" ("UnsubscribeToken");
