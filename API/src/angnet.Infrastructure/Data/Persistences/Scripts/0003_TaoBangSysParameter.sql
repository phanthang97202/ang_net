-- Bang tham so he thong. Dung chung toan he thong (khong theo tenant).
-- ParameterCode lam khoa chinh, giong cach MstPaymentType / MstStadiumStatus dang lam.
-- Cac cot cuoi la metadata ke thua tu BaseModel.
CREATE TABLE "SysParameter" (
    "ParameterCode" text NOT NULL,
    "ParameterNameVi" text NOT NULL,
    "ParameterNameEn" text NOT NULL,
    "ParameterValueVi" text NOT NULL,
    "ParameterValueEn" text NOT NULL,
    "DefaultValueVi" text NOT NULL,
    "DefaultValueEn" text NOT NULL,
    "DataType" text NOT NULL,
    "Category" text NOT NULL,
    "DescriptionVi" text NOT NULL,
    "DescriptionEn" text NOT NULL,
    "SortOrder" integer NOT NULL,
    "FlagActive" boolean NOT NULL,
    "CreatedBy" text NOT NULL,
    "UpdatedBy" text NOT NULL,
    "CreatedDTime" timestamp with time zone NOT NULL,
    "UpdatedDTime" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_SysParameter" PRIMARY KEY ("ParameterCode")
);
