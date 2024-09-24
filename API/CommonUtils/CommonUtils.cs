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
    }
}
