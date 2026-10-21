ALTER TABLE "ReelMedia" ADD COLUMN "IsCloudinaryManaged" boolean NOT NULL DEFAULT false;

-- Giữ khả năng dọn các file đã tải lên trước khi có namespace theo user.
-- Các reel tạo sau migration chỉ được đánh dấu bởi server dựa trên owner.
-- dumdpgmgs là cloud của trình upload Reels cũ; link đến cloud ngoài không được nhận quản lý.
UPDATE "ReelMedia"
SET "IsCloudinaryManaged" = true
WHERE "MediaUrl" ~ '^https?://res[.]cloudinary[.]com/dumdpgmgs/(image|video)/upload/(v[0-9]+/)?reels/(image|video)/([A-Za-z0-9_-]+/)?[A-Za-z0-9_-]+([.][A-Za-z0-9]+)?([?].*)?$';
