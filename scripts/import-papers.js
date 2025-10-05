/**
 * NASA Research Papers Import Script
 * 
 * This script reads the data.csv file, fetches metadata from PubMed,
 * and imports all research papers into the Supabase database.
 * 
 * Usage:
 *   npm run import-papers
 *   or
 *   node scripts/import-papers.js
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  console.error('\nCurrent values:');
  console.error(`  NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl || 'NOT SET'}`);
  console.error(`  SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '[SET]' : 'NOT SET'}`);
  console.error('\nChecking .env.local path:', path.join(__dirname, '..', '.env.local'));
  console.error('File exists:', fs.existsSync(path.join(__dirname, '..', '.env.local')) ? 'YES' : 'NO');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Parse CSV file
 */
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Skip header
  const dataLines = lines.slice(1);
  
  const papers = [];
  
  for (const line of dataLines) {
    // Parse CSV line (handles quoted values with commas)
    const match = line.match(/^"?([^"]*)"?,(.*)$/);
    if (!match) continue;
    
    const title = match[1].trim();
    const link = match[2].trim();
    
    if (title && link) {
      papers.push({ title, link });
    }
  }
  
  return papers;
}

/**
 * Extract PubMed ID from URL
 */
function extractPubMedId(url) {
  const match = url.match(/PMC(\d+)/);
  return match ? `PMC${match[1]}` : null;
}

/**
 * Fetch paper metadata from PubMed API
 */
async function fetchPubMedMetadata(pmcId) {
  return new Promise((resolve, reject) => {
    if (!pmcId) {
      resolve(null);
      return;
    }
    
    const id = pmcId.replace('PMC', '');
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pmc&id=${id}&retmode=json`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const result = json.result?.[id];
          
          if (!result) {
            resolve(null);
            return;
          }
          
          resolve({
            authors: result.authors || [],
            pubdate: result.pubdate || result.epubdate || null,
            abstract: result.title || '', // PubMed summary API doesn't return abstract
          });
        } catch (error) {
          console.error(`Error parsing PubMed response for ${pmcId}:`, error.message);
          resolve(null);
        }
      });
    }).on('error', (error) => {
      console.error(`Error fetching PubMed data for ${pmcId}:`, error.message);
      resolve(null);
    });
  });
}

/**
 * Clean and format publication date
 */
function formatDate(dateString) {
  if (!dateString) {
    return new Date().toISOString().split('T')[0]; // Default to today
  }
  
  try {
    // Handle various date formats from PubMed
    // Examples: "2014", "2014 Jan", "2014 Jan 15", "2014-01-15"
    const parts = dateString.split(/[\s-]/);
    const year = parts[0];
    
    const monthMap = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
      'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    
    const month = parts[1] ? (monthMap[parts[1]] || '01') : '01';
    const day = parts[2] || '01';
    
    return `${year}-${month}-${day.padStart(2, '0')}`;
  } catch (error) {
    console.error(`Error formatting date "${dateString}":`, error.message);
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Import papers to Supabase
 */
async function importPapers() {
  console.log('🚀 Starting NASA Research Papers Import...\n');
  
  // Read CSV file
  const csvPath = path.join(__dirname, '..', 'data.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found at: ${csvPath}`);
    process.exit(1);
  }
  
  console.log(`📖 Reading CSV file: ${csvPath}`);
  const papers = parseCSV(csvPath);
  console.log(`✅ Found ${papers.length} papers to import\n`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  // Process papers one at a time (to avoid rate limiting PubMed API)
  for (let i = 0; i < papers.length; i++) {
    const paper = papers[i];
    const index = i + 1;
    
    try {
      const pmcId = extractPubMedId(paper.link);
      
      if (!pmcId) {
        console.log(`⚠️  [${index}/${papers.length}] No PMC ID found for: ${paper.title.substring(0, 50)}...`);
      }
      
      console.log(`📡 [${index}/${papers.length}] Fetching metadata for ${pmcId}...`);
      
      // Fetch metadata from PubMed
      const metadata = await fetchPubMedMetadata(pmcId);
      
      // Prepare data for insertion
      const paperData = {
        title: paper.title,
        source_url: paper.link,
        authors: metadata?.authors?.map(a => a.name || 'Unknown') || ['Unknown'],
        publication_date: formatDate(metadata?.pubdate),
        abstract: metadata?.abstract || paper.title, // Use title as fallback for abstract
        created_at: new Date().toISOString(),
      };
      
      // Insert paper into database
      const { data, error } = await supabase
        .from('research_papers')
        .insert(paperData)
        .select()
        .single();
      
      if (error) {
        // Check if it's a duplicate
        if (error.code === '23505') {
          console.log(`⚠️  [${index}/${papers.length}] Duplicate: ${paper.title.substring(0, 50)}...`);
          successCount++;
          continue;
        }
        throw error;
      }
      
      console.log(`✅ [${index}/${papers.length}] Imported: ${paper.title.substring(0, 50)}...`);
      console.log(`   Authors: ${paperData.authors.slice(0, 3).join(', ')}${paperData.authors.length > 3 ? '...' : ''}`);
      console.log(`   Date: ${paperData.publication_date}`);
      successCount++;
      
      // Small delay to avoid rate limiting (NCBI recommends max 3 requests/second)
      await new Promise(resolve => setTimeout(resolve, 400));
      
    } catch (error) {
      console.error(`❌ [${index}/${papers.length}] Error: ${paper.title.substring(0, 50)}...`);
      console.error(`   Reason: ${error.message}`);
      errorCount++;
      errors.push({ paper, error: error.message });
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Import Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successfully imported: ${successCount}/${papers.length}`);
  console.log(`❌ Failed: ${errorCount}/${papers.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach((err, idx) => {
      console.log(`   ${idx + 1}. ${err.paper?.title || 'Unknown'}`);
      console.log(`      ${err.error}`);
    });
  }
  
  console.log('\n✨ Import completed!\n');
}

// Run the import
importPapers()
  .then(() => {
    console.log('👋 Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
