DROP INDEX IF EXISTS uq_todos_client_id;
ALTER TABLE todos DROP COLUMN IF EXISTS client_id;
