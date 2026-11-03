-- Chuyen cac URL van hanh tu domain cu sang domain production hien tai.
-- AuditTrail duoc co y giu nguyen de bao toan lich su truoc/sau cua he thong.
DO $domain_migration$
DECLARE
    old_domain constant text := 'phanthang.site';
    new_domain constant text := 'thangphan.vercel.app';
    changed_chat integer := 0;
    changed_news integer := 0;
    changed_menu integer := 0;
    changed_parameter integer := 0;
    remaining_rows bigint := 0;
BEGIN
    UPDATE "Chat"
    SET "Message" = replace("Message", old_domain, new_domain)
    WHERE strpos("Message", old_domain) > 0;
    GET DIAGNOSTICS changed_chat = ROW_COUNT;

    UPDATE "News"
    SET "Thumbnail" = replace("Thumbnail", old_domain, new_domain),
        "ShortDescription" = replace("ShortDescription", old_domain, new_domain),
        "ShortDescriptionEn" = replace("ShortDescriptionEn", old_domain, new_domain),
        "ContentBody" = replace("ContentBody", old_domain, new_domain),
        "ContentBodyEn" = replace("ContentBodyEn", old_domain, new_domain)
    WHERE strpos("Thumbnail", old_domain) > 0
       OR strpos("ShortDescription", old_domain) > 0
       OR strpos("ShortDescriptionEn", old_domain) > 0
       OR strpos("ContentBody", old_domain) > 0
       OR strpos("ContentBodyEn", old_domain) > 0;
    GET DIAGNOSTICS changed_news = ROW_COUNT;

    UPDATE "SysMenu"
    SET "Path" = replace("Path", old_domain, new_domain)
    WHERE strpos("Path", old_domain) > 0;
    GET DIAGNOSTICS changed_menu = ROW_COUNT;

    UPDATE "SysParameter"
    SET "ParameterValueVi" = replace("ParameterValueVi", old_domain, new_domain),
        "ParameterValueEn" = replace("ParameterValueEn", old_domain, new_domain),
        "DefaultValueVi" = replace("DefaultValueVi", old_domain, new_domain),
        "DefaultValueEn" = replace("DefaultValueEn", old_domain, new_domain)
    WHERE strpos("ParameterValueVi", old_domain) > 0
       OR strpos("ParameterValueEn", old_domain) > 0
       OR strpos("DefaultValueVi", old_domain) > 0
       OR strpos("DefaultValueEn", old_domain) > 0;
    GET DIAGNOSTICS changed_parameter = ROW_COUNT;

    SELECT count(*)
    INTO remaining_rows
    FROM (
        SELECT 1 FROM "Chat"
        WHERE strpos("Message", old_domain) > 0
        UNION ALL
        SELECT 1 FROM "News"
        WHERE strpos("Thumbnail", old_domain) > 0
           OR strpos("ShortDescription", old_domain) > 0
           OR strpos("ShortDescriptionEn", old_domain) > 0
           OR strpos("ContentBody", old_domain) > 0
           OR strpos("ContentBodyEn", old_domain) > 0
        UNION ALL
        SELECT 1 FROM "SysMenu"
        WHERE strpos("Path", old_domain) > 0
        UNION ALL
        SELECT 1 FROM "SysParameter"
        WHERE strpos("ParameterValueVi", old_domain) > 0
           OR strpos("ParameterValueEn", old_domain) > 0
           OR strpos("DefaultValueVi", old_domain) > 0
           OR strpos("DefaultValueEn", old_domain) > 0
    ) AS remaining;

    IF remaining_rows > 0 THEN
        RAISE EXCEPTION 'Domain migration is incomplete: % operational rows still contain %',
            remaining_rows, old_domain;
    END IF;

    RAISE NOTICE 'Domain migration completed: Chat=%, News=%, SysMenu=%, SysParameter=%',
        changed_chat, changed_news, changed_menu, changed_parameter;
END
$domain_migration$;
