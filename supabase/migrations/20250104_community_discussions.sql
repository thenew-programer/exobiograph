-- Community Discussion Feature Database Schema
-- Tables: posts, comments, reactions, tags, following, notifications

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- COMMUNITY POSTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_type TEXT NOT NULL CHECK (post_type IN ('discussion', 'question', 'insight', 'announcement', 'paper_share')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    
    -- Paper linking
    linked_paper_id UUID REFERENCES research_papers(id),
    linked_paper_title TEXT,
    linked_paper_doi TEXT,
    
    -- Engagement metrics
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    save_count INTEGER DEFAULT 0,
    
    -- Status
    is_pinned BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    
    -- Best answer (for questions)
    accepted_answer_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for community_posts
CREATE INDEX idx_community_posts_author ON community_posts(author_id);
CREATE INDEX idx_community_posts_type ON community_posts(post_type);
CREATE INDEX idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_likes ON community_posts(like_count DESC);
CREATE INDEX idx_community_posts_paper ON community_posts(linked_paper_id);

-- =============================================
-- COMMUNITY COMMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
    
    content TEXT NOT NULL,
    depth INTEGER DEFAULT 0 CHECK (depth <= 3), -- Max 3 levels of nesting
    
    -- Engagement
    like_count INTEGER DEFAULT 0,
    is_best_answer BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for community_comments
CREATE INDEX idx_community_comments_post ON community_comments(post_id);
CREATE INDEX idx_community_comments_author ON community_comments(author_id);
CREATE INDEX idx_community_comments_parent ON community_comments(parent_comment_id);
CREATE INDEX idx_community_comments_created ON community_comments(created_at);

-- =============================================
-- COMMUNITY REACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS community_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Can react to either post or comment
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
    
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'helpful', 'insightful')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure user can only have one reaction per item
    CONSTRAINT unique_user_post_reaction UNIQUE (user_id, post_id, reaction_type),
    CONSTRAINT unique_user_comment_reaction UNIQUE (user_id, comment_id, reaction_type),
    
    -- Must react to either post or comment, not both
    CONSTRAINT check_reaction_target CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR 
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);

-- Indexes for community_reactions
CREATE INDEX idx_community_reactions_user ON community_reactions(user_id);
CREATE INDEX idx_community_reactions_post ON community_reactions(post_id);
CREATE INDEX idx_community_reactions_comment ON community_reactions(comment_id);

-- =============================================
-- COMMUNITY TAGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS community_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    use_count INTEGER DEFAULT 0,
    color TEXT, -- Hex color for tag display
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for community_tags
CREATE INDEX idx_community_tags_slug ON community_tags(slug);
CREATE INDEX idx_community_tags_use_count ON community_tags(use_count DESC);

-- =============================================
-- POST TAGS (Many-to-Many relationship)
-- =============================================
CREATE TABLE IF NOT EXISTS post_tags (
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES community_tags(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (post_id, tag_id)
);

-- Indexes for post_tags
CREATE INDEX idx_post_tags_post ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag ON post_tags(tag_id);

-- =============================================
-- FOLLOWING TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS community_following (
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (follower_id, following_id),
    
    -- Prevent self-following
    CONSTRAINT check_no_self_follow CHECK (follower_id != following_id)
);

-- Indexes for community_following
CREATE INDEX idx_community_following_follower ON community_following(follower_id);
CREATE INDEX idx_community_following_following ON community_following(following_id);

-- =============================================
-- SAVED POSTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS community_saved_posts (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (user_id, post_id)
);

-- Indexes for community_saved_posts
CREATE INDEX idx_community_saved_posts_user ON community_saved_posts(user_id);
CREATE INDEX idx_community_saved_posts_post ON community_saved_posts(post_id);

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS community_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Who triggered the notification
    triggered_by_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'post_reply', 'comment_reply', 'mention', 'like', 
        'follow', 'best_answer', 'new_post_from_following'
    )),
    
    -- Related content
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
    
    content TEXT, -- Brief description
    
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for community_notifications
CREATE INDEX idx_community_notifications_user ON community_notifications(user_id);
CREATE INDEX idx_community_notifications_read ON community_notifications(is_read);
CREATE INDEX idx_community_notifications_created ON community_notifications(created_at DESC);

