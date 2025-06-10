namespace API.Application.Interfaces.Persistences
{
    public interface INotificationClient
    {
        public Task ReceiveMessage(string message);
    }
}
