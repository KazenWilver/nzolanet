using System.Collections.Concurrent;
using System.Collections.Generic;
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
        return _connections.TryGetValue(userId, out var connections) && HasActiveConnections(connections);
    }

    public int GetOnlineUsersCount()
    {
        var count = 0;

        foreach (var (_, connections) in _connections)
        {
            if (HasActiveConnections(connections))
            {
                count++;
            }
        }

        return count;
    }

    public IReadOnlyCollection<Guid> GetOnlineUserIds()
    {
        var onlineUsers = new List<Guid>();

        foreach (var (userId, connections) in _connections)
        {
            if (HasActiveConnections(connections))
            {
                onlineUsers.Add(userId);
            }
        }

        return onlineUsers;
    }

    public DateTime? GetLastSeenUtc(Guid userId)
    {
        if (IsOnline(userId))
        {
            return null;
        }

        return _lastSeenUtc.TryGetValue(userId, out var lastSeen) ? lastSeen : null;
    }

    private static bool HasActiveConnections(HashSet<string> connections)
    {
        lock (connections)
        {
            return connections.Count > 0;
        }
    }
}
