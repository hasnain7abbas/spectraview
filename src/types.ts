export interface ParseMetadata {
  delimiter: string;
  comment_lines: number;
  data_rows: number;
  encoding: string;
}

export interface ParsedData {
  file_name: string;
  headers: string[];
  columns: number[][];
  metadata: ParseMetadata;
}

export interface Dataset {
  id: string;
  fileName: string;
  parsedData: ParsedData;
  xColumnIndex: number;
  yColumnIndex: number;
  color: string;
  lineWidth: number;
  visible: boolean;
  label: string;
}

export type ScaleType = "linear" | "log";

export interface PlotConfig {
  xLabel: string;
  yLabel: string;
  title: string;
  xScale: ScaleType;
  yScale: ScaleType;
  showGrid: boolean;
  showLegend: boolean;
}

export interface PlotDimensions {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
}
