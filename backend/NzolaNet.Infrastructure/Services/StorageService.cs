using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Infrastructure.Services;

public class StorageService : IStorageService
{
    private readonly IWebHostEnvironment _env;

    public StorageService(IWebHostEnvironment env)
    {
        _env = env;
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

        var relativePath = filePath.TrimStart('/');
        var rootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var fullPath = Path.Combine(rootPath, relativePath);

        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }
    }
}
