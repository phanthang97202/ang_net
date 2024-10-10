using DocumentFormat.OpenXml.Wordprocessing;

namespace API.Dtos
{
    public class PageInfo<T>
    {
        public int PageIndex { get; set; }
        public int PageSize { get; set; }
        public int PageCount { get; set; }
        public int ItemCount { get; set; }

        public List<T> DataList {  get; set; } = new List<T>();

    }
}
