"use client";

import { Network, Sparkles, Filter, X, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryFilter } from "@/components/filters/CategoryFilter";
import { useCategoryFilter } from "@/hooks/useCategoryFilter";
import type { EntityType, GraphStats } from "@/lib/types";
import { ForceGraph } from "./ForceGraph";
import { useState } from "react";

interface Props {
  initialStats: GraphStats | null;
}

export function KnowledgeGraphInterface({ initialStats }: Props) {
  const [selectedCategories, setSelectedCategories] = useCategoryFilter(
    "graph-category-filter",
    ["sample", "conditions", "result", "objective", "entity"], // All selected by default
    true // Use Set instead of Array
  );
  const [showFilters, setShowFilters] = useState(false);
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
    <div className="relative h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      {/* Compact Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Filter Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 bg-white dark:bg-slate-800"
          >
            <Filter className="h-4 w-4" />
            Filters
            {selectedCategories.size < 5 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {selectedCategories.size}
              </Badge>
            )}
          </Button>

          {/* Right: Stats Info */}
          {stats && (
            <div className="flex items-center gap-6 text-xs">
              <div className="flex items-center gap-1.5">
                <Network className="h-3.5 w-3.5 text-blue-500" />
                <span className="font-semibold text-slate-900 dark:text-white">
                  {stats.totalEntities.toLocaleString()}
                </span>
                <span className="text-slate-600 dark:text-slate-400">entities</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                <span className="font-semibold text-slate-900 dark:text-white">
                  {stats.totalRelationships.toLocaleString()}
                </span>
                <span className="text-slate-600 dark:text-slate-400">links</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="font-semibold text-slate-900 dark:text-white">
                  {stats.totalPapers.toLocaleString()}
                </span>
                <span className="text-slate-600 dark:text-slate-400">papers</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal/Sidebar */}
      {showFilters && (
        <>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 dark:bg-black/40 z-20 backdrop-blur-sm"
            onClick={() => setShowFilters(false)}
          />
          
          {/* Filter Panel */}
          <div className="absolute top-14 left-4 z-30 w-80 bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Filter Categories
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                  className="h-7 w-7 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  className="h-7 text-xs flex-1"
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  className="h-7 text-xs flex-1"
                >
                  Clear All
                </Button>
              </div>

              <CategoryFilter
                selectedCategories={selectedCategories}
                onToggle={toggleCategory}
                onSelectAll={selectAll}
                onClearAll={clearAll}
                mode="compact"
              />
            </div>
          </div>
        </>
      )}

      {/* Full-Screen Graph */}
      <div className="h-full pt-14">
        {selectedCategories.size === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center max-w-md mx-auto px-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mx-auto mb-4">
                <Network className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                No Categories Selected
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Select at least one category to visualize the knowledge graph
              </p>
              <Button onClick={selectAll} className="bg-nasa-blue hover:bg-nasa-blue/90" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Select All Categories
              </Button>
            </div>
          </div>
        ) : (
          <ForceGraph selectedCategories={selectedCategories} />
        )}
      </div>
    </div>
  );
}
