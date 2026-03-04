import {
  FolderOpen,
  Grid3x3,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { useDatasets } from "../stores/useDatasets";
import type { ScaleType } from "../types";

interface ToolbarProps {
  onOpenFile: () => void;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
}

export function Toolbar({
  onOpenFile,
  leftPanelOpen,
  rightPanelOpen,
  onToggleLeftPanel,
  onToggleRightPanel,
}: ToolbarProps) {
  const { plotConfig, updatePlotConfig } = useDatasets();

  const toggleScale = (axis: "x" | "y") => {
    const key = axis === "x" ? "xScale" : "yScale";
    const current = plotConfig[key];
    const next: ScaleType = current === "linear" ? "log" : "linear";
    updatePlotConfig({ [key]: next });
  };

  return (
    <div className="toolbar">
      <button className="btn btn-accent" onClick={onOpenFile}>
        <FolderOpen size={14} />
        Open
      </button>

      <div className="separator" />

      <button
        className={`btn ${plotConfig.xScale === "log" ? "active" : ""}`}
        onClick={() => toggleScale("x")}
        title="Toggle X log scale"
      >
        X {plotConfig.xScale === "log" ? "Log" : "Lin"}
      </button>
      <button
        className={`btn ${plotConfig.yScale === "log" ? "active" : ""}`}
        onClick={() => toggleScale("y")}
        title="Toggle Y log scale"
      >
        Y {plotConfig.yScale === "log" ? "Log" : "Lin"}
      </button>

      <div className="separator" />

      <button
        className={`btn btn-icon ${plotConfig.showGrid ? "active" : ""}`}
        onClick={() => updatePlotConfig({ showGrid: !plotConfig.showGrid })}
        title="Toggle grid (G)"
      >
        <Grid3x3 size={14} />
      </button>

      <div style={{ flex: 1 }} />

      <button
        className="btn btn-icon"
        onClick={onToggleLeftPanel}
        title="Toggle data panel"
      >
        {leftPanelOpen ? (
          <PanelLeftClose size={14} />
        ) : (
          <PanelLeftOpen size={14} />
        )}
      </button>
      <button
        className="btn btn-icon"
        onClick={onToggleRightPanel}
        title="Toggle style panel"
      >
        {rightPanelOpen ? (
          <PanelRightClose size={14} />
        ) : (
          <PanelRightOpen size={14} />
        )}
      </button>
    </div>
  );
}
