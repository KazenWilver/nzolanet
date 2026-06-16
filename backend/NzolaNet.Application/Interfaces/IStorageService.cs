using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace NzolaNet.Application.Interfaces;

public interface IStorageService
{
    Task<string> SaveFileAsync(IFormFile file, string folderName);
    void DeleteFile(string filePath);
}
