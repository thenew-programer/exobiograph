"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { EntityType, GraphNode, GraphData } from "@/lib/types";
import { toast } from "sonner";

// D3 type definitions for simulation nodes
type SimulationNode = GraphNode & d3.SimulationNodeDatum;
type SimulationLink = d3.SimulationLinkDatum<SimulationNode>;

interface Props {
  selectedCategories: Set<EntityType>;
}

// Cache for graph data to avoid repeated API calls
const graphDataCache = new Map<string, GraphData>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

export function ForceGraph({ selectedCategories }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Fetch graph data with caching
  useEffect(() => {
    async function fetchGraphData() {
      // Create cache key from selected categories
      const cacheKey = Array.from(selectedCategories).sort().join(',');
      
      // Check if we have valid cached data
      const cachedData = graphDataCache.get(cacheKey);
      const cachedTime = cacheTimestamps.get(cacheKey);
      const now = Date.now();
      
      if (cachedData && cachedTime && (now - cachedTime) < CACHE_DURATION) {
        // Use cached data
        setGraphData(cachedData);
        setIsLoading(false);
        toast.success(`Loaded ${cachedData.nodes.length} entities from cache`);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch("/api/graph", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityTypes: Array.from(selectedCategories),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to load graph");
        }

        const data = await response.json();
        
        // Cache the data
        graphDataCache.set(cacheKey, data);
        cacheTimestamps.set(cacheKey, now);
        
        setGraphData(data);
        
        if (data.nodes.length > 0) {
          toast.success(`Loaded ${data.nodes.length} entities and ${data.edges.length} relationships`);
        }
      } catch (error) {
        console.error("Failed to fetch graph data:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to load graph";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }

    if (selectedCategories.size > 0) {
      fetchGraphData();
    }
  }, [selectedCategories]);

  // Render D3 graph
  useEffect(() => {
    if (!svgRef.current || !graphData || graphData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous content
    svg.selectAll("*").remove();

    // Add gradient definitions for glowing effects
    const defs = svg.append("defs");

    // Glow filter
    const filter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    filter.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Radial gradients for nodes
    ["organism", "condition", "effect", "endpoint"].forEach(type => {
      const gradient = defs.append("radialGradient")
        .attr("id", `gradient-${type}`);
      
      const color = getNodeColor(type as EntityType);
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", color)
        .attr("stop-opacity", "1");
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", color)
        .attr("stop-opacity", "0.6");
    });

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Main group for zoom/pan
    const g = svg.append("g");

    // Create force simulation with Obsidian-like physics
    const simulation = d3
      .forceSimulation(graphData.nodes as SimulationNode[])
      .force(
        "link",
        d3
          .forceLink<SimulationNode, SimulationLink>(graphData.edges)
          .id((d) => d.id)
          .distance(150)
          .strength(0.3)
      )
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40))
      .alphaDecay(0.02);

    // Draw edges with gradient
    const link = g
      .append("g")
      .selectAll("line")
      .data(graphData.edges)
      .join("line")
      .attr("class", "graph-edge")
      .attr("stroke", "url(#edge-gradient)")
      .attr("stroke-opacity", 0.3)
      .attr("stroke-width", (d) => Math.sqrt(d.weight) * 0.5 + 0.5)
      .style("mix-blend-mode", "screen");

    // Edge gradient
    const edgeGradient = defs.append("linearGradient")
      .attr("id", "edge-gradient");
    edgeGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#6366f1")
      .attr("stop-opacity", "0.4");
    edgeGradient.append("stop")
      .attr("offset", "50%")
      .attr("stop-color", "#8b5cf6")
      .attr("stop-opacity", "0.6");
    edgeGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#6366f1")
      .attr("stop-opacity", "0.4");

    // Draw nodes
    const node = g
      .append("g")
      .selectAll("g")
      .data(graphData.nodes)
      .join("g")
      .attr("class", "graph-node");

    (node as d3.Selection<SVGGElement, SimulationNode, SVGGElement, unknown>).call(
      d3
        .drag<SVGGElement, SimulationNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );

    // Outer glow circle
    node
      .append("circle")
      .attr("class", "node-glow")
      .attr("r", (d) => Math.sqrt(d.frequency) * 5 + 15)
      .attr("fill", (d) => getNodeColor(d.type))
      .attr("opacity", 0.2)
      .attr("filter", "url(#glow)");

    // Inner circle with gradient
    node
      .append("circle")
      .attr("class", "node-core")
      .attr("r", (d) => Math.sqrt(d.frequency) * 3 + 8)
      .attr("fill", (d) => `url(#gradient-${d.type})`)
      .attr("stroke", (d) => getNodeColor(d.type))
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.8)
      .style("cursor", "pointer")
      .style("filter", "drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))")
      .on("click", (event: MouseEvent, d: SimulationNode) => {
        event.stopPropagation();
        setSelectedNode(d);
      })
      .on("mouseenter", function(event: MouseEvent, d: SimulationNode) {
        setHoveredNode(d);
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke-width", 3)
          .attr("r", Math.sqrt(d.frequency) * 3 + 12);
        
        d3.select((this as SVGElement).parentNode as SVGElement).select(".node-glow")
          .transition()
          .duration(200)
          .attr("opacity", 0.4)
          .attr("r", Math.sqrt(d.frequency) * 5 + 20);

        // Highlight connected nodes
        highlightConnected(d);
      })
      .on("mouseleave", function(event: MouseEvent, d: SimulationNode) {
        setHoveredNode(null);
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke-width", 2)
          .attr("r", Math.sqrt(d.frequency) * 3 + 8);
        
        d3.select((this as SVGElement).parentNode as SVGElement).select(".node-glow")
          .transition()
          .duration(200)
          .attr("opacity", 0.2)
          .attr("r", Math.sqrt(d.frequency) * 5 + 15);

        // Reset highlights
        resetHighlights();
      });

    // Node labels with better styling
    node
      .append("text")
      .text((d) => d.label.length > 20 ? d.label.substring(0, 20) + "..." : d.label)
      .attr("class", "node-label")
      .attr("x", 0)
      .attr("y", (d) => Math.sqrt(d.frequency) * 3 + 24)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("font-weight", "500")
      .attr("fill", "#e2e8f0")
      .attr("stroke", "#0f172a")
      .attr("stroke-width", "3")
      .attr("paint-order", "stroke")
      .style("pointer-events", "none")
      .style("user-select", "none")
      .style("opacity", 0.9);

    // Highlight connected nodes
    function highlightConnected(node: SimulationNode) {
      if (!graphData) return;
      
      const connectedIds = new Set<string>();
      
      graphData.edges.forEach(edge => {
        const sourceId = typeof edge.source === 'string' ? edge.source : (edge.source as SimulationNode).id;
        const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as SimulationNode).id;
        
        if (sourceId === node.id) {
          connectedIds.add(targetId);
        }
        if (targetId === node.id) {
          connectedIds.add(sourceId);
        }
      });

      // Dim non-connected nodes
      d3.selectAll(".graph-node")
        .style("opacity", (d: unknown) => {
          const graphNode = d as SimulationNode;
          if (graphNode.id === node.id || connectedIds.has(graphNode.id)) {
            return 1;
          }
          return 0.2;
        });

      // Highlight connected edges
      link.attr("stroke-opacity", (d: unknown) => {
        const edge = d as SimulationLink;
        const sourceId = typeof edge.source === 'string' ? edge.source : (edge.source as SimulationNode).id;
        const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as SimulationNode).id;
        if ((sourceId === node.id && connectedIds.has(targetId)) ||
            (targetId === node.id && connectedIds.has(sourceId))) {
          return 0.8;
        }
        return 0.1;
      });
    }

    function resetHighlights() {
      d3.selectAll(".graph-node").style("opacity", 1);
      link.attr("stroke-opacity", 0.3);
    }

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: unknown) => {
          const link = d as SimulationLink;
          const source = typeof link.source === 'object' ? link.source : null;
          return source?.x ?? 0;
        })
        .attr("y1", (d: unknown) => {
          const link = d as SimulationLink;
          const source = typeof link.source === 'object' ? link.source : null;
          return source?.y ?? 0;
        })
        .attr("x2", (d: unknown) => {
          const link = d as SimulationLink;
          const target = typeof link.target === 'object' ? link.target : null;
          return target?.x ?? 0;
        })
        .attr("y2", (d: unknown) => {
          const link = d as SimulationLink;
          const target = typeof link.target === 'object' ? link.target : null;
          return target?.y ?? 0;
        });

      node.attr("transform", (d: unknown) => {
        const simNode = d as SimulationNode;
        return `translate(${simNode.x ?? 0},${simNode.y ?? 0})`;
      });
    });

    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, SimulationNode, SimulationNode>, d: SimulationNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, SimulationNode, SimulationNode>, d: SimulationNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, SimulationNode, SimulationNode>, d: SimulationNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Click outside to deselect
    svg.on("click", () => {
      setSelectedNode(null);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [graphData]);

  function getNodeColor(type: EntityType): string {
    const colors: Record<EntityType, string> = {
      sample: "#3b82f6",      // blue
      conditions: "#f59e0b",  // amber
      result: "#10b981",      // green
      objective: "#8b5cf6",   // purple
      entity: "#64748b",      // slate
    };
    return colors[type];
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-nasa-blue"></div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Loading knowledge graph...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
            Failed to load graph
          </h3>
          <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No entities found for the selected types
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-slate-900/50 to-slate-950"></div>

      <svg ref={svgRef} className="h-full w-full relative z-10" />

      {/* Hover tooltip */}
      {hoveredNode && (
        <div className="absolute pointer-events-none z-20 rounded-lg bg-slate-900/95 backdrop-blur-sm border border-indigo-500/30 px-4 py-2 shadow-xl"
             style={{
               left: '50%',
               top: '20px',
               transform: 'translateX(-50%)'
             }}>
          <p className="text-sm font-semibold text-white">{hoveredNode.label}</p>
          <p className="text-xs text-slate-400">
            {hoveredNode.type.charAt(0).toUpperCase() + hoveredNode.type.slice(1)} • 
            {hoveredNode.frequency} occurrence{hoveredNode.frequency !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Node details panel */}
      {selectedNode && (
        <div className="absolute right-4 top-4 max-h-[calc(100vh-8rem)] w-96 overflow-y-auto rounded-xl border border-indigo-500/30 bg-slate-900/95 backdrop-blur-xl p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <div 
                className="h-3 w-3 rounded-full"
                style={{ 
                  backgroundColor: getNodeColor(selectedNode.type),
                  boxShadow: `0 0 12px ${getNodeColor(selectedNode.type)}`
                }}
              />
              Entity Details
            </h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                Name
              </p>
              <p className="text-base font-medium text-white">
                {selectedNode.label}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                Type
              </p>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  backgroundColor: `${getNodeColor(selectedNode.type)}20`,
                  color: getNodeColor(selectedNode.type),
                  border: `1px solid ${getNodeColor(selectedNode.type)}40`
                }}
              >
                <div 
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: getNodeColor(selectedNode.type) }}
                />
                {selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1)}
              </span>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                Frequency
              </p>
              <p className="text-sm text-slate-300">
                Appears in {selectedNode.frequency} paper{selectedNode.frequency !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Research Papers */}
            {selectedNode.papers && selectedNode.papers.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Research Papers ({selectedNode.papers.length})
                </p>
                <div className="space-y-2">
                  {selectedNode.papers.slice(0, 10).map((paper: { id: string; title: string; authors: string[]; source_url: string; publication_date: string }) => {
                    const year = new Date(paper.publication_date).getFullYear();
                    const authors = Array.isArray(paper.authors) 
                      ? paper.authors.join(", ")
                      : String(paper.authors);
                    
                    return (
                      <div
                        key={paper.id}
                        className="group rounded-lg border border-slate-700/50 bg-slate-800/30 p-3 hover:border-indigo-500/30 hover:bg-slate-800/50 transition-all"
                      >
                        <h4 className="mb-1.5 text-sm font-medium text-white leading-snug">
                          {paper.title}
                        </h4>
                        <p className="mb-2 text-xs text-slate-400">
                          {authors.length > 50 ? authors.substring(0, 50) + "..." : authors} • {year}
                        </p>
                        <a
                          href={paper.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          View Paper
                          <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                      </div>
                    );
                  })}
                  {selectedNode.papers.length > 10 && (
                    <p className="text-xs text-slate-500 text-center py-2">
                      + {selectedNode.papers.length - 10} more papers
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 rounded-xl border border-indigo-500/30 bg-slate-900/95 backdrop-blur-xl p-4 shadow-2xl">
        <h4 className="mb-3 text-sm font-bold text-white">
          Legend
        </h4>
        <div className="space-y-2">
          {(["sample", "conditions", "result", "objective", "entity"] as EntityType[]).map((type) => (
            <div key={type} className="flex items-center gap-2.5">
              <div
                className="h-3 w-3 rounded-full"
                style={{ 
                  backgroundColor: getNodeColor(type),
                  boxShadow: `0 0 8px ${getNodeColor(type)}`
                }}
              />
              <span className="text-sm text-slate-300 font-medium">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-slate-700 pt-3 space-y-1 text-xs text-slate-400">
          <p>• <span className="text-slate-300">Node size</span> = frequency</p>
          <p>• <span className="text-slate-300">Edge width</span> = strength</p>
          <p>• <span className="text-slate-300">Drag</span> to rearrange</p>
          <p>• <span className="text-slate-300">Scroll</span> to zoom</p>
        </div>
      </div>
    </div>
  );
}
