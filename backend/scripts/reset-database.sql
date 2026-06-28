SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

-- Full reset: removes all users and content. Restart the API to seed a new admin from appsettings SeedAdmin.
BEGIN TRANSACTION;

DELETE FROM Likes;
DELETE FROM Comments;
DELETE FROM Follows;
DELETE FROM Posts;

DELETE FROM AspNetUserRoles;
DELETE FROM AspNetUserClaims;
DELETE FROM AspNetUserLogins;
DELETE FROM AspNetUserTokens;
DELETE FROM AspNetUsers;

COMMIT TRANSACTION;

SELECT COUNT(*) AS RemainingUsers FROM AspNetUsers;
SELECT COUNT(*) AS RemainingPosts FROM Posts;
