# Database Setup Instructions

## Step 1: Run Schema Creation

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: **bjaekiuvuqdhsihvhpvo**
3. Navigate to **SQL Editor** (icon on left sidebar)
4. Click **New Query**
5. Copy the entire contents of `schema.sql`
6. Paste into the SQL editor
7. Click **Run** (or press Ctrl+Enter)

You should see success messages indicating tables, indexes, and functions were created.

## Step 2: Load Sample Data

1. In the same SQL Editor, click **New Query** again
2. Copy the entire contents of `sample_data.sql`
3. Paste into the SQL editor
4. Click **Run**

This will insert:
- 5 research papers
- 20 entities (5 of each type)
- 15 sentences
- Multiple sentence-entity relationships
- Entity relationships for the knowledge graph

## Step 3: Verify Data Loaded

Run this query to verify:

```sql
SELECT 'Papers' as table_name, COUNT(*) as count FROM research_papers
UNION ALL
SELECT 'Entities', COUNT(*) FROM entities
UNION ALL
SELECT 'Sentences', COUNT(*) FROM sentences
UNION ALL
SELECT 'Sentence Entities', COUNT(*) FROM sentence_entities
UNION ALL
SELECT 'Relationships', COUNT(*) FROM entity_relationships;
```

Expected results:
- Papers: 5
- Entities: 20
- Sentences: 15
- Sentence Entities: ~40
- Relationships: ~15

## Step 4: Test Search Function

Test the search functionality:

```sql
SELECT * FROM search_biology_knowledge('microgravity bone density', 10);
```

This should return sentences containing those terms with entity highlighting data.

## Step 5: Test Graph Statistics

```sql
SELECT get_graph_statistics();
```

This should return a JSON object with entity counts, top entities, and relationship statistics.

## Troubleshooting

If you get errors:

1. **"relation already exists"**: Tables were already created. Drop them first:
   ```sql
   DROP TABLE IF EXISTS sentence_entities CASCADE;
   DROP TABLE IF EXISTS entity_relationships CASCADE;
   DROP TABLE IF EXISTS sentences CASCADE;
   DROP TABLE IF EXISTS entities CASCADE;
   DROP TABLE IF EXISTS research_papers CASCADE;
   DROP TYPE IF EXISTS entity_type CASCADE;
   ```

2. **"function already exists"**: Drop the functions first:
   ```sql
   DROP FUNCTION IF EXISTS search_biology_knowledge(TEXT, INTEGER);
   DROP FUNCTION IF EXISTS get_graph_statistics();
   ```

3. **Permission errors**: Make sure you're logged in as the project owner.

## Next Steps

Once the database is set up:
1. Return to VS Code
2. The Next.js app is already configured to connect to Supabase
3. We'll build the homepage and search interface next!
