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
    public DbSet<Like> Likes { get; set; } = null!;
    public DbSet<Notification> Notifications { get; set; } = null!;
    public DbSet<Conversation> Conversations { get; set; } = null!;
    public DbSet<ConversationParticipant> ConversationParticipants { get; set; } = null!;
    public DbSet<Message> Messages { get; set; } = null!;
    public DbSet<MessageReaction> MessageReactions { get; set; } = null!;
    public DbSet<Repost> Reposts { get; set; } = null!;
    public DbSet<Bookmark> Bookmarks { get; set; } = null!;
    public DbSet<MessageUserHide> MessageUserHides { get; set; } = null!;
    public DbSet<ContentReport> ContentReports { get; set; } = null!;
    public DbSet<Feedback> Feedbacks { get; set; } = null!;
    public DbSet<PlatformCounter> PlatformCounters { get; set; } = null!;
    public DbSet<FimbuUserActivity> FimbuUserActivities { get; set; } = null!;

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

            entity.HasOne(p => p.QuotedPost)
                  .WithMany()
                  .HasForeignKey(p => p.QuotedPostId)
                  .OnDelete(DeleteBehavior.Restrict);

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
            entity.Property(c => c.Text).IsRequired().HasMaxLength(1000);
            entity.Property(c => c.ImagePath).HasMaxLength(500);
            entity.Property(c => c.VideoPath).HasMaxLength(500);

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

        builder.Entity<Like>(entity =>
        {
            entity.HasKey(l => l.Id);

            entity.HasOne(l => l.User)
                  .WithMany()
                  .HasForeignKey(l => l.UserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(l => l.Post)
                  .WithMany(p => p.Likes)
                  .HasForeignKey(l => l.PostId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(l => new { l.UserId, l.PostId }).IsUnique();
        });

        builder.Entity<Notification>(entity =>
        {
            entity.HasKey(n => n.Id);
            entity.Property(n => n.Type).IsRequired().HasMaxLength(32);
            entity.Property(n => n.MessagePreview).HasMaxLength(200);

            entity.HasOne(n => n.Recipient)
                  .WithMany()
                  .HasForeignKey(n => n.RecipientId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(n => n.Actor)
                  .WithMany()
                  .HasForeignKey(n => n.ActorId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(n => n.Publication)
                  .WithMany()
                  .HasForeignKey(n => n.PublicationId)
                  .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(n => n.Comment)
                  .WithMany()
                  .HasForeignKey(n => n.CommentId)
                  .OnDelete(DeleteBehavior.NoAction);

            entity.HasIndex(n => new { n.RecipientId, n.IsRead, n.CreatedAt });
        });

        builder.Entity<Repost>(entity =>
        {
            entity.HasKey(r => r.Id);

            entity.HasOne(r => r.User)
                  .WithMany()
                  .HasForeignKey(r => r.UserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.Post)
                  .WithMany()
                  .HasForeignKey(r => r.PostId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(r => new { r.UserId, r.PostId }).IsUnique();
            entity.HasIndex(r => r.PostId);
        });

        builder.Entity<Conversation>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Title).HasMaxLength(100);
            entity.Property(c => c.Description).HasMaxLength(500);
            entity.Property(c => c.ImagePath).HasMaxLength(500);
            entity.Property(c => c.IsGroup).HasDefaultValue(false);
            entity.Property(c => c.CreatedAt).IsRequired();
            entity.Property(c => c.UpdatedAt).IsRequired();
        });

        builder.Entity<ConversationParticipant>(entity =>
        {
            entity.HasKey(p => p.Id);

            entity.HasOne(p => p.Conversation)
                  .WithMany(c => c.Participants)
                  .HasForeignKey(p => p.ConversationId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(p => p.User)
                  .WithMany()
                  .HasForeignKey(p => p.UserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(p => new { p.ConversationId, p.UserId }).IsUnique();
            entity.HasIndex(p => p.UserId);
        });

        builder.Entity<Message>(entity =>
        {
            entity.HasKey(m => m.Id);
            entity.Property(m => m.Text).IsRequired().HasMaxLength(2000);
            entity.Property(m => m.ImagePath).HasMaxLength(500);
            entity.Property(m => m.VideoPath).HasMaxLength(500);
            entity.Property(m => m.RemoteImageUrl).HasMaxLength(1000);

            entity.HasOne(m => m.Conversation)
                  .WithMany(c => c.Messages)
                  .HasForeignKey(m => m.ConversationId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(m => m.Sender)
                  .WithMany()
                  .HasForeignKey(m => m.SenderId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(m => m.ReplyTo)
                  .WithMany()
                  .HasForeignKey(m => m.ReplyToMessageId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(m => new { m.ConversationId, m.CreatedAt });
        });

        builder.Entity<MessageReaction>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.Property(r => r.Emoji).IsRequired().HasMaxLength(32);

            entity.HasOne(r => r.Message)
                  .WithMany()
                  .HasForeignKey(r => r.MessageId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(r => r.User)
                  .WithMany()
                  .HasForeignKey(r => r.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(r => new { r.MessageId, r.UserId }).IsUnique();
            entity.HasIndex(r => r.MessageId);
        });

        builder.Entity<MessageUserHide>(entity =>
        {
            entity.HasKey(h => h.Id);

            entity.HasOne(h => h.Message)
                  .WithMany()
                  .HasForeignKey(h => h.MessageId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(h => h.User)
                  .WithMany()
                  .HasForeignKey(h => h.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(h => new { h.MessageId, h.UserId }).IsUnique();
            entity.HasIndex(h => h.UserId);
        });

        builder.Entity<Bookmark>(entity =>
        {
            entity.HasKey(bookmark => bookmark.Id);

            entity.HasOne(bookmark => bookmark.User)
                  .WithMany()
                  .HasForeignKey(bookmark => bookmark.UserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(bookmark => bookmark.Post)
                  .WithMany()
                  .HasForeignKey(bookmark => bookmark.PostId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(bookmark => new { bookmark.UserId, bookmark.PostId }).IsUnique();
            entity.HasIndex(bookmark => bookmark.PostId);
        });

        builder.Entity<ContentReport>(entity =>
        {
            entity.HasKey(report => report.Id);
            entity.Property(report => report.TargetType).IsRequired().HasMaxLength(20);
            entity.Property(report => report.Reason).IsRequired().HasMaxLength(80);
            entity.Property(report => report.Details).HasMaxLength(600);
            entity.Property(report => report.CreatedAt).IsRequired();

            entity.HasOne(report => report.Reporter)
                  .WithMany()
                  .HasForeignKey(report => report.ReporterId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(report => new { report.ReporterId, report.TargetType, report.TargetId }).IsUnique();
            entity.HasIndex(report => new { report.TargetType, report.TargetId });
        });

        builder.Entity<Feedback>(entity =>
        {
            entity.HasKey(feedback => feedback.Id);
            entity.Property(feedback => feedback.Message).IsRequired().HasMaxLength(4000);
            entity.Property(feedback => feedback.CreatedAt).IsRequired();

            entity.HasOne(feedback => feedback.User)
                  .WithMany()
                  .HasForeignKey(feedback => feedback.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(feedback => feedback.CreatedAt);
            entity.HasIndex(feedback => feedback.UserId);
        });

        builder.Entity<PlatformCounter>(entity =>
        {
            entity.HasKey(counter => counter.Key);
            entity.Property(counter => counter.Key).HasMaxLength(80);
        });

        builder.Entity<FimbuUserActivity>(entity =>
        {
            entity.HasKey(activity => activity.UserId);
            entity.HasIndex(activity => activity.Interactions);
        });
    }
}
