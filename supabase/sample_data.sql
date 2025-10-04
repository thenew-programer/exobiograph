-- ============================================================================
-- ExoBioGraph Sample Data
-- NASA Biology Knowledge Engine - Testing Data
-- ============================================================================

-- This file contains realistic sample data for testing the application
-- Run this AFTER schema.sql has been executed

-- ============================================================================
-- Sample Research Papers
-- ============================================================================

INSERT INTO research_papers (id, title, authors, publication_date, source_url, abstract) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  'Effects of Microgravity on Bone Density in Mice',
  ARRAY['Johnson, M.', 'Smith, K.', 'Chen, L.'],
  '2023-05-15',
  'https://ntrs.nasa.gov/citations/sample001',
  'This study examines the impact of prolonged microgravity exposure on bone mineral density in laboratory mice during a 60-day spaceflight mission.'
),
(
  '22222222-2222-2222-2222-222222222222',
  'Arabidopsis Growth Patterns in Low Earth Orbit',
  ARRAY['Williams, R.', 'Garcia, P.', 'Taylor, S.'],
  '2023-08-22',
  'https://ntrs.nasa.gov/citations/sample002',
  'Investigation of cellular responses and growth patterns of Arabidopsis thaliana plants cultivated in the International Space Station over 45 days.'
),
(
  '33333333-3333-3333-3333-333333333333',
  'Radiation Effects on Human Cell Cultures Beyond LEO',
  ARRAY['Martinez, A.', 'Brown, T.', 'Davis, J.'],
  '2024-01-10',
  'https://ntrs.nasa.gov/citations/sample003',
  'Analysis of DNA damage and repair mechanisms in human fibroblast cells exposed to simulated deep space radiation environments.'
),
(
  '44444444-4444-4444-4444-444444444444',
  'Muscle Atrophy Countermeasures in Extended Spaceflight',
  ARRAY['Lee, H.', 'Kumar, R.', 'Anderson, M.'],
  '2023-11-30',
  'https://ntrs.nasa.gov/citations/sample004',
  'Evaluation of exercise protocols and pharmaceutical interventions to prevent skeletal muscle loss during long-duration space missions.'
),
(
  '55555555-5555-5555-5555-555555555555',
  'Immune System Response to Spaceflight Stress in Rodents',
  ARRAY['Nguyen, T.', 'Patel, V.', 'Wilson, C.'],
  '2024-03-18',
  'https://ntrs.nasa.gov/citations/sample005',
  'Comprehensive study of immune cell populations and cytokine expression in mice subjected to 90-day spaceflight conditions.'
);

-- ============================================================================
-- Sample Entities
-- ============================================================================

-- Organisms
INSERT INTO entities (id, entity_text, entity_type, frequency) VALUES
('a1111111-1111-1111-1111-111111111111', 'mice', 'organism', 25),
('a2222222-2222-2222-2222-222222222222', 'Arabidopsis thaliana', 'organism', 15),
('a3333333-3333-3333-3333-333333333333', 'human fibroblasts', 'organism', 12),
('a4444444-4444-4444-4444-444444444444', 'skeletal muscle cells', 'organism', 18),
('a5555555-5555-5555-5555-555555555555', 'immune cells', 'organism', 20);

-- Conditions
INSERT INTO entities (id, entity_text, entity_type, frequency) VALUES
('b1111111-1111-1111-1111-111111111111', 'microgravity', 'condition', 45),
('b2222222-2222-2222-2222-222222222222', 'low earth orbit', 'condition', 22),
('b3333333-3333-3333-3333-333333333333', 'radiation exposure', 'condition', 30),
('b4444444-4444-4444-4444-444444444444', 'spaceflight', 'condition', 38),
('b5555555-5555-5555-5555-555555555555', 'simulated weightlessness', 'condition', 16);

