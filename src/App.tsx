import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useDatasets } from "./stores/useDatasets";
import { Toolbar } from "./components/Toolbar";
import { PlotCanvas } from "./components/PlotCanvas";
import { DataPanel } from "./components/DataPanel";
import { StylePanel } from "./components/StylePanel";
import { DropZone } from "./components/DropZone";
import { WelcomeScreen } from "./components/WelcomeScreen";
import type { ParsedData } from "./types";

export default function App() {
  const { datasets, addDataset, toggleVisibility, plotConfig, updatePlotConfig } =
    useDatasets();
  const [leftPanel, setLeftPanel] = useState(true);
  const [rightPanel, setRightPanel] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFile = useCallback(
    async (path: string) => {
      try {
        const parsed = await invoke<ParsedData>("parse_file", { path });
        addDataset(parsed);
        setError(null);
      } catch (e) {
        setError(String(e));
      }
    },
    [addDataset]
  );

  const openFileDialog = useCallback(async () => {
    const selected = await open({
      multiple: true,
      filters: [
        {
          name: "Data Files",
          extensions: ["csv", "tsv", "txt", "dat", "xy", "xrdml"],
        },
        { name: "All Files", extensions: ["*"] },
      ],
    });
    if (!selected) return;
    const paths = Array.isArray(selected) ? selected : [selected];
    for (const p of paths) {
      await loadFile(p);
    }
  }, [loadFile]);

  const handleDrop = useCallback(
    (paths: string[]) => {
      paths.forEach((p) => loadFile(p));
    },
    [loadFile]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.ctrlKey && e.key === "o") {
        e.preventDefault();
        openFileDialog();
      } else if (e.key === "g" || e.key === "G") {
        updatePlotConfig({ showGrid: !plotConfig.showGrid });
      } else if (e.key === "r" || e.key === "R") {
        window.dispatchEvent(new Event("plot:resetZoom"));
      } else if (e.key >= "1" && e.key <= "9") {
        const idx = parseInt(e.key) - 1;
        if (idx < datasets.length) {
          toggleVisibility(datasets[idx].id);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openFileDialog, plotConfig.showGrid, updatePlotConfig, datasets, toggleVisibility]);

  const hasData = datasets.length > 0;

  return (
    <div className="app-layout">
      <Toolbar
        onOpenFile={openFileDialog}
        leftPanelOpen={leftPanel}
        rightPanelOpen={rightPanel}
        onToggleLeftPanel={() => setLeftPanel((v) => !v)}
        onToggleRightPanel={() => setRightPanel((v) => !v)}
      />
      <div className="main-content">
        {leftPanel && hasData && <DataPanel />}
        <div className="plot-container">
          {hasData ? <PlotCanvas /> : <WelcomeScreen onOpenFile={openFileDialog} />}
          <DropZone onFilesDropped={handleDrop} />
          {error && (
            <div
              style={{
                position: "absolute",
                bottom: 12,
                left: "50%",
                transform: "translateX(-50%)",
                background: "var(--danger)",
                color: "#fff",
                padding: "6px 16px",
                borderRadius: 6,
                fontSize: 12,
                zIndex: 50,
                cursor: "pointer",
              }}
              onClick={() => setError(null)}
            >
              {error}
            </div>
          )}
        </div>
        {rightPanel && hasData && <StylePanel />}
      </div>
    </div>
  );
}
