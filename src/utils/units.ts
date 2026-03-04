import { format } from "d3";

const sciFormat = format(".2e");
const fixedFormat = format(".4~f");

export function formatAxisValue(value: number): string {
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  if (abs >= 1e4 || abs < 1e-2) return sciFormat(value);
  return fixedFormat(value);
}
