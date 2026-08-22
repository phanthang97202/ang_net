using System.Reflection;
using Npgsql;

namespace angnet.Infrastructure.Data.Persistences
{
    /*
        Thay cho EF Migrations.

        Schema do SQL tay quan ly: moi thay doi DB la 1 file .sql moi trong Data/Persistences/Scripts,
        dat ten tang dan (0002_..., 0003_...). Cac file duoc nhung vao assembly (EmbeddedResource),
        chay theo thu tu ten, va ghi lai vao bang "SchemaVersions" nen moi script chi chay dung 1 lan.

        Quy uoc:
          - Script da chay thi KHONG sua nua, luon them file moi.
          - Sua schema xong thi sua luon Domain model + OnModelCreating cho khop
            (SchemaDriftTests se bat neu quen).

        Khong dung thu vien migration ngoai (DbUp/Evolve...) vi cac ban hien tai deu keo Npgsql 9/10,
        xung dot voi Npgsql 8 ma Npgsql.EntityFrameworkCore.PostgreSQL 8.0.2 dang dung.

        Database rong phai duoc tao san; runner nay chi tao bang, khong tao database.
    */
    public static class DatabaseMigrator
    {
        private const string ScriptNamespace = "angnet.Infrastructure.Data.Persistences.Scripts.";

        // Khoa de nhieu instance khoi cung chay migration luc deploy. So tuy y, mien co dinh.
        private const long AdvisoryLockKey = 8_246_113_907;

        /// <returns>Ten cac script vua chay trong lan goi nay.</returns>
        public static IReadOnlyList<string> Run(string connectionString)
        {
            using var connection = new NpgsqlConnection(connectionString);
            connection.Open();

            Execute(connection, null, $"SELECT pg_advisory_lock({AdvisoryLockKey})");
            try
            {
                Execute(connection, null, """
                    CREATE TABLE IF NOT EXISTS "SchemaVersions" (
                        "ScriptName" text NOT NULL,
                        "Applied" timestamptz NOT NULL DEFAULT now(),
                        CONSTRAINT "PK_SchemaVersions" PRIMARY KEY ("ScriptName")
                    )
                    """);

                var applied = GetAppliedScripts(connection);
                var executed = new List<string>();

                foreach (var (name, sql) in ReadScripts())
                {
                    if (applied.Contains(name))
                    {
                        continue;
                    }

                    using var transaction = connection.BeginTransaction();
                    Execute(connection, transaction, sql);

                    using (var record = new NpgsqlCommand(
                        @"INSERT INTO ""SchemaVersions"" (""ScriptName"") VALUES (@name)", connection, transaction))
                    {
                        record.Parameters.AddWithValue("name", name);
                        record.ExecuteNonQuery();
                    }

                    transaction.Commit();
                    executed.Add(name);
                }

                return executed;
            }
            finally
            {
                Execute(connection, null, $"SELECT pg_advisory_unlock({AdvisoryLockKey})");
            }
        }

        private static void Execute(NpgsqlConnection connection, NpgsqlTransaction? transaction, string sql)
        {
            using var command = new NpgsqlCommand(sql, connection, transaction);
            command.ExecuteNonQuery();
        }

        private static HashSet<string> GetAppliedScripts(NpgsqlConnection connection)
        {
            var applied = new HashSet<string>(StringComparer.Ordinal);
            using var command = new NpgsqlCommand(@"SELECT ""ScriptName"" FROM ""SchemaVersions""", connection);
            using var reader = command.ExecuteReader();
            while (reader.Read())
            {
                applied.Add(reader.GetString(0));
            }

            return applied;
        }

        private static IEnumerable<(string Name, string Sql)> ReadScripts()
        {
            var assembly = Assembly.GetExecutingAssembly();

            return assembly.GetManifestResourceNames()
                .Where(n => n.StartsWith(ScriptNamespace, StringComparison.Ordinal)
                            && n.EndsWith(".sql", StringComparison.OrdinalIgnoreCase))
                .OrderBy(n => n, StringComparer.Ordinal)
                .Select(n =>
                {
                    using var stream = assembly.GetManifestResourceStream(n)!;
                    using var streamReader = new StreamReader(stream);
                    return (Name: n.Substring(ScriptNamespace.Length), Sql: streamReader.ReadToEnd());
                });
        }
    }
}
