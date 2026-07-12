namespace NzolaNet.Application.Interfaces;

/// <summary>
/// Presença em tempo real dos utilizadores na plataforma.
/// </summary>
public interface IUserPresenceService
{
    void UserConnected(Guid userId, string connectionId);

    bool UserDisconnected(Guid userId, string connectionId);

    bool IsOnline(Guid userId);

    int GetOnlineUsersCount();

    IReadOnlyCollection<Guid> GetOnlineUserIds();

    DateTime? GetLastSeenUtc(Guid userId);
}
