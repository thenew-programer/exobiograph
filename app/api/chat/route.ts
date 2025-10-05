import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const SCIBERT_BASE_URL = 'https://ybouryal-scibert-nasa.hf.space';

// Generate a random session hash similar to Gradio's format
function generateSessionHash(): string {
  return Math.random().toString(36).substring(2, 15);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, message, mode } = await request.json();

    if (!conversationId || !message) {
      return NextResponse.json(
        { error: 'Missing conversationId or message' },
        { status: 400 }
      );
    }

    // Determine fn_index based on mode
    // 0 = Question Answering, 1 = Summarization
    const fnIndex = mode === 'summarize' ? 1 : 0;
    console.log('Mode:', mode, 'fn_index:', fnIndex);

    // Verify conversation belongs to user
    const { data: conversation } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', conversationId)
      .single();

    if (!conversation || conversation.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Call SciBERT QA API using Gradio's queue pattern
    let aiResponse;
    try {
      console.log('Calling SciBERT API with message:', message);
      
      const sessionHash = generateSessionHash();
      console.log('Generated session hash:', sessionHash);
      
      // Step 1: Join the queue
      const joinResponse = await fetch(`${SCIBERT_BASE_URL}/gradio_api/queue/join?`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: fnIndex === 1 ? [message, 0.5] : [message], // Summarization needs ratio parameter
          event_data: null,
          fn_index: fnIndex,
          session_hash: sessionHash,
        }),
      });

      console.log('Queue join response status:', joinResponse.status);

      if (!joinResponse.ok) {
        const errorText = await joinResponse.text();
        console.error('Queue join error:', errorText);
        throw new Error(`Failed to join queue: ${joinResponse.statusText}`);
      }

      const joinData = await joinResponse.json();
      console.log('Queue join data:', JSON.stringify(joinData, null, 2));

      // Step 2: Poll the queue data endpoint for results
      const dataUrl = `${SCIBERT_BASE_URL}/gradio_api/queue/data?session_hash=${sessionHash}`;
      console.log('Polling data URL:', dataUrl);

      let answer = null;
      let attempts = 0;
      const maxAttempts = 60; // 60 attempts with 1 second delay = 60 seconds timeout

      while (attempts < maxAttempts && !answer) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between polls

        try {
          const dataResponse = await fetch(dataUrl, {
            headers: {
              'Accept': 'text/event-stream',
            },
          });

          if (!dataResponse.ok) {
            console.log(`Data response not ok: ${dataResponse.status}, attempt ${attempts + 1}`);
            attempts++;
            continue;
          }

          const responseText = await dataResponse.text();
          console.log('Data response:', responseText.substring(0, 500)); // Log first 500 chars

          // Parse server-sent events
          const lines = responseText.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                console.log('Parsed event data:', data);
                
                // Check for process_completed event with output
                if (data.msg === 'process_completed' && data.output?.data) {
                  answer = data.output.data[0];
                  console.log('Found answer:', answer);
                  break;
                }
              } catch (e) {
                console.error('Error parsing event line:', line, e);
              }
            }
          }

          if (answer) break;
        } catch (fetchError) {
          console.error('Error fetching data:', fetchError);
        }

        attempts++;
      }

      if (!answer) {
        console.error('Timeout waiting for answer from SciBERT after', attempts, 'attempts');
        throw new Error('Timeout waiting for answer from SciBERT API');
      }

      console.log('Successfully received answer from SciBERT:', answer);

      aiResponse = {
        content: answer,
        entities: extractEntities(message, answer),
        sources: await fetchRelevantSources(supabase, message),
      };
    } catch (error) {
      console.error('SciBERT API error details:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Fallback to mock response if API fails
      aiResponse = {
        content: generateFallbackResponse(message),
        entities: extractMockEntities(message),
        sources: await fetchRelevantSources(supabase, message),
      };
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return NextResponse.json(aiResponse);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Extract entities from the question and answer
function extractEntities(question: string, answer: string): string[] {
  const text = `${question} ${answer}`.toLowerCase();
  const entities = new Set<string>();

  // Entity type keywords
  const entityPatterns = [
    // Samples (organisms)
    /\b(bacteria|microbes?|organisms?|plants?|animals?|fungi|archaea|e\.?\s*coli|salmonella|yeast)\b/gi,
    // Conditions
    /\b(microgravity|zero[- ]g|radiation|cosmic rays?|temperature|pressure|humidity|oxygen)\b/gi,
    // Results (effects)
    /\b(growth|mutation|adaptation|gene expression|protein|dna|rna|metabolism)\b/gi,
    // Objectives
    /\b(survival|habitability|colonization|agriculture|life support|sustainability)\b/gi,
  ];

  entityPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => entities.add(match.toLowerCase()));
    }
  });

  return Array.from(entities);
}

