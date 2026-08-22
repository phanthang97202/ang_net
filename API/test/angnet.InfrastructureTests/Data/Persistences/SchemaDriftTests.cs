using angnet.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Npgsql;

namespace angnet.Infrastructure.Data.Persistences.Tests
{
    /*
        Luoi an toan thay cho EF Migrations.

        Bo EF Migrations => khong con ai tu dong dam bao Domain model khop voi DB that.
        Neu them property vao model ma quen viet script SQL, loi chi lo ra luc chay that.
        Test nay bat som: voi moi entity trong EF model, chay SELECT cac cot da map
        (WHERE false, khong doc du lieu). Thieu bang hoac thieu cot la Postgres bao loi ngay.

        Chay: set bien moi truong ANGNET_TEST_DB roi `dotnet test`.
        Khong set thi test tu bo qua (Inconclusive) de khong pha CI khi khong co DB.
    */
    [TestClass]
    public class SchemaDriftTests
    {
        [TestMethod]
        public void EfModel_KhopVoiSchemaTrongDatabase()
        {
            var connectionString = Environment.GetEnvironmentVariable("ANGNET_TEST_DB");
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                Assert.Inconclusive("Chua set ANGNET_TEST_DB nen bo qua kiem tra schema drift.");
            }

            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseNpgsql(connectionString)
                .Options;

            using var context = new AppDbContext(options);
            using var connection = new NpgsqlConnection(connectionString);
            connection.Open();

            var errors = new List<string>();

            foreach (var entity in context.Model.GetEntityTypes())
            {
                var tableName = entity.GetTableName();
                if (string.IsNullOrEmpty(tableName))
                {
                    continue;
                }

                var schema = entity.GetSchema() ?? "public";
                var storeObject = StoreObjectIdentifier.Table(tableName, entity.GetSchema());

                var columns = entity.GetProperties()
                    .Select(p => p.GetColumnName(storeObject))
                    .Where(c => !string.IsNullOrEmpty(c))
                    .Distinct()
                    .Select(c => $"\"{c}\"")
                    .ToList();

                if (columns.Count == 0)
                {
                    continue;
                }

                var sql = $"SELECT {string.Join(", ", columns)} FROM \"{schema}\".\"{tableName}\" WHERE false";

                try
                {
                    using var command = new NpgsqlCommand(sql, connection);
                    command.ExecuteNonQuery();
                }
                catch (PostgresException ex)
                {
                    errors.Add($"{entity.ClrType.Name} -> \"{schema}\".\"{tableName}\": {ex.MessageText}");
                }
            }

            Assert.AreEqual(
                0,
                errors.Count,
                $"EF model lech voi DB. Viet script SQL moi trong Data/Persistences/Scripts de vá:{Environment.NewLine}"
                    + string.Join(Environment.NewLine, errors));
        }
    }
}
