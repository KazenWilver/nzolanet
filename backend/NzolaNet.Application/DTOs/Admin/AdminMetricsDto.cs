namespace NzolaNet.Application.DTOs.Admin;

/// <summary>
/// Aggregated platform indicators shown on the administrator dashboard.
/// </summary>
public class AdminMetricsDto
{
    public int TotalUtilizadores { get; set; }
    public int TotalUtilizadoresOnline { get; set; }
    public int TotalUtilizadoresOffline { get; set; }
    public int TotalPublicacoes { get; set; }
    public int TotalComentarios { get; set; }
    public int TotalBazes { get; set; }
    public int TotalDenuncias { get; set; }
    public int TotalPublicacoesDenunciadas { get; set; }
    public int TotalComentariosDenunciados { get; set; }

    public int TotalHashtagsCriadas { get; set; }
    public int TotalFotografiasPartilhadas { get; set; }
    public int TotalVideosPartilhados { get; set; }

    public int TotalChatsCriados { get; set; }
    public int TotalGruposCriados { get; set; }

    public long TotalInteracoesFimbu { get; set; }
    public long TotalMensagensFimbu { get; set; }

    public IReadOnlyList<AdminTopHashtagDto> TopHashtags { get; set; } = new List<AdminTopHashtagDto>();
    public IReadOnlyList<AdminTopFollowedDto> TopPerfisSeguidos { get; set; } = new List<AdminTopFollowedDto>();
}
