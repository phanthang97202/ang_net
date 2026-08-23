-- Ho tro chuc nang binh luan bai viet: chan spam bao cao va them tham so nguong an tu dong.

-- Moi tai khoan chi duoc bao cao mot binh luan dung 1 lan. Khong co rang buoc nay
-- thi mot tai khoan bam bao cao N lan la du cham nguong, tu an duoc binh luan nguoi khac.
CREATE UNIQUE INDEX "UX_NewsReportComment_CommentId_UserId"
    ON "NewsReportComment" ("CommentId", "UserId");

-- Danh sach binh luan luon loc theo bai viet + trang thai
CREATE INDEX "IX_NewsComment_NewsId_Status"
    ON "NewsComment" ("NewsId", "Status");

-- So luot bao cao (tu cac tai khoan khac nhau) de mot binh luan bi an tu dong.
INSERT INTO "SysParameter" (
    "ParameterCode", "ParameterNameVi", "ParameterNameEn",
    "ParameterValueVi", "ParameterValueEn", "DefaultValueVi", "DefaultValueEn",
    "DataType", "Category", "DescriptionVi", "DescriptionEn",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES (
    'NEWS_COMMENT_REPORT_THRESHOLD',
    'Nguong bao cao an binh luan', 'Comment report auto-hide threshold',
    '3', '3', '3', '3',
    'int', 'News',
    'So luot bao cao tu cac tai khoan khac nhau de binh luan tu dong bi an',
    'Number of distinct reports required to auto-hide a comment',
    1, true, 'system', 'system', now(), now()
)
ON CONFLICT ("ParameterCode") DO NOTHING;
