ALTER TABLE todos ADD COLUMN client_id UUID;
CREATE UNIQUE INDEX uq_todos_client_id ON todos (client_id);
