# SpectraView — Materials Characterization Data Viewer & Publication Figure Generator

## Complete Product Specification: From Raw Instrument Files to Journal-Ready Figures

---

## The Vision

SpectraView is not just a spectrum viewer. It is a **complete instrument-to-publication pipeline** for materials science researchers. You drag in a raw `.xrdml` from the PANalytical, a Radiant Vision `.txt` ferroelectric hysteresis export, or a multi-column dielectric data file — and within 60 seconds you have a **journal-ready figure** with correct fonts, dimensions, DPI, axis formatting, and optional insets, ready to paste into your LaTeX manuscript or submit to Nature/Elsevier/ACS.

The key insight: **the pain is not in viewing the data — it's in the 45 minutes between "I have data" and "I have a figure my supervisor will accept."** That 45 minutes currently involves: opening Origin or Python, cleaning the columns, guessing which columns to plot, formatting axes, fighting with font sizes, exporting at the wrong DPI, re-exporting, adding an inset by hand, and then doing it all over again when the reviewer asks for a different color scheme.

SpectraView kills that entire workflow.

---

## Target Users & Their Exact Pain Points

### 1. The XRD Researcher (You, doing BTO memristor characterization)
**Current workflow:** PANalytical instrument → `.xrdml` file → open HighScore Plus (if you have a license) or manually extract 2θ/intensity → paste into Origin → format → export.
**Pain:** HighScore is Windows-only, expensive, and slow. Manual extraction from XRDML is XML parsing hell. Origin is $1,000+/year.

### 2. The Ferroelectric Characterization Researcher
**Current workflow:** Radiant Vision software → export `.txt` with P-E loop data → open in Origin → figure out which columns are voltage vs. polarization → manually compute E-field from voltage/thickness → plot → format.
**Pain:** Radiant's exported `.txt` files have metadata headers + multiple column formats depending on the test type (hysteresis, PUND, fatigue, I-V, C-V). You have to know the column layout by heart or read the header every time.

