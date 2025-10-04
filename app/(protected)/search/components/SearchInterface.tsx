"use client";

import { useState } from "react";
import { Search as SearchIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ENTITY_COLORS, ENTITY_TYPE_LABELS } from "@/lib/types";
import type { EntityType, SearchResult } from "@/lib/types";
import { toast } from "sonner";

export function SearchInterface() {
  const [query, setQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<EntityType[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entityTypes: EntityType[] = ["organism", "condition", "effect", "endpoint"];

  const toggleEntityType = (type: EntityType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setError(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          entityTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Search failed";
        toast.error(errorMessage);
        setError(errorMessage);
        setResults([]);
        return;
      }

      const data = await response.json();
      setResults(data.results || []);
      
      if (data.results && data.results.length > 0) {
        toast.success(`Found ${data.results.length} result${data.results.length !== 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error("Search error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(errorMessage);
      setError(errorMessage);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
            Search Research
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Search through NASA&apos;s space biology research database
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-900">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search for organisms, conditions, effects, or endpoints..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1"
              disabled={isSearching}
            />
            <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
              <SearchIcon className="mr-2 h-4 w-4" />
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>

          {/* Entity Type Filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Filter by type:
            </span>
            {entityTypes.map((type) => (
              <Badge
                key={type}
                variant={selectedTypes.includes(type) ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  selectedTypes.includes(type)
                    ? `${ENTITY_COLORS[type]} text-white`
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                onClick={() => toggleEntityType(type)}
              >
                {ENTITY_TYPE_LABELS[type]}
              </Badge>
            ))}
            {selectedTypes.length > 0 && (
              <button
                onClick={() => setSelectedTypes([])}
                className="text-sm text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {hasSearched && (
          <div>
            {/* Error Banner */}
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Search Error</p>
                  <p>{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  aria-label="Dismiss error"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {results.length} {results.length === 1 ? "Result" : "Results"}
              </h2>
            </div>

            {results.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-slate-50 p-12 text-center dark:bg-slate-900">
                <SearchIcon className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                  No results found
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Try adjusting your search query or removing filters
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result) => (
                  <ResultCard key={result.id} result={result} />
                ))}
              </div>
            )}
          </div>
        )}

        {!hasSearched && (
          <div className="rounded-lg border border-dashed bg-slate-50 p-12 text-center dark:bg-slate-900">
            <SearchIcon className="mx-auto mb-4 h-12 w-12 text-slate-400" />
            <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
              Start your search
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Enter keywords to search through our space biology research database
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: SearchResult }) {
  const publicationYear = new Date(result.paper.publicationDate).getFullYear();
  const authorList = result.paper.authors.join(", ");

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-900">
      {/* Paper Title */}
      <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
        {result.paper.title}
      </h3>

      {/* Authors & Year */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <span>{authorList}</span>
        <span>•</span>
        <span>{publicationYear}</span>
        <span>•</span>
        <a
          href={result.paper.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-nasa-blue hover:underline"
        >
          View Paper
        </a>
      </div>

      {/* Sentence with Entities */}
      <div className="mb-4 rounded-md bg-slate-50 p-4 dark:bg-slate-800">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {highlightEntities(result.sentence, result.entities)}
        </p>
      </div>

      {/* Entity Badges */}
      {result.entities && result.entities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {result.entities.map((entity, idx) => (
            <Badge
              key={idx}
              className={`${ENTITY_COLORS[entity.type].bg} ${ENTITY_COLORS[entity.type].text} ${ENTITY_COLORS[entity.type].border}`}
            >
              {entity.text} • {ENTITY_TYPE_LABELS[entity.type]}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to highlight entities in text
function highlightEntities(
  text: string,
  entities: SearchResult["entities"]
): React.ReactNode {
  if (!entities || entities.length === 0) {
    return text;
  }

  // Sort entities by start position
  const sortedEntities = [...entities].sort(
    (a, b) => a.position[0] - b.position[0]
  );

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  sortedEntities.forEach((entity, idx) => {
    const [start, end] = entity.position;

    // Add text before entity
    if (start > lastIndex) {
      parts.push(text.substring(lastIndex, start));
    }

    // Add highlighted entity
    parts.push(
      <span key={idx} className={`font-semibold ${ENTITY_COLORS[entity.type].text}`}>
        {text.substring(start, end)}
      </span>
    );

    lastIndex = end;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}
