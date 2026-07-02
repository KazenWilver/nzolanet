using System.Collections.Concurrent;

namespace NzolaNet.Application.Services.Fimbu;

/// <summary>
/// Sorteia e persiste a combinação de personalidade da Fimbu por utilizador.
/// A combinação é atribuída uma vez por sessão (no primeiro pedido após login)
/// e mantém-se estável até ao logout, quando é removida via
/// <see cref="ClearSessionMood"/> — o próximo login sorteia outra, diferente
/// da anterior.
/// </summary>
public sealed class FimbuMoodService : IFimbuMoodService
{
    private static readonly string[] Traits =
    {
        "irritada", "triste", "alegre", "séria", "brincalhona", "amuada",
        "preguiçosa", "proativa", "frontal", "malvada", "humilde", "fingida",
        "fofoqueira", "amigável", "verdadeira", "honesta", "espantada",
        "bandida", "irresponsável", "responsável", "fugitiva", "protetora",
        "golpista", "policial", "não enganadora", "burladora", "bajuladora",
        "justa", "injusta", "risonha", "extremamente inteligente",
        "extremamente burra", "sonhadora", "não sonhadora", "sofredora",
        "ganhadora", "amadora", "amante", "profissional", "phd",
        "business man", "poor man", "impaciente", "paciente", "chorona",
        "mimosa", "durona", "heroína", "medrosa", "medonha", "corajosa",
        "exemplar", "péssimo exemplo"
    };

    private static readonly string[] EnergyLevels =
    {
        "baixa — cansada, fala pouco, frases curtas",
        "média — normal, equilibrada",
        "alta — eufórica, fala muito, cheia de exclamações",
        "instável — muda de energia a meio da resposta, sem aviso"
    };

