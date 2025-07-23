
namespace angnet.Domain.Dtos
{
    public class RequestClient
    {
        public string Key { get; set; }
        public object Value { get; set; }

        public RequestClient(string key, object value)
        {
            Key = key;
            Value = value;
        }

        public RequestClient(object value)
        {
            Value = value;
        }
    }

    public class ApiResponse<T>
    {
        public bool Success { get; set; } // false | true
        public string ErrorMessage { get; set; } = default!; // default is null
        public DateTime RequestDTimeAt { get; } = DateTime.Now; // Changed to UtcNow
        public List<RequestClient> RequestClients { get; set; } = default!; // Initialize to an empty list
        public T Data { get; set; } = default!; // Used for get detail data, data was created
        public List<T> DataList { get; set; } = default!; // used for array list, such as: mapping
        public object objResult { get; set; } = null!; // used for pagination

        public ApiResponse() => Success = true;

        public ApiResponse(T data)
        {
            Success = true;
            Data = data;
        }

        public ApiResponse(string errorMessage)
        {
            ErrorMessage = errorMessage;
            Success = false;
        }

        public ApiResponse(bool success, string errorMessage, T data, List<RequestClient> requestClients)
        {
            Success = success;
            ErrorMessage = errorMessage;
            Data = data;
            RequestClients = requestClients;
        }

        public string ShowInfo()
        {
            return $"IsSuccess: {Success} \n ErrorMessage: {ErrorMessage} \n Result: {Data}";
        }

        public void CatchException(bool success, string errorMessage, List<RequestClient> requestClients)
        {
            Success = success;
            ErrorMessage = errorMessage;
            RequestClients = requestClients; // Corrected to use parameter
        }
    }
}