-- =============================================
-- REPUTATION SYSTEM (extends profiles table)
-- =============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS posts_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS best_answers_count INTEGER DEFAULT 0;

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update post comment count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_posts 
        SET comment_count = comment_count + 1,
            updated_at = NOW()
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_posts 
        SET comment_count = GREATEST(comment_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comment count
CREATE TRIGGER trigger_update_post_comment_count
AFTER INSERT OR DELETE ON community_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comment_count();

-- Function to update reaction counts
CREATE OR REPLACE FUNCTION update_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.post_id IS NOT NULL THEN
            UPDATE community_posts 
            SET like_count = like_count + 1
            WHERE id = NEW.post_id;
        ELSIF NEW.comment_id IS NOT NULL THEN
            UPDATE community_comments 
            SET like_count = like_count + 1
            WHERE id = NEW.comment_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.post_id IS NOT NULL THEN
            UPDATE community_posts 
            SET like_count = GREATEST(like_count - 1, 0)
            WHERE id = OLD.post_id;
        ELSIF OLD.comment_id IS NOT NULL THEN
            UPDATE community_comments 
            SET like_count = GREATEST(like_count - 1, 0)
            WHERE id = OLD.comment_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reaction counts
CREATE TRIGGER trigger_update_reaction_counts
AFTER INSERT OR DELETE ON community_reactions
FOR EACH ROW
EXECUTE FUNCTION update_reaction_counts();

-- Function to update tag use count
CREATE OR REPLACE FUNCTION update_tag_use_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_tags 
        SET use_count = use_count + 1
        WHERE id = NEW.tag_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_tags 
        SET use_count = GREATEST(use_count - 1, 0)
        WHERE id = OLD.tag_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tag use count
CREATE TRIGGER trigger_update_tag_use_count
AFTER INSERT OR DELETE ON post_tags
FOR EACH ROW
EXECUTE FUNCTION update_tag_use_count();

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME = 'community_posts' THEN
            UPDATE profiles 
            SET posts_count = posts_count + 1
            WHERE id = NEW.author_id;
        ELSIF TG_TABLE_NAME = 'community_comments' THEN
            UPDATE profiles 
            SET comments_count = comments_count + 1
            WHERE id = NEW.author_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF TG_TABLE_NAME = 'community_posts' THEN
            UPDATE profiles 
            SET posts_count = GREATEST(posts_count - 1, 0)
            WHERE id = OLD.author_id;
        ELSIF TG_TABLE_NAME = 'community_comments' THEN
            UPDATE profiles 
            SET comments_count = GREATEST(comments_count - 1, 0)
            WHERE id = OLD.author_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for user stats
CREATE TRIGGER trigger_update_user_posts_stats
AFTER INSERT OR DELETE ON community_posts
FOR EACH ROW
EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER trigger_update_user_comments_stats
AFTER INSERT OR DELETE ON community_comments
FOR EACH ROW
EXECUTE FUNCTION update_user_stats();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_following ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_notifications ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Posts are viewable by everyone"
    ON community_posts FOR SELECT
    USING (NOT is_archived OR author_id = auth.uid());

CREATE POLICY "Users can create posts"
    ON community_posts FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts"
    ON community_posts FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts"
    ON community_posts FOR DELETE
    USING (auth.uid() = author_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
    ON community_comments FOR SELECT
    USING (NOT is_deleted);

CREATE POLICY "Users can create comments"
    ON community_comments FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own comments"
    ON community_comments FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments"
    ON community_comments FOR DELETE
    USING (auth.uid() = author_id);

-- Reactions policies
CREATE POLICY "Reactions are viewable by everyone"
    ON community_reactions FOR SELECT
    USING (true);

CREATE POLICY "Users can create own reactions"
    ON community_reactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions"
    ON community_reactions FOR DELETE
    USING (auth.uid() = user_id);

-- Tags policies
CREATE POLICY "Tags are viewable by everyone"
    ON community_tags FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create tags"
    ON community_tags FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Post tags policies
CREATE POLICY "Post tags are viewable by everyone"
    ON post_tags FOR SELECT
    USING (true);

CREATE POLICY "Post authors can manage tags"
    ON post_tags FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM community_posts
            WHERE id = post_tags.post_id
            AND author_id = auth.uid()
        )
    );

-- Following policies
CREATE POLICY "Following relationships are viewable by everyone"
    ON community_following FOR SELECT
    USING (true);

CREATE POLICY "Users can follow others"
    ON community_following FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
    ON community_following FOR DELETE
    USING (auth.uid() = follower_id);

-- Saved posts policies
CREATE POLICY "Users can view own saved posts"
    ON community_saved_posts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts"
    ON community_saved_posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts"
    ON community_saved_posts FOR DELETE
    USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications"
    ON community_notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
    ON community_notifications FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
    ON community_notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
    ON community_notifications FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- SEED DATA - Initial Tags
-- =============================================

INSERT INTO community_tags (name, slug, description, color) VALUES
('Microgravity', 'microgravity', 'Research related to microgravity effects', '#3B82F6'),
('Plant Biology', 'plant-biology', 'Studies on plant growth and development in space', '#10B981'),
('Animal Studies', 'animal-studies', 'Research involving animals in space environments', '#F59E0B'),
('Cellular Biology', 'cellular-biology', 'Cellular and molecular biology research', '#8B5CF6'),
('Bone Density', 'bone-density', 'Studies on bone density changes', '#EC4899'),
('ISS Experiments', 'iss-experiments', 'Experiments conducted on the International Space Station', '#06B6D4'),
('NASA Research', 'nasa-research', 'NASA-affiliated research', '#EF4444'),
('Radiation', 'radiation', 'Radiation effects and protection', '#F97316'),
('Space Medicine', 'space-medicine', 'Medical research for space travel', '#14B8A6'),
('Astrobiology', 'astrobiology', 'Life sciences in space contexts', '#A855F7')
ON CONFLICT (slug) DO NOTHING;