### 3. The Dielectric Spectroscopy Researcher
**Current workflow:** LCR meter or impedance analyzer → export `.csv` or `.txt` with 11+ columns (frequency, temperature, Cp, Cs, D, tan δ, Z', Z'', |Z|, θ, Rp, Rs...) → figure out which columns are ε' and ε'' → compute ε from C using sample dimensions → plot ε vs T at multiple frequencies → format.
**Pain:** 11 columns and you only need 2-3 for any given plot, but which 2-3 depends on what you're analyzing. The temperature sweep data has hundreds of rows per frequency, and you need to separate them into individual frequency curves for the ε(T) multi-frequency plot.

### 4. The Raman/FTIR/UV-Vis Researcher
**Current workflow:** Instrument software → export `.txt` or `.csv` → background subtraction → peak fitting → Origin → format.
**Pain:** Background subtraction and peak fitting are done in separate tools or manual Python scripts.

**SpectraView solves ALL of these by being format-aware.** It knows what a `.xrdml` file looks like. It knows what a Radiant hysteresis `.txt` file looks like. It knows that column 3 in your dielectric data is Cp and it can auto-compute ε' if you give it the sample area and thickness.

---

## Supported Data Types — In Detail

### A. XRD Data

#### Format: `.xrdml` (PANalytical/Malvern Panalytical)

This is an XML file. The critical data lives inside:

```xml
<xrdMeasurement>
  <scan>
    <dataPoints>
      <positions axis="2Theta" unit="deg">
        <startPosition>10.0000</startPosition>
        <endPosition>80.0000</endPosition>
      </positions>
      <intensities unit="counts">1234 1456 1789 2034 ...</intensities>
      <!-- intensities are space-separated, evenly spaced between start and end -->
    </dataPoints>
  </scan>
</xrdMeasurement>
```

**SpectraView's parser extracts:**
- 2θ start/end positions → generates the x-axis array
- Intensity values → y-axis
- Scan metadata: wavelength (Kα1, Kα2), scan speed, step size, tube voltage/current, date
- The metadata gets embedded in the figure as hidden properties and shown in the info panel

**Additional XRD formats to support:**
- `.xy` / `.dat` — two-column ASCII (2θ, intensity), most universal
- `.raw` (Bruker) — binary format, needs specific byte layout parsing
- `.csv` / `.tsv` — generic columnar
- `.uxd` (Bruker) — text-based with metadata headers
- GSAS `.fxye` — three columns (2θ, intensity, sigma)

#### XRD-Specific Features:
- **Phase identification overlay:** Load reference patterns from bundled database (top ~300 materials from COD) or import custom .xy reference. Reference lines appear as colored tick marks below the experimental pattern.
- **Peak picking:** Click peaks → auto-find exact 2θ and d-spacing. Show (hkl) labels if reference is loaded.
- **Background subtraction:** Polynomial fit (degree 2-8) with user-adjustable anchor points.
- **Kα2 stripping:** Remove Kα2 contribution from the pattern (Rachinger correction).

---

### B. Ferroelectric Hysteresis Loop Data (Radiant Technologies / AixACCT)

#### Format: Radiant Vision `.txt` Export

Radiant's Vision software exports test results as tab-delimited `.txt` files. The structure depends on the test type, but the P-E hysteresis export typically looks like:

```
<Test Information Header - variable length>
Hysteresis Data
Voltage (V)	Charge (uC)	Polarization (uC/cm2)	Time (msec)	Current (A)
-10.000	-2.345e-004	-23.450	0.000	-1.234e-005
-9.950	-2.340e-004	-23.400	0.050	-1.200e-005
...
```

**Key challenges:**
- Header length varies (could be 5 lines or 50 lines depending on what metadata Vision includes)
- Column order is NOT fixed across different Vision versions and test configurations
- The file may contain multiple data segments (e.g., multiple voltage loops in fatigue tests)
- Voltage needs to be converted to Electric Field: E = V / thickness (user provides thickness in mm or μm)
- Polarization may already be computed (in μC/cm²) or may need to be computed from Charge: P = Q / Area

**SpectraView's parser:**
1. Detect the header by scanning for the first line that matches a numeric data pattern
2. Parse column headers from the line immediately before data starts
3. Map column names to known fields using fuzzy matching: "Voltage" → V, "Polarization" → P, "Charge" → Q, "Electric Field" → E, "Current" → I, "Time" → t
4. Prompt user for sample dimensions if E-field needs to be computed (or remember from previous session)

#### AixACCT TF Analyzer Format
Similar tab-delimited text export, different header format. Parse the same way — detect header, map columns.

#### Ferroelectric-Specific Features:
- **Auto-detect P-E loop:** Identify voltage and polarization columns → plot P(E) hysteresis
- **Auto-extract parameters:**
  - Pr (remanent polarization): P at E = 0 on the descending branch
  - Ec (coercive field): E at P = 0
  - Ps (saturation polarization): P at maximum E
  - Pmax: maximum polarization value
  - Loop area (proportional to energy loss per cycle)
- **Parameter annotation:** Show Pr, Ec, Ps directly on the plot with dashed guide lines
- **Multi-loop overlay:** Load P-E loops at different voltages/frequencies → overlay with legend
- **I-E curve:** Plot switching current vs. E-field from the same data (current column)
- **PUND analysis:** If PUND data is detected, separate P*, Pr*, P^, and compute ΔP = P* - P^
- **Fatigue plot:** If fatigue data (loop number vs Pr), plot Pr degradation curve
- **Sample dimension input:** Dialog box where user enters electrode area (mm² or cm²) and sample thickness (μm or mm). **Remembered per project** — enter once, used for all subsequent files.

---

### C. Dielectric Data (ε vs T, ε vs f, tan δ)

#### Format: Multi-column `.csv` / `.txt` from LCR meters and impedance analyzers

Typical instruments: Keysight E4980A, Wayne Kerr 6500B, Novocontrol Alpha-A, HP 4294A

A typical dielectric temperature sweep file has 8-12 columns:

```
Temperature(°C), Frequency(Hz), Cp(F), Cs(F), D(tanδ), Rp(Ω), Rs(Ω), Z'(Ω), Z''(Ω), |Z|(Ω), Phase(°)
25.0, 1000, 4.567e-10, 4.570e-10, 0.0234, 6.78e+06, 45.3, 6780000, -158000, 6781842, -1.34
25.5, 1000, 4.590e-10, 4.593e-10, 0.0236, ...
...
25.0, 10000, 4.521e-10, ...
25.5, 10000, 4.544e-10, ...
```

**Key challenges:**
- 11 columns but you typically only plot 2-3 at a time
- Data is interleaved: rows for 1kHz at all temperatures, then 10kHz at all temperatures, etc. (or vice versa — temperature sweeps at fixed frequency vs. frequency sweeps at fixed temperature)
- Need to **separate by frequency** to plot ε(T) curves at 1kHz, 10kHz, 100kHz, 1MHz on the same graph
- Capacitance (Cp) must be converted to dielectric constant: ε' = Cp × d / (ε₀ × A)
  where d = thickness, A = electrode area, ε₀ = 8.854 × 10⁻¹² F/m
- tan δ is directly plotted (no conversion needed)
- For impedance spectroscopy: need Cole-Cole plot (Z'' vs Z'), Nyquist plot, Bode plot

**SpectraView's approach:**

1. **Column mapper UI:** On import, show a dialog with all detected column headers. User assigns each to a semantic role: Temperature, Frequency, Cp, D (tanδ), Z', Z'', etc. **Remember the mapping** for this file pattern (so next time the same instrument's files auto-map).

2. **Dimension input:** Same dialog as ferroelectric — area + thickness → auto-compute ε' from Cp.

3. **Auto-separate by parameter:** Detect the grouping variable (usually frequency or temperature) and offer: "I detected 5 frequencies (1kHz, 10kHz, 100kHz, 500kHz, 1MHz). Plot separate curves for each?"

4. **One-click standard plots:**
   - ε'(T) at multiple frequencies (the most common dielectric plot)
   - tan δ(T) at multiple frequencies
   - ε'(f) at multiple temperatures
   - Cole-Cole plot: Z'' vs Z'
   - Bode plot: |Z| and phase vs frequency
   - Modulus plot: M'' vs M'

#### Dielectric-Specific Features:
- **Curie temperature finder:** Auto-detect ε' peak → mark Tc on the plot
- **Curie-Weiss fit:** Above Tc, fit 1/ε' = (T - T₀) / C → extract Curie constant C and Curie-Weiss temperature T₀
- **Diffuseness parameter (γ):** Fit modified Curie-Weiss: 1/ε' - 1/ε'max = (T - Tm)^γ / C' → extract γ (1 for normal ferroelectric, 2 for relaxor)
- **Vogel-Fulcher fit:** For relaxors, fit f = f₀ · exp(-Ea / kB(Tm - Tf)) to the Tm(f) data

---

### D. General Spectroscopy (XPS, Raman, FTIR, UV-Vis, PL)

#### Supported Formats:
- `.txt` / `.csv` / `.tsv` / `.dat` — generic two-column or multi-column
- `.spc` (Galactic/Thermo) — binary spectroscopy format
- `.dx` / `.jdx` (JCAMP-DX) — ISO 6195, text-based spectroscopy standard
- `.vms` (VAMAS/ISO 14976) — XPS standard format
- `.sp` / `.spa` (Perkin-Elmer/Thermo FTIR)
- `.asc` — ASCII export from various instruments

#### Universal Spectroscopy Features:
- **Smoothing:** Savitzky-Golay filter (adjustable window size and polynomial order)
- **Background subtraction:** Linear, polynomial, Shirley (for XPS), Tougaard (for XPS)
- **Normalization:** To max, to area, to specific peak, min-max
- **Peak fitting:** Gaussian, Lorentzian, Voigt, Pseudo-Voigt, Pearson VII, Doniach-Šunjić (for XPS metallic peaks). Levenberg-Marquardt least-squares fitting in Rust backend.
- **Derivative:** 1st and 2nd derivative (useful for finding inflection points and hidden peaks)
- **Area integration:** Numerical integration between user-selected bounds

#### UV-Vis Specific:
- **Tauc plot generator:** Compute (αhν)^n vs hν for direct (n=2), indirect (n=1/2), forbidden direct (n=2/3), forbidden indirect (n=1/3) band gaps. User draws tangent line → extract band gap value.
- **Absorbance ↔ Transmittance conversion**
- **Beer-Lambert calculator:** Given concentration + path length, compute molar absorptivity

---

## Publication-Quality Figure Engine — The Core Differentiator

This is what makes SpectraView genuinely useful beyond just viewing data. Every figure exported from SpectraView must be **immediately submittable** to Nature, Science, ACS, Elsevier, and Springer journals without modification.

### Journal Figure Standards (Compiled)

| Parameter | Nature | ACS | Elsevier | Springer |
|-----------|--------|-----|----------|----------|
| **Font** | Helvetica or Arial | Helvetica, Arial, or Symbol | Arial, Times, Symbol | Arial or Helvetica |
| **Min font size** | 5 pt | 8 pt | 6 pt | 6 pt |
| **Max font size** | 7 pt (body), 8 pt (labels) | — | — | — |
| **Figure width** | 89 mm (single) / 183 mm (double) | 3.25 in (single) / 7 in (double) | 90 mm / 190 mm | 84 mm / 174 mm |
| **Resolution** | 300 DPI (min) | 300 DPI | 300 DPI (halftone), 1000 (line art) | 300 DPI |
| **Format** | TIFF, EPS, PDF, JPEG | TIFF, EPS, PDF | TIFF, JPEG, EPS, PDF | TIFF, EPS, PDF |
| **Color mode** | RGB for submission | RGB or CMYK | RGB or CMYK | RGB |
| **Line weight** | ≥ 0.5 pt | ≥ 0.5 pt | ≥ 0.25 pt | ≥ 0.5 pt |
| **Panel labels** | 8 pt bold lowercase (a, b, c) | Bold lowercase | lowercase | lowercase |

### SpectraView's Export Presets

When the user clicks **Export**, they see a preset selector:

```
┌─ Export Figure ──────────────────────────────┐
│                                               │
│  Preset: [▼ Nature / Science                ] │
│          [  ACS (JACS, Nano Letters, etc.)   ] │
│          [  Elsevier (generic)               ] │
│          [  Springer                         ] │
│          [  Physical Review (APS)            ] │
│          [  Custom                           ] │
│                                               │
│  Width:     [● Single column (89 mm)  ]       │
│             [○ Double column (183 mm) ]       │
│             [○ 1.5 column (120 mm)    ]       │
│                                               │
│  Format:    [● TIFF 300 DPI  ]                │
│             [○ PDF (vector)  ]                │
│             [○ EPS (vector)  ]                │
│             [○ PNG 600 DPI   ]                │
│             [○ SVG (vector)  ]                │
│                                               │
│  Font:      [Helvetica ▼] Size: [7 pt ▼]     │
│  Line wt:   [1.0 pt ▼]                       │
│  Color mode: [● RGB] [○ CMYK]                │
│                                               │
│  ☑ Include panel label: [a ▼]                 │
│  ☐ Transparent background                     │
│  ☑ Embed metadata (instrument, date, sample)  │
│                                               │
│         [ Cancel ]    [ Export ]               │
└───────────────────────────────────────────────┘
```

Each preset auto-configures: font family, font sizes (axis labels, tick labels, legend), line weights, figure dimensions, DPI, file format, axis label style ("Quantity (unit)" format), tick mark style (inward, outward, both), and panel label format.

### Figure Styling System

#### Axis Formatting:
- Label format: `"2θ (°)"`, `"Intensity (arb. units)"`, `"Polarization (μC/cm²)"`, `"Electric field (kV/cm)"`, `"Temperature (°C)"`, `"Dielectric constant (ε')"` — auto-generated from data type but fully editable
- Tick direction: inward (default for physics), outward, or both
- Major + minor ticks with adjustable spacing
- Scientific notation on y-axis when appropriate: `×10³`, `×10⁶`
- Axis break (`//`) for non-continuous ranges

#### Color Palette:
- Default: **Colorblind-safe** (Wong 2011 palette, recommended by Nature):
  - `#0072B2` (blue), `#D55E00` (vermillion), `#009E73` (green), `#CC79A7` (pink),
  - `#F0E442` (yellow), `#56B4E9` (sky blue), `#E69F00` (orange), `#000000` (black)
- Alternative palettes: Viridis, Inferno, Plasma (for colormaps), Okabe-Ito
- Custom color picker per dataset

#### Line Styles:
- Solid, dashed, dotted, dash-dot
- Line weight: 0.5 pt to 3 pt (default 1.0 pt)
- Marker symbols: circle, square, triangle-up, triangle-down, diamond, star — filled or open
- Marker size: adjustable, default scaled to figure size

### Inset System — Critical Feature

Insets are extremely common in materials science figures. Examples:
- XRD: zoomed-in region showing peak splitting (e.g., tetragonal BaTiO₃ (200)/(002) split)
- P-E loop: inset showing the I-E switching current peaks
- ε(T): inset showing 1/ε' vs T (Curie-Weiss fit) or ln(f) vs 1/Tm (Vogel-Fulcher)

**Implementation:**

```
┌──────────────────────────────────────┐
│                          ┌────────┐  │
│  Main plot               │ Inset  │  │
│  (XRD full range)        │ (zoom  │  │
│                          │ 44-46°)│  │
│                          └────────┘  │
│                                      │
│                                      │
└──────────────────────────────────────┘
```

User workflow:
1. Click **Add Inset** button
2. A resizable/draggable rectangle appears on the canvas
3. User selects: which data to show, x/y range, position, size (as fraction of main plot)
4. Inset gets its own independent axis labels, ticks, and styling
5. Optional: dashed lines connecting inset region to the main plot zoom area
6. Inset can show **different data** from the main plot (e.g., main = XRD, inset = crystal structure photo or a derived plot)

The inset is rendered as part of the same figure on export — single file output, not a separate overlay. This is what makes it publication-ready. Currently in Origin, creating an inset requires: Insert → New Layer → Link Axes → manually position → manually format. It takes 10+ minutes. In SpectraView it takes 10 seconds.

### Multi-Panel Figures

For papers, you often need figure layouts like:

```
┌─────────────┬─────────────┐
│  (a) XRD    │  (b) Raman  │
│             │             │
├─────────────┼─────────────┤
│  (c) P-E    │  (d) ε(T)   │
│             │             │
└─────────────┴─────────────┘
```

**SpectraView's approach:**
1. User selects layout: 1×1, 1×2, 2×1, 2×2, 1×3, 3×1, 2×3, custom grid
2. Each panel is an independent plot with its own data, axes, and styling
3. Panels auto-labeled: (a), (b), (c), (d) in 8pt bold per journal spec
4. Shared legend option (one legend for the whole figure)
5. Export as single image at the correct total dimensions
6. Individual panel export also available

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Tauri 2 Shell                         │
│                                                          │
│  ┌────────────────────────┐  ┌────────────────────────┐ │
│  │     Rust Backend        │  │  React + D3.js/Canvas  │ │
│  │                         │  │      Frontend          │ │
│  │  ┌──────────────────┐  │  │                        │ │
│  │  │ Format Parsers    │  │  │  ┌──────────────────┐ │ │
│  │  │ • XRDML (XML)     │  │  │  │ Plot Engine      │ │ │
│  │  │ • Radiant .txt    │──┼──┼─►│ (D3.js + SVG)    │ │ │
│  │  │ • Dielectric CSV  │  │  │  │                  │ │ │
│  │  │ • Generic ASCII   │  │  │  └──────────────────┘ │ │
│  │  │ • JCAMP-DX        │  │  │                        │ │
│  │  │ • Bruker .raw     │  │  │  ┌──────────────────┐ │ │
│  │  │ • SPC binary      │  │  │  │ Figure Composer  │ │ │
│  │  └──────────────────┘  │  │  │ (multi-panel,    │ │ │
│  │                         │  │  │  insets, export)  │ │ │
│  │  ┌──────────────────┐  │  │  └──────────────────┘ │ │
│  │  │ Math Engine       │  │  │                        │ │
│  │  │ • Background sub  │──┼──┼─►┌──────────────────┐ │ │
│  │  │ • Peak fitting    │  │  │  │ Export Engine     │ │ │
│  │  │ • Smoothing       │  │  │  │ (TIFF/PDF/EPS/   │ │ │
│  │  │ • Derivatives     │  │  │  │  SVG/PNG at DPI) │ │ │
│  │  │ • ε computation   │  │  │  └──────────────────┘ │ │
│  │  │ • Tauc plot       │  │  │                        │ │
│  │  │ • Curie-Weiss fit │  │  │  ┌──────────────────┐ │ │
│  │  │ • Vogel-Fulcher   │  │  │  │ Parameter Panel  │ │ │
│  │  │ • Levenberg-Marq  │  │  │  │ (Pr, Ec, Tc,    │ │ │
│  │  └──────────────────┘  │  │  │  peak positions)  │ │ │
│  │                         │  │  └──────────────────┘ │ │
│  │  ┌──────────────────┐  │  │                        │ │
│  │  │ Reference DB      │  │  │                        │ │
│  │  │ • 300 XRD phases  │  │  │                        │ │
│  │  │ • Element radii   │  │  │                        │ │
│  │  └──────────────────┘  │  │                        │ │
│  │                         │  │                        │ │
│  │  ┌──────────────────┐  │  │                        │ │
│  │  │ Project Store     │  │  │                        │ │
│  │  │ (SQLite)          │  │  │                        │ │
│  │  │ • Sample dims     │  │  │                        │ │
│  │  │ • Column maps     │  │  │                        │ │
│  │  │ • Style presets   │  │  │                        │ │
│  │  └──────────────────┘  │  │                        │ │
│  └────────────────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Why D3.js + SVG (not Canvas/Three.js)

For 2D scientific plots, **SVG is the correct choice** because:
1. SVG is vector — scales to any DPI without rasterization
2. SVG elements can be individually styled, selected, and manipulated
3. SVG can be directly exported as PDF/EPS (true vector output)
4. D3.js has world-class axis generation, scales, and data binding
5. Text in SVG remains editable (journal requirement — editors need to adjust fonts)

For the high-DPI raster exports (TIFF/PNG), render the SVG at the target resolution using an offscreen canvas.

### Rust Backend Modules

```
src-tauri/src/
├── main.rs
├── lib.rs
├── commands.rs                 # Tauri IPC commands
├── parsers/
│   ├── mod.rs
│   ├── xrdml.rs               # PANalytical XRDML XML parser
│   ├── radiant.rs             # Radiant Vision ferroelectric .txt parser
│   ├── dielectric.rs          # Multi-column dielectric data parser
│   ├── generic_ascii.rs       # Generic 2-N column ASCII parser
│   ├── jcamp.rs               # JCAMP-DX (.dx/.jdx) parser
│   ├── bruker.rs              # Bruker .raw binary parser
│   ├── spc.rs                 # Galactic/Thermo .spc binary parser
│   └── column_detector.rs     # Auto-detect column types from headers
├── math/
│   ├── mod.rs
│   ├── background.rs          # Polynomial, Shirley, Tougaard background subtraction
│   ├── smoothing.rs           # Savitzky-Golay filter
│   ├── peak_finding.rs        # 2nd derivative, wavelet-based peak detection
│   ├── peak_fitting.rs        # Levenberg-Marquardt with Gaussian/Lorentz/Voigt/PseudoVoigt
│   ├── derivatives.rs         # Numerical 1st/2nd derivative
│   ├── integration.rs         # Trapezoidal/Simpson numerical integration
│   ├── curie_weiss.rs         # Curie-Weiss and modified CW fitting
│   ├── vogel_fulcher.rs       # VF fit for relaxors
│   ├── tauc.rs                # Tauc plot computation
│   ├── dielectric_calc.rs     # Cp → ε' conversion, impedance transforms
│   └── ferroelectric_params.rs # Pr, Ec, Ps extraction from P-E data
├── reference/
│   ├── mod.rs
│   └── xrd_database.rs        # Bundled XRD reference peaks (top 300 materials)
├── project/
│   ├── mod.rs
│   └── store.rs               # SQLite for sample dimensions, column mappings, presets
└── export/
    ├── mod.rs
    ├── svg_generator.rs        # Generate publication-ready SVG from plot data
    └── raster.rs              # SVG → TIFF/PNG at target DPI
```

### Frontend Modules

```
src/
├── main.tsx
├── App.tsx
├── types.ts                    # All TypeScript interfaces
├── hooks/
│   ├── useProject.ts           # Sample dimensions, column mappings persistence
│   ├── useDatasets.ts          # Loaded data management
│   └── useExport.ts           # Export configuration state
├── components/
│   ├── PlotCanvas.tsx          # D3.js SVG rendering surface
│   ├── DataPanel.tsx           # Left panel: loaded datasets, visibility toggles
│   ├── StylePanel.tsx          # Right panel: colors, line styles, fonts, axes
│   ├── Toolbar.tsx             # Top: open, export, add inset, layout, tools
│   ├── ColumnMapper.tsx        # Dialog for mapping file columns to data roles
│   ├── DimensionInput.tsx      # Dialog for sample area + thickness input
│   ├── ExportDialog.tsx        # Journal preset export dialog
│   ├── InsetEditor.tsx         # Inset creation and positioning
│   ├── PeakFitPanel.tsx        # Peak fitting controls and results table
│   ├── ParameterTable.tsx      # Extracted parameters (Pr, Ec, Tc, etc.)
│   └── ReferenceSearch.tsx     # XRD reference pattern search
├── d3/
│   ├── PlotEngine.ts           # Core D3 plot rendering (axes, gridlines, data lines)
│   ├── InsetRenderer.ts        # Inset plot rendering within main SVG
│   ├── PanelLayout.ts          # Multi-panel figure layout manager
│   ├── AnnotationLayer.ts      # Parameter annotations, arrows, labels on plot
│   ├── ExportRenderer.ts       # SVG → high-DPI raster conversion
│   └── StylePresets.ts         # Journal-specific style configurations
└── utils/
    ├── colors.ts               # Wong/viridis/colorblind palettes
    └── units.ts                # Unit formatting, SI prefixes, special characters
```

### Rust Crates

| Crate | Purpose |
|-------|---------|
| `serde` + `serde_json` | Tauri IPC serialization |
| `quick-xml` | XRDML parsing (XML) |
| `nalgebra` | Matrix ops for fitting |
| `csv` | Generic CSV/TSV parsing |
| `rusqlite` | Project persistence (sample dims, mappings) |
| `encoding_rs` | Handle non-UTF-8 file encodings |
| `nom` | Binary format parsing (Bruker .raw, .spc) |
| `image` | TIFF/PNG raster export |
| `rayon` | Parallel peak fitting |

### Frontend Libraries

| Library | Purpose |
|---------|---------|
| React 18 + TypeScript | UI framework |
| D3.js v7 | SVG plot rendering, axes, scales |
| Tailwind CSS | UI styling |
| lucide-react | Icons |
| html-to-image / dom-to-image | SVG → raster for export |

---

## Core Workflow — Step by Step

### Workflow 1: XRD Pattern to Publication Figure

```
1. User drags BTO_xrd_scan.xrdml into SpectraView
     ↓
2. Rust: parse XRDML → extract 2θ array + intensity array + metadata
     ↓
3. Frontend: auto-render XRD pattern (2θ vs intensity, log scale option)
     ↓
4. User clicks "Reference" → searches "BaTiO3" → selects tetragonal P4mm
     ↓
5. Reference tick marks appear below pattern, (hkl) labels on matching peaks
     ↓
6. User wants inset of (200)/(002) splitting → clicks "Add Inset" →
   drags rectangle on plot → sets x-range 44-46° → zoomed view appears
     ↓
7. User clicks Export → selects "Nature" preset →
   Single column (89mm), Helvetica 7pt, TIFF 300 DPI, panel label (a)
     ↓
8. File saved. Ready to insert into LaTeX: \includegraphics{fig1a.tiff}
```

**Total time: ~90 seconds.** Current Origin workflow: 30-45 minutes.

### Workflow 2: Ferroelectric P-E Loop with Parameter Extraction

```
1. User drags radiant_hysteresis_5V.txt into SpectraView
     ↓
2. Rust: detect Radiant format → parse header → find column mapping
     ↓
3. If first time: SpectraView asks for sample area (0.785 mm²)
   and thickness (500 μm). Saved to project.
     ↓
4. Auto-compute E = V/thickness, plot P(E) hysteresis loop
     ↓
5. Auto-extract: Pr = 12.3 μC/cm², Ec = 45.2 kV/cm, Ps = 24.1 μC/cm²
   Shown in parameter panel + annotated on plot with dashed lines
     ↓
6. User loads 3 more files (10V, 15V, 20V) → all overlay on same plot
   with auto-assigned colorblind-safe colors and legend
     ↓
7. Export → ACS preset → 3.25 in single column → PDF vector
```

### Workflow 3: Dielectric ε(T) Multi-Frequency Plot

```
1. User drags dielectric_temp_sweep.csv (11 columns, 5 frequencies)
     ↓
2. Rust: detect multi-column format → show column mapper dialog
     ↓
3. User maps: Col1 → Temperature, Col2 → Frequency, Col3 → Cp, Col5 → tanδ
   (mapping saved — next file from same instrument auto-maps)
     ↓
4. User enters area (0.785 mm²) and thickness (1.0 mm) if not already saved
     ↓
5. Rust: compute ε' = Cp × d / (ε₀ × A) for each row
   Separate data by frequency → 5 curves
     ↓
6. Frontend: plot ε'(T) with 5 colored curves, legend showing frequencies
     ↓
7. User clicks "Find Tc" → SpectraView finds ε' peak at each frequency →
   marks Tc on plot, shows in parameter table
     ↓
8. User adds inset: 1/ε' vs T above Tc → Curie-Weiss fit line shown →
   C and T₀ displayed in inset annotation
     ↓
9. Export → Elsevier preset → 90mm single column → TIFF 300 DPI
```

---

## Smart File Detection — The "Just Drop It" Philosophy

SpectraView must be able to handle files **without the user telling it what kind of file it is.** The detection cascade:

```rust
fn detect_file_type(path: &str, content: &[u8]) -> FileType {
    let ext = get_extension(path);
    
    // 1. Extension-based detection
    match ext {
        "xrdml" => return FileType::XRDML,
        "xy" | "xye" | "fxye" => return FileType::XRD_ASCII,
        "raw" => return FileType::BrukerRAW,
        "spc" => return FileType::SPC,
        "dx" | "jdx" => return FileType::JCAMP,
        _ => {}
    }
    
    // 2. Content-based detection
    let text = String::from_utf8_lossy(content);
    
    // Check for XML header (XRDML)
    if text.starts_with("<?xml") && text.contains("xrdMeasurement") {
        return FileType::XRDML;
    }
    
    // Check for JCAMP-DX header
    if text.starts_with("##TITLE") || text.starts_with("##title") {
        return FileType::JCAMP;
    }
    
    // Check for Radiant header patterns
    if text.contains("Radiant") || text.contains("Vision") || 
       text.contains("Hysteresis") || text.contains("PUND") {
        return FileType::RadiantFerroelectric;
    }
    
    // Check for AixACCT patterns
    if text.contains("TF Analyzer") || text.contains("aixACCT") {
        return FileType::AixACCTFerroelectric;
    }
    
    // 3. Heuristic column analysis for generic files
    let columns = count_columns(&text);
    let headers = detect_headers(&text);
    
    if headers_suggest_dielectric(&headers) {
        return FileType::Dielectric;
    }
    
    if columns == 2 {
        return FileType::GenericTwoColumn; // probably XRD or spectrum
    }
    
    if columns >= 3 && columns <= 15 {
        return FileType::GenericMultiColumn; // show column mapper
    }
    
    FileType::Unknown
}
```

---

## Project System — Remember Everything

SpectraView uses a local SQLite database to remember user-specific settings so they never have to enter the same information twice.

**Stored per-project (sample):**
- Sample name
- Electrode area (mm²)
- Sample thickness (μm or mm)
- Material name (for reference pattern search)

**Stored per-instrument (file pattern):**
- Column mapping: which column index → which data type
- Header row count
- Delimiter type
- Encoding

**Stored globally:**
- Default journal preset
- Default color palette
- Custom style presets
- Recently opened files
- Window size/position

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Cmd+O` | Open file(s) |
| `Cmd+E` | Export figure |
| `Cmd+C` | Copy figure to clipboard |
| `Cmd+Z` / `Cmd+Shift+Z` | Undo / Redo |
| `Cmd+I` | Add inset |
| `Cmd+L` | Toggle legend |
| `B` | Toggle background subtraction |
| `N` | Toggle normalization |
| `G` | Toggle grid |
| `P` | Peak picking mode |
| `F` | Peak fitting mode |
| `R` | Reset zoom |
| `Scroll` | Zoom in/out |
| `Click+drag` | Pan |
| `Shift+click+drag` | Box zoom |
| `1`-`9` | Toggle dataset visibility |

---

## Build Timeline

### Phase 1 — Core Viewer + XRD + Export (5 weeks)

| Week | Deliverable |
|------|-------------|
| 1 | Project scaffolding (Tauri 2 + React + D3). Generic ASCII parser. D3 plot engine: axes, line rendering, zoom, pan. Dark theme UI shell. |
| 2 | XRDML parser. XRD-specific rendering (2θ vs intensity). Background subtraction (polynomial). Peak picking. File drag-and-drop. |
| 3 | Publication export engine: SVG generation with journal presets (Nature, ACS, Elsevier). TIFF/PNG raster export at target DPI. Font embedding. Axis formatting system. |
| 4 | Inset system. Multi-dataset overlay with colorblind palette. Legend. Style panel (colors, line weights, fonts, tick marks). |
| 5 | XRD reference database (300 materials). Reference overlay. Polish + test with 30+ real XRD files. |

### Phase 2 — Ferroelectric + Dielectric (4 weeks)

| Week | Deliverable |
|------|-------------|
| 6 | Radiant .txt parser. P-E loop rendering. Auto-parameter extraction (Pr, Ec, Ps). Parameter annotation on plot. |
| 7 | Dielectric CSV parser. Column mapper UI. ε computation from Cp. Auto-separation by frequency. Multi-curve ε(T) plot. |
| 8 | Curie-Weiss fitting. Curie temperature finder. Vogel-Fulcher fit. Sample dimension input dialog + SQLite persistence. |
| 9 | Multi-panel figure layout (2×2, 1×2, etc.). Panel labels. Shared legend. I-E curve from P-E data. PUND analysis. |

### Phase 3 — General Spectroscopy + Advanced (4 weeks)

| Week | Deliverable |
|------|-------------|
| 10 | JCAMP-DX parser. SPC parser. UV-Vis specific: Tauc plot, absorbance↔transmittance. |
| 11 | Peak fitting engine (Levenberg-Marquardt in Rust). Gaussian/Lorentz/Voigt/PseudoVoigt profiles. Fit results table. |
| 12 | Shirley background (XPS). Smoothing (Savitzky-Golay). Derivative computation. Area integration. |
| 13 | Project system completion. Column mapping memory. Batch processing (folder of files → batch export). Polish + test with all data types. |

### Phase 4 — Pro Features (3 weeks)

| Week | Deliverable |
|------|-------------|
| 14 | Scripting engine (Rhai) for automated figure generation. Template system (save a figure style → apply to new data). |
| 15 | Advanced: Cole-Cole plots, Bode plots, impedance spectroscopy views. Bruker .raw parser. |
| 16 | File association registration. System tray. Auto-update system. Documentation + landing page. |

**Total: ~16 weeks to full product.**
**Usable MVP (XRD + ferroelectric + export): 9 weeks.**

---

## Monetization

### Free Tier (open source)
- All file format import
- Basic plotting (single panel, no inset)
- PNG export at 300 DPI
- Peak picking
- Background subtraction

### Pro ($5.99/month or $39/year)
- Journal presets (Nature, ACS, Elsevier, etc.)
- Multi-panel figures
- Inset system
- TIFF/PDF/EPS/SVG vector export
- Peak fitting engine
- Auto-parameter extraction (Pr, Ec, Tc, etc.)
- Curie-Weiss / Vogel-Fulcher fitting
- Tauc plot generator
- Batch export
- Template system
- Column mapping memory

### Academic Site License ($299/year per lab)
- All Pro features
- Unlimited seats
- Shared style templates across lab members
- Priority support

---

## Why This Beats Origin, MATLAB, and Python Scripts

| Dimension | Origin | MATLAB | Python | **SpectraView** |
|-----------|--------|--------|--------|------------------|
| **Cost** | $1,099/year | $940/year | Free but time cost | $39/year |
| **Format awareness** | None (generic importer) | None | You write the parser | **Knows XRDML, Radiant, etc.** |
| **Time to figure** | 30-45 min | 20-30 min (if script exists) | 15-60 min | **< 2 min** |
| **Journal presets** | Manual every time | Manual | Manual | **One click** |
| **Insets** | 10+ min | Code it | Code it | **10 seconds** |
| **Parameter extraction** | Manual or plugin | Code it | Code it | **Automatic** |
| **Offline** | Yes | Yes | Yes | **Yes** |
| **App size** | 400+ MB | 20+ GB | N/A | **< 10 MB** |
| **Launch time** | 10-30 sec | 30-60 sec | N/A | **< 1 sec** |
| **Learning curve** | Steep | Steep | Steep (scipy, matplotlib) | **Drag-and-drop** |

The killer differentiator: **SpectraView understands your data.** It doesn't just see columns of numbers — it knows that column 3 of your Radiant file is Polarization and that you need to divide voltage by thickness to get E-field. It knows that your XRDML is 2θ vs counts and it can overlay BaTiO₃ reference peaks. No other general-purpose tool does this.

---

## Summary

SpectraView is a **format-aware, publication-ready data viewer** for materials scientists. It closes the gap between raw instrument output and journal-ready figures. The four pillars are:

1. **Format intelligence** — knows XRDML, Radiant, dielectric CSV, JCAMP-DX, Bruker, SPC. Parses them correctly without user intervention.

2. **Domain knowledge** — auto-computes ε' from Cp, E from V/thickness, extracts Pr/Ec/Tc, fits Curie-Weiss and Vogel-Fulcher. These are things only a tool built BY materials scientists FOR materials scientists would include.

3. **Publication export** — journal presets with correct fonts, dimensions, DPI, and color palettes. Insets, multi-panel layouts, and parameter annotations. One-click from data to submittable figure.

4. **Speed** — drag-and-drop a file, see the plot in under a second, export in two clicks. The entire workflow that takes 30-45 minutes in Origin takes under 2 minutes in SpectraView.

Built with Tauri + Rust + React + D3.js. Under 10MB installed. Launches in under a second. Works offline. This is the tool you wish existed every time you opened Origin to format yet another XRD pattern for your paper.