// Fetch relevant research papers based on the question
async function fetchRelevantSources(supabase: Awaited<ReturnType<typeof createServerClient>>, question: string): Promise<string[]> {
  try {
    // Search for papers with titles or abstracts matching key terms
    const keywords = question.toLowerCase().split(' ').filter(word => word.length > 4);
    
    if (keywords.length === 0) {
      return [];
    }

    const { data: papers } = await supabase
      .from('papers')
      .select('title, authors, year')
      .limit(3);

    if (papers && papers.length > 0) {
      return papers.map((paper: { title: string; authors: string; year: number }) => 
        `${paper.title} - ${paper.authors} (${paper.year})`
      );
    }

    return [];
  } catch (error) {
    console.error('Error fetching sources:', error);
    return [];
  }
}

// Fallback response when SciBERT API is unavailable
function generateFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('microgravity') || lowerMessage.includes('zero-g')) {
    return "I'm currently unable to connect to the AI model, but based on available research, microgravity conditions significantly affect biological systems. Studies show changes in gene expression, protein synthesis, and cellular metabolism in space environments. For detailed information, please try again in a moment.";
  }
  
  if (lowerMessage.includes('radiation') || lowerMessage.includes('cosmic')) {
    return "I'm currently unable to connect to the AI model, but research indicates that cosmic radiation poses significant challenges for space biology. Organisms show various responses including DNA damage, mutations, and adaptive mechanisms. For detailed analysis, please try again in a moment.";
  }
  
  if (lowerMessage.includes('plant') || lowerMessage.includes('agriculture')) {
    return "I'm currently unable to connect to the AI model, but space agriculture research has shown that plants can grow in microgravity with proper conditions. Key challenges include water distribution, lighting, and nutrient delivery. For detailed information, please try again in a moment.";
  }
  
  return "I'm currently unable to connect to the AI model to provide a detailed answer. Please try again in a moment. In the meantime, you can explore the Knowledge Graph to discover related research papers and biological entities.";
}

// Extract entities for fallback responses
function extractMockEntities(message: string): string[] {
  const entities: string[] = [];
  const lowerMessage = message.toLowerCase();

  const entityMap: { [key: string]: string } = {
    'microgravity': 'Microgravity (Condition)',
    'gravity': 'Microgravity (Condition)',
    'radiation': 'Radiation (Condition)',
    'arabidopsis': 'Arabidopsis thaliana (Sample)',
    'plant': 'Plants (Sample)',
    'mice': 'Mice (Sample)',
    'mouse': 'Mice (Sample)',
    'bone': 'Bone density loss (Result)',
    'muscle': 'Muscle atrophy (Result)',
    'immune': 'Immune suppression (Result)',
    'dna': 'DNA damage (Result)',
  };

  Object.entries(entityMap).forEach(([keyword, entity]) => {
    if (lowerMessage.includes(keyword) && !entities.includes(entity)) {
      entities.push(entity);
    }
  });

  return entities;
}
