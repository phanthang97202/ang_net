namespace API.Dtos
{
    public class RequestClient
    {
        public string? Key { get; set; }
        public string? Value { get; set; }

        public RequestClient(string key, string value)
        {
            Key = key;
            Value = value;
        }
    }

    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
        public T Data { get; set; } = default!;
        public List<T> DataList { get; set; } = new List<T>();
        public DateTime RequestDTimeAt { get; } = DateTime.UtcNow; // Changed to UtcNow
        public List<RequestClient> RequestClients { get; set; } = new List<RequestClient>(); // Initialize to an empty list

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