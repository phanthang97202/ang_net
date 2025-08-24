
namespace angnet.Utility.CommonUtils
{
    public static class MappingData
    {
        public static string MappingAuditType(int type)
        {
            if (type == 0)
            {
                return "TRACE";
            }
            if (type == 1)
            {
                return "DEBUG";
            }
            if (type == 2)
            {
                return "INFORMATION";
            }
            if (type == 3)
            {
                return "WARNING";
            }
            if (type == 4)
            {
                return "ERROR";
            }
            if (type == 5)
            {
                return "CRITICAL";
            }
            return "---";
        }
    }
}
