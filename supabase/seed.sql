-- ============================================================================
-- ExoBioGraph Sample Data Seed
-- Uses temporary variables to reference generated UUIDs
-- ============================================================================

DO $$
DECLARE
  -- Paper IDs
  paper1_id UUID := gen_random_uuid();
  paper2_id UUID := gen_random_uuid();
  paper3_id UUID := gen_random_uuid();
  paper4_id UUID := gen_random_uuid();
  paper5_id UUID := gen_random_uuid();
  
  -- Entity IDs
  mice_id UUID := gen_random_uuid();
  arabidopsis_id UUID := gen_random_uuid();
  fibroblasts_id UUID := gen_random_uuid();
  muscle_id UUID := gen_random_uuid();
  immune_id UUID := gen_random_uuid();
  
  microgravity_id UUID := gen_random_uuid();
  leo_id UUID := gen_random_uuid();
  radiation_id UUID := gen_random_uuid();
  spaceflight_id UUID := gen_random_uuid();
  weightless_id UUID := gen_random_uuid();
  
  bone_loss_id UUID := gen_random_uuid();
  gene_expr_id UUID := gen_random_uuid();
  dna_damage_id UUID := gen_random_uuid();
  muscle_atrophy_id UUID := gen_random_uuid();
  immune_supp_id UUID := gen_random_uuid();
  
  bone_mineral_id UUID := gen_random_uuid();
  cell_prolif_id UUID := gen_random_uuid();
  dna_repair_id UUID := gen_random_uuid();
  muscle_fiber_id UUID := gen_random_uuid();
  cytokine_id UUID := gen_random_uuid();
  
  -- Sentence IDs
  s1_1 UUID := gen_random_uuid();
  s1_2 UUID := gen_random_uuid();
  s1_3 UUID := gen_random_uuid();
  s2_1 UUID := gen_random_uuid();
  s2_2 UUID := gen_random_uuid();
  s2_3 UUID := gen_random_uuid();
  s3_1 UUID := gen_random_uuid();
  s3_2 UUID := gen_random_uuid();
  s3_3 UUID := gen_random_uuid();
  s4_1 UUID := gen_random_uuid();
  s4_2 UUID := gen_random_uuid();
  s4_3 UUID := gen_random_uuid();
  s5_1 UUID := gen_random_uuid();
  s5_2 UUID := gen_random_uuid();
  s5_3 UUID := gen_random_uuid();

