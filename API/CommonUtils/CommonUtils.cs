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
