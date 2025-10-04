import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedCommunityTags() {
  console.log('Seeding community tags...');

  const tags = [
    { name: 'Microgravity', slug: 'microgravity', description: 'Research related to microgravity effects on biological systems', color: '#3B82F6' },
    { name: 'Plant Biology', slug: 'plant-biology', description: 'Studies on plant growth and development in space', color: '#10B981' },
    { name: 'Animal Studies', slug: 'animal-studies', description: 'Research involving animal models in space biology', color: '#F59E0B' },
    { name: 'Cellular Biology', slug: 'cellular-biology', description: 'Cell-level biological research in space environments', color: '#8B5CF6' },
    { name: 'Bone Density', slug: 'bone-density', description: 'Studies on bone density changes in microgravity', color: '#EF4444' },
    { name: 'ISS Experiments', slug: 'iss-experiments', description: 'Experiments conducted on the International Space Station', color: '#06B6D4' },
    { name: 'NASA Research', slug: 'nasa-research', description: 'Official NASA research programs and findings', color: '#EC4899' },
    { name: 'Radiation', slug: 'radiation', description: 'Effects of space radiation on biological systems', color: '#F97316' },
    { name: 'Space Medicine', slug: 'space-medicine', description: 'Medical research for long-duration spaceflight', color: '#14B8A6' },
    { name: 'Astrobiology', slug: 'astrobiology', description: 'Study of life in the universe and extremophiles', color: '#A855F7' }
  ];

  for (const tag of tags) {
    const { data, error } = await supabase
      .from('community_tags')
      .upsert(tag, { onConflict: 'slug', ignoreDuplicates: true })
      .select();

    if (error) {
      console.error(`Error inserting tag ${tag.name}:`, error);
    } else {
      console.log(`✓ Inserted tag: ${tag.name}`);
    }
  }

  console.log('\nSeeding complete!');
  process.exit(0);
}

seedCommunityTags();
