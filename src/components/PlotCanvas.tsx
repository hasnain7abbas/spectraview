import { useEffect, useRef } from "react";
import { PlotEngine } from "../d3/PlotEngine";
import { useDatasets } from "../stores/useDatasets";

export function PlotCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PlotEngine | null>(null);
  const { datasets, plotConfig } = useDatasets();

  useEffect(() => {
    if (!containerRef.current) return;
    engineRef.current = new PlotEngine(containerRef.current);
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.update(datasets, plotConfig);
  }, [datasets, plotConfig]);

  // Expose resetZoom via ref for keyboard shortcut
  useEffect(() => {
    const handler = () => engineRef.current?.resetZoom();
    window.addEventListener("plot:resetZoom", handler);
    return () => window.removeEventListener("plot:resetZoom", handler);
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
