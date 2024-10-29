using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace API.CommonUtils
{
    public static class CommonUtils
    {
        public static bool IsNullOrEmpty(string value)
        {
            if (string.IsNullOrEmpty(value))
            {
                return true;
            }
            else
            {
                return false;
            }
        }

        public static string PureString(string value)
        {
            if (string.IsNullOrEmpty(value))
            {
                return "";
            }
            else
            {
                string pureString = value.Trim();
                return pureString;
            }
        }

        public static string RemoveAccent(string txt)
        {
            var normalizedString = txt.Normalize(NormalizationForm.FormD);
            var stringBuilder = new StringBuilder();

            foreach (var c in normalizedString)
            {
                var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
                if (unicodeCategory != UnicodeCategory.NonSpacingMark)
                {
                    stringBuilder.Append(c);
                }
            }

            return stringBuilder.ToString().Normalize(NormalizationForm.FormC);
        }

        public static string GenerateSlug(string phrase)
        {
            string str = RemoveAccent(phrase).ToLower();
            // invalid chars           
            str = Regex.Replace(str, @"[^a-z0-9\s-]", "");
            // convert multiple spaces into one space   
            str = Regex.Replace(str, @"\s+", " ").Trim();
            // cut and trim 
            str = str.Substring(0, str.Length <= 45 ? str.Length : 45).Trim();
            str = Regex.Replace(str, @"\s", "-"); // hyphens   
            return str;
        }

        public static string ConvertObjectToString(object value)
        {
            if (value == null || value == DBNull.Value)
            {
                return "";
            }
            else
            {
                return value.ToString()!;
            }
        }


        public static int CeilingValue(int value)
        {
            if (value % 10 > 0)
            {
                return value + 1;
            }
            else
            {
                return value;
            }
        }
    }
}
