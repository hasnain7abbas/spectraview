import { FolderOpen } from "lucide-react";

interface WelcomeScreenProps {
  onOpenFile: () => void;
}

const FORMATS = [".csv", ".tsv", ".txt", ".dat", ".xy", ".xrdml"];

export function WelcomeScreen({ onOpenFile }: WelcomeScreenProps) {
  return (
    <div className="welcome">
      <div className="welcome-title">SpectraView</div>
      <p className="welcome-subtitle">
        Open or drag &amp; drop spectral data files to visualize them as
        interactive plots.
      </p>
      <button className="btn btn-accent" onClick={onOpenFile} style={{ fontSize: 14, padding: "8px 20px" }}>
        <FolderOpen size={16} />
        Open File
      </button>
      <div className="format-badges">
        {FORMATS.map((f) => (
          <span key={f} className="format-badge">
            {f}
          </span>
        ))}
      </div>
      <p style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 8 }}>
        Ctrl+O to open &middot; Drag files anywhere
      </p>
    </div>
  );
}