BEGIN
  -- Insert research papers
  INSERT INTO research_papers (id, title, authors, publication_date, source_url, abstract) VALUES
  (paper1_id, 'Effects of Microgravity on Bone Density in Mice', 
   ARRAY['Johnson, M.', 'Smith, K.', 'Chen, L.'], '2023-05-15',
   'https://ntrs.nasa.gov/citations/sample001',
   'This study examines the impact of prolonged microgravity exposure on bone mineral density in laboratory mice during a 60-day spaceflight mission.'),
  (paper2_id, 'Arabidopsis Growth Patterns in Low Earth Orbit',
   ARRAY['Williams, R.', 'Garcia, P.', 'Taylor, S.'], '2023-08-22',
   'https://ntrs.nasa.gov/citations/sample002',
   'Investigation of cellular responses and growth patterns of Arabidopsis thaliana plants cultivated in the International Space Station over 45 days.'),
  (paper3_id, 'Radiation Effects on Human Cell Cultures Beyond LEO',
   ARRAY['Martinez, A.', 'Brown, T.', 'Davis, J.'], '2024-01-10',
   'https://ntrs.nasa.gov/citations/sample003',
   'Analysis of DNA damage and repair mechanisms in human fibroblast cells exposed to simulated deep space radiation environments.'),
  (paper4_id, 'Muscle Atrophy Countermeasures in Extended Spaceflight',
   ARRAY['Lee, H.', 'Kumar, R.', 'Anderson, M.'], '2023-11-30',
   'https://ntrs.nasa.gov/citations/sample004',
   'Evaluation of exercise protocols and pharmaceutical interventions to prevent skeletal muscle loss during long-duration space missions.'),
  (paper5_id, 'Immune System Response to Spaceflight Stress in Rodents',
   ARRAY['Nguyen, T.', 'Patel, V.', 'Wilson, C.'], '2024-03-18',
   'https://ntrs.nasa.gov/citations/sample005',
   'Comprehensive study of immune cell populations and cytokine expression in mice subjected to 90-day spaceflight conditions.');

  -- Insert entities
  INSERT INTO entities (id, entity_text, entity_type, frequency) VALUES
  (mice_id, 'mice', 'organism', 25),
  (arabidopsis_id, 'Arabidopsis thaliana', 'organism', 15),
  (fibroblasts_id, 'human fibroblasts', 'organism', 12),
  (muscle_id, 'skeletal muscle cells', 'organism', 18),
  (immune_id, 'immune cells', 'organism', 20),
  (microgravity_id, 'microgravity', 'condition', 45),
  (leo_id, 'low earth orbit', 'condition', 22),
  (radiation_id, 'radiation exposure', 'condition', 30),
  (spaceflight_id, 'spaceflight', 'condition', 38),
  (weightless_id, 'simulated weightlessness', 'condition', 16),
  (bone_loss_id, 'bone density loss', 'effect', 28),
  (gene_expr_id, 'altered gene expression', 'effect', 24),
  (dna_damage_id, 'DNA damage', 'effect', 26),
  (muscle_atrophy_id, 'muscle atrophy', 'effect', 32),
  (immune_supp_id, 'immune suppression', 'effect', 19),
  (bone_mineral_id, 'bone mineral content', 'endpoint', 22),
  (cell_prolif_id, 'cell proliferation rate', 'endpoint', 18),
  (dna_repair_id, 'DNA repair capacity', 'endpoint', 15),
  (muscle_fiber_id, 'muscle fiber cross-sectional area', 'endpoint', 14),
  (cytokine_id, 'cytokine levels', 'endpoint', 17);

  -- Insert sentences
  INSERT INTO sentences (id, paper_id, sentence_text, sentence_index) VALUES
  (s1_1, paper1_id, 'Prolonged exposure to microgravity resulted in significant bone density loss in mice after 60 days.', 0),
  (s1_2, paper1_id, 'The bone mineral content decreased by 15% compared to ground controls.', 1),
  (s1_3, paper1_id, 'Mice exposed to spaceflight conditions showed altered gene expression in osteoblasts.', 2),
  (s2_1, paper2_id, 'Arabidopsis thaliana plants grown in low earth orbit exhibited altered gene expression patterns.', 0),
  (s2_2, paper2_id, 'Cell proliferation rate was reduced by 25% under microgravity conditions.', 1),
  (s2_3, paper2_id, 'Root development in Arabidopsis thaliana was significantly affected during spaceflight.', 2),
  (s3_1, paper3_id, 'Human fibroblasts exposed to radiation showed increased DNA damage markers.', 0),
  (s3_2, paper3_id, 'DNA repair capacity was compromised in cells subjected to prolonged radiation exposure.', 1),
  (s3_3, paper3_id, 'Simulated deep space radiation reduced cell proliferation rate by 40%.', 2),
  (s4_1, paper4_id, 'Skeletal muscle cells demonstrated significant muscle atrophy during spaceflight.', 0),
  (s4_2, paper4_id, 'Muscle fiber cross-sectional area decreased by 30% under microgravity conditions.', 1),
  (s4_3, paper4_id, 'Exercise countermeasures partially prevented muscle atrophy in mice during extended spaceflight.', 2),
  (s5_1, paper5_id, 'Immune cells from mice showed altered cytokine levels after spaceflight.', 0),
  (s5_2, paper5_id, 'Immune suppression was observed in all test subjects exposed to microgravity.', 1),
  (s5_3, paper5_id, 'The study revealed decreased immune cell proliferation under spaceflight conditions.', 2);

  -- Insert sentence entities
  INSERT INTO sentence_entities (sentence_id, entity_id, position_start, position_end) VALUES
  (s1_1, microgravity_id, 21, 33), (s1_1, bone_loss_id, 57, 74), (s1_1, mice_id, 78, 82),
  (s1_2, bone_mineral_id, 4, 24),
  (s1_3, mice_id, 0, 4), (s1_3, spaceflight_id, 16, 27), (s1_3, gene_expr_id, 46, 67),
  (s2_1, arabidopsis_id, 0, 20), (s2_1, leo_id, 35, 49), (s2_1, gene_expr_id, 60, 83),
  (s2_2, cell_prolif_id, 0, 23), (s2_2, microgravity_id, 48, 60),
  (s2_3, arabidopsis_id, 20, 40), (s2_3, spaceflight_id, 76, 87),
  (s3_1, fibroblasts_id, 0, 17), (s3_1, radiation_id, 29, 47), (s3_1, dna_damage_id, 58, 68),
  (s3_2, dna_repair_id, 0, 19), (s3_2, radiation_id, 62, 80),
  (s3_3, radiation_id, 10, 32), (s3_3, cell_prolif_id, 41, 64),
  (s4_1, muscle_id, 0, 21), (s4_1, muscle_atrophy_id, 46, 60), (s4_1, spaceflight_id, 68, 79),
  (s4_2, muscle_fiber_id, 0, 34), (s4_2, microgravity_id, 55, 67),
  (s4_3, muscle_atrophy_id, 41, 55), (s4_3, mice_id, 59, 63), (s4_3, spaceflight_id, 79, 90),
  (s5_1, immune_id, 0, 12), (s5_1, mice_id, 18, 22), (s5_1, cytokine_id, 37, 52), (s5_1, spaceflight_id, 59, 70),
  (s5_2, immune_supp_id, 0, 18), (s5_2, microgravity_id, 62, 74),
  (s5_3, immune_id, 28, 39), (s5_3, spaceflight_id, 62, 73);

  -- Insert entity relationships
  INSERT INTO entity_relationships (source_entity_id, target_entity_id, relationship_strength, co_occurrence_count) VALUES
  (microgravity_id, bone_loss_id, 10, 15),
  (microgravity_id, muscle_atrophy_id, 8, 12),
  (microgravity_id, immune_supp_id, 6, 8),
  (microgravity_id, mice_id, 12, 18),
  (mice_id, bone_loss_id, 9, 14),
  (mice_id, muscle_atrophy_id, 7, 10),
  (arabidopsis_id, gene_expr_id, 8, 11),
  (spaceflight_id, gene_expr_id, 9, 13),
  (spaceflight_id, muscle_atrophy_id, 10, 15),
  (spaceflight_id, immune_supp_id, 7, 9),
  (radiation_id, dna_damage_id, 11, 16),
  (radiation_id, fibroblasts_id, 8, 12),
  (bone_loss_id, bone_mineral_id, 10, 14),
  (dna_damage_id, dna_repair_id, 9, 12),
  (muscle_atrophy_id, muscle_fiber_id, 11, 15),
  (immune_supp_id, cytokine_id, 8, 11);

  RAISE NOTICE 'Sample data inserted successfully!';
