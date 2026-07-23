-- ═══════════════════════════════════════════════════
-- SAFE TO RE-RUN: all statements use IF [NOT] EXISTS
-- ═══════════════════════════════════════════════════

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create shortlist table
CREATE TABLE IF NOT EXISTS shortlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  github_username TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  github_username TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create recently_viewed table
CREATE TABLE IF NOT EXISTS recently_viewed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  github_username TEXT NOT NULL,
  viewed_at TIMESTAMP DEFAULT NOW()
);

-- Create saved_searches table
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create collection_members table
CREATE TABLE IF NOT EXISTS collection_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  github_username TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first so this script is re-runnable
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Users can read own shortlist" ON shortlist;
DROP POLICY IF EXISTS "Users can insert own shortlist" ON shortlist;
DROP POLICY IF EXISTS "Users can delete own shortlist" ON shortlist;

DROP POLICY IF EXISTS "Users can read own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON notes;
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON notes;

DROP POLICY IF EXISTS "Users can read own recently_viewed" ON recently_viewed;
DROP POLICY IF EXISTS "Users can insert own recently_viewed" ON recently_viewed;

DROP POLICY IF EXISTS "Users can read own saved_searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can insert own saved_searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can delete own saved_searches" ON saved_searches;

DROP POLICY IF EXISTS "Users can read own collections" ON collections;
DROP POLICY IF EXISTS "Users can insert own collections" ON collections;
DROP POLICY IF EXISTS "Users can update own collections" ON collections;
DROP POLICY IF EXISTS "Users can delete own collections" ON collections;

DROP POLICY IF EXISTS "Users can read own collection_members" ON collection_members;
DROP POLICY IF EXISTS "Users can insert own collection_members" ON collection_members;
DROP POLICY IF EXISTS "Users can delete own collection_members" ON collection_members;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Shortlist: users can CRUD their own entries
CREATE POLICY "Users can read own shortlist"
  ON shortlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shortlist"
  ON shortlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shortlist"
  ON shortlist FOR DELETE
  USING (auth.uid() = user_id);

-- Notes: users can CRUD their own notes
CREATE POLICY "Users can read own notes"
  ON notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE
  USING (auth.uid() = user_id);

-- Recently Viewed: users can read/insert their own entries
CREATE POLICY "Users can read own recently_viewed"
  ON recently_viewed FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recently_viewed"
  ON recently_viewed FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Saved Searches: users can read/insert/delete their own
CREATE POLICY "Users can read own saved_searches"
  ON saved_searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved_searches"
  ON saved_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved_searches"
  ON saved_searches FOR DELETE
  USING (auth.uid() = user_id);

-- Collections: users can CRUD their own
CREATE POLICY "Users can read own collections"
  ON collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);

-- Collection Members: users can read/insert/delete members of their collections
CREATE POLICY "Users can read own collection_members"
  ON collection_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_members.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own collection_members"
  ON collection_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_members.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own collection_members"
  ON collection_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_members.collection_id
      AND collections.user_id = auth.uid()
    )
  );

-- Auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
