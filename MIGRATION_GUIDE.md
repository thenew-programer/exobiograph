# Entity Type Migration Guide

## Overview
This guide explains how to migrate the database from the old entity type system to the new one.

**Old Entity Types:** `organism`, `condition`, `effect`, `endpoint`  
**New Entity Types:** `sample`, `conditions`, `result`, `objective`, `entity`

## Migration Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. **Access Supabase Dashboard:**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Migration SQL:**
   - Copy the contents of `supabase/migrations/20250105000001_update_entity_types.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

3. **Verify the Migration:**
   - Run this query to check the updated entity types:
   ```sql
   SELECT entity_type, COUNT(*) as count
   FROM entities
   GROUP BY entity_type
   ORDER BY count DESC;
   ```

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Navigate to the project directory
cd /home/joseph/Documents/nasa-space-app-challenge/exobiograph

# Link your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
supabase db push
```

### Option 3: Manual SQL Execution

If you have direct PostgreSQL access:

```bash
# Connect to your database
psql "postgresql://[user]:[password]@[host]:[port]/[database]"

# Run the migration file
\i supabase/migrations/20250105000001_update_entity_types.sql
```

## What the Migration Does

1. **Adds New Enum Values:**
   - Adds `sample`, `conditions`, `result`, `objective`, `entity` to the `entity_type` enum

2. **Migrates Existing Data:**
   - `organism` → `sample`
   - `condition` → `conditions`
   - `effect` → `result`
   - `endpoint` → `objective`

3. **Updates Related Tables:**
   - Updates the `entities` table
   - Updates the `entity_mentions` table (if the column exists)

## Post-Migration Verification

Run these queries to verify the migration was successful:

```sql
-- Check entity type distribution
SELECT entity_type, COUNT(*) as count
FROM entities
GROUP BY entity_type
ORDER BY count DESC;

-- Verify no old types remain
SELECT COUNT(*) as old_types_count
FROM entities
WHERE entity_type IN ('organism', 'condition', 'effect', 'endpoint');
-- Should return 0

-- Check that new types exist
SELECT COUNT(*) as new_types_count
FROM entities
WHERE entity_type IN ('sample', 'conditions', 'result', 'objective', 'entity');
-- Should return > 0
```

## Rollback (If Needed)

If you need to rollback the migration:

```sql
-- Revert data back to old types
UPDATE entities SET entity_type = 'organism' WHERE entity_type = 'sample';
UPDATE entities SET entity_type = 'condition' WHERE entity_type = 'conditions';
UPDATE entities SET entity_type = 'effect' WHERE entity_type = 'result';
UPDATE entities SET entity_type = 'endpoint' WHERE entity_type = 'objective';

-- Note: The enum type will still contain new values, but data will be reverted
```

## Troubleshooting

### Error: "enum value already exists"
This is normal if you run the migration multiple times. The `IF NOT EXISTS` clause prevents errors.

### Error: "column entity_type does not exist"
The migration includes a check for the `entity_mentions` table. If this error appears, the table structure may be different than expected.

### No entities updated
Verify that your database actually contains entities with the old types before running the migration.

## Need Help?

If you encounter issues:
1. Check the error message in the SQL editor
2. Verify database connection settings in `.env.local`
3. Ensure you have the necessary database permissions
4. Check the Supabase logs for detailed error information
