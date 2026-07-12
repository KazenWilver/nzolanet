namespace NzolaNet.Application.DTOs.Conversations;

public class AddGroupParticipantsDto
{
    public IReadOnlyList<Guid> ParticipantIds { get; set; } = Array.Empty<Guid>();
}
