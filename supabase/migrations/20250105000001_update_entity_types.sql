-- Migration to update entity_type enum from old types to new types
-- Old: 'organism', 'condition', 'effect', 'endpoint'
-- New: 'sample', 'conditions', 'result', 'objective', 'entity'

-- Step 1: Add new enum values to entity_type
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'sample';
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'conditions';
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'result';
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'objective';
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'entity';

-- Step 2: Migrate existing data from old types to new types
UPDATE entities SET entity_type = 'sample' WHERE entity_type = 'organism';
UPDATE entities SET entity_type = 'conditions' WHERE entity_type = 'condition';
UPDATE entities SET entity_type = 'result' WHERE entity_type = 'effect';
UPDATE entities SET entity_type = 'objective' WHERE entity_type = 'endpoint';

-- Step 3: Update entity_mentions table (if it has entity_type column)
-- Check if the column exists in entity_mentions
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entity_mentions' AND column_name = 'entity_type'
  ) THEN
    UPDATE entity_mentions SET entity_type = 'sample' WHERE entity_type = 'organism';
    UPDATE entity_mentions SET entity_type = 'conditions' WHERE entity_type = 'condition';
    UPDATE entity_mentions SET entity_type = 'result' WHERE entity_type = 'effect';
    UPDATE entity_mentions SET entity_type = 'objective' WHERE entity_type = 'endpoint';
  END IF;
END $$;

-- Note: We cannot remove old enum values directly in PostgreSQL without recreating the enum
-- If you need to remove old values, you'll need to:
-- 1. Create a new enum type with only the new values
-- 2. Alter the column to use the new enum type
-- 3. Drop the old enum type
-- For now, we're keeping both old and new values for backwards compatibility
