-- Chuyen nguyen menu dang khai cung trong navbar.component.ts (mang listRoute) vao
-- DB. Giu dung thu tu va dung chu hien thi hien tai, de sau khi deploy menu trong
-- nhin khong khac gi truoc - chi khac la tu day sua duoc bang man quan tri.
--
-- Chu hien thi lay tu vi.json/en.json theo dung khoa ma code cu dang dung:
--   Home -> T_HOME, Tools -> T_TOOLS, Reels -> T_REELS, Game -> T_GAME...
--
-- Muc /about co trong code nhung dang bi comment (route cung da an), nen KHONG seed.
-- Khi nao mo lai route thi them muc nay qua man quan tri, khong phai sua code.
INSERT INTO "SysMenu" (
    "MenuId", "ParentId", "TitleVi", "TitleEn", "Path", "Icon",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES
    ('home',    NULL, 'Trang chu', 'Home',  '/',       'home',        1, true, 'system', 'system', now(), now()),
    ('tools',   NULL, 'Cong cu',   'Tools', '',        'tool',        2, true, 'system', 'system', now(), now()),
    ('reels',   NULL, 'Reels',     'Reels', '/reels',  'play-circle', 3, true, 'system', 'system', now(), now()),
    ('game',    NULL, 'Game',      'Game',  '',        'trophy',      4, true, 'system', 'system', now(), now())
ON CONFLICT ("MenuId") DO NOTHING;

-- Menu con. Path cua menu cha ('tools', 'game') de rong: chung chi la nhom xo
-- xuong, bam vao khong dieu huong di dau.
INSERT INTO "SysMenu" (
    "MenuId", "ParentId", "TitleVi", "TitleEn", "Path", "Icon",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES
    ('tools-hotel-fee',      'tools', 'Tinh phi khach san',  'Calculating hotel fee', '/tools/calculating-hotel-fee', 'calculator', 1, true, 'system', 'system', now(), now()),
    ('tools-shift-report',   'tools', 'Bao cao ca truc',     'Shift report',          '/tools/shift-report',          'file-text',  2, true, 'system', 'system', now(), now()),
    ('tools-revenue-report', 'tools', 'Bao cao doanh thu',   'Revenue report',        '/tools/revenue-report',        'dollar',     3, true, 'system', 'system', now(), now()),
    ('game-chess',           'game',  'Co vua',              'Chess',                 '/game/chess',                  'appstore',   1, true, 'system', 'system', now(), now())
ON CONFLICT ("MenuId") DO NOTHING;
