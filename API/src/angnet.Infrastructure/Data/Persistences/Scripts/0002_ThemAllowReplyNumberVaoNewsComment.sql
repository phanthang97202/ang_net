-- NewsCommentModel.AllowReplyNumber da co trong model tu truoc nhung chua migration nao tao cot nay,
-- nen DB dang thieu. Default 1 khop voi gia tri khoi tao trong model.
ALTER TABLE "NewsComment" ADD COLUMN "AllowReplyNumber" integer NOT NULL DEFAULT 1;
