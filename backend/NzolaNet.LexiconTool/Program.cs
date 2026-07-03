using NzolaNet.Application.Services.Fimbu.Lexicon;

var repoRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
var markdownPath = Path.Combine(repoRoot, "palavras_angolanas", "dicionario_angolano.md");

if (!File.Exists(markdownPath))
{
    Console.Error.WriteLine($"Ficheiro não encontrado: {markdownPath}");
    return 1;
}

var source = await File.ReadAllTextAsync(markdownPath);
var parsed = FimbuLexiconMdParser.Parse(source);

if (parsed.Entries.Count == 0)
{
    Console.Error.WriteLine("Nenhuma entrada encontrada no Markdown.");
    return 1;
}

var reorganized = FimbuLexiconMdParser.Write(parsed.Entries);
var backupPath = markdownPath + ".bak";

if (!File.Exists(backupPath))
{
    await File.WriteAllTextAsync(backupPath, source);
}

await File.WriteAllTextAsync(markdownPath, reorganized);
Console.WriteLine($"Markdown reorganizado: {parsed.Entries.Count} entradas em {markdownPath}");
return 0;
