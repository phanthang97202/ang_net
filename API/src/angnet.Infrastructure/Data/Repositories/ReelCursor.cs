using System.Text;

namespace angnet.Infrastructure.Data.Repositories
{
    /// <summary>
    /// Cursor keyset dạng Base64("{CreatedDTime:O}|{Id}"), dùng chung cho feed reel và list comment.
    /// Decode luôn trả về null khi chuỗi hỏng: endpoint là public nên cursor rác phải rơi về trang đầu, không được throw.
    /// </summary>
    internal static class ReelCursor
    {
        public static string Encode(DateTime createdDTime, string id)
        {
            return Convert.ToBase64String(Encoding.UTF8.GetBytes($"{createdDTime:O}|{id}"));
        }

        public static (DateTime CreatedDTime, string Id)? Decode(string cursor)
        {
            if (string.IsNullOrWhiteSpace(cursor))
            {
                return null;
            }

            try
            {
                string raw = Encoding.UTF8.GetString(Convert.FromBase64String(cursor));
                string[] parts = raw.Split('|', 2);
                if (parts.Length != 2 || string.IsNullOrEmpty(parts[1]))
                {
                    return null;
                }

                DateTime createdDTime = DateTime.Parse(parts[0], null, System.Globalization.DateTimeStyles.RoundtripKind);
                return (createdDTime, parts[1]);
            }
            catch (Exception)
            {
                return null;
            }
        }
    }
}
