import { useEffect, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

interface DropZoneProps {
  onFilesDropped: (paths: string[]) => void;
}

export function DropZone({ onFilesDropped }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const webview = getCurrentWebviewWindow();
    const unlisten: (() => void)[] = [];

    webview.onDragDropEvent((event) => {
      if (event.payload.type === "enter" || event.payload.type === "over") {
        setIsDragging(true);
      } else if (event.payload.type === "leave") {
        setIsDragging(false);
      } else if (event.payload.type === "drop") {
        setIsDragging(false);
        const paths = event.payload.paths;
        if (paths.length > 0) {
          onFilesDropped(paths);
        }
      }
    }).then((fn) => unlisten.push(fn));

    return () => {
      unlisten.forEach((fn) => fn());
    };
  }, [onFilesDropped]);

  if (!isDragging) return null;

  return (
    <div className="drop-overlay">
      <div className="drop-overlay-text">Drop files to load</div>
    </div>
  );
}
