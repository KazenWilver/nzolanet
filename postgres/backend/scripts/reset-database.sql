-- Reinicia dados da BD NzolaNet (PostgreSQL / Supabase).
-- NÃO apaga o schema — só limpa tabelas de aplicação.
-- Uso: psql "$DATABASE_URL" -f reset-database.sql

BEGIN;

TRUNCATE TABLE
  "FimbuUserActivities",
  "PlatformCounters",
  "MessageReactions",
  "MessageUserHides",
  "Messages",
  "ConversationParticipants",
  "Conversations",
  "ContentReports",
  "Notifications",
  "Bookmarks",
  "Reposts",
  "Likes",
  "Comments",
  "Posts",
  "Follows",
  "AspNetUserTokens",
  "AspNetUserRoles",
  "AspNetUserLogins",
  "AspNetUserClaims",
  "AspNetRoleClaims",
  "AspNetUsers",
  "AspNetRoles"
RESTART IDENTITY CASCADE;

COMMIT;
