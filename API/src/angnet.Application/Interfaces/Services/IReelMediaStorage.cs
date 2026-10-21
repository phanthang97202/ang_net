namespace angnet.Application.Interfaces.Services;

public record ReelStoredFile(string CloudName, string ResourceType, string PublicId);

public interface IReelMediaStorage
{
    ReelStoredFile? GetFile(string url);
    bool IsOwnedUpload(string ownerId, string url);
    Task<bool> DeleteAsync(IReadOnlyCollection<ReelStoredFile> files);
}
