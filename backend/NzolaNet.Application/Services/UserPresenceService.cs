using System.Collections.Concurrent;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Application.Services;

/// <summary>
/// Rastreia ligações activas e última presença em memória.
/// </summary>
public class UserPresenceService : IUserPresenceService
{
    private readonly ConcurrentDictionary<Guid, HashSet<string>> _connections = new();
    private readonly ConcurrentDictionary<Guid, DateTime> _lastSeenUtc = new();

    public void UserConnected(Guid userId, string connectionId)
    {
        var connections = _connections.GetOrAdd(userId, _ => new HashSet<string>());
        lock (connections)
        {
            connections.Add(connectionId);
        }
    }

    public bool UserDisconnected(Guid userId, string connectionId)
    {
        if (!_connections.TryGetValue(userId, out var connections))
        {
            _lastSeenUtc[userId] = DateTime.UtcNow;
            return true;
        }

        lock (connections)
        {
            connections.Remove(connectionId);
            if (connections.Count == 0)
            {
                _connections.TryRemove(userId, out _);
                _lastSeenUtc[userId] = DateTime.UtcNow;
                return true;
            }
        }

        return false;
    }

    public bool IsOnline(Guid userId)
    {
        return _connections.TryGetValue(userId, out var connections) && connections.Count > 0;
    }

    public DateTime? GetLastSeenUtc(Guid userId)
    {
        if (IsOnline(userId))
        {
            return null;
        }

        return _lastSeenUtc.TryGetValue(userId, out var lastSeen) ? lastSeen : null;
    }
}
