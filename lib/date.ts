import { PeriodType } from "@/components/Editor";

/**
 * Get the formatted date label for a given period type
 */
export const getDateLabel = (periodType: PeriodType): string => {
  const now = new Date();
  const year = now.getFullYear();

  const monthName = now.toLocaleString("en", { month: "long" });

  switch (periodType) {
    case "day":
      return `${monthName} ${year}`;
    case "week":
      return `${monthName} ${year}`;
    case "month":
      return `${monthName} ${year}`;
    case "year":
      return `${year}`;
  }
};
