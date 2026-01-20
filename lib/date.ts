import { PeriodType } from "@/components/Editor";

/**
 * Get the formatted date label for a given period type
 */
export const getDateLabel = (periodType: PeriodType): string => {
  const now = new Date();
  const year = now.getFullYear();

  const startOfYear = new Date(year, 0, 1);
  const dayOfYear = Math.ceil((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const totalDays = isLeapYear ? 366 : 365;

  switch (periodType) {
    case "day":
      return `${dayOfYear.toString().padStart(2, "0")}/${totalDays} – ${year}`;
    case "week":
      const weekNumber = Math.ceil(dayOfYear / 7);
      return `${weekNumber.toString().padStart(2, "0")}/52 – ${year}`;
    case "month":
      const month = now.getMonth() + 1;
      return `${month.toString().padStart(2, "0")}/12 – ${year}`;
    case "year":
      return `${year}`;
  }
};