END $$;

-- ============================================================================
-- Community Feature Seed Data
-- Insert initial community tags
-- ============================================================================

INSERT INTO community_tags (name, slug, description, color) VALUES
  ('Microgravity', 'microgravity', 'Research related to microgravity effects on biological systems', '#3B82F6'),
  ('Plant Biology', 'plant-biology', 'Studies on plant growth and development in space', '#10B981'),
  ('Animal Studies', 'animal-studies', 'Research involving animal models in space biology', '#F59E0B'),
  ('Cellular Biology', 'cellular-biology', 'Cell-level biological research in space environments', '#8B5CF6'),
  ('Bone Density', 'bone-density', 'Studies on bone density changes in microgravity', '#EF4444'),
  ('ISS Experiments', 'iss-experiments', 'Experiments conducted on the International Space Station', '#06B6D4'),
  ('NASA Research', 'nasa-research', 'Official NASA research programs and findings', '#EC4899'),
  ('Radiation', 'radiation', 'Effects of space radiation on biological systems', '#F97316'),
  ('Space Medicine', 'space-medicine', 'Medical research for long-duration spaceflight', '#14B8A6'),
  ('Astrobiology', 'astrobiology', 'Study of life in the universe and extremophiles', '#A855F7')
ON CONFLICT (slug) DO NOTHING;
