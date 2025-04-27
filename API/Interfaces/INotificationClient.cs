namespace API.Interfaces
{
    public interface INotificationClient
    {
        public Task ReceiveMessage(string message);
    }
}
