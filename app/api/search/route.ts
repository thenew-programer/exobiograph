import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { SearchResult, EntityType } from "@/lib/types";

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
    const { query, entityTypes } = body as {
      query: string;
      entityTypes?: EntityType[];
    };

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Save search to history
    await saveSearchHistory(supabase, user.id, query, entityTypes);

    // Perform search using the database function
    const results = await performSearch(supabase, query, entityTypes);

    return NextResponse.json({
      results,
      totalResults: results.length,
      query,
      filters: { entityTypes },
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function performSearch(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  query: string,
  entityTypes?: EntityType[]
): Promise<SearchResult[]> {
  try {
    // Call the database search function
    const { data, error } = await supabase.rpc("search_biology_knowledge", {
      search_query: query,
      limit_count: 50,
    });

    if (error) {
      console.error("Database search error:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Group results by sentence to combine multiple entities
    const sentenceMap = new Map<string, {
      sentence_id: string;
      sentence_text: string;
      paper_id: string;
      paper_title: string;
      paper_authors: string[];
      paper_source_url?: string;
      paper_publication_date?: string;
      relevance_score: number;
      entities: Array<{ text: string; type: EntityType; position: [number, number] }>;
    }>();
    
    data.forEach((row: {
      sentence_id: string;
      sentence_text: string;
      paper_id: string;
      paper_title: string;
      paper_authors?: string[];
      paper_source_url?: string;
      paper_publication_date?: string;
      relevance_score: number;
      entity_text?: string;
      entity_type?: string;
      position_start?: number;
      position_end?: number;
    }) => {
      if (!sentenceMap.has(row.sentence_id)) {
        sentenceMap.set(row.sentence_id, {
          sentence_id: row.sentence_id,
          sentence_text: row.sentence_text,
          paper_id: row.paper_id,
          paper_title: row.paper_title,
          paper_authors: row.paper_authors || [],
          paper_source_url: row.paper_source_url,
          paper_publication_date: row.paper_publication_date,
          relevance_score: row.relevance_score,
          entities: [],
        });
      }
      
      // Add entity if it exists
      const sentenceData = sentenceMap.get(row.sentence_id);
      if (sentenceData && row.entity_text && row.entity_type && row.position_start !== undefined && row.position_end !== undefined) {
        sentenceData.entities.push({
          text: row.entity_text,
          type: row.entity_type as EntityType,
          position: [row.position_start, row.position_end] as [number, number],
        });
      }
    });

    // Transform to SearchResult format
    let results: SearchResult[] = Array.from(sentenceMap.values()).map((row) => ({
      id: row.sentence_id,
      sentence: row.sentence_text,
      entities: row.entities,
      paper: {
        id: row.paper_id,
        title: row.paper_title,
        authors: row.paper_authors || [],
        sourceUrl: row.paper_source_url || '',
        publicationDate: row.paper_publication_date || '',
      },
      relevanceScore: row.relevance_score,
    }));

    // Filter by entity types if specified (client-side filtering)
    if (entityTypes && entityTypes.length > 0) {
      results = results.filter((result) =>
        result.entities.some((entity) => entityTypes.includes(entity.type))
      );
    }

    return results;
  } catch (error) {
    console.error("Search processing error:", error);
    return [];
  }
}

async function saveSearchHistory(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
  query: string,
  entityTypes?: EntityType[]
) {
  try {
    await supabase.from("search_history").insert({
      user_id: userId,
      search_query: query,
      entity_types_filter: entityTypes || null,
    });
  } catch (error) {
    console.error("Failed to save search history:", error);
    // Don't throw - search history is not critical
  }
}
