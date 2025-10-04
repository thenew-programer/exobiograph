-- Fix RLS policies for community posts and all related tables
-- The original policies were too restrictive and blocked joins

-- =============================================
-- POSTS POLICIES
-- =============================================
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON community_posts;

CREATE POLICY "Posts are viewable by authenticated users"
    ON community_posts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Posts are viewable by anon users"
    ON community_posts FOR SELECT
    TO anon
    USING (NOT is_archived);

-- =============================================
-- PROFILES POLICIES (Required for author joins)
-- =============================================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- =============================================
-- POST_TAGS POLICIES (Required for tag filtering)
-- =============================================
DROP POLICY IF EXISTS "Post tags are viewable by everyone" ON post_tags;

CREATE POLICY "Post tags are viewable by everyone"
    ON post_tags FOR SELECT
    USING (true);

-- =============================================
-- COMMUNITY_TAGS POLICIES (Required for tag display)
-- =============================================
DROP POLICY IF EXISTS "Tags are viewable by everyone" ON community_tags;

CREATE POLICY "Tags are viewable by everyone"
    ON community_tags FOR SELECT
    USING (true);
