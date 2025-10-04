import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// This is a placeholder - you'll need to implement your actual AI backend integration
// For now, this returns a mock response
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, message } = await request.json();

    if (!conversationId || !message) {
      return NextResponse.json(
        { error: 'Missing conversationId or message' },
        { status: 400 }
      );
    }

    // Verify conversation belongs to user
    const { data: conversation } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', conversationId)
      .single();

    if (!conversation || conversation.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // TODO: Replace this with actual AI backend call
    // Example: const aiResponse = await fetch(process.env.AI_BACKEND_URL, {...})
    
    // Mock response for now
    const mockResponse = {
      content: generateMockResponse(message),
      entities: extractMockEntities(message),
      sources: [
        'NASA Technical Reports Server - NTRS-2023-001234',
        'Space Biology Research Database - Study #5678',
      ],
    };

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Mock response generator - replace with actual AI integration
function generateMockResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('microgravity') || lowerMessage.includes('gravity')) {
    return `Microgravity environments in space have profound effects on biological organisms. Research has shown that exposure to microgravity can lead to:

1. **Bone density loss**: Astronauts can lose 1-2% of bone mass per month in space due to reduced mechanical loading.

2. **Muscle atrophy**: Without gravitational resistance, muscles weaken and decrease in size, particularly in the legs and back.

3. **Immune system changes**: Studies on the ISS have shown alterations in immune cell function and gene expression patterns.

4. **Cellular modifications**: Plant cells exhibit altered growth patterns, and microbial cultures show changes in virulence and antibiotic resistance.

Would you like to know more about a specific organism or experimental endpoint?`;
  }

  if (lowerMessage.includes('arabidopsis') || lowerMessage.includes('plant')) {
    return `Arabidopsis thaliana is one of the most studied plants in space biology research. Key findings include:

- **Gravity sensing**: Root growth patterns change in microgravity, with roots exhibiting "skewing" and "waving" behaviors.
- **Gene expression**: Over 1,000 genes show altered expression in spaceflight conditions.
- **Cell wall modifications**: Changes in cell wall composition affect structural integrity.

The European Modular Cultivation System (EMCS) on the ISS has been instrumental in these studies.`;
  }

  return `Based on NASA's space biology research database, I can help you explore various aspects of biological responses to spaceflight conditions. This includes:

• Organisms studied: mice, plants (Arabidopsis), human cells, microbes
• Environmental conditions: microgravity, radiation, confined habitats
• Biological effects: bone loss, muscle atrophy, immune changes, DNA damage
• Measured endpoints: gene expression, cell proliferation, biomechanical properties

What specific aspect would you like to learn more about?`;
}

// Mock entity extraction - replace with actual NER
function extractMockEntities(message: string): string[] {
  const entities: string[] = [];
  const lowerMessage = message.toLowerCase();

  const entityMap: { [key: string]: string } = {
    'microgravity': 'Microgravity (Condition)',
    'gravity': 'Microgravity (Condition)',
    'radiation': 'Radiation (Condition)',
    'arabidopsis': 'Arabidopsis thaliana (Organism)',
    'plant': 'Plants (Organism)',
    'mice': 'Mice (Organism)',
    'mouse': 'Mice (Organism)',
    'bone': 'Bone density loss (Effect)',
    'muscle': 'Muscle atrophy (Effect)',
    'immune': 'Immune suppression (Effect)',
    'dna': 'DNA damage (Effect)',
  };

  Object.entries(entityMap).forEach(([keyword, entity]) => {
    if (lowerMessage.includes(keyword) && !entities.includes(entity)) {
      entities.push(entity);
    }
  });

  return entities;
}
