using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Infrastructure.Services;

public class StorageService : IStorageService
{
    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _config;
    private static readonly HttpClient _httpClient = new HttpClient();

    public StorageService(IWebHostEnvironment env, IConfiguration config)
    {
        _env = env;
        _config = config;
    }

    public async Task<string> SaveFileAsync(IFormFile file, string folderName)
    {
        var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
        return await SaveFileAsync(file, folderName, uniqueFileName);
    }

    public async Task<string> SaveFileAsync(IFormFile file, string folderName, string fileName)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("O ficheiro está vazio.");

        var supabaseUrl = _config["Supabase:Url"] ?? Environment.GetEnvironmentVariable("SUPABASE_URL");
        var supabaseKey = _config["Supabase:Key"] ?? Environment.GetEnvironmentVariable("SUPABASE_KEY");
        var bucketName = _config["Supabase:Bucket"] ?? Environment.GetEnvironmentVariable("SUPABASE_BUCKET") ?? "nzolanet";

        if (!string.IsNullOrEmpty(supabaseUrl) && !string.IsNullOrEmpty(supabaseKey))
        {
            try
            {
                var baseUrl = supabaseUrl.TrimEnd('/');
                var relativePath = $"{folderName.Trim('/')}/{fileName}";
                var uploadUrl = $"{baseUrl}/storage/v1/object/{bucketName}/{relativePath}";

                using (var memoryStream = new MemoryStream())
                {
                    await file.CopyToAsync(memoryStream);
                    var fileBytes = memoryStream.ToArray();

                    using (var request = new HttpRequestMessage(HttpMethod.Post, uploadUrl))
                    {
                        request.Headers.Add("apikey", supabaseKey);
                        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", supabaseKey);
                        request.Headers.Add("x-upsert", "true");

                        var content = new ByteArrayContent(fileBytes);
                        content.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType ?? "application/octet-stream");
                        request.Content = content;

                        var response = await _httpClient.SendAsync(request);
                        if (response.IsSuccessStatusCode)
                        {
                            return $"{baseUrl}/storage/v1/object/public/{bucketName}/{relativePath}";
                        }
                        else
                        {
                            var errorMsg = await response.Content.ReadAsStringAsync();
                            Console.WriteLine($"Erro ao fazer upload para o Supabase Storage: {response.StatusCode} - {errorMsg}");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Excepção ao fazer upload para o Supabase Storage: {ex.Message}");
            }
        }

        // FALLBACK: Local storage
        var rootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var uploadsFolder = Path.Combine(rootPath, folderName);

        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var fileStream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(fileStream);
        }

        return Path.Combine("/", folderName, fileName).Replace("\\", "/");
    }

    public void DeleteFile(string filePath)
    {
        if (string.IsNullOrEmpty(filePath)) return;

        var supabaseUrl = _config["Supabase:Url"] ?? Environment.GetEnvironmentVariable("SUPABASE_URL");
        var supabaseKey = _config["Supabase:Key"] ?? Environment.GetEnvironmentVariable("SUPABASE_KEY");
        var bucketName = _config["Supabase:Bucket"] ?? Environment.GetEnvironmentVariable("SUPABASE_BUCKET") ?? "nzolanet";

        if (!string.IsNullOrEmpty(supabaseUrl) && !string.IsNullOrEmpty(supabaseKey) && filePath.StartsWith("http"))
        {
            try
            {
                var baseUrl = supabaseUrl.TrimEnd('/');
                var prefix = $"{baseUrl}/storage/v1/object/public/{bucketName}/";
                if (filePath.StartsWith(prefix))
                {
                    var relativePath = filePath.Substring(prefix.Length);
                    var deleteUrl = $"{baseUrl}/storage/v1/object/{bucketName}/{relativePath}";

                    var request = new HttpRequestMessage(HttpMethod.Delete, deleteUrl);
                    request.Headers.Add("apikey", supabaseKey);
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", supabaseKey);

                    Task.Run(async () =>
                    {
                        try
                        {
                            var response = await _httpClient.SendAsync(request);
                            if (!response.IsSuccessStatusCode)
                            {
                                var errorMsg = await response.Content.ReadAsStringAsync();
                                Console.WriteLine($"Erro ao apagar no Supabase Storage: {response.StatusCode} - {errorMsg}");
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Excepção ao apagar no Supabase Storage: {ex.Message}");
                        }
                    });
                    return;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao processar delete do Supabase: {ex.Message}");
            }
        }

        var relativePathLocal = filePath.TrimStart('/');
        var rootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var fullPath = Path.Combine(rootPath, relativePathLocal);

        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }
    }
}
