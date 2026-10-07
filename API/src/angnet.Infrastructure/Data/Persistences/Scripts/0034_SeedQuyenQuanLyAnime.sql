INSERT INTO "SysPermission" (
    "PermissionCode", "PermissionNameVi", "PermissionNameEn",
    "Module", "ModuleNameVi", "ModuleNameEn",
    "DescriptionVi", "DescriptionEn",
    "SortOrder", "FlagActive", "CreatedBy", "UpdatedBy", "CreatedDTime", "UpdatedDTime"
) VALUES (
    'anime.manage', 'Quan ly anime', 'Manage anime',
    'anime', 'Anime', 'Anime',
    'Nhap anime, tao tap va quan ly nguon phat',
    'Import anime, create episodes and manage playback sources',
    2, true, 'system', 'system', now(), now()
);

INSERT INTO "AspNetRoles" ("Id", "Name", "NormalizedName", "ConcurrencyStamp")
VALUES ('04a489b8-0316-40cb-9614-29accf5fb62a', 'Anime Manager', 'ANIME MANAGER', 'anime-manager-v1');

INSERT INTO "AspNetRoleClaims" ("RoleId", "ClaimType", "ClaimValue") VALUES
    ('04a489b8-0316-40cb-9614-29accf5fb62a', 'permission', 'anime.view'),
    ('04a489b8-0316-40cb-9614-29accf5fb62a', 'permission', 'anime.manage');
