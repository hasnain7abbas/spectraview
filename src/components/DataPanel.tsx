import { Eye, EyeOff, X } from "lucide-react";
import { useDatasets } from "../stores/useDatasets";

export function DataPanel() {
  const {
    datasets,
    activeDatasetId,
    setActiveDataset,
    toggleVisibility,
    removeDataset,
    updateDataset,
    setColumnMapping,
  } = useDatasets();

  if (datasets.length === 0) {
    return (
      <div className="side-panel">
        <div className="panel-heading">Datasets</div>
        <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
          No data loaded. Open a file or drag &amp; drop.
        </p>
      </div>
    );
  }

  return (
    <div className="side-panel">
      <div className="panel-heading">Datasets</div>
      {datasets.map((ds, idx) => (
        <div key={ds.id}>
          <div
            className={`dataset-item ${
              activeDatasetId === ds.id ? "active" : ""
            }`}
            onClick={() => setActiveDataset(ds.id)}
          >
            <input
              type="color"
              value={ds.color}
              onChange={(e) =>
                updateDataset(ds.id, { color: e.target.value })
              }
              className="color-swatch"
              style={{ background: ds.color }}
              title="Change color"
              onClick={(e) => e.stopPropagation()}
            />
            <span
              style={{
                flex: 1,
                fontSize: 12,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                opacity: ds.visible ? 1 : 0.4,
              }}
              title={ds.fileName}
            >
              {ds.label}
            </span>
            <span
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                marginRight: 4,
              }}
            >
              {idx + 1}
            </span>
            <button
              className="btn btn-icon"
              style={{ padding: 2, border: "none", background: "none" }}
              onClick={(e) => {
                e.stopPropagation();
                toggleVisibility(ds.id);
              }}
              title={ds.visible ? "Hide" : "Show"}
            >
              {ds.visible ? (
                <Eye size={13} color="var(--text-secondary)" />
              ) : (
                <EyeOff size={13} color="var(--text-muted)" />
              )}
            </button>
            <button
              className="btn btn-icon"
              style={{ padding: 2, border: "none", background: "none" }}
              onClick={(e) => {
                e.stopPropagation();
                removeDataset(ds.id);
              }}
              title="Remove"
            >
              <X size={13} color="var(--text-muted)" />
            </button>
          </div>

          {activeDatasetId === ds.id && (
            <div style={{ padding: "4px 8px 8px 8px" }}>
              <div className="field-group">
                <label className="field-label">X Column</label>
                <select
                  className="field-input"
                  value={ds.xColumnIndex}
                  onChange={(e) =>
                    setColumnMapping(
                      ds.id,
                      Number(e.target.value),
                      ds.yColumnIndex
                    )
                  }
                >
                  {ds.parsedData.headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Y Column</label>
                <select
                  className="field-input"
                  value={ds.yColumnIndex}
                  onChange={(e) =>
                    setColumnMapping(
                      ds.id,
                      ds.xColumnIndex,
                      Number(e.target.value)
                    )
                  }
                >
                  {ds.parsedData.headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
