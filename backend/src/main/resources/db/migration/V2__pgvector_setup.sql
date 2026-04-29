CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE prompt_cache ADD COLUMN IF NOT EXISTS embedding vector(768);

CREATE INDEX IF NOT EXISTS idx_prompt_cache_embedding_hnsw
  ON prompt_cache USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
