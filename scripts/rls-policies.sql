-- Supabase Row Level Security (RLS) Policies
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- These policies enforce ownership constraints at the database level,
-- preventing unauthorized access even if application-level checks are bypassed.

-- =============================================================================
-- TABLE: user_collections
-- =============================================================================

ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;

-- Anyone can read collections (for public sharing via link)
CREATE POLICY "Public read collections"
  ON user_collections FOR SELECT
  USING (true);

-- Users can only insert collection entries for themselves
CREATE POLICY "Users insert own collections"
  ON user_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own collection entries
CREATE POLICY "Users update own collections"
  ON user_collections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own collection entries
CREATE POLICY "Users delete own collections"
  ON user_collections FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- TABLE: user_decks
-- =============================================================================

ALTER TABLE user_decks ENABLE ROW LEVEL SECURITY;

-- Anyone can read decks (for public sharing via link)
CREATE POLICY "Public read decks"
  ON user_decks FOR SELECT
  USING (true);

-- Users can only insert decks for themselves
CREATE POLICY "Users insert own decks"
  ON user_decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own decks
CREATE POLICY "Users update own decks"
  ON user_decks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own decks
CREATE POLICY "Users delete own decks"
  ON user_decks FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- TABLE: cards (public read, admin write)
-- =============================================================================

ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Anyone can read cards (public database)
CREATE POLICY "Public read cards"
  ON cards FOR SELECT
  USING (true);

-- Only admins can insert cards
CREATE POLICY "Admins insert cards"
  ON cards FOR INSERT
  WITH CHECK (
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  );

-- Only admins can update cards
CREATE POLICY "Admins update cards"
  ON cards FOR UPDATE
  USING (
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  )
  WITH CHECK (
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  );

-- Only admins can delete cards
CREATE POLICY "Admins delete cards"
  ON cards FOR DELETE
  USING (
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  );

-- =============================================================================
-- TABLE: sets (public read, admin write)
-- =============================================================================

ALTER TABLE sets ENABLE ROW LEVEL SECURITY;

-- Anyone can read sets
CREATE POLICY "Public read sets"
  ON sets FOR SELECT
  USING (true);

-- Only admins can modify sets
CREATE POLICY "Admins insert sets"
  ON sets FOR INSERT
  WITH CHECK (
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  );

CREATE POLICY "Admins update sets"
  ON sets FOR UPDATE
  USING (
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  );

CREATE POLICY "Admins delete sets"
  ON sets FOR DELETE
  USING (
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  );
