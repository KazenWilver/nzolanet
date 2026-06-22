-- Database Schema for NzolaNet (SQL Server Compatible DDL)

-- 1. ASP.NET Identity Core Users Table
CREATE TABLE [AspNetUsers] (
    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    [UserName] NVARCHAR(256) NULL,
    [NormalizedUserName] NVARCHAR(256) NULL,
    [Email] NVARCHAR(256) NULL,
    [NormalizedEmail] NVARCHAR(256) NULL,
    [EmailConfirmed] BIT NOT NULL,
    [PasswordHash] NVARCHAR(MAX) NULL,
    [SecurityStamp] NVARCHAR(MAX) NULL,
    [ConcurrencyStamp] NVARCHAR(MAX) NULL,
    [PhoneNumber] NVARCHAR(MAX) NULL,
    [PhoneNumberConfirmed] BIT NOT NULL,
    [TwoFactorEnabled] BIT NOT NULL,
    [LockoutEnd] DATETIMEOFFSET NULL,
    [LockoutEnabled] BIT NOT NULL,
    [AccessFailedCount] INT NOT NULL,
    [ProfilePhoto] NVARCHAR(500) NULL,
    [IsPrivate] BIT NOT NULL DEFAULT 0,
    [Bio] NVARCHAR(MAX) NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NULL
);

-- 2. Posts Table (Tweets)
CREATE TABLE [Posts] (
    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [Text] NVARCHAR(1000) NOT NULL,
    [ImagePath] NVARCHAR(500) NULL,
    [VideoPath] NVARCHAR(500) NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NULL,
    CONSTRAINT [FK_Posts_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);

-- 3. Comments Table (Replies)
CREATE TABLE [Comments] (
    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [PostId] UNIQUEIDENTIFIER NOT NULL,
    [Text] NVARCHAR(500) NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NULL,
    CONSTRAINT [FK_Comments_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Comments_Posts_PostId] FOREIGN KEY ([PostId]) REFERENCES [Posts] ([Id]) ON DELETE CASCADE
);

-- 4. Follows Table (Followers/Following)
CREATE TABLE [Follows] (
    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    [FollowerId] UNIQUEIDENTIFIER NOT NULL,
    [FollowedId] UNIQUEIDENTIFIER NOT NULL,
    [IsApproved] BIT NOT NULL DEFAULT 1,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [FK_Follows_AspNetUsers_FollowerId] FOREIGN KEY ([FollowerId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Follows_AspNetUsers_FollowedId] FOREIGN KEY ([FollowedId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION
);
CREATE UNIQUE INDEX [IX_Follows_FollowerId_FollowedId] ON [Follows] ([FollowerId], [FollowedId]);

-- 5. Likes Table
CREATE TABLE [Likes] (
    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [PostId] UNIQUEIDENTIFIER NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NULL,
    CONSTRAINT [FK_Likes_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Likes_Posts_PostId] FOREIGN KEY ([PostId]) REFERENCES [Posts] ([Id]) ON DELETE CASCADE
);
CREATE UNIQUE INDEX [IX_Likes_UserId_PostId] ON [Likes] ([UserId], [PostId]);