-- Effects
INSERT INTO entities (id, entity_text, entity_type, frequency) VALUES
('c1111111-1111-1111-1111-111111111111', 'bone density loss', 'effect', 28),
('c2222222-2222-2222-2222-222222222222', 'altered gene expression', 'effect', 24),
('c3333333-3333-3333-3333-333333333333', 'DNA damage', 'effect', 26),
('c4444444-4444-4444-4444-444444444444', 'muscle atrophy', 'effect', 32),
('c5555555-5555-5555-5555-555555555555', 'immune suppression', 'effect', 19);

-- Endpoints
INSERT INTO entities (id, entity_text, entity_type, frequency) VALUES
('d1111111-1111-1111-1111-111111111111', 'bone mineral content', 'endpoint', 22),
('d2222222-2222-2222-2222-222222222222', 'cell proliferation rate', 'endpoint', 18),
('d3333333-3333-3333-3333-333333333333', 'DNA repair capacity', 'endpoint', 15),
('d4444444-4444-4444-4444-444444444444', 'muscle fiber cross-sectional area', 'endpoint', 14),
('d5555555-5555-5555-5555-555555555555', 'cytokine levels', 'endpoint', 17);

-- ============================================================================
-- Sample Sentences
-- ============================================================================

-- Paper 1 sentences
INSERT INTO sentences (id, paper_id, sentence_text, sentence_index) VALUES
('s1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 
'Prolonged exposure to microgravity resulted in significant bone density loss in mice after 60 days.', 0),
('s1111112-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
'The bone mineral content decreased by 15% compared to ground controls.', 1),
('s1111113-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
'Mice exposed to spaceflight conditions showed altered gene expression in osteoblasts.', 2);

-- Paper 2 sentences
INSERT INTO sentences (id, paper_id, sentence_text, sentence_index) VALUES
('s2222221-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
'Arabidopsis thaliana plants grown in low earth orbit exhibited altered gene expression patterns.', 0),
('s2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
'Cell proliferation rate was reduced by 25% under microgravity conditions.', 1),
('s2222223-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
'Root development in Arabidopsis thaliana was significantly affected during spaceflight.', 2);

-- Paper 3 sentences
INSERT INTO sentences (id, paper_id, sentence_text, sentence_index) VALUES
('s3333331-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
'Human fibroblasts exposed to radiation showed increased DNA damage markers.', 0),
('s3333332-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
'DNA repair capacity was compromised in cells subjected to prolonged radiation exposure.', 1),
('s3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
'Simulated deep space radiation reduced cell proliferation rate by 40%.', 2);

-- Paper 4 sentences  
INSERT INTO sentences (id, paper_id, sentence_text, sentence_index) VALUES
('s4444441-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444',
'Skeletal muscle cells demonstrated significant muscle atrophy during spaceflight.', 0),
('s4444442-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444',
'Muscle fiber cross-sectional area decreased by 30% under microgravity conditions.', 1),
('s4444443-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444',
'Exercise countermeasures partially prevented muscle atrophy in mice during extended spaceflight.', 2);

-- Paper 5 sentences
INSERT INTO sentences (id, paper_id, sentence_text, sentence_index) VALUES
('s5555551-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555',
'Immune cells from mice showed altered cytokine levels after spaceflight.', 0),
('s5555552-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555',
'Immune suppression was observed in all test subjects exposed to microgravity.', 1),
('s5555553-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555',
'The study revealed decreased immune cell proliferation under spaceflight conditions.', 2);

-- ============================================================================
-- Sample Sentence Entities (Entity highlighting positions)
-- ============================================================================

