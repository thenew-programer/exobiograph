-- Add missing columns to profiles table for community features
-- Run this in Supabase SQL Editor

-- Add is_verified column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Add institution column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS institution TEXT;

-- Add bio column if it doesn't exist  
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add reputation_score if it doesn't exist (should already exist from community migration)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0;

-- Add user stat columns if they don't exist (should already exist from community migration)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS posts_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS best_answers_count INTEGER DEFAULT 0;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
