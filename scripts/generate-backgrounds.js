const fs = require("fs");
const path = require("path");

const backgroundsDir = path.join(__dirname, "..", "public", "backgrounds");
const outputFile = path.join(__dirname, "..", "lib", "backgrounds.ts");

const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

function generateBackgrounds() {
  const files = fs.readdirSync(backgroundsDir);

  const backgrounds = files
    .filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    })
    .sort() // Sort alphabetically to respect numeric prefixes
    .map((file) => {
      const rawName = path.basename(file, path.extname(file));
      // Remove numeric prefix (e.g., "01-tokyo-streets" -> "tokyo-streets")
      let name = rawName.replace(/^\d+-/, "");
      // Check if it's a premium background (prefix "premium-")
      const isPremium = name.startsWith("premium-");
      // Remove premium prefix for the id and display name
      if (isPremium) {
        name = name.replace(/^premium-/, "");
      }
      // Convert filename to display name (e.g., "tokyo-streets" -> "Tokyo Streets")
      const displayName = name
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      return {
        id: isPremium ? `premium-${name}` : name,
        name: displayName,
        image: `/backgrounds/${file}`,
        premium: isPremium,
      };
    });

  const content = `// Auto-generated file - do not edit manually
// Run "npm run generate-backgrounds" to update

import { BackgroundPreset } from "@/components/Editor";

export const BACKGROUNDS: BackgroundPreset[] = ${JSON.stringify(backgrounds, null, 2)};
`;

  fs.writeFileSync(outputFile, content);
  console.log(`Generated ${backgrounds.length} backgrounds in ${outputFile}`);
}

generateBackgrounds();