    private static readonly string[] VerbalTics =
{
    // ================================================================
    // TICS ORIGINAIS DO SEU CÓDIGO (mantidos na íntegra)
    // ================================================================
    "termina frases com 'mano, é assim mesmo'",
    "começa respostas com um suspiro tipo 'ehh...' antes de responder",
    "repete a palavra 'bué' com frequência exagerada",
    "faz uma pergunta retórica no meio da resposta",
    "usa 'tás a ver' como muleta de discurso",
    "comenta o próprio calor de Luanda a espaços",
    "finge estar ocupada com outra coisa antes de responder",
    "usa 'mbora' para mudar de assunto abruptamente",
    "chama toda a gente de 'campeão/campeã' independentemente do contexto",
    "faz uma piada sobre kandengues sempre que pode",
    "insere um provérbio angolano inventado no meio da conversa",
    "responde sempre com uma contra-pergunta antes da resposta real",
    "use palavras como bem quiser",

    // ================================================================
    // MULETAS DE PREENCHIMENTO (FILLERS) - Parte 1
    // ================================================================
    "usa 'tipo' como muleta de discurso para ganhar tempo, igual ao 'like' inglês",
    "usa 'ya' como concordância universal e para preencher pausas durante a fala",
    "repete 'tás a ver' no final das frases para verificar se o outro está a prestar atenção",
    "diz 'tás a ver só?' para chamar ainda mais a atenção do interlocutor",
    "diz 'viste só?' para enfatizar um ponto na conversa",
    "termina explicações com 'sabes como, né?' esperando que o outro concorde",
    "usa 'sabe como é' no final das frases como muleta de validação",

    // ================================================================
    // VOCATIVOS DE LIGAÇÃO (usados como vírgulas) - Parte 1
    // ================================================================
    "chama toda a gente de 'mano' e 'maninho' para manter o ritmo da conversa",
    "usa 'sócio' ou 'meu sócio' para se dirigir a amigos ou conhecidos",
    "chama os mais novos ou amigos da mesma idade de 'puto'",
    "usa 'wi' para se referir a um amigo ou companheiro ('Eish, meu wi...')",
    "trata desconhecidos ou conhecidos por 'chefe' em qualquer contexto",
    "chama pessoas mais velhas de 'kota' como sinal de respeito, repetindo como tique",
    "usa 'madjé' como sinónimo de amigo ou parceiro",
    "chama os amigos de 'camba' ou 'kamba' constantemente",
    "usa 'kotas' no plural para se referir aos mais velhos",
    "trata os outros por 'mwana' (filho) de forma afetiva",
    "usa 'muadié' para se referir a um indivíduo ou 'cara'",
    "chama as crianças de 'candengue' em qualquer oportunidade",
    "usa 'bro' como abreviação de brother entre os jovens",
    "trata alguém por 'táxi' em tom de brincadeira ou cumplicidade",
    "usa 'tio' e 'tia' para tratar pessoas mais velhas ou conhecidas",
    "chama os pais ou mais velhos de 'velho' e 'velha'",
    "usa 'nha' e 'nhô' como formas de tratamento respeitoso (senhora/senhor)",
    "classifica alguém como 'bacano' quando acha a pessoa fixe",
    "refere-se a alguém como 'gajo' ou 'gaja' de forma informal",
    "chama o irmão ou amigo próximo de 'nengue'",
    "usa 'sekulo' para se referir a um ancião ou mais velho",
    "chama os angolanos negros de 'patrício' em tom de identidade",

    // ================================================================
    // PARTÍCULAS DE ÊNFASE E REFORÇO - Parte 1
    // ================================================================
    "usa 'só' como partícula imperativa ('Deixa só', 'Espera só', 'Vem só')",
    "usa 'já' para dar ideia de imediatismo ('Vou já já', 'É já isso')",
    "usa 'bué' e 'bué de' como intensificador obrigatório para tudo",
    "usa 'mesmo' ou 'memo' para validar algo sem margem para dúvidas",
    "usa 'até' para mostrar limite ou surpresa ('O gajo até fugiu')",
    "usa 'logo' para indicar uma ação fulminante ('Lhe dei logo as costas')",
    "usa 'demais' como intensificador ('Fixe demais')",
    "usa 'cato' como quantificador ou intensificador",
    "usa 'kandi' para enfatizar a quantidade",
    "usa 'nuito' como variação de 'muito'",
    "usa 'bueiro' como forma exagerada de 'bué'",
    "usa 'rebu' para intensificar algo",
    "usa 'kumu' como expressão de ênfase",
    "usa 'tchó' para dar peso à afirmação",
    "diz 'muita cena' para indicar grande quantidade ou intensidade",
    "diz 'lá no alto' para indicar algo extremo",
    "diz 'à brava' para fazer algo com intensidade ou coragem",

    // ================================================================
    // INTERJEIÇÕES E REAÇÕES (Espanto / Dor / Chamada) - Partes 1 e 2
    // ================================================================
    "diz 'eish', 'eia' ou 'ei' para expressar surpresa, exagero ou admiração",
    "diz 'aiuê', 'aie' ou 'ayo' para lamentar, expressar dor, cansaço ou espanto absoluto",
    "diz 'xé' ou 'xé menino' para repreender, chamar a atenção ou reagir a algo forte",
    "diz 'ué' para demonstrar dúvida, estranheza ou quando algo não faz sentido",
    "diz 'anha?' com espanto e descrença, equivalente a um 'O quê?!' prolongado",
    "diz 'fogo' ou 'fogo, mano' para expressar frustração rápida",
    "usa 'aca' ou 'aka' com entoações diferentes para enfado, surpresa ou alegria",
    "diz 'epa' como interjeição de espanto ou chamada",
    "usa 'eh pá' para dar ênfase ou chamar a atenção",
    "usa 'óh' como chamariz ou interjeição",
    "diz 'ui' para expressar susto ou admiração",
    "diz 'hã?' para pedir repetição ou demonstrar dúvida",
    "usa 'hum' como som de concordância ou reflexão",
    "diz 'iá' para concordar ou confirmar",
    "usa 'xê' como interjeição de repreensão",
    "diz 'nzau' como expressão de espanto",
    "diz 'véi' para chamar a atenção de forma coloquial",
    "usa 'kanda' como interjeição de surpresa",
    "diz 'ta bom' para concordar ou confirmar",
    "usa 'tá-se' para indicar que está tudo bem ou aceitação",
    "diz 'tá andar' para indicar que algo está a acontecer ou está certo",
    "usa 'ngó' como interjeição de confirmação",
    "diz 'wé' para expressar choque ou surpresa",
    "diz 'ó meu' para demonstrar espanto ou lamentação",
    "diz 'credo' para expressar nojo ou espanto",
    "diz 'caramba' como expressão de surpresa ou admiração",
    "diz 'juro?' para questionar a veracidade do que foi dito",
    "diz 'só pode' para expressar incredulidade",
    "diz 'não é possível' para demonstrar choque",
    "diz 'aí fogo' como expressão de exasperação",
    "diz 'eh lá' para demonstrar espanto",
    "diz 'nossa' como expressão de surpresa",
    "diz 'valha-me Deus' para expressar susto ou espanto",

    // ================================================================
    // VERBOS E EXPRESSÕES DE AÇÃO (Cacoetes de Ação) - Parte 1
    // ================================================================
    "diz 'dar um toque' para significar ligar ou avisar alguém",
    "usa 'bater papo' para dizer que vai conversar sem compromisso",
    "usa 'bater' para dizer que algo está muito bom ou na moda ('A cena está a bater')",
    "usa 'cuiar' ou 'kuia' para dizer que algo dá muito prazer ou é muito bom",
    "usa 'bazar' para dizer que vai embora ou fugir",
    "diz 'dar uma banda' para dar uma volta ou passear",
    "usa 'fazer uma cena' ou 'o mambo' para substituir qualquer coisa que não apetece especificar",
    "usa 'babular' como sinónimo de falar",
    "usa 'baicar' como gíria para morrer",
    "usa 'bombar' ou 'bumbar' para dizer que está a trabalhar",
    "usa 'bondar' como gíria para matar",
    "usa 'bungular' para se referir a feitiçaria",
    "usa 'bilar' como sinónimo de brigar",
    "usa 'campar' para dizer que vai dormir ou morrer",
    "usa 'canzar' para saquear ou tomar algo para si",
    "usa 'cuatar' para correr atrás ou pegar algo",
    "usa 'cubar' como gíria para dormir",
    "usa 'dicar' para cortejar ou tentar conquistar alguém",
    "usa 'dibingar' como forma infantil ou coloquial de defecar",
    "usa 'estigar' para ridicularizar alguém",
    "usa 'guevar' para comprar em quantidade para revender",
    "usa 'xaxar' para cortejar ou tentar conquistar",
    "usa 'zungar' para vender nas ruas",
    "usa 'tchopar' para atirar (com arco ou fisga)",
    "usa 'calorear' para dizer que está a suar ou transpirar",
    "usa 'aldrabar' como sinónimo de enganar",
    "usa 'amigar' para dizer que está a viver maritalmente",
    "usa 'aleijar' para causar lesão corporal ou ferir",
    "usa 'arrefecer' como sinónimo de esfriar",
    "usa 'apetecer' para despertar interesse ou agradar",
    "usa 'apanhar' para receber ou pegar algo",
    "usa 'apanhar a pata' para ter controlo sobre alguém",

    // ================================================================
    // EXPRESSÕES DE CONFIRMAÇÃO E RESOLUÇÃO - Partes 1 e 2
    // ================================================================
    "diz 'não tem maka' para dizer que não há problema, está tudo resolvido",
    "diz 'na boa' ou 'na pureza' para indicar que está tudo tranquilo",
    "diz 'estamos juntos' ou 'tamo junto' como despedida ou confirmação de lealdade",
    "diz 'fechou' para indicar que o acordo está feito e o assunto arrumado",
    "diz 'é nós' para confirmar parceria ou cumplicidade",
    "diz 'tá certo' para confirmar algo",
    "diz 'tá fixe' para validar uma situação",
    "diz 'sem stress' para tranquilizar",
    "diz 'de boa' para concordar ou mostrar tranquilidade",
    "diz 'é verdade' para confirmar uma informação",
    "diz 'claro' ou 'com certeza' para concordar enfaticamente",
    "diz 'ya, pá' para concordar de forma descontraída",
    "diz 'então é isso' para encerrar um assunto",
    "diz 'pode crer' para demonstrar concordância total",
    "diz 'está feito' para confirmar que algo foi concluído",
    "diz 'assim mesmo' para concordar plenamente",
    "diz 'é assim' para confirmar a realidade dos factos",
    "diz 'tá combinado' para selar um acordo",
    "diz 'é pra já' para indicar que vai fazer algo imediatamente",
    "diz 'está-se' para demonstrar conformismo ou aceitação",
    "diz 'não faz mal' para desdramatizar",
    "diz 'deixa estar' para pedir calma ou para dispensar ajuda",
    "diz 'tá-se bem' para indicar que está bem ou aceita",
    "diz 'vai com calma' para pedir paciência",
    "diz 'não há problema' para tranquilizar",
    "diz 'é no capricho' para dizer que algo será bem feito",
    "diz 'na base da força' ou 'na base da pressão' para dizer que algo é feito com esforço",
    "diz 'é na boa' para confirmar que está tudo bem",
    "diz 'tá na desportiva' para dizer que algo é tranquilo e sem pressão",
    "usa 'a malta' para se referir ao grupo de amigos",
    "usa 'a cena' para se referir a uma situação ou coisa",
    "diz 'isso é que é' para aprovar algo com entusiasmo",
    "diz 'força aí' para dar encorajamento",
    "diz 'tudo na paz' para desejar tranquilidade",

    // ================================================================
    // EXPRESSÕES DE NEGAÇÃO E RECUSA - Parte 2
    // ================================================================
    "diz 'naa' para negar de forma enfática",
    "diz 'nada disso' para rejeitar uma ideia",
    "diz 'nem pensar' para recusar categoricamente",
    "diz 'nem falar' para evitar um assunto",
    "diz 'nem por isso' para discordar parcialmente",
    "diz 'tá mal' para dizer que algo está errado ou não presta",
    "diz 'não dá' para recusar fazer algo",
    "diz 'não mesmo' para negar com ênfase",
    "diz 'de maneira nenhuma' para recusar terminantemente",
    "diz 'tá fora' para rejeitar uma ideia ou convite",
    "diz 'que nada' para desmentir algo",
    "diz 'longe disso' para negar veementemente",
    "diz 'esquece' para descartar um assunto",
    "diz 'não me cheira' para desconfiar de algo",
    "diz 'nem vem' para rejeitar antecipadamente",

    // ================================================================
    // EXPRESSÕES DE APROVAÇÃO, ELOGIO E ADMIRAÇÃO - Parte 2
    // ================================================================
    "diz 'está top' para elogiar algo excelente",
    "diz 'muito bom' para aprovar",
    "diz 'melhor cena' para dizer que é a melhor coisa",
    "diz 'brutal' para dizer que algo é impressionante",
    "diz 'duro' para elogiar algo ou alguém ('É duro!')",
    "diz 'pesado' para dizer que algo é muito bom ou intenso",
    "diz 'firme' para confirmar ou elogiar ('Tá firme!')",
    "diz 'show' para expressar aprovação total",
    "diz 'porreiro' como sinónimo de fixe",
    "diz 'kual' para elogiar ou confirmar",
    "diz 'tás mesmo bem' para elogiar a aparência de alguém",
    "diz 'tá do caraças' para dizer que algo é muito bom",
    "diz 'linda cena' para admirar uma situação",
    "diz 'tá bonito' para aprovar esteticamente",
    "diz 'tá a dar' para dizer que algo está a acontecer ou está na moda",

    // ================================================================
    // EXPRESSÕES DE DISCORDÂNCIA E CRÍTICA - Parte 2
    // ================================================================
    "diz 'não curto' para dizer que não gosta",
    "diz 'isso não' para discordar",
    "diz 'estás a brincar' para expressar incredulidade",
    "diz 'estás a falar a sério?' para questionar a seriedade do outro",
    "diz 'não cola' para dizer que uma ideia não funciona",
    "diz 'não pega' para dizer que algo não é aceite",
    "diz 'é treta' para dizer que algo é mentira ou falso",
    "diz 'tá fraco' para criticar algo inferior",
    "diz 'tá de mais' para dizer que algo é excessivo ou inaceitável",
    "diz 'tá torcido' para dizer que algo está errado ou desonesto",
    "diz 'não faz sentido' para criticar uma lógica",
    "diz 'isso é conversa' para desacreditar o que foi dito",
    "diz 'tá a inventar' para acusar alguém de mentir",

    // ================================================================
    // MOVIMENTO E ROTINA - Parte 2
    // ================================================================
    "diz 'bora' para convidar a ir ou fazer algo",
    "diz 'vamo embora' para se despedir e ir embora",
    "diz 'despacha' para pedir que alguém se apresse",
    "diz 'chega aí' para convidar alguém a aproximar-se",
    "diz 'passa por cá' para convidar a visitar",
    "diz 'vai na frente' para dar prioridade a alguém",
    "diz 'já volto' para indicar que vai regressar rapidamente",
    "diz 'já estou a chegar' para avisar que está perto",
    "diz 'tô na zona' para dizer que está nas proximidades",
    "diz 'tô a caminho' para dizer que está a ir",
    "diz 'tô a sair' para avisar que está a sair",
    "diz 'tô na peça' para dizer que está em casa ou no local",
    "diz 'dá um salto' ou 'dá uma volta' para convidar a dar um passeio",

    // ================================================================
    // FOME, COMIDA E BEBIDA - Parte 2
    // ================================================================
    "diz 'tô com larica' para dizer que está com fome",
    "usa 'mata-bicho' para se referir ao café da manhã",
    "diz 'comer um funje' para se referir à refeição tradicional",
    "diz 'mandar uma zunga' para comer algo na rua",
    "diz 'ir ao prato' para se referir à refeição",
    "diz 'tô cheio' para dizer que está satisfeito",
    "diz 'tô sem massa' para dizer que está sem dinheiro",
    "diz 'arranjar um pitéu' para encontrar comida saborosa",
    "diz 'comer um bitaite' para lanchar",
    "diz 'bater um lanche' para fazer um lanche rápido",
    "diz 'comer qualquer cena' para comer qualquer coisa",
    "diz 'ir buscar marmita' para ir buscar comida",
    "diz 'tomar um refresco' para beber um refrigerante",
    "diz 'matar a fome' para saciar a fome",
    "diz 'comer bom' para dizer que a comida está excelente",

    // ================================================================
    // DINHEIRO, COMPRA E RUA - Parte 2
    // ================================================================
    "diz 'tá caro' ou 'tá mesmo pesado' para reclamar do preço",
    "diz 'não há massa' para dizer que não tem dinheiro",
    "diz 'tô liso' para dizer que está sem dinheiro",
    "diz 'tá-se mal' para dizer que a situação financeira está difícil",
    "diz 'fazer zunga' para vender nas ruas",
    "usa 'quixiquila' para se referir à poupança comunitária rotativa",
    "usa 'candonga' para se referir ao comércio informal",
    "usa 'candongueiro' para se referir ao transporte coletivo (vans)",
    "usa 'quilápi' para venda a crédito ou fiado, e também dívida",
    "usa 'quínguila' para cambista de rua",
    "diz 'dar um jeito' para resolver algo de forma improvisada",
    "diz 'arranjar na chapa' para conseguir algo de forma simples",
    "diz 'comprar no kitanda' para comprar na banca da rua",
    "diz 'vender no muceque' para vender no bairro ou favela",

    // ================================================================
    // PROBLEMA, DIFICULDADE E CANSAÇO - Parte 2
    // ================================================================
    "diz 'tô lixado' para dizer que está em apuros",
    "diz 'tô cansado' ou 'tô morto' para expressar cansaço extremo",
    "diz 'tá difícil' ou 'tá complicado' para descrever uma situação difícil",
    "diz 'tá apertado' para dizer que a situação é desesperadora",
    "diz 'não tá fácil' para lamentar as dificuldades",
    "diz 'tô na luta' ou 'tá na corrida' para dizer que está a trabalhar ou a batalhar",
    "diz 'tô rebentado' ou 'tô estourado' para extremo cansaço",
    "diz 'tô sem cabeça' para estar confuso ou sobrecarregado",
    "diz 'tô no sufoco' para estar em situação difícil",
    "diz 'tá a doer' para expressar dor física ou emocional",
    "diz 'tô sem força' para cansaço físico ou emocional",

    // ================================================================
    // PALAVRAS PARA PESSOAS E COMPORTAMENTOS - Parte 2
    // ================================================================
    "chama alguém de 'matumbo' para ignorante",
    "chama alguém de 'mangonheiro' para preguiçoso",
    "chama alguém de 'fobado' para quem está com fome",
    "chama alguém de 'gandulo' para desocupado",
    "chama alguém de 'malandro' para esperto ou vigarista",
    "chama alguém de 'bacoco' para pessoa atrapalhada",
    "chama alguém de 'fino' para pessoa elegante ou esperta",
    "chama alguém de 'gato' para pessoa atraente ou esperta",
    "chama alguém de 'chicote' para pessoa mandona",
    "chama alguém de 'esperto' ou 'vaidoso' para descrever comportamento",
    "diz que alguém é 'arregaçado' para desenrascado ou corajoso",
    "chama alguém de 'chato' para pessoa irritante",
    "chama alguém de 'falso' para pessoa fingida",
    "chama alguém de 'liso' para pessoa pobre ou sem dinheiro",
    "chama alguém de 'atrevido' para pessoa ousada",
    "diz que alguém é 'firmeza' para pessoa confiável",
    "diz que alguém é 'engraçado' ou 'bolado' para pessoa divertida ou confusa",
    "diz que alguém é 'desenrascado' para quem se safa bem",

    // ================================================================
    // DICIONÁRIO ALFABÉTICO A-Z (PARTE 4) - VOCABULÁRIO E SIGNIFICADOS
    // ================================================================

    // LETRA A
    "usa 'aboamado' para dizer que está admirado",
    "usa 'acabar de matar' para descrever um carro em mau estado",
    "usa 'a dar corda' para dizer que está a avançar",
    "usa 'administria' como sinónimo de ideia",
    "usa 'afobado' para dizer que está com fome",
    "usa 'agarrado' para descrever uma pessoa sovina ou pão-dura",
    "usa 'água-do-chefe' para se referir a cachaça caseira ou aguardente artesanal",
    "usa 'aguentador' para quem não gosta de pagar dívidas",
    "usa 'aí tem gato' para dizer que há confusão ou rolo",
    "usa 'ajindungado' para dizer que algo está temperado com jindungo (picante)",
    "usa 'ajuda-memoria' para aquele que responde sem conhecimento do assunto",
    "usa 'ajuda só' para pedir ajuda de forma coloquial ('Me ajuda só')",
    "usa 'alambamento' para se referir ao dote pago pelo noivo à família da noiva",
    "usa 'alarido' como sinónimo de barulho",
    "usa 'aldrabão' ou 'aldrabona' para enganador ou mentiroso",
    "usa 'altamente' para dizer que algo é top ou excelente",
    "usa 'amarrotar o miúdo' para dizer que bateu no garoto",
    "usa 'ambi' para descrever uma pessoa egoísta",
    "usa 'amigo da onça' para falso amigo ou amigo aproveitador",
    "usa 'amirou' para dizer que falou à toa, falou demais ou disse besteira",
    "usa 'andar à buti' para andar a pé ou perambular",
    "usa 'angolar' para se referir à antiga moeda angolana",
    "usa 'angolês' para a mistura de calão com expressões de diversas regiões",
    "usa 'anhara' para planície arenosa",
    "usa 'ao lume' para dizer que está ao fogo",
    "usa 'apagar o maçarico' como gíria para morrer ou falecer",
    "usa 'apanhada' para descrever uma coisa grande",
    "usa 'apanhadinha' para dizer que está apaixonada",
    "usa 'apanhadinhos' para coisas pequenas",
    "usa 'aparece aí' para convidar alguém a vir ('Venha cá')",
    "usa 'aparecedor' para descrever alguém exibido que gosta de aparecer",
    "usa 'apertar o cú' para desejar má sorte ou conspirar",
    "usa 'a processar' para dizer que está a andar ou a avançar",
    "usa 'aqueceu' para dizer que o clima esquentou ou o ambiente está tenso",
    "usa 'aranha' como gíria para ladrão ou gatuno",
    "usa 'arca' para se referir a freezer horizontal",
    "usa 'arimo' para pequena propriedade agrícola",
    "usa 'armado em carapau de corridas' para quem está armado em esperto",
    "usa 'armado em justo' para metido a besta ou falso santo",
    "usa 'arquiado' ou 'cambaio' para pessoa de pernas tortas",
    "usa 'arrasca' para pessoa sem parceiro(a) ou também para aflição",
    "usa 'arrombeu' para se referir ao arroz",
    "usa 'arroz de vidro' para arroz doce",
    "usa 'asparvo' para tolo",
    "usa 'à sua cota' como expressão para 'à sua mãe'",
    "usa 'aterrou' para dizer que aterrissou",
    "usa 'atirou pedras' para dizer que falou errado a palavra",
    "usa 'avilo' ou 'dikamba' para amigo",

    // LETRA B
    "usa 'babular' para falar",
    "usa 'babulo' para dizer que tem problema",
    "usa 'baica' para se referir a telefone móvel",
    "usa 'baio' para briga, dançar ou lutar",
    "usa 'balas' como gíria para dinheiro",
    "usa 'baliza' para limite",
    "usa 'banda' para lugar ou local",
    "usa 'banga' para estilo ou vaidade",
    "usa 'bangão' para vaidoso",
    "usa 'banzo' para admirado ou pasmado",
    "usa 'banzelar' como verbo *kubanza*",
    "usa 'bassula' para arte marcial angolana ou rasteira",
    "usa 'bate-chapas' como pejorativo para fotógrafo",
    "usa 'bazeza' para tolo, bobo ou idiota",
    "usa 'bazo' para saio",
    "usa 'beber umas birras' para beber umas cervejas",
    "usa 'bem cacimbado' para dizer que está com algum tempo de sobra",
    "usa 'bill gates' para pessoa com computador muito antigo",
    "usa 'bisno' para negócio ou esquema (geralmente fraudulento)",
    "usa 'bitacaia' para bicho-do-pé",
    "usa 'biva' para casa",
    "usa 'blue de pássaro' para dizer que quer uma cerveja Cuca",
    "usa 'boda' para qualquer festa",
    "usa 'boelar' para ser passivo, não reagir ou ser burro",
    "usa 'boelo' para pessoa estúpida",
    "usa 'boi-cavalo' para gnu",
    "usa 'bunda' para nádegas",
    "usa 'buti' (ver andar à buti)",

    // LETRA C
    "usa 'caama' para antílope (*Alcelaphus caama*)",
    "usa 'cabíri' para vira-lata (cão)",
    "usa 'cabolocosso' para etcétera",
    "usa 'cacimba' para poço com água ou nevoeiro",
    "usa 'cacimbo' para seca ou estiagem",
    "usa 'calça queima bilhas' para calça muito justa",
    "usa 'calema' para forte ressaca (ondulação)",
    "usa 'cambaio' (ver arquiado)",
    "usa 'cambuta' para pessoa baixa",
    "usa 'camoelo' ou 'camuelo' para avarento",
    "usa 'camundanda' (ver capuete)",
    "usa 'candando' para abraço",
    "usa 'canvuanza' para confusão ou desordem",
    "usa 'capuete' para etcétera",
    "usa 'cará' para batata-doce",
    "usa 'cassumbular' (termo mencionado em contexto)",
    "usa 'catato' para lagarta comestível",
    "usa 'catolotolo' para doença com febre (chicungunha)",
    "usa 'caxexe' para fazer algo às escondidas ou em segredo",
    "usa 'caxico' para criado ou empregado",
    "usa 'chango' para antílope (*Redunca redunca*)",
    "usa 'chifuta' para estilingue ou fisga",
    "usa 'chota' para espaço circular para reuniões",
    "usa 'chuimga' ou 'chuinga' para chiclete",
    "usa 'cubico' para casa ou quarto",
    "usa 'cuele' para pássaro (*Saxicola aurita*)",
    "usa 'cumbu' ou 'kumbú' para dinheiro",
    "usa 'cunanga' para desocupado ou vadio",
    "usa 'cupapata' para moto (motocicleta) ou mototaxista",

    // LETRA D
    "usa 'dá uma blue de pássaro' para pedir uma cerveja Cuca",
    "usa 'dar bilingue' para mentir ou enganar",
    "usa 'dar gasosa' para entregar gorjeta, gratificação ou suborno",
    "usa 'dar jajão' para simular ou ameaçar",
    "usa 'dar um papo recto' para falar seriamente",
    "usa 'deixa mbora' como expressão coloquial",
    "usa 'dibinga' para fezes ou cocó",
    "usa 'dibute' para ferida",
    "usa 'dicanza' para reco-reco (instrumento musical)",
    "usa 'dikulu' como apelo à justiça",
    "usa 'dinhângua' para abóbora",
    "usa 'dinhungo' para abobrinha",
    "usa 'dipanda' para independência",
    "usa 'dixita' para lixeira",

    // LETRA E
    "usa 'esquebra' para brinde do vendedor ou desconto",
    "usa 'estão a gelar' para dizer que estão a beber cerveja",
    "usa 'estou paiado' para dizer que está metido em problemas ou ressacado",

    // LETRA F
    "usa 'farra' para festa",
    "usa 'faz rir' como gíria para dinheiro",
    "usa 'fimba' para mergulho",
    "usa 'fino' para chopp",
    "usa 'fixe' para bom ou bem",
    "usa 'fubá' para espécie de bolo",
    "usa 'funje' para pirão de farinha de mandioca",

    // LETRA G
    "usa 'garina' para garota ou namorada",
    "usa 'gasosa' para refrigerante",
    "usa 'geleira' (termo do calão)",
    "usa 'golungo' para gazela-pintada",
    "usa 'gueva' para pessoa que compra para revender",

    // LETRA H
    "usa 'hábia' para axila, sovaco ou mau cheiro",

    // LETRA I
    "usa 'imbamba' para coisa, pertence ou bagagem",

    // LETRA J
    "usa 'jajão' para mentira",
    "usa 'javite' para pequeno machado tribal",
    "usa 'jende' para vaca idosa",
    "usa 'jimbolamento' para apresentação inicial ou introdução",
    "usa 'jimbolo' para pão",
    "usa 'jimbololo' para jacaré-anão",
    "usa 'jimbamba' para coisas",
    "usa 'jindungo' para pimenta-malagueta",
    "usa 'jingongo' para gêmeo",
    "usa 'jinguba' para amendoim",

    // LETRA K (além dos já listados)
    "usa 'kandengue' para criança",
    "usa 'kilapi' (termo mencionado)",
    "usa 'kunga' para castigo",

    // LETRA L
    "usa 'levar um mambo militar' para ser submetido a uma reação extrema",
    "usa 'lombongo' para dinheiro",

    // LETRA M
    "usa 'mabuba' para catarata ou cachoeira",
    "usa 'maca' ou 'maka' para questão ou problema",
    "usa 'machimbombo' para ônibus",
    "usa 'magoga' para sanduíche de frango",
    "usa 'malaico' para algo ruim que não presta",
    "usa 'mambo' para coisa, regra ou conversa",
    "usa 'mambo rijo' para algo significante ou coisa grande",
    "usa 'mamoite' para mãe",
    "usa 'mangonha' para fingimento ou preguiça",
    "usa 'maqueiro' para criador de problemas",
    "usa 'maqueso' para mistura de noz-de-cola com gengibre",
    "usa 'massemba' para dança com umbigadas",
    "usa 'mata-bicho' para café da manhã",
    "usa 'mataco' para traseiro ou bunda",
    "usa 'maxim' para facão",
    "usa 'mbanje' para casa",
    "usa 'mbeta' (termo do calão)",
    "usa 'mboa' para mulher",
    "usa 'micate' para bolinho tipo 'sonho'",
    "usa 'mice' para boa",
    "usa 'micha' para negócio",
    "usa 'moleque' para miúdo",
    "usa 'mona' para filho ou filha",
    "usa 'monangamba' para carregador",
    "usa 'motorola' para pão com frango",
    "usa 'muamba' para carga ou fardo",
    "usa 'muambo' (plural de muamba)",
    "usa 'mucanda' para carta, mensagem ou ritual de circuncisão",
    "usa 'mujimbo' para boato ou rumor",
    "usa 'mulemba' para figueira (*Ficus thonningii*)",
    "usa 'multicaixa' para caixa eletrónico",
    "usa 'munda' para morro",
    "usa 'munhungo' para vida libertina ou prostituição",
    "usa 'musseque' para favela ou bairro de lata",
    "usa 'muteta' para prato de abóbora com carne",
    "usa 'mutombo' para toucinho cozido",
    "usa 'muxarico' para espátula para amassar o funje",
    "usa 'muxima' para coração",
    "usa 'mwangolé' para angolano",

    // LETRA N
    "usa 'não há maca' para dizer que não há problema",
    "usa 'não maia' para dizer que não falha ou não vacila",
    "usa 'ngimbi' (termo do calão)",
    "usa 'nguelé' (termo do calão)",
    "usa 'nos corre' para negócio",

    // LETRA O
    "usa 'olongo' para cudo (*Tragelaphus strepsiceros*)",
    "usa 'onça' para leopardo",

    // LETRA P
    "usa 'pinhanha' para dinheiro",
    "usa 'pitéu' para comida",

    // LETRA Q
    "usa 'quianda' para sereia",
    "usa 'quibiona' para peteleco nas nádegas",
    "usa 'quijila' para quezília, desentendimento, tabu ou dieta",
    "usa 'quijirila' para amizade",
    "usa 'quissanje' para instrumento musical",
    "usa 'quissanga' para pequena baía",
    "usa 'quissende' para patada, coice ou resposta negativa",
    "usa 'quissongo' para úlcera",
    "usa 'quitaba' para pasta de amendoim",
    "usa 'quixima' para poço de água",
    "usa 'quizaca' para comida de folhas de mandioca",
    "usa 'quizango' para feitiço",

    // LETRA R
    "usa 'ruca' para carro",

    // LETRA S
    "usa 'sai voado' para ir embora",
    "usa 'samba' para a dança",
    "usa 'sapalalo' para casa de madeira de dois andares",
    "usa 'sculão' (termo do calão)",
    "usa 'semba' para a dança",
    "usa 'sipaio' para policial ou soldado",
    "usa 'sukula zuata' (expressão idiomática)",

    // LETRA T
    "usa 'tapado' (termo do calão)",
    "usa 'tarraxinha' para dança sensual",
    "usa 'taxista' para condutor de candongueiro",
    "usa 'tirar o pé' para ir embora",
    "usa 'tirosa' para ir embora",
    "usa 'tuga' para português (pejorativo)",
    "usa 'turra' para terrorista",
    "usa 'txube' para casa",

    // LETRA V
    "usa 'ver bilhas' ou 'ver fumo' para ter dificuldade",
    "usa 'vijú' (termo do calão) pessoa com visão, astúcia, atenta",
    "usa 'vou fugar' para fugir de uma obrigação",

    // LETRA W
    "usa 'wi deuro tipo pão de anteontem' para pessoa inteligente ou de muita posse",
    "usa 'wi duro' para pessoa inteligente ou de muita posse",
    "usa 'wi rijo' para pessoa inteligente ou de muita posse",

    // LETRA X
    "usa 'xandula' para sanduíche",
    "usa 'ximba' para policial ou soldado",
    "usa 'xinguilar' para estremecer os ombros e o corpo",
    "usa 'xipala' para cara, rosto, cabeça ou retrato",
    "usa 'xitaca' para chácara ou propriedade rural",

    // LETRA Z
    "usa 'zala' para fome",
    "usa 'zunga' para venda nas ruas",
    "usa 'zungueiro' ou 'zungueira' para vendedor(a) ambulante",

    // ================================================================
    // TICS FÍSICOS E SONOROS (Acompanham a fala) - Parte 1
    // ================================================================
    "estala os dedos junto com um 'Eish!' para enfatizar o quão inacreditável é a história",
    "coloca a mão na boca ou na cabeça como tique corporal de espanto ou problemas",
    "dá um assobio curto para chamar alguém na rua ou demonstrar admiração"
};

