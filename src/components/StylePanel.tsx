import { useDatasets } from "../stores/useDatasets";

export function StylePanel() {
  const { datasets, activeDatasetId, plotConfig, updatePlotConfig, updateDataset } =
    useDatasets();

  const activeDs = datasets.find((d) => d.id === activeDatasetId);

  return (
    <div className="side-panel right">
      <div className="panel-heading">Plot</div>
      <div className="field-group">
        <label className="field-label">Title</label>
        <input
          className="field-input"
          value={plotConfig.title}
          onChange={(e) => updatePlotConfig({ title: e.target.value })}
          placeholder="Plot title"
        />
      </div>
      <div className="field-group">
        <label className="field-label">X Label</label>
        <input
          className="field-input"
          value={plotConfig.xLabel}
          onChange={(e) => updatePlotConfig({ xLabel: e.target.value })}
          placeholder="X axis label"
        />
      </div>
      <div className="field-group">
        <label className="field-label">Y Label</label>
        <input
          className="field-input"
          value={plotConfig.yLabel}
          onChange={(e) => updatePlotConfig({ yLabel: e.target.value })}
          placeholder="Y axis label"
        />
      </div>

      {activeDs && (
        <>
          <div className="panel-heading">Dataset: {activeDs.label}</div>
          <div className="field-group">
            <label className="field-label">Label</label>
            <input
              className="field-input"
              value={activeDs.label}
              onChange={(e) =>
                updateDataset(activeDs.id, { label: e.target.value })
              }
            />
          </div>
          <div className="field-group">
            <label className="field-label">Color</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="color"
                value={activeDs.color}
                onChange={(e) =>
                  updateDataset(activeDs.id, { color: e.target.value })
                }
                style={{ width: 32, height: 24, border: "none", cursor: "pointer" }}
              />
              <input
                className="field-input"
                value={activeDs.color}
                onChange={(e) =>
                  updateDataset(activeDs.id, { color: e.target.value })
                }
                style={{ flex: 1 }}
              />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Line Width</label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={activeDs.lineWidth}
              onChange={(e) =>
                updateDataset(activeDs.id, {
                  lineWidth: Number(e.target.value),
                })
              }
              style={{ width: "100%" }}
            />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {activeDs.lineWidth}px
            </span>
          </div>
          <div className="field-group">
            <label className="field-label">Info</label>
            <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
              <div>Rows: {activeDs.parsedData.metadata.data_rows}</div>
              <div>Delimiter: {activeDs.parsedData.metadata.delimiter}</div>
              <div>Encoding: {activeDs.parsedData.metadata.encoding}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
