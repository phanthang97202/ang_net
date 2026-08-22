# Migration scripts

Thay cho EF Migrations. Schema DB do cac file .sql trong thu muc nay quan ly.

## Them thay doi DB

1. Tao file moi, so tang dan: `0002_ThemCotXyzVaoNews.sql`
   (KHONG sua file da chay - moi script chi chay dung 1 lan)
2. Viet SQL binh thuong, khong can `IF NOT EXISTS`, khong dat `BEGIN/COMMIT`
   (runner da boc san transaction cho tung script)
3. Sua Domain model + `OnModelCreating` cho khop voi SQL vua viet
4. Chay app - `DatabaseMigrator` tu ap dung script chua chay va ghi vao bang `SchemaVersions`

## Kiem tra model co lech DB khong

```
set ANGNET_TEST_DB=Host=localhost;Database=...;Username=...;Password=...
dotnet test --filter SchemaDriftTests
```

Test bao loi neu EF model co bang/cot ma DB chua co.

## Luu y

- File .sql phai duoc build voi `Build Action = Embedded Resource`.
  Da co wildcard trong angnet.Infrastructure.csproj nen file moi tu dong duoc nhung.
- Database rong phai tao san; runner chi tao bang, khong tao database.
