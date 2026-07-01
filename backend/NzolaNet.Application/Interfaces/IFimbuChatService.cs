using NzolaNet.Application.DTOs.Fimbu;

namespace NzolaNet.Application.Interfaces;

public interface IFimbuChatService
{
    Task<FimbuChatResponseDto> SendMessageAsync(Guid userId, string message, CancellationToken cancellationToken = default);

    Task<FimbuHistoryDto> GetHistoryAsync(Guid userId, CancellationToken cancellationToken = default);

    Task ClearHistoryAsync(Guid userId, CancellationToken cancellationToken = default);
}
