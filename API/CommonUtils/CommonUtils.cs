namespace API.CommonUtils
{
    public  class CommonUtils
    {
        public static bool IsNullOrEmpty (string value)
        {
            if(string.IsNullOrEmpty(value))
            {
                return true;
            }
            else
            {
                return false;
            }
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


        public static int CeilingValue (int value)
        {
            if(value % 10 > 0)
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
