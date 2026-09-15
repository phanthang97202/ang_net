-- Menu dieu huong ngoai trang chu. Truoc day khai cung trong navbar.component.ts
-- (mang listRoute), doi menu la phai sua code roi deploy lai.
--
-- Cau truc 2 cap, dung ParentId tu tham chieu: menu cha co ParentId = NULL, menu
-- con tro ve MenuId cua cha. Navbar chi ve toi 2 cap nen khong can sau hon.
--
-- TitleVi/TitleEn luu thang chu hien thi chu KHONG luu khoa i18n. Neu luu khoa
-- (T_TOOLS...) thi them menu moi van phai sua vi.json/en.json roi deploy - tuc la
-- van chua thuc su cau hinh duoc, dung muc dich cua bang nay.
--
-- Icon la ten icon cua ng-zorro (home, tool, play-circle...), khong phai duong dan.
CREATE TABLE "SysMenu" (
    "MenuId" text NOT NULL,
    "ParentId" text NULL,
    "TitleVi" text NOT NULL,
    "TitleEn" text NOT NULL,
    "Path" text NOT NULL,
    "Icon" text NOT NULL,
    "SortOrder" integer NOT NULL,
    "FlagActive" boolean NOT NULL,
    "CreatedBy" text NOT NULL,
    "UpdatedBy" text NOT NULL,
    "CreatedDTime" timestamp with time zone NOT NULL,
    "UpdatedDTime" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_SysMenu" PRIMARY KEY ("MenuId")
);

-- Xoa menu cha thi xoa luon menu con, khong de lai con mo coi khong bao gio hien ra.
ALTER TABLE "SysMenu"
    ADD CONSTRAINT "FK_SysMenu_SysMenu_ParentId"
    FOREIGN KEY ("ParentId") REFERENCES "SysMenu" ("MenuId") ON DELETE CASCADE;

-- Navbar luon doc theo cap cha/con roi den thu tu hien thi
CREATE INDEX "IX_SysMenu_ParentId_SortOrder" ON "SysMenu" ("ParentId", "SortOrder");
