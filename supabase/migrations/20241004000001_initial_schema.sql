-- ============================================================================
-- ExoBioGraph Database Schema
-- NASA Biology Knowledge Engine
-- ============================================================================

-- ============================================================================
-- 1. Research Papers Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS research_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  authors TEXT[] NOT NULL,
  publication_date DATE NOT NULL,
  source_url TEXT NOT NULL,
  abstract TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster searches
CREATE INDEX idx_research_papers_title ON research_papers USING GIN (to_tsvector('english', title));
CREATE INDEX idx_research_papers_abstract ON research_papers USING GIN (to_tsvector('english', abstract));
CREATE INDEX idx_research_papers_date ON research_papers(publication_date DESC);

-- ============================================================================
-- 2. Entities Table
-- ============================================================================

CREATE TYPE entity_type AS ENUM ('organism', 'condition', 'effect', 'endpoint');

CREATE TABLE IF NOT EXISTS entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_text TEXT NOT NULL UNIQUE,
  entity_type entity_type NOT NULL,
  frequency INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for entity searches
CREATE INDEX idx_entities_type ON entities(entity_type);
CREATE INDEX idx_entities_frequency ON entities(frequency DESC);
CREATE INDEX idx_entities_text ON entities USING GIN (to_tsvector('english', entity_text));

-- ============================================================================
-- 3. Sentences Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS sentences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES research_papers(id) ON DELETE CASCADE,
  sentence_text TEXT NOT NULL,
  sentence_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for full-text search on sentences
CREATE INDEX idx_sentences_text ON sentences USING GIN (to_tsvector('english', sentence_text));
CREATE INDEX idx_sentences_paper ON sentences(paper_id);

-- ============================================================================
-- 4. Sentence Entities Table (Junction table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sentence_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sentence_id UUID NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  position_start INTEGER NOT NULL,
  position_end INTEGER NOT NULL,
  UNIQUE(sentence_id, entity_id, position_start)
);

-- Indexes for relationship queries
CREATE INDEX idx_sentence_entities_sentence ON sentence_entities(sentence_id);
CREATE INDEX idx_sentence_entities_entity ON sentence_entities(entity_id);

-- ============================================================================
-- 5. Entity Relationships Table (for Knowledge Graph)
-- ============================================================================

CREATE TABLE IF NOT EXISTS entity_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  target_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  relationship_strength INTEGER DEFAULT 1,
  co_occurrence_count INTEGER DEFAULT 1,
  UNIQUE(source_entity_id, target_entity_id),
  CHECK (source_entity_id != target_entity_id)
);

-- Indexes for graph queries
CREATE INDEX idx_relationships_source ON entity_relationships(source_entity_id);
CREATE INDEX idx_relationships_target ON entity_relationships(target_entity_id);
CREATE INDEX idx_relationships_strength ON entity_relationships(relationship_strength DESC);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE research_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentence_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_relationships ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (research is public)
CREATE POLICY "Allow public read access" ON research_papers FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read access" ON entities FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read access" ON sentences FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read access" ON sentence_entities FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read access" ON entity_relationships FOR SELECT TO anon USING (true);

-- Authenticated users can also read (for future features)
CREATE POLICY "Allow authenticated read access" ON research_papers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON entities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON sentences FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON sentence_entities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON entity_relationships FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to search biology knowledge
CREATE OR REPLACE FUNCTION search_biology_knowledge(search_query TEXT, limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  sentence_id UUID,
  sentence_text TEXT,
  paper_id UUID,
  paper_title TEXT,
  paper_authors TEXT[],
  paper_source_url TEXT,
  paper_publication_date DATE,
  entity_text TEXT,
  entity_type entity_type,
  position_start INTEGER,
  position_end INTEGER,
  relevance_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    s.id AS sentence_id,
    s.sentence_text,
    p.id AS paper_id,
    p.title AS paper_title,
    p.authors AS paper_authors,
    p.source_url AS paper_source_url,
    p.publication_date AS paper_publication_date,
    e.entity_text,
    e.entity_type,
    se.position_start,
    se.position_end,
    ts_rank(to_tsvector('english', s.sentence_text), plainto_tsquery('english', search_query)) AS relevance_score
  FROM sentences s
  INNER JOIN research_papers p ON s.paper_id = p.id
  LEFT JOIN sentence_entities se ON s.id = se.sentence_id
  LEFT JOIN entities e ON se.entity_id = e.id
  WHERE to_tsvector('english', s.sentence_text) @@ plainto_tsquery('english', search_query)
  ORDER BY relevance_score DESC, s.id, se.position_start
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get graph statistics
CREATE OR REPLACE FUNCTION get_graph_statistics()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalEntities', (SELECT COUNT(*) FROM entities),
    'totalRelationships', (SELECT COUNT(*) FROM entity_relationships),
    'totalPapers', (SELECT COUNT(*) FROM research_papers),
    'entityCounts', (
      SELECT json_object_agg(entity_type, count)
      FROM (
        SELECT entity_type, COUNT(*) as count
        FROM entities
        GROUP BY entity_type
      ) counts
    ),
    'topEntities', (
      SELECT json_agg(top_entities)
      FROM (
        SELECT 
          e.entity_text,
          e.entity_type,
          COUNT(DISTINCT er.id) as connections
        FROM entities e
        LEFT JOIN entity_relationships er ON e.id = er.source_entity_id OR e.id = er.target_entity_id
        GROUP BY e.id, e.entity_text, e.entity_type
        ORDER BY connections DESC, e.frequency DESC
        LIMIT 10
      ) top_entities
    ),
    'lastUpdated', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Sample Data Insert (Optional - for testing)
-- ============================================================================

-- You can insert sample data here or do it separately
-- This is just a placeholder comment

COMMENT ON TABLE research_papers IS 'Stores NASA biological research papers';
COMMENT ON TABLE entities IS 'Extracted biological entities (organisms, conditions, effects, endpoints)';
COMMENT ON TABLE sentences IS 'Individual sentences from research papers';
COMMENT ON TABLE sentence_entities IS 'Links entities to their positions in sentences';
COMMENT ON TABLE entity_relationships IS 'Co-occurrence relationships between entities for knowledge graph';
