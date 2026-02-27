export type BadgeId =
  | "first-roar"
  | "template-explorer"
  | "background-hunter"
  | "week-warrior"
  | "month-master"
  | "legend"
  | "rising-star"
  | "groar-elite"
  | "night-owl"
  | "early-bird"
  | "jungle-king";

export type BadgeDefinition = {
  id: BadgeId;
  name: string;
  description: string;
  emoji: string;
};

export const BADGES: BadgeDefinition[] = [
  { id: "first-roar", name: "First Roar", description: "Export your first visual", emoji: "🐯" },
  { id: "template-explorer", name: "Template Explorer", description: "Use all 3 templates", emoji: "🧭" },
  { id: "background-hunter", name: "Background Hunter", description: "Use 10 different backgrounds", emoji: "🎨" },
  { id: "week-warrior", name: "Week Warrior", description: "7-day streak", emoji: "⚔️" },
  { id: "month-master", name: "Month Master", description: "30-day streak", emoji: "👑" },
  { id: "legend", name: "Legend", description: "90-day streak", emoji: "🏆" },
  { id: "rising-star", name: "Rising Star", description: "Reach 500 points", emoji: "⭐" },
  { id: "groar-elite", name: "GROAR Elite", description: "Reach 1,000 points", emoji: "💎" },
  { id: "night-owl", name: "Night Owl", description: "Export between midnight and 5am", emoji: "🦉" },
  { id: "early-bird", name: "Early Bird", description: "Export between 5am and 8am", emoji: "🐦" },
  { id: "jungle-king", name: "King of the Jungle", description: "Claim rank #1 on the leaderboard", emoji: "🦁" },
];

export const BADGE_MAP = Object.fromEntries(
  BADGES.map((b) => [b.id, b])
) as Record<BadgeId, BadgeDefinition>;