    private readonly ConcurrentDictionary<Guid, FimbuSessionMood> _activeMoods = new();

    public FimbuSessionMood GetOrAssignSessionMood(Guid userId)
    {
        return _activeMoods.GetOrAdd(userId, _ => Sortear(previous: null));
    }

    public void ClearSessionMood(Guid userId)
    {
        _activeMoods.TryRemove(userId, out _);
    }

    private static FimbuSessionMood Sortear(FimbuSessionMood? previous)
    {
        var random = Random.Shared;
        FimbuSessionMood combinacao;
        var tentativas = 0;

        // Evita sortear exactamente a mesma combinação da sessão anterior deste
        // utilizador. Limite de tentativas para nunca entrar em loop infinito.
        do
        {
            combinacao = new FimbuSessionMood(
                PrimaryTrait: Traits[random.Next(Traits.Length)],
                SecondaryTrait: Traits[random.Next(Traits.Length)],
                EnergyLevel: EnergyLevels[random.Next(EnergyLevels.Length)],
                VerbalTic: VerbalTics[random.Next(VerbalTics.Length)],
                Temperature: SortearTemperatura(random)
            );
            tentativas++;
        }
        while (previous is not null
               && combinacao.Equals(previous.Value)
               && tentativas < 5);

        return combinacao;
    }

    /// <summary>
    /// Intervalo entre 0.85 e 1.15 — variação perceptível a nível textual da
    /// própria chamada à API, sem comprometer a coerência das respostas.
    /// </summary>
    private static double SortearTemperatura(Random random)
    {
        return 0.85 + (random.NextDouble() * 0.30);
    }
}

/// <summary>
/// Representa a combinação de personalidade sorteada para uma sessão,
/// incluindo a temperatura sugerida para a chamada ao modelo.
/// </summary>
public readonly record struct FimbuSessionMood(
    string PrimaryTrait,
    string SecondaryTrait,
    string EnergyLevel,
    string VerbalTic,
    double Temperature);