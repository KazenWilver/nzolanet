using NzolaNet.Application.DTOs.Publications;
using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;

namespace NzolaNet.Application.Services;

public class BookmarkService : IBookmarkService
{
    private readonly IBookmarkRepository _bookmarkRepository;
    private readonly IPostRepository _postRepository;
    private readonly PostService _postService;

    public BookmarkService(
        IBookmarkRepository bookmarkRepository,
        IPostRepository postRepository,
        PostService postService)
    {
        _bookmarkRepository = bookmarkRepository;
        _postRepository = postRepository;
        _postService = postService;
    }

    public async Task ToggleBookmarkAsync(Guid userId, Guid postId, bool bookmark)
    {
        var post = await _postRepository.GetByIdAsync(postId);
        if (post == null)
        {
            throw new ArgumentException("Publicação não encontrada.");
        }

        var existing = await _bookmarkRepository.GetByUserAndPostAsync(userId, postId);
        if (bookmark)
        {
            if (existing != null)
            {
                return;
            }

            await _bookmarkRepository.CreateAsync(new Bookmark
            {
                UserId = userId,
                PostId = postId,
                CreatedAt = DateTime.UtcNow
            });
            return;
        }

        if (existing == null)
        {
            return;
        }

        await _bookmarkRepository.DeleteAsync(existing);
    }

    public async Task<PaginatedPublicationsResponseDto> GetMyBookmarksAsync(Guid userId, int page, int pageSize)
    {
        var (items, totalCount) = await _bookmarkRepository.GetBookmarkedPostsByUserAsync(userId, page, pageSize);
        var dtos = await _postService.MapPostsForCurrentUserAsync(items, userId);

        return new PaginatedPublicationsResponseDto
        {
            Items = dtos.ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            HasMore = page * pageSize < totalCount
        };
    }
}
