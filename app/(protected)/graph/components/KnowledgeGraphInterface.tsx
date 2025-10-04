"use client";

import { useState } from "react";
import { Network, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ENTITY_COLORS, ENTITY_TYPE_LABELS } from "@/lib/types";
import type { EntityType, GraphStats } from "@/lib/types";
import { ForceGraph } from "./ForceGraph";

interface Props {
  initialStats: GraphStats | null;
}

export function KnowledgeGraphInterface({ initialStats }: Props) {
  const [selectedTypes, setSelectedTypes] = useState<Set<EntityType>>(
    new Set(["organism", "condition", "effect", "endpoint"])
  );
  const stats = initialStats;

  const entityTypes: EntityType[] = ["organism", "condition", "effect", "endpoint"];

  const toggleEntityType = (type: EntityType) => {
    setSelectedTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedTypes(new Set(entityTypes));
  };

  const clearAll = () => {
    setSelectedTypes(new Set());
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="border-b bg-white p-4 dark:bg-slate-900">
        <div className="container mx-auto">
          <div className="mb-4">
            <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
              Knowledge Graph
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Explore relationships between organisms, conditions, effects, and endpoints
            </p>
          </div>

          {/* Stats */}
          {stats && (
            <div className="mb-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-slate-500" />
                <span className="font-semibold text-slate-900 dark:text-white">
                  {stats.totalEntities.toLocaleString()}
                </span>
                <span className="text-slate-600 dark:text-slate-400">Entities</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {stats.totalRelationships.toLocaleString()}
                </span>
                <span className="text-slate-600 dark:text-slate-400">Relationships</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {stats.totalPapers.toLocaleString()}
                </span>
                <span className="text-slate-600 dark:text-slate-400">Papers</span>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Show entity types:
            </span>
            {entityTypes.map((type) => (
              <Badge
                key={type}
                variant={selectedTypes.has(type) ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  selectedTypes.has(type)
                    ? `${ENTITY_COLORS[type].bg} ${ENTITY_COLORS[type].text}`
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                onClick={() => toggleEntityType(type)}
              >
                {ENTITY_TYPE_LABELS[type]}
              </Badge>
            ))}
            <button
              onClick={selectAll}
              className="text-sm text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            >
              Select All
            </button>
            <button
              onClick={clearAll}
              className="text-sm text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="flex-1 bg-slate-50 dark:bg-slate-950">
        {selectedTypes.size === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Filter className="mx-auto mb-4 h-12 w-12 text-slate-400" />
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                No entity types selected
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Select at least one entity type to view the graph
              </p>
            </div>
          </div>
        ) : (
          <ForceGraph selectedTypes={selectedTypes} />
        )}
      </div>
    </div>
  );
}
