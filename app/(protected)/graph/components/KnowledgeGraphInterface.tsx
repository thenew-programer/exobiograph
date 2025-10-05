"use client";

import { Network } from "lucide-react";
import { CategoryFilter } from "@/components/filters/CategoryFilter";
import { useCategoryFilter } from "@/hooks/useCategoryFilter";
import type { EntityType, GraphStats } from "@/lib/types";
import { ForceGraph } from "./ForceGraph";

interface Props {
  initialStats: GraphStats | null;
}

export function KnowledgeGraphInterface({ initialStats }: Props) {
  const [selectedCategories, setSelectedCategories] = useCategoryFilter(
    "graph-category-filter",
    ["sample", "conditions", "result", "objective", "entity"], // All selected by default
    true // Use Set instead of Array
  );
  const stats = initialStats;

  const toggleCategory = (type: EntityType) => {
    const newSet = new Set(selectedCategories);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedCategories(newSet);
  };

  const selectAll = () => {
    setSelectedCategories(new Set(["sample", "conditions", "result", "objective", "entity"]));
  };

  const clearAll = () => {
    setSelectedCategories(new Set());
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
              Explore relationships between samples, conditions, results, objectives, and entities
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
          <CategoryFilter
            selectedCategories={selectedCategories}
            onToggle={toggleCategory}
            onSelectAll={selectAll}
            onClearAll={clearAll}
            mode="expanded"
          />
        </div>
      </div>

      {/* Graph */}
      <div className="flex-1 bg-slate-50 dark:bg-slate-950">
        {selectedCategories.size === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Network className="mx-auto mb-4 h-12 w-12 text-slate-400" />
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                No categories selected
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Select at least one category to view the graph
              </p>
            </div>
          </div>
        ) : (
          <ForceGraph selectedCategories={selectedCategories} />
        )}
      </div>
    </div>
  );
}
