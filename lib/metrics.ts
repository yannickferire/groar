import { MetricType } from "@/components/Editor";

/**
 * Parse values like "10k", "1.5M", "100" into numbers
 */
export const parseMetricInput = (input: string, metricType: MetricType): number | null => {
  // Strip thousands separators (commas and dots used as grouping)
  // Dots followed by exactly 3 digits are treated as thousands separators (e.g., 1.500 -> 1500)
  const trimmed = input.trim().replace(/,/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").toLowerCase();
  if (trimmed === "" || trimmed === "-") return 0;

  // For engagement rate, allow decimals but cap at 100
  if (metricType === "engagementRate") {
    const num = parseFloat(trimmed);
    if (isNaN(num)) return null;
    return Math.min(100, Math.max(0, num));
  }

  const match = trimmed.match(/^(-?\d+\.?\d*)\s*(k|m|b)?$/);
  if (!match) return null;

  const num = parseFloat(match[1]);
  const suffix = match[2];

  if (isNaN(num)) return null;

  switch (suffix) {
    case "k":
      return Math.round(num * 1000);
    case "m":
      return Math.round(num * 1000000);
    case "b":
      return Math.round(num * 1000000000);
    default:
      return Math.round(num);
  }
};

/**
 * Format a number abbreviated (e.g., 10000 -> "10.0K")
 */
export const formatNumberShort = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

/**
 * Format a number with thousands separators (e.g., 10000 -> "10,000")
 */
export const formatNumberFull = (value: number): string => {
  return value.toLocaleString("en-US");
};

/**
 * Format a number for display in preview (abbreviated or full)
 */
export const formatNumber = (value: number, abbreviate = true): string => {
  return abbreviate ? formatNumberShort(value) : formatNumberFull(value);
};

/**
 * Format a metric value for display based on its type
 */
export const formatMetricValue = (type: MetricType, value: number, abbreviate = true): string => {
  if (type === "engagementRate") {
    return `${value}%`;
  }
  return formatNumber(value, abbreviate);
};
