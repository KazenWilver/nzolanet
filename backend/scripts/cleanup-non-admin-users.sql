SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

-- Removes all non-admin users and content. For a full wipe including admin, use reset-database.sql instead.
BEGIN TRANSACTION;

DELETE FROM Notifications;
DELETE FROM Likes;
DELETE FROM Comments;
DELETE FROM Follows;
DELETE FROM Posts;

DELETE FROM AspNetUserRoles
WHERE UserId IN (SELECT Id FROM AspNetUsers WHERE Email <> 'admin@nzolanet.app');

DELETE FROM AspNetUserClaims
WHERE UserId IN (SELECT Id FROM AspNetUsers WHERE Email <> 'admin@nzolanet.app');

DELETE FROM AspNetUserLogins
WHERE UserId IN (SELECT Id FROM AspNetUsers WHERE Email <> 'admin@nzolanet.app');

DELETE FROM AspNetUserTokens
WHERE UserId IN (SELECT Id FROM AspNetUsers WHERE Email <> 'admin@nzolanet.app');

DELETE FROM AspNetUsers
WHERE Email <> 'admin@nzolanet.app';

COMMIT TRANSACTION;

SELECT COUNT(*) AS RemainingUsers FROM AspNetUsers;
SELECT Email, UserName, DisplayName FROM AspNetUsers;
SELECT COUNT(*) AS RemainingPosts FROM Posts;
