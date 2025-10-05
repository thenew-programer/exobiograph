"use client";

import { Filter, X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ENTITY_COLORS, ENTITY_TYPE_LABELS } from "@/lib/types";
import type { EntityType } from "@/lib/types";

interface CategoryFilterProps {
  selectedCategories: EntityType[] | Set<EntityType>;
  onToggle: (category: EntityType) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  mode?: "compact" | "expanded";
  className?: string;
}

export function CategoryFilter({
  selectedCategories,
  onToggle,
  onSelectAll,
  onClearAll,
  mode = "compact",
  className = "",
}: CategoryFilterProps) {
  const categoryTypes: EntityType[] = ["sample", "conditions", "result", "objective", "entity"];
  
  // Convert Set to Array for consistent handling
  const selectedArray = Array.isArray(selectedCategories) 
    ? selectedCategories 
    : Array.from(selectedCategories);
  
  const isSelected = (type: EntityType) => {
    return Array.isArray(selectedCategories)
      ? selectedCategories.includes(type)
      : selectedCategories.has(type);
  };

  const activeCount = selectedArray.length;
  const allSelected = activeCount === categoryTypes.length;
  const noneSelected = activeCount === 0;

  if (mode === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2">
              <Filter className="h-3.5 w-3.5" />
              <span className="text-sm">Categories</span>
              {activeCount > 0 && activeCount < categoryTypes.length && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {activeCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Filter by Category</h4>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={onSelectAll}
                    disabled={allSelected}
                  >
                    All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={onClearAll}
                    disabled={noneSelected}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Category Checkboxes */}
              <div className="space-y-2">
                {categoryTypes.map((type) => {
                  const selected = isSelected(type);
                  return (
                    <label
                      key={type}
                      className="flex items-center gap-3 cursor-pointer rounded-md px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center justify-center h-4 w-4">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => onToggle(type)}
                          className="sr-only"
                        />
                        <div
                          className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-all ${
                            selected
                              ? `${ENTITY_COLORS[type].border} ${ENTITY_COLORS[type].bg}`
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                          }`}
                        >
                          {selected && (
                            <Check className="h-3 w-3 text-white" strokeWidth={3} />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className={`h-2 w-2 rounded-full ${ENTITY_COLORS[type].bg}`}
                        />
                        <span className="text-sm">{ENTITY_TYPE_LABELS[type]}</span>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Active Filter Count */}
              {activeCount > 0 && (
                <>
                  <Separator />
                  <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    {activeCount} of {categoryTypes.length} categories selected
                  </div>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Filters Display */}
        {activeCount > 0 && activeCount < categoryTypes.length && (
          <div className="flex flex-wrap gap-1.5">
            {selectedArray.map((type) => (
              <Badge
                key={type}
                variant="secondary"
                className={`${ENTITY_COLORS[type].bg} ${ENTITY_COLORS[type].text} cursor-pointer hover:opacity-80 transition-opacity`}
                onClick={() => onToggle(type)}
              >
                {ENTITY_TYPE_LABELS[type]}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Expanded mode - show all categories inline
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <Filter className="h-4 w-4 text-slate-500" />
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Categories:
      </span>
      {categoryTypes.map((type) => {
        const selected = isSelected(type);
        return (
          <Badge
            key={type}
            variant={selected ? "default" : "outline"}
            className={`cursor-pointer transition-all ${
              selected
                ? `${ENTITY_COLORS[type].bg} ${ENTITY_COLORS[type].text} hover:opacity-90`
                : "hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            onClick={() => onToggle(type)}
          >
            {ENTITY_TYPE_LABELS[type]}
            {selected && <Check className="ml-1 h-3 w-3" />}
          </Badge>
        );
      })}
      <Separator orientation="vertical" className="h-4" />
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={onSelectAll}
        disabled={allSelected}
      >
        Select All
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={onClearAll}
        disabled={noneSelected}
      >
        Clear All
      </Button>
      {activeCount > 0 && (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          ({activeCount} selected)
        </span>
      )}
    </div>
  );
}
