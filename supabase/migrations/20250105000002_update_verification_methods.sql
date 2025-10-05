-- Migration to update verification_method enum to only keep ORCID, Google Scholar, and ResearchGate
-- This removes: edu_email, linkedin, manual_review

-- Note: PostgreSQL doesn't allow removing enum values directly
-- We need to create a new enum type and migrate the data

-- Step 1: Create a new enum type with only the three methods we want
CREATE TYPE verification_method_new AS ENUM (
  'orcid',
  'google_scholar',
  'researchgate'
);

-- Step 2: Add a temporary column with the new enum type
ALTER TABLE verification_requests 
ADD COLUMN verification_method_new verification_method_new;

-- Step 3: Migrate existing data
-- Map old values to new values (choose the most relevant mapping)
UPDATE verification_requests 
SET verification_method_new = CASE 
  WHEN verification_method = 'orcid' THEN 'orcid'::verification_method_new
  WHEN verification_method = 'google_scholar' THEN 'google_scholar'::verification_method_new
  WHEN verification_method = 'researchgate' THEN 'researchgate'::verification_method_new
  -- For removed methods, we'll keep them as NULL or map to a default
  -- Option 1: Delete these records (commented out)
  -- WHEN verification_method IN ('edu_email', 'linkedin', 'manual_review') THEN NULL
  -- Option 2: Map to a default method (e.g., orcid)
  ELSE 'orcid'::verification_method_new
END;

-- Alternative: Delete old verification methods instead of migrating them
-- Uncomment this if you want to remove old verification requests
-- DELETE FROM verification_requests 
-- WHERE verification_method IN ('edu_email', 'linkedin', 'manual_review');

-- Step 4: Drop the old column
ALTER TABLE verification_requests 
DROP COLUMN verification_method;

-- Step 5: Rename the new column to the original name
ALTER TABLE verification_requests 
RENAME COLUMN verification_method_new TO verification_method;

-- Step 6: Make the column NOT NULL
ALTER TABLE verification_requests 
ALTER COLUMN verification_method SET NOT NULL;

-- Step 7: Drop the old enum type
DROP TYPE verification_method;

-- Step 8: Rename the new enum type to the original name
ALTER TYPE verification_method_new RENAME TO verification_method;

-- Step 9: Recreate the index on the verification_method column
DROP INDEX IF EXISTS idx_verification_requests_method;
CREATE INDEX idx_verification_requests_method ON verification_requests(verification_method);

-- Add a comment
COMMENT ON TYPE verification_method IS 'Supported verification methods: ORCID, Google Scholar, and ResearchGate';
