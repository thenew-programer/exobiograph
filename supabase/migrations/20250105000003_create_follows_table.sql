-- Create follows table for user connections
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent users from following themselves
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  
  -- Prevent duplicate follows
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at DESC);

-- Enable Row Level Security
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Policies for follows table
-- Users can view all follows (public information)
CREATE POLICY "Anyone can view follows"
  ON follows
  FOR SELECT
  USING (true);

-- Users can follow others
CREATE POLICY "Users can follow others"
  ON follows
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow others (delete their own follows)
CREATE POLICY "Users can unfollow others"
  ON follows
  FOR DELETE
  USING (auth.uid() = follower_id);

-- Function to get follower count
CREATE OR REPLACE FUNCTION get_follower_count(user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM follows
  WHERE following_id = user_id;
$$ LANGUAGE SQL STABLE;

-- Function to get following count
CREATE OR REPLACE FUNCTION get_following_count(user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM follows
  WHERE follower_id = user_id;
$$ LANGUAGE SQL STABLE;

-- Function to check if user A follows user B
CREATE OR REPLACE FUNCTION is_following(follower UUID, following UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1
    FROM follows
    WHERE follower_id = follower AND following_id = following
  );
$$ LANGUAGE SQL STABLE;

COMMENT ON TABLE follows IS 'User follow relationships for social features';
COMMENT ON FUNCTION get_follower_count IS 'Get the number of followers for a user';
COMMENT ON FUNCTION get_following_count IS 'Get the number of users a user is following';
COMMENT ON FUNCTION is_following IS 'Check if one user follows another';
