import { TemplateType } from "@/components/Editor";

export type TemplateConfig = {
  name: string;
  description: string;
  premium: boolean;
};

export const TEMPLATES: Record<TemplateType, TemplateConfig> = {
  metrics: {
    name: "Metrics",
    description: "Display your key metrics",
    premium: false,
  },
  milestone: {
    name: "Milestone",
    description: "Celebrate a follower milestone",
    premium: true,
  },
  progress: {
    name: "Progress",
    description: "Show progress towards a goal",
    premium: true,
  },
};

export const TEMPLATE_LIST = Object.entries(TEMPLATES).map(([id, config]) => ({
  id: id as TemplateType,
  ...config,
}));
