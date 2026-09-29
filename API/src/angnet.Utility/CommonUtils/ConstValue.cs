namespace angnet.Utility.CommonUtils
{
    public static partial class ConstValue
    {
       // News - Bài viết
       public const double MAX_POINT_NEWS = 10.0; // Điểm tối đa chấm cho bài viết
       public const double MIN_POINT_NEWS = 0.0; // Điểm tối thiểu chấm cho bài viết
        // HashTagNews 
       public const int MAX_TOP_HASHTAGNEWS = 6; //  

        // Danh sách NewsCategoryId được phép xuất hiện trong khối chủ đề hot.
        // Giá trị SysParameter là một mảng JSON; thứ tự phần tử cũng là thứ tự
        // hiển thị ngoài trang chủ.
        public const string HOME_HOT_TOPIC_CATEGORY_IDS = "HOME_HOT_TOPIC_CATEGORY_IDS";

        // Mail
        public const string TYPE_AUTH_CODE_FORGOT_PASSWORD = "FORGOT PASSWORD";
        public const string TYPE_AUTH_CODE_REGISTER = "REGISTER";
    }
}
