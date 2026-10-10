CREATE TABLE "ChatImage" (
    "MessageId" text PRIMARY KEY REFERENCES "Chat" ("MessageId") ON DELETE CASCADE,
    "ContentType" character varying(32) NOT NULL,
    "Data" bytea NOT NULL,
    CONSTRAINT "CK_ChatImage_Size" CHECK (octet_length("Data") > 0 AND octet_length("Data") < 2097152)
);
