/**
 * Entity Extraction and Linking Script
 * 
 * This script processes imported research papers to:
 * 1. Extract sentences from abstracts
 * 2. Identify entities (samples, conditions, results, objectives, entities)
 * 3. Create entity relationships for the knowledge graph
 * 
 * Usage:
 *   npm run extract-entities
 *   or
 *   node scripts/extract-entities.js
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Simple sentence splitter
 */
function splitIntoSentences(text) {
  // Split on period, exclamation, or question mark followed by space and capital letter
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return sentences.map(s => s.trim()).filter(s => s.length > 10);
}

/**
 * Extract entities from text using keyword matching
 * This is a basic implementation - you can enhance with NLP libraries
 */
function extractEntities(text) {
  const entities = [];
  
  // Sample keywords (biological samples and organisms)
  const sampleKeywords = [
    'mice', 'mouse', 'rat', 'rats', 'drosophila', 'arabidopsis', 'tardigrade', 'tardigrades',
    'cells', 'stem cells', 'osteoblast', 'osteoclast', 'embryonic', 'tissue', 'bone',
    'muscle', 'cardiac', 'skeletal', 'neurons', 'bacteria', 'e. coli', 'yeast'
  ];
  
  // Condition keywords
  const conditionKeywords = [
    'microgravity', 'spaceflight', 'radiation', 'cosmic ray', 'simulated', 'hypergravity',
    'altered gravity', 'space environment', 'hindlimb unloading', 'partial weight suspension',
    'oxidative stress', 'temperature', 'pressure', 'ionizing radiation'
  ];
  
  // Result keywords
  const resultKeywords = [
    'loss', 'increased', 'decreased', 'reduced', 'elevated', 'atrophy', 'growth',
    'expression', 'activation', 'inhibition', 'regulation', 'modulation', 'response',
    'adaptation', 'damage', 'repair', 'recovery', 'mortality', 'survival'
  ];
  
  // Objective keywords
  const objectiveKeywords = [
    'investigate', 'study', 'examine', 'analyze', 'determine', 'assess', 'evaluate',
    'characterize', 'identify', 'explore', 'understand', 'test', 'measure', 'quantify'
  ];
  
  const textLower = text.toLowerCase();
  
  // Extract samples
  sampleKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      entities.push({
        text: match[0],
        type: 'sample',
        start: match.index,
        end: match.index + match[0].length
      });
    }
  });
  
  // Extract conditions
  conditionKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      entities.push({
        text: match[0],
        type: 'conditions',
        start: match.index,
        end: match.index + match[0].length
      });
    }
  });
  
  // Extract results
  resultKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      entities.push({
        text: match[0],
        type: 'result',
        start: match.index,
        end: match.index + match[0].length
      });
    }
  });
  
  // Extract objectives
  objectiveKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      entities.push({
        text: match[0],
        type: 'objective',
        start: match.index,
        end: match.index + match[0].length
      });
    }
  });
  
  // Sort by position and remove duplicates
  return entities
    .sort((a, b) => a.start - b.start)
    .filter((entity, index, self) => 
      index === self.findIndex(e => e.start === entity.start && e.text === entity.text)
    );
}

/**
 * Process a single paper
 */
