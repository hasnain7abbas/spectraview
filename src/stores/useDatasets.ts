import { create } from "zustand";
import type { Dataset, PlotConfig } from "../types";
import { getNextColor, generateId } from "../utils/colors";
import type { ParsedData } from "../types";

interface DatasetStore {
  datasets: Dataset[];
  activeDatasetId: string | null;
  plotConfig: PlotConfig;

  addDataset: (parsed: ParsedData) => void;
  removeDataset: (id: string) => void;
  toggleVisibility: (id: string) => void;
  setActiveDataset: (id: string | null) => void;
  updateDataset: (id: string, updates: Partial<Dataset>) => void;
  updatePlotConfig: (updates: Partial<PlotConfig>) => void;
  setColumnMapping: (id: string, x: number, y: number) => void;
}

export const useDatasets = create<DatasetStore>((set) => ({
  datasets: [],
  activeDatasetId: null,
  plotConfig: {
    xLabel: "",
    yLabel: "",
    title: "",
    xScale: "linear",
    yScale: "linear",
    showGrid: true,
    showLegend: true,
  },

  addDataset: (parsed) =>
    set((state) => {
      const xIdx = 0;
      const yIdx = Math.min(1, parsed.columns.length - 1);
      const dataset: Dataset = {
        id: generateId(),
        fileName: parsed.file_name,
        parsedData: parsed,
        xColumnIndex: xIdx,
        yColumnIndex: yIdx,
        color: getNextColor(),
        lineWidth: 1.5,
        visible: true,
        label: parsed.file_name,
      };
      // Auto-set axis labels from column headers on first dataset
      const isFirst = state.datasets.length === 0;
      const plotConfigUpdate = isFirst
        ? {
            plotConfig: {
              ...state.plotConfig,
              xLabel: parsed.headers[xIdx] || "",
              yLabel: parsed.headers[yIdx] || "",
            },
          }
        : {};
      return {
        datasets: [...state.datasets, dataset],
        activeDatasetId: dataset.id,
        ...plotConfigUpdate,
      };
    }),

  removeDataset: (id) =>
    set((state) => ({
      datasets: state.datasets.filter((d) => d.id !== id),
      activeDatasetId:
        state.activeDatasetId === id ? null : state.activeDatasetId,
    })),

  toggleVisibility: (id) =>
    set((state) => ({
      datasets: state.datasets.map((d) =>
        d.id === id ? { ...d, visible: !d.visible } : d
      ),
    })),

  setActiveDataset: (id) => set({ activeDatasetId: id }),

  updateDataset: (id, updates) =>
    set((state) => ({
      datasets: state.datasets.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    })),

  updatePlotConfig: (updates) =>
    set((state) => ({
      plotConfig: { ...state.plotConfig, ...updates },
    })),

  setColumnMapping: (id, x, y) =>
    set((state) => {
      const ds = state.datasets.find((d) => d.id === id);
      const newDatasets = state.datasets.map((d) =>
        d.id === id ? { ...d, xColumnIndex: x, yColumnIndex: y } : d
      );
      // Update axis labels to match the selected columns
      const xLabel = ds?.parsedData.headers[x] || "";
      const yLabel = ds?.parsedData.headers[y] || "";
      return {
        datasets: newDatasets,
        plotConfig: {
          ...state.plotConfig,
          xLabel,
          yLabel,
        },
      };
    }),
}));
