-- Preserve role IDs and user assignments while expanding the viewer to all movies.
UPDATE "SysPermission"
SET "PermissionCode" = 'movie.view',
    "PermissionNameVi" = 'Xem phim', "PermissionNameEn" = 'View movies',
    "Module" = 'movie', "ModuleNameVi" = 'Phim', "ModuleNameEn" = 'Movies',
    "DescriptionVi" = 'Tìm kiếm phim, xem danh sách tập và phát phim từ nguồn trực tuyến',
    "DescriptionEn" = 'Search movies, browse episodes and play provider streams',
    "UpdatedBy" = 'system', "UpdatedDTime" = now()
WHERE "PermissionCode" = 'anime.view';

UPDATE "AspNetRoleClaims"
SET "ClaimValue" = 'movie.view'
WHERE "ClaimType" = 'permission' AND "ClaimValue" = 'anime.view';

-- The manual importer is retired; retain its stored data and role assignments.
UPDATE "SysPermission"
SET "FlagActive" = false, "UpdatedBy" = 'system', "UpdatedDTime" = now()
WHERE "PermissionCode" = 'anime.manage';

UPDATE "AspNetRoles"
SET "Name" = 'Movie Viewer', "NormalizedName" = 'MOVIE VIEWER'
WHERE "Id" = '37b814c5-a787-42c5-9e69-f0192437489f' AND "Name" = 'Anime Viewer';

UPDATE "AspNetRoles"
SET "Name" = 'Movie Viewer (legacy)', "NormalizedName" = 'MOVIE VIEWER (LEGACY)'
WHERE "Id" = '04a489b8-0316-40cb-9614-29accf5fb62a' AND "Name" = 'Anime Manager';

UPDATE "SysMenu"
SET "Path" = '/phim',
    "TitleVi" = CASE WHEN "TitleVi" = 'Anime' THEN 'Phim' ELSE "TitleVi" END,
    "TitleEn" = CASE WHEN "TitleEn" = 'Anime' THEN 'Movies' ELSE "TitleEn" END,
    "UpdatedBy" = 'system', "UpdatedDTime" = now()
WHERE "Path" = '/anime';
