namespace NzolaNet.Application.DTOs.Admin;

public class AdminMetricsDto
{
    public int TotalUtilizadores { get; set; }
    public int TotalUtilizadoresOnline { get; set; }
    public int TotalUtilizadoresOffline { get; set; }
    public int TotalPublicacoes { get; set; }
    public int TotalPublicacoesDenunciadas { get; set; }
    public int TotalComentarios { get; set; }
    public int TotalComentariosDenunciados { get; set; }
    public int TotalDenuncias { get; set; }
    public int TotalBazes { get; set; }
    public int TotalGrupos { get; set; }
    public int TotalMensagensEnviadas { get; set; }
    public long TotalMensagensRecebidas { get; set; }
    public long TotalGruposApagados { get; set; }
    public long TotalInteracoesIa { get; set; }
    public long TotalMensagensIa { get; set; }
    public double MediaUtilizadoresOnlinePercentagem { get; set; }
    public double MediaUtilizadoresOfflinePercentagem { get; set; }
    public double MediaUsoIaPercentagem { get; set; }
    public int TotalHashtagsCriadas { get; set; }
    public IReadOnlyList<AdminTopHashtagDto> TopHashtagsMaisUsadas { get; set; } = Array.Empty<AdminTopHashtagDto>();
    public IReadOnlyList<AdminTopFollowedProfileDto> TopPerfisMaisSeguidos { get; set; } = Array.Empty<AdminTopFollowedProfileDto>();
}