-- Sentence 1 entities
INSERT INTO sentence_entities (sentence_id, entity_id, position_start, position_end) VALUES
('s1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 21, 33),  -- microgravity
('s1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 57, 74),  -- bone density loss
('s1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 78, 82);  -- mice

INSERT INTO sentence_entities (sentence_id, entity_id, position_start, position_end) VALUES
('s1111112-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 4, 24);   -- bone mineral content

INSERT INTO sentence_entities (sentence_id, entity_id, position_start, position_end) VALUES
('s1111113-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 0, 4),    -- mice
('s1111113-1111-1111-1111-111111111111', 'b4444444-4444-4444-4444-444444444444', 16, 27),  -- spaceflight
('s1111113-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', 46, 67);  -- altered gene expression

-- Sentence 2 entities
INSERT INTO sentence_entities (sentence_id, entity_id, position_start, position_end) VALUES
('s2222221-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 0, 20),   -- Arabidopsis thaliana
('s2222221-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 35, 49),  -- low earth orbit
('s2222221-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 60, 83);  -- altered gene expression

INSERT INTO sentence_entities (sentence_id, entity_id, position_start, position_end) VALUES
('s2222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222', 0, 23),   -- cell proliferation rate
('s2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 48, 60);  -- microgravity

INSERT INTO sentence_entities (sentence_id, entity_id, position_start, position_end) VALUES
('s2222223-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 20, 40),  -- Arabidopsis thaliana
('s2222223-2222-2222-2222-222222222222', 'b4444444-4444-4444-4444-444444444444', 76, 87);  -- spaceflight

-- Sentence 3 entities
INSERT INTO sentence_entities (sentence_id, entity_id, position_start, position_end) VALUES
('s3333331-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 0, 17),   -- human fibroblasts
('s3333331-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 29, 47),  -- radiation exposure
('s3333331-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 58, 68);  -- DNA damage

INSERT INTO sentence_entities (sentence_id, entity_id, position_start, position_end) VALUES
('s3333332-3333-3333-3333-333333333333', 'd3333333-3333-3333-3333-333333333333', 0, 19),   -- DNA repair capacity
('s3333332-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 62, 80);  -- radiation exposure

INSERT INTO sentence_entities (sentence_id, entity_id, position_start, position_end) VALUES
('s3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 10, 32),  -- deep space radiation
('s3333333-3333-3333-3333-333333333333', 'd2222222-2222-2222-2222-222222222222', 41, 64);  -- cell proliferation rate

-- Sentence 4 entities
INSERT INTO sentence_entities (sentence_id, entity_id, position_start, position_end) VALUES
('s4444441-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 0, 21),   -- skeletal muscle cells
('s4444441-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 46, 60),  -- muscle atrophy
('s4444441-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 68, 79);  -- spaceflight

INSERT INTO sentence_entities (sentence_id, entity_id, position_start, position_end) VALUES
('s4444442-4444-4444-4444-444444444444', 'd4444444-4444-4444-4444-444444444444', 0, 34),   -- muscle fiber cross-sectional area
('s4444442-4444-4444-4444-444444444444', 'b1111111-1111-1111-1111-111111111111', 55, 67);  -- microgravity

INSERT INTO sentence_entities (sentence_id, entity_id, position_start, position_end) VALUES
('s4444443-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 41, 55),  -- muscle atrophy
('s4444443-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111', 59, 63),  -- mice
('s4444443-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 79, 90);  -- spaceflight

-- Sentence 5 entities
INSERT INTO sentence_entities (sentence_id, entity_id, position_start, position_end) VALUES
('s5555551-5555-5555-5555-555555555555', 'a5555555-5555-5555-5555-555555555555', 0, 12),   -- immune cells
('s5555551-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111111', 18, 22),  -- mice
('s5555551-5555-5555-5555-555555555555', 'd5555555-5555-5555-5555-555555555555', 37, 52),  -- cytokine levels
('s5555551-5555-5555-5555-555555555555', 'b4444444-4444-4444-4444-444444444444', 59, 70);  -- spaceflight

INSERT INTO sentence_entities (sentence_id, entity_id, position_start, position_end) VALUES
('s5555552-5555-5555-5555-555555555555', 'c5555555-5555-5555-5555-555555555555', 0, 18),   -- immune suppression
('s5555552-5555-5555-5555-555555555555', 'b1111111-1111-1111-1111-111111111111', 62, 74);  -- microgravity

INSERT INTO sentence_entities (sentence_id, entity_id, position_start, position_end) VALUES
('s5555553-5555-5555-5555-555555555555', 'a5555555-5555-5555-5555-555555555555', 28, 39),  -- immune cell
('s5555553-5555-5555-5555-555555555555', 'b4444444-4444-4444-4444-444444444444', 62, 73);  -- spaceflight

-- ============================================================================
-- Sample Entity Relationships (for Knowledge Graph)
-- ============================================================================

-- Microgravity relationships
INSERT INTO entity_relationships (source_entity_id, target_entity_id, relationship_strength, co_occurrence_count) VALUES
('b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 10, 15),  -- microgravity -> bone density loss
('b1111111-1111-1111-1111-111111111111', 'c4444444-4444-4444-4444-444444444444', 8, 12),   -- microgravity -> muscle atrophy
('b1111111-1111-1111-1111-111111111111', 'c5555555-5555-5555-5555-555555555555', 6, 8),    -- microgravity -> immune suppression
('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 12, 18);  -- microgravity -> mice

-- Organism relationships
INSERT INTO entity_relationships (source_entity_id, target_entity_id, relationship_strength, co_occurrence_count) VALUES
('a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 9, 14),   -- mice -> bone density loss
('a1111111-1111-1111-1111-111111111111', 'c4444444-4444-4444-4444-444444444444', 7, 10),   -- mice -> muscle atrophy
('a2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 8, 11);   -- Arabidopsis -> altered gene expression

-- Spaceflight relationships
INSERT INTO entity_relationships (source_entity_id, target_entity_id, relationship_strength, co_occurrence_count) VALUES
('b4444444-4444-4444-4444-444444444444', 'c2222222-2222-2222-2222-222222222222', 9, 13),   -- spaceflight -> altered gene expression
('b4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 10, 15),  -- spaceflight -> muscle atrophy
('b4444444-4444-4444-4444-444444444444', 'c5555555-5555-5555-5555-555555555555', 7, 9);    -- spaceflight -> immune suppression

-- Radiation relationships
INSERT INTO entity_relationships (source_entity_id, target_entity_id, relationship_strength, co_occurrence_count) VALUES
('b3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 11, 16),  -- radiation -> DNA damage
('b3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 8, 12);   -- radiation -> human fibroblasts

-- Effect to endpoint relationships
INSERT INTO entity_relationships (source_entity_id, target_entity_id, relationship_strength, co_occurrence_count) VALUES
('c1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 10, 14),  -- bone density loss -> bone mineral content
('c3333333-3333-3333-3333-333333333333', 'd3333333-3333-3333-3333-333333333333', 9, 12),   -- DNA damage -> DNA repair capacity
('c4444444-4444-4444-4444-444444444444', 'd4444444-4444-4444-4444-444444444444', 11, 15),  -- muscle atrophy -> muscle fiber area
('c5555555-5555-5555-5555-555555555555', 'd5555555-5555-5555-5555-555555555555', 8, 11);   -- immune suppression -> cytokine levels

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Count records
-- SELECT 'Papers' as table_name, COUNT(*) as count FROM research_papers
-- UNION ALL
-- SELECT 'Entities', COUNT(*) FROM entities
-- UNION ALL
-- SELECT 'Sentences', COUNT(*) FROM sentences
-- UNION ALL
-- SELECT 'Sentence Entities', COUNT(*) FROM sentence_entities
-- UNION ALL
-- SELECT 'Relationships', COUNT(*) FROM entity_relationships;

-- Test search function
-- SELECT * FROM search_biology_knowledge('microgravity bone density', 10);

-- Test graph statistics
-- SELECT get_graph_statistics();
