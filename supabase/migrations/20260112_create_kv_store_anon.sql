-- Migration: create anonymous kv_store table for session/anonymous users
-- Run this against your Supabase/Postgres instance.

-- Up
CREATE TABLE IF NOT EXISTS kv_store_anon_ff90fa65 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

-- Optionally create an index for prefix searches
CREATE INDEX IF NOT EXISTS idx_kv_store_anon_key ON kv_store_anon_ff90fa65 (left(key, 64));

-- Down
-- DROP TABLE IF EXISTS kv_store_anon_ff90fa65;
