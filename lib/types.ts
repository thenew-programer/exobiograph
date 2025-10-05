/**
 * ExoBioGraph - Core Type Definitions
 * NASA Biology Knowledge Engine
 */

// ============================================================================
// Entity Types
// ============================================================================

export type EntityType = 'sample' | 'conditions' | 'result' | 'objective' | 'entity';

export interface Entity {
  id: string;
  entity_text: string;
  entity_type: EntityType;
  frequency: number;
  created_at?: string;
}

// ============================================================================
// Research Paper Types
// ============================================================================

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  publication_date: string;
  source_url: string;
  abstract: string;
  created_at?: string;
}

// ============================================================================
// Sentence Types
// ============================================================================

export interface Sentence {
  id: string;
  paper_id: string;
  sentence_text: string;
  sentence_index: number;
  created_at?: string;
}

export interface SentenceEntity {
  id: string;
  sentence_id: string;
  entity_id: string;
  position_start: number;
  position_end: number;
}

// ============================================================================
// Search Result Types
// ============================================================================

export interface EntityHighlight {
  text: string;
  type: EntityType;
  position: [number, number];
}

export interface SearchResult {
  id: string;
  sentence: string;
  entities: EntityHighlight[];
  paper: {
    id: string;
    title: string;
    authors: string[];
    sourceUrl: string;
    publicationDate: string;
  };
  relevanceScore?: number;
}

// ============================================================================
// Knowledge Graph Types
// ============================================================================

export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  frequency: number;
  papers?: Array<{
    id: string;
    title: string;
    authors: string[];
    source_url: string;
    publication_date: string;
  }>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  coOccurrenceCount: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphStats {
  totalEntities: number;
  totalRelationships: number;
  totalPapers: number;
  topEntities: Array<{
    entity: string;
    type: EntityType;
    connections: number;
  }>;
  lastUpdated: string;
}

// ============================================================================
// Entity Relationship Types
// ============================================================================

export interface EntityRelationship {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_strength: number;
  co_occurrence_count: number;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface FilterState {
  entityTypes: Set<EntityType>;
  entities: Set<string>;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// ============================================================================
// Database Join Types (for Supabase queries)
// ============================================================================

export interface SentenceWithEntities extends Sentence {
  paper: ResearchPaper;
  sentence_entities: Array<{
    entity: Entity;
    position_start: number;
    position_end: number;
  }>;
}

// ============================================================================
// UI Component Props Types
// ============================================================================

export interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
  isLoading?: boolean;
}

export interface ResultCardProps {
  result: SearchResult;
  onEntityClick: (entity: EntityHighlight) => void;
  isHighlighted?: boolean;
}

export interface FilterPanelProps {
  activeFilters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableEntities: Entity[];
}

export interface KnowledgeGraphProps {
  data: GraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
}

// ============================================================================
// Utility Types
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: LoadingState;
}

// ============================================================================
// Entity Color Mapping
// ============================================================================

export const ENTITY_COLORS: Record<EntityType, { bg: string; text: string; border: string }> = {
  sample: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700',
  },
  conditions: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700',
  },
  result: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-700',
  },
  objective: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-700',
  },
  entity: {
    bg: 'bg-slate-100 dark:bg-slate-900/30',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
  },
};

// Entity type display names
export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  sample: 'Sample',
  conditions: 'Conditions',
  result: 'Result',
  objective: 'Objective',
  entity: 'Entity',
};