async function processPaper(paper, index, total) {
  console.log(`\n📄 [${index}/${total}] Processing: ${paper.title.substring(0, 60)}...`);
  
  try {
    // Step 1: Split abstract into sentences
    const sentences = splitIntoSentences(paper.abstract);
    console.log(`   Found ${sentences.length} sentences`);
    
    if (sentences.length === 0) {
      console.log('   ⚠️  No sentences to process, skipping...');
      return { success: false, reason: 'No sentences' };
    }
    
    // Step 2: Insert sentences
    const sentenceRecords = [];
    for (let i = 0; i < sentences.length; i++) {
      const { data, error } = await supabase
        .from('sentences')
        .insert({
          paper_id: paper.id,
          sentence_text: sentences[i],
          sentence_index: i
        })
        .select()
        .single();
      
      if (error) {
        if (error.code !== '23505') { // Ignore duplicates
          throw error;
        }
        // If duplicate, fetch existing
        const { data: existing } = await supabase
          .from('sentences')
          .select()
          .eq('paper_id', paper.id)
          .eq('sentence_index', i)
          .single();
        
        if (existing) {
          sentenceRecords.push(existing);
        }
      } else {
        sentenceRecords.push(data);
      }
    }
    
    console.log(`   ✅ Inserted ${sentenceRecords.length} sentences`);
    
    // Step 3: Extract and insert entities
    const entityMap = new Map(); // entity_text -> entity_id
    let totalEntities = 0;
    
    for (const sentenceRecord of sentenceRecords) {
      const entities = extractEntities(sentenceRecord.sentence_text);
      
      for (const entity of entities) {
        // Insert or get entity
        let entityId = entityMap.get(entity.text.toLowerCase());
        
        if (!entityId) {
          const { data: existingEntity } = await supabase
            .from('entities')
            .select()
            .ilike('entity_text', entity.text)
            .eq('entity_type', entity.type)
            .single();
          
          if (existingEntity) {
            entityId = existingEntity.id;
            // Update frequency
            await supabase
              .from('entities')
              .update({ frequency: existingEntity.frequency + 1 })
              .eq('id', entityId);
          } else {
            const { data: newEntity, error } = await supabase
              .from('entities')
              .insert({
                entity_text: entity.text,
                entity_type: entity.type,
                frequency: 1
              })
              .select()
              .single();
            
            if (error && error.code !== '23505') {
              console.error(`   ⚠️  Error inserting entity "${entity.text}":`, error.message);
              continue;
            }
            
            entityId = newEntity?.id;
          }
          
          if (entityId) {
            entityMap.set(entity.text.toLowerCase(), entityId);
          }
        }
        
        // Link entity to sentence
        if (entityId) {
          const { error } = await supabase
            .from('sentence_entities')
            .insert({
              sentence_id: sentenceRecord.id,
              entity_id: entityId,
              position_start: entity.start,
              position_end: entity.end
            });
          
          if (error && error.code !== '23505') {
            console.error(`   ⚠️  Error linking entity:`, error.message);
          } else {
            totalEntities++;
          }
        }
      }
    }
    
    console.log(`   ✅ Extracted and linked ${totalEntities} entity mentions`);
    
    // Step 4: Build entity relationships (co-occurrence in same sentence)
    let relationshipsCreated = 0;
    
    for (const sentenceRecord of sentenceRecords) {
      // Get all entities in this sentence
      const { data: sentenceEntities } = await supabase
        .from('sentence_entities')
        .select('entity_id')
        .eq('sentence_id', sentenceRecord.id);
      
      if (!sentenceEntities || sentenceEntities.length < 2) continue;
      
      // Create relationships between all pairs
      const entityIds = sentenceEntities.map(se => se.entity_id);
      
      for (let i = 0; i < entityIds.length; i++) {
        for (let j = i + 1; j < entityIds.length; j++) {
          const sourceId = entityIds[i];
          const targetId = entityIds[j];
          
          if (sourceId === targetId) continue;
          
          // Check if relationship exists
          const { data: existing } = await supabase
            .from('entity_relationships')
            .select()
            .or(`and(source_entity_id.eq.${sourceId},target_entity_id.eq.${targetId}),and(source_entity_id.eq.${targetId},target_entity_id.eq.${sourceId})`)
            .single();
          
          if (existing) {
            // Update strength
            await supabase
              .from('entity_relationships')
              .update({ 
                relationship_strength: existing.relationship_strength + 1,
                co_occurrence_count: existing.co_occurrence_count + 1
              })
              .eq('id', existing.id);
          } else {
            // Create new relationship
            const { error } = await supabase
              .from('entity_relationships')
              .insert({
                source_entity_id: sourceId,
                target_entity_id: targetId,
                relationship_strength: 1,
                co_occurrence_count: 1
              });
            
            if (!error || error.code === '23505') {
              relationshipsCreated++;
            }
          }
        }
      }
    }
    
    console.log(`   ✅ Created ${relationshipsCreated} new entity relationships`);
    
    return { success: true };
    
  } catch (error) {
    console.error(`   ❌ Error processing paper:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main function
 */
async function extractEntitiesFromPapers() {
  console.log('🚀 Starting Entity Extraction and Linking...\n');
  
  // Fetch all papers
  console.log('📖 Fetching papers from database...');
  const { data: papers, error } = await supabase
    .from('research_papers')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('❌ Error fetching papers:', error);
    process.exit(1);
  }
  
  console.log(`✅ Found ${papers.length} papers to process\n`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  // Process each paper
  for (let i = 0; i < papers.length; i++) {
    const result = await processPaper(papers[i], i + 1, papers.length);
    
    if (result.success) {
      successCount++;
    } else {
      errorCount++;
      errors.push({ paper: papers[i], reason: result.reason || result.error });
    }
    
    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Extraction Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successfully processed: ${successCount}/${papers.length}`);
  console.log(`❌ Failed: ${errorCount}/${papers.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach((err, idx) => {
      console.log(`   ${idx + 1}. ${err.paper.title.substring(0, 50)}...`);
      console.log(`      ${err.reason || err.error}`);
    });
  }
  
  // Get final statistics
  console.log('\n📈 Database Statistics:');
  const { data: stats } = await supabase.rpc('get_graph_statistics');
  if (stats) {
    console.log(`   Total Entities: ${stats.totalEntities}`);
    console.log(`   Total Relationships: ${stats.totalRelationships}`);
    console.log(`   Total Papers: ${stats.totalPapers}`);
  }
  
  console.log('\n✨ Entity extraction completed!\n');
}

// Run the extraction
extractEntitiesFromPapers()
  .then(() => {
    console.log('👋 Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
