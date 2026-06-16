using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using NzolaNet.Domain.Entities;

namespace NzolaNet.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Post> Posts { get; set; } = null!;
    public DbSet<Comment> Comments { get; set; } = null!;
    public DbSet<Follow> Follows { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        // IMPORTANTE: Chamar o OnModelCreating da classe base para configurar as tabelas nativas do Identity
        base.OnModelCreating(builder);

        // Configuração de Post
        builder.Entity<Post>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Text).IsRequired().HasMaxLength(1000);
            entity.Property(p => p.ImagePath).HasMaxLength(500);
            entity.Property(p => p.VideoPath).HasMaxLength(500);

            // Relação Post -> User (1 para N)
            entity.HasOne(p => p.User)
                  .WithMany(u => u.Posts)
                  .HasForeignKey(p => p.UserId)
                  .OnDelete(DeleteBehavior.Cascade); // Se o utilizador for apagado, os posts são apagados
        });

        // Configuração de Comment
        builder.Entity<Comment>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Text).IsRequired().HasMaxLength(500);

            // Relação Comment -> User (1 para N)
            entity.HasOne(c => c.User)
                  .WithMany(u => u.Comments)
                  .HasForeignKey(c => c.UserId)
                  .OnDelete(DeleteBehavior.Restrict); // Evitar múltiplos caminhos de eliminação em cascata

            // Relação Comment -> Post (1 para N)
            entity.HasOne(c => c.Post)
                  .WithMany(p => p.Comments)
                  .HasForeignKey(c => c.PostId)
                  .OnDelete(DeleteBehavior.Cascade); // Se o post for apagado, os comentários são apagados
        });

        // Configuração de Follow (Tabela de Seguidores)
        builder.Entity<Follow>(entity =>
        {
            entity.HasKey(f => f.Id);

            // Relação Follower -> User (quem segue)
            entity.HasOne(f => f.Follower)
                  .WithMany(u => u.Following)
                  .HasForeignKey(f => f.FollowerId)
                  .OnDelete(DeleteBehavior.Restrict); // Evita caminhos de eliminação múltipla em cascata

            // Relação Followed -> User (quem é seguido)
            entity.HasOne(f => f.Followed)
                  .WithMany(u => u.Followers)
                  .HasForeignKey(f => f.FollowedId)
                  .OnDelete(DeleteBehavior.Restrict); // Evita caminhos de eliminação múltipla em cascata

            // Índice Único: Impede que o mesmo utilizador siga a mesma pessoa mais de uma vez
            entity.HasIndex(f => new { f.FollowerId, f.FollowedId }).IsUnique();
        });
    }
}
