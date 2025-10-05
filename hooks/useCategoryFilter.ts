"use client";

import { useState, useEffect } from "react";
import type { EntityType } from "@/lib/types";

/**
 * Custom hook for managing category filter state with localStorage persistence
 * @param key - The localStorage key to use
 * @param defaultCategories - Default categories to select if none are saved
 * @param useSet - Whether to return a Set (true) or Array (false)
 */
export function useCategoryFilter<T extends boolean = false>(
  key: string,
  defaultCategories: EntityType[] = [],
  useSet?: T
): T extends true 
  ? [Set<EntityType>, (categories: Set<EntityType>) => void]
  : [EntityType[], (categories: EntityType[]) => void] {
  
  const [categories, setCategories] = useState<T extends true ? Set<EntityType> : EntityType[]>(() => {
    if (typeof window === "undefined") {
      return (useSet ? new Set(defaultCategories) : defaultCategories) as any;
    }
    
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as EntityType[];
        return (useSet ? new Set(parsed) : parsed) as any;
      }
    } catch (error) {
      console.error("Error loading category filter from localStorage:", error);
    }
    
    return (useSet ? new Set(defaultCategories) : defaultCategories) as any;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const toStore = useSet 
        ? Array.from(categories as Set<EntityType>)
        : categories as EntityType[];
      localStorage.setItem(key, JSON.stringify(toStore));
    } catch (error) {
      console.error("Error saving category filter to localStorage:", error);
    }
  }, [key, categories, useSet]);

  return [categories, setCategories] as any;
}
