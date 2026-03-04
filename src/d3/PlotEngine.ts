import * as d3 from "d3";
import type { Dataset, PlotConfig, ScaleType } from "../types";
import { PLOT_THEME, DEFAULT_MARGINS } from "./StylePresets";
import { formatAxisValue } from "../utils/units";

type D3Scale =
  | d3.ScaleLinear<number, number>
  | d3.ScaleLogarithmic<number, number>;

export class PlotEngine {
  private container: HTMLElement;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private plotArea!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private clipRect!: d3.Selection<SVGRectElement, unknown, null, undefined>;
  private xAxisG!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private yAxisG!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private gridG!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private linesG!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private xLabelEl!: d3.Selection<SVGTextElement, unknown, null, undefined>;
  private yLabelEl!: d3.Selection<SVGTextElement, unknown, null, undefined>;
  private titleEl!: d3.Selection<SVGTextElement, unknown, null, undefined>;
  private selectionRect!: d3.Selection<SVGRectElement, unknown, null, undefined>;

  private width = 0;
  private height = 0;
  private margin = { ...DEFAULT_MARGINS };
  private xScale!: D3Scale;
  private yScale!: D3Scale;
  private xDomainBase: [number, number] = [0, 1];
  private yDomainBase: [number, number] = [0, 1];
  private zoom!: d3.ZoomBehavior<SVGSVGElement, unknown>;
  private currentTransform: d3.ZoomTransform = d3.zoomIdentity;
  private resizeObserver: ResizeObserver;
  private isBoxZooming = false;
  private boxStart: [number, number] | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.initSvg();
    this.initZoom();
    this.initBoxZoom();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
  }

  private initSvg() {
    this.svg = d3
      .select(this.container)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .style("background", PLOT_THEME.plotArea);

    // Clip path
    const defs = this.svg.append("defs");
    defs
      .append("clipPath")
      .attr("id", "plot-clip")
      .append("rect")
      .attr("x", 0)
      .attr("y", 0);
    this.clipRect = defs.select("clipPath rect");

    // Background for plot area
    this.svg
      .append("rect")
      .attr("class", "plot-bg")
      .attr("fill", PLOT_THEME.plotArea);

    this.gridG = this.svg.append("g").attr("class", "grid");
    this.plotArea = this.svg
      .append("g")
      .attr("class", "plot-area")
      .attr("clip-path", "url(#plot-clip)");
    this.linesG = this.plotArea.append("g").attr("class", "lines");
    this.xAxisG = this.svg.append("g").attr("class", "x-axis");
    this.yAxisG = this.svg.append("g").attr("class", "y-axis");

    // Selection rectangle for box zoom
    this.selectionRect = this.svg
      .append("rect")
      .attr("class", "selection-rect")
      .attr("fill", PLOT_THEME.selectionFill)
      .attr("stroke", PLOT_THEME.selectionStroke)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,2")
      .style("display", "none");

    // Labels
    this.xLabelEl = this.svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("fill", PLOT_THEME.axisLabelColor)
      .attr("font-size", 13);

    this.yLabelEl = this.svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("fill", PLOT_THEME.axisLabelColor)
      .attr("font-size", 13);

    this.titleEl = this.svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("fill", PLOT_THEME.titleColor)
      .attr("font-size", 15)
      .attr("font-weight", 600);
  }

  private initZoom() {
    this.zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 100])
      .filter((event: Event) => {
        // Allow wheel and non-shift mousedown for pan
        if (event.type === "wheel") return true;
        if (event.type === "mousedown" || event.type === "dblclick") {
          return !(event as MouseEvent).shiftKey;
        }
        return true;
      })
      .on("zoom", (event) => {
        this.currentTransform = event.transform;
        this.applyTransform();
      });

    this.svg.call(this.zoom);

    // Double-click to reset
    this.svg.on("dblclick.zoom", () => {
      this.resetZoom();
    });
  }

  private initBoxZoom() {
    this.svg.on("mousedown.boxzoom", (event: MouseEvent) => {
      if (!event.shiftKey) return;
      event.preventDefault();
      this.isBoxZooming = true;
      this.boxStart = [
        event.offsetX - this.margin.left,
        event.offsetY - this.margin.top,
      ];
      this.selectionRect.style("display", null);
    });

    this.svg.on("mousemove.boxzoom", (event: MouseEvent) => {
      if (!this.isBoxZooming || !this.boxStart) return;
      const x = event.offsetX - this.margin.left;
      const y = event.offsetY - this.margin.top;
      const x0 = Math.min(this.boxStart[0], x);
      const y0 = Math.min(this.boxStart[1], y);
      const w = Math.abs(x - this.boxStart[0]);
      const h = Math.abs(y - this.boxStart[1]);
      this.selectionRect
        .attr("x", x0 + this.margin.left)
        .attr("y", y0 + this.margin.top)
        .attr("width", w)
        .attr("height", h);
    });

    this.svg.on("mouseup.boxzoom", (event: MouseEvent) => {
      if (!this.isBoxZooming || !this.boxStart) return;
      this.isBoxZooming = false;
      this.selectionRect.style("display", "none");

      const x1 = this.boxStart[0];
      const y1 = this.boxStart[1];
      const x2 = event.offsetX - this.margin.left;
      const y2 = event.offsetY - this.margin.top;
      this.boxStart = null;

      const plotW = this.width - this.margin.left - this.margin.right;
      const plotH = this.height - this.margin.top - this.margin.bottom;

      const selW = Math.abs(x2 - x1);
      const selH = Math.abs(y2 - y1);
      if (selW < 5 || selH < 5) return;

      // Convert pixel selection to data coordinates
      const xMin = this.xScale.invert(Math.min(x1, x2));
      const xMax = this.xScale.invert(Math.max(x1, x2));
      const yMin = this.yScale.invert(Math.max(y1, y2));
      const yMax = this.yScale.invert(Math.min(y1, y2));

      // Calculate zoom transform
      const scaleX = plotW / selW;
      const scaleY = plotH / selH;
      const scale = Math.min(scaleX, scaleY);

      // Update base domain and reset transform
      this.xDomainBase = [xMin, xMax];
      this.yDomainBase = [yMin, yMax];
      this.currentTransform = d3.zoomIdentity;
      this.svg.call(this.zoom.transform, d3.zoomIdentity);
      this.xScale.domain(this.xDomainBase);
      this.yScale.domain(this.yDomainBase);
      this.renderAxes();
      this.renderGrid();
      this.renderLines(this.lastDatasets);
    });
  }

  private lastDatasets: Dataset[] = [];
  private lastConfig: PlotConfig | null = null;

  private resize() {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    if (this.width <= 0 || this.height <= 0) return;

    const plotW = this.width - this.margin.left - this.margin.right;
    const plotH = this.height - this.margin.top - this.margin.bottom;

    this.clipRect.attr("width", plotW).attr("height", plotH);

    this.svg
      .select(".plot-bg")
      .attr("x", this.margin.left)
      .attr("y", this.margin.top)
      .attr("width", plotW)
      .attr("height", plotH);

    this.plotArea.attr(
      "transform",
      `translate(${this.margin.left},${this.margin.top})`
    );

    this.xAxisG.attr(
      "transform",
      `translate(${this.margin.left},${this.margin.top + plotH})`
    );
    this.yAxisG.attr(
      "transform",
      `translate(${this.margin.left},${this.margin.top})`
    );
    this.gridG.attr(
      "transform",
      `translate(${this.margin.left},${this.margin.top})`
    );

    // Labels
    this.xLabelEl
      .attr("x", this.margin.left + plotW / 2)
      .attr("y", this.height - 8);
    this.yLabelEl
      .attr("x", -(this.margin.top + plotH / 2))
      .attr("y", 16)
      .attr("transform", "rotate(-90)");
    this.titleEl
      .attr("x", this.margin.left + plotW / 2)
      .attr("y", 22);

    if (this.lastDatasets.length > 0 && this.lastConfig) {
      this.update(this.lastDatasets, this.lastConfig);
    }
  }

  private createScale(type: ScaleType, range: [number, number]): D3Scale {
    return type === "log"
      ? d3.scaleLog().range(range).clamp(true)
      : d3.scaleLinear().range(range);
  }

  private computeDomain(
    datasets: Dataset[],
    accessor: (d: Dataset) => number[],
    scaleType: ScaleType
  ): [number, number] {
    let allValues: number[] = [];
    for (const ds of datasets) {
      if (!ds.visible) continue;
      const vals = accessor(ds).filter((v) => !isNaN(v) && isFinite(v));
      allValues = allValues.concat(vals);
    }
    if (scaleType === "log") {
      allValues = allValues.filter((v) => v > 0);
    }
    if (allValues.length === 0) return scaleType === "log" ? [0.1, 10] : [0, 1];
    let min = d3.min(allValues)!;
    let max = d3.max(allValues)!;
    if (min === max) {
      const pad = Math.abs(min) * 0.1 || 1;
      min -= pad;
      max += pad;
    } else {
      const pad = (max - min) * 0.05;
      min -= pad;
      max += pad;
    }
    if (scaleType === "log" && min <= 0) {
      min = d3.min(allValues.filter((v) => v > 0))! * 0.5;
    }
    return [min, max];
  }

  update(datasets: Dataset[], config: PlotConfig) {
    this.lastDatasets = datasets;
    this.lastConfig = config;

    const plotW = this.width - this.margin.left - this.margin.right;
    const plotH = this.height - this.margin.top - this.margin.bottom;
    if (plotW <= 0 || plotH <= 0) return;

    const getX = (d: Dataset) => d.parsedData.columns[d.xColumnIndex] ?? [];
    const getY = (d: Dataset) => d.parsedData.columns[d.yColumnIndex] ?? [];

    this.xDomainBase = this.computeDomain(datasets, getX, config.xScale);
    this.yDomainBase = this.computeDomain(datasets, getY, config.yScale);

    this.xScale = this.createScale(config.xScale, [0, plotW]);
    this.yScale = this.createScale(config.yScale, [plotH, 0]);

    this.xScale.domain(this.xDomainBase);
    this.yScale.domain(this.yDomainBase);

    // Reset zoom when data or scale type changes
    this.currentTransform = d3.zoomIdentity;
    this.svg.call(this.zoom.transform, d3.zoomIdentity);

    // Labels
    this.xLabelEl.text(config.xLabel);
    this.yLabelEl.text(config.yLabel);
    this.titleEl.text(config.title);

    this.renderAxes();
    this.renderGrid();
    this.renderLines(datasets);
  }

  private applyTransform() {
    const plotW = this.width - this.margin.left - this.margin.right;
    const plotH = this.height - this.margin.top - this.margin.bottom;

    const newXScale = this.currentTransform.rescaleX(
      this.createScale(
        this.lastConfig?.xScale ?? "linear",
        [0, plotW]
      ).domain(this.xDomainBase) as d3.ScaleLinear<number, number>
    );
    const newYScale = this.currentTransform.rescaleY(
      this.createScale(
        this.lastConfig?.yScale ?? "linear",
        [plotH, 0]
      ).domain(this.yDomainBase) as d3.ScaleLinear<number, number>
    );

    this.xScale = newXScale as D3Scale;
    this.yScale = newYScale as D3Scale;

    this.renderAxes();
    this.renderGrid();
    this.renderLines(this.lastDatasets);
  }

  resetZoom() {
    if (this.lastDatasets.length > 0 && this.lastConfig) {
      const getX = (d: Dataset) => d.parsedData.columns[d.xColumnIndex] ?? [];
      const getY = (d: Dataset) => d.parsedData.columns[d.yColumnIndex] ?? [];
      this.xDomainBase = this.computeDomain(
        this.lastDatasets,
        getX,
        this.lastConfig.xScale
      );
      this.yDomainBase = this.computeDomain(
        this.lastDatasets,
        getY,
        this.lastConfig.yScale
      );
    }
    this.currentTransform = d3.zoomIdentity;
    this.svg
      .transition()
      .duration(300)
      .call(this.zoom.transform, d3.zoomIdentity);
  }

  private renderAxes() {
    const plotH = this.height - this.margin.top - this.margin.bottom;

    const xAxis = d3
      .axisBottom(this.xScale)
      .ticks(Math.max(plotH > 0 ? 8 : 4))
      .tickFormat((d) => formatAxisValue(d as number));
    const yAxis = d3
      .axisLeft(this.yScale)
      .ticks(Math.max(plotH > 0 ? 6 : 3))
      .tickFormat((d) => formatAxisValue(d as number));

    this.xAxisG.call(xAxis);
    this.yAxisG.call(yAxis);

    // Style axes
    this.svg
      .selectAll(".x-axis text, .y-axis text")
      .attr("fill", PLOT_THEME.tickColor)
      .attr("font-size", 11);
    this.svg
      .selectAll(".x-axis line, .y-axis line, .x-axis path, .y-axis path")
      .attr("stroke", PLOT_THEME.axisColor);
  }

  private renderGrid() {
    this.gridG.selectAll("*").remove();
    if (!this.lastConfig?.showGrid) return;

    const plotW = this.width - this.margin.left - this.margin.right;
    const plotH = this.height - this.margin.top - this.margin.bottom;

    // X grid
    const xTicks = this.xScale.ticks ? this.xScale.ticks(8) : [];
    this.gridG
      .selectAll(".grid-x")
      .data(xTicks)
      .enter()
      .append("line")
      .attr("class", "grid-x")
      .attr("x1", (d: number) => this.xScale(d))
      .attr("x2", (d: number) => this.xScale(d))
      .attr("y1", 0)
      .attr("y2", plotH)
      .attr("stroke", PLOT_THEME.gridColor)
      .attr("stroke-width", 0.5);

    // Y grid
    const yTicks = this.yScale.ticks ? this.yScale.ticks(6) : [];
    this.gridG
      .selectAll(".grid-y")
      .data(yTicks)
      .enter()
      .append("line")
      .attr("class", "grid-y")
      .attr("x1", 0)
      .attr("x2", plotW)
      .attr("y1", (d: number) => this.yScale(d))
      .attr("y2", (d: number) => this.yScale(d))
      .attr("stroke", PLOT_THEME.gridColor)
      .attr("stroke-width", 0.5);
  }

  private renderLines(datasets: Dataset[]) {
    this.linesG.selectAll("*").remove();

    for (const ds of datasets) {
      if (!ds.visible) continue;
      const xData = ds.parsedData.columns[ds.xColumnIndex];
      const yData = ds.parsedData.columns[ds.yColumnIndex];
      if (!xData || !yData) continue;

      const points: [number, number][] = [];
      const len = Math.min(xData.length, yData.length);
      for (let i = 0; i < len; i++) {
        const x = xData[i];
        const y = yData[i];
        if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) continue;
        if (
          this.lastConfig?.xScale === "log" && x <= 0 ||
          this.lastConfig?.yScale === "log" && y <= 0
        ) continue;
        points.push([x, y]);
      }

      const line = d3
        .line<[number, number]>()
        .x((d) => this.xScale(d[0]))
        .y((d) => this.yScale(d[1]));

      this.linesG
        .append("path")
        .datum(points)
        .attr("fill", "none")
        .attr("stroke", ds.color)
        .attr("stroke-width", ds.lineWidth)
        .attr("d", line);
    }
  }

  destroy() {
    this.resizeObserver.disconnect();
    this.svg.remove();
  }
}
