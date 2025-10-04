import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { EntityType, GraphData, GraphNode, GraphEdge } from "@/lib/types";

// Simple in-memory cache
const graphCache = new Map<string, { data: GraphData; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { entityTypes } = body as {
      entityTypes?: EntityType[];
    };

    // Create cache key from entity types
    const cacheKey = entityTypes?.sort().join(',') || 'all';
    
    // Check cache
    const cached = graphCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'private, max-age=300', // 5 minutes
          'X-Cache': 'HIT'
        }
      });
    }

    // Fetch graph data
    const graphData = await buildGraphData(supabase, entityTypes);
    
    // Store in cache
    graphCache.set(cacheKey, { data: graphData, timestamp: Date.now() });
    
    // Clean old cache entries (simple cleanup)
    if (graphCache.size > 20) {
      const oldestKey = Array.from(graphCache.keys())[0];
      if (oldestKey) {
        graphCache.delete(oldestKey);
      }
    }

    return NextResponse.json(graphData, {
      headers: {
        'Cache-Control': 'private, max-age=300', // 5 minutes
        'X-Cache': 'MISS'
      }
    });
  } catch (error) {
    console.error("Graph API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function buildGraphData(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  entityTypes?: EntityType[]
): Promise<GraphData> {
  try {
    // Build entity type filter
    let entitiesQuery = supabase
      .from("entities")
      .select("id, entity_text, entity_type, frequency")
      .order("frequency", { ascending: false })
      .limit(100); // Limit nodes for performance

    if (entityTypes && entityTypes.length > 0) {
      entitiesQuery = entitiesQuery.in("entity_type", entityTypes);
    }

    const { data: entities, error: entitiesError } = await entitiesQuery;

    if (entitiesError) {
      console.error("Failed to fetch entities:", entitiesError);
      return { nodes: [], edges: [] };
    }

    if (!entities || entities.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Fetch papers for each entity
    const entityIds = entities.map((e) => e.id);
    const { data: sentenceEntities } = await supabase
      .from("sentence_entities")
      .select(`
        entity_id,
        sentences (
          paper_id,
          research_papers (
            id,
            title,
            authors,
            source_url,
            publication_date
          )
        )
      `)
      .in("entity_id", entityIds);

    // Group papers by entity
    const papersByEntity: Record<string, unknown[]> = {};
    if (sentenceEntities) {
      sentenceEntities.forEach((se) => {
        if (!papersByEntity[se.entity_id]) {
          papersByEntity[se.entity_id] = [];
        }
        // Handle both single paper and array structure
        const sentences = se.sentences as { research_papers?: unknown } | Array<{ research_papers?: unknown }>;
        if (Array.isArray(sentences)) {
          sentences.forEach((s) => {
            if (s.research_papers) {
              const paper = s.research_papers;
              if (!papersByEntity[se.entity_id].find((p: unknown) => (p as { id: string }).id === (paper as { id: string }).id)) {
                papersByEntity[se.entity_id].push(paper);
              }
            }
          });
        } else if (sentences?.research_papers) {
          const paper = sentences.research_papers;
          if (!papersByEntity[se.entity_id].find((p: unknown) => (p as { id: string }).id === (paper as { id: string }).id)) {
            papersByEntity[se.entity_id].push(paper);
          }
        }
      });
    }

    // Create nodes with papers
    const nodes: GraphNode[] = entities.map((entity) => ({
      id: entity.id,
      label: entity.entity_text,
      type: entity.entity_type as EntityType,
      frequency: entity.frequency,
      papers: (papersByEntity[entity.id] || []) as GraphNode['papers'],
    }));

    // Fetch relationships between these entities
    const { data: relationships, error: relationshipsError } = await supabase
      .from("entity_relationships")
      .select("id, source_entity_id, target_entity_id, relationship_strength, co_occurrence_count")
      .in("source_entity_id", entityIds)
      .in("target_entity_id", entityIds)
      .order("relationship_strength", { ascending: false })
      .limit(200); // Limit edges for performance

    if (relationshipsError) {
      console.error("Failed to fetch relationships:", relationshipsError);
      return { nodes, edges: [] };
    }

    // Create edges
    const edges: GraphEdge[] = (relationships || []).map((rel) => ({
      id: rel.id,
      source: rel.source_entity_id,
      target: rel.target_entity_id,
      weight: rel.relationship_strength,
      coOccurrenceCount: rel.co_occurrence_count,
    }));

    return { nodes, edges };
  } catch (error) {
    console.error("Failed to build graph data:", error);
    return { nodes: [], edges: [] };
  }
}
