using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace NzolaNet.Application.Interfaces;

public interface IStorageService
{
    Task<string> SaveFileAsync(IFormFile file, string folderName);
    Task<string> SaveFileAsync(IFormFile file, string folderName, string fileName);
    void DeleteFile(string filePath);
}
