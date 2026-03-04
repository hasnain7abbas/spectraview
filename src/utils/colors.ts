// Wong 2011 colorblind-safe palette, adapted for dark backgrounds
const PALETTE = [
  "#56b4e9", // sky blue
  "#e69f00", // orange
  "#009e73", // bluish green
  "#f0e442", // yellow
  "#0072b2", // blue
  "#d55e00", // vermilion
  "#cc79a7", // reddish purple
  "#ffffff", // white
];

let colorIndex = 0;

export function getNextColor(): string {
  const color = PALETTE[colorIndex % PALETTE.length];
  colorIndex++;
  return color;
}

export function resetColorIndex(): void {
  colorIndex = 0;
}

export function generateId(): string {
  return crypto.randomUUID();
}
