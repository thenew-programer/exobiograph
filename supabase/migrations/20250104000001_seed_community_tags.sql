-- Seed community tags
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
