using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;

namespace NzolaNet.Application.Services;

/// <summary>
/// Aplica regras de privacidade ao servir ficheiros de upload.
/// </summary>
public class MediaAccessService : IMediaAccessService
{
    private readonly IUserRepository _userRepository;
    private readonly IPostRepository _postRepository;
    private readonly ICommentRepository _commentRepository;
    private readonly IFollowRepository _followRepository;
    private readonly IConversationRepository _conversationRepository;

    public MediaAccessService(
        IUserRepository userRepository,
        IPostRepository postRepository,
        ICommentRepository commentRepository,
        IFollowRepository followRepository,
        IConversationRepository conversationRepository)
    {
        _userRepository = userRepository;
        _postRepository = postRepository;
        _commentRepository = commentRepository;
        _followRepository = followRepository;
        _conversationRepository = conversationRepository;
    }

    public async Task<bool> CanAccessAsync(Guid userId, string normalizedPath)
    {
        if (string.IsNullOrWhiteSpace(normalizedPath) || !normalizedPath.StartsWith("/uploads/", StringComparison.Ordinal))
        {
            return false;
        }

        var relativePath = normalizedPath["/uploads/".Length..];
        var category = relativePath.Split('/', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();

        return category switch
        {
            "profiles" => await CanAccessProfilePhotoAsync(userId, normalizedPath),
            "covers" => await CanAccessCoverPhotoAsync(userId, normalizedPath),
            "publications" => await CanAccessPublicationMediaAsync(userId, normalizedPath),
            "comments" => await CanAccessCommentMediaAsync(userId, normalizedPath),
            "groups" => await CanAccessGroupMediaAsync(userId, normalizedPath),
            "messages" => await CanAccessMessageMediaAsync(userId, normalizedPath),
            _ => false
        };
    }

    private async Task<bool> CanAccessGroupMediaAsync(Guid userId, string normalizedPath)
    {
        var conversation = await _conversationRepository.GetByImagePathAsync(normalizedPath);
        return conversation?.Participants.Any(participant => participant.UserId == userId) == true;
    }

    private async Task<bool> CanAccessMessageMediaAsync(Guid userId, string normalizedPath)
    {
        var message = await _conversationRepository.GetByMediaPathAsync(normalizedPath);
        return message?.Conversation.Participants.Any(participant => participant.UserId == userId) == true;
    }

    private async Task<bool> CanAccessProfilePhotoAsync(Guid userId, string normalizedPath)
    {
        var owner = await _userRepository.GetByProfilePhotoPathAsync(normalizedPath);
        return owner != null && await CanViewUserAsync(userId, owner);
    }

    private async Task<bool> CanAccessCoverPhotoAsync(Guid userId, string normalizedPath)
    {
        var owner = await _userRepository.GetByCoverPhotoPathAsync(normalizedPath);
        return owner != null && await CanViewUserAsync(userId, owner);
    }

    private async Task<bool> CanAccessPublicationMediaAsync(Guid userId, string normalizedPath)
    {
        var post = await _postRepository.GetByMediaPathAsync(normalizedPath);
        return post != null && await CanViewPostAsync(userId, post);
    }

    private async Task<bool> CanAccessCommentMediaAsync(Guid userId, string normalizedPath)
    {
        var comment = await _commentRepository.GetByMediaPathAsync(normalizedPath);
        if (comment == null)
        {
            return false;
        }

        var post = await _postRepository.GetByIdAsync(comment.PostId);
        return post != null && await CanViewPostAsync(userId, post);
    }

    private async Task<bool> CanViewPostAsync(Guid userId, Post post)
    {
        if (post.User == null)
        {
            return false;
        }

        return await CanViewUserAsync(userId, post.User);
    }

    private async Task<bool> CanViewUserAsync(Guid userId, User owner)
    {
        if (!owner.IsPrivate || owner.Id == userId)
        {
            return true;
        }

        return await _followRepository.IsFollowingAsync(userId, owner.Id);
    }
}
