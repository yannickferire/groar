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
    .map((file) => {
      const name = path.basename(file, path.extname(file));
      // Convert filename to display name (e.g., "noisy-lights" -> "Noisy Lights")
      const displayName = name
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      return {
        id: name,
        name: displayName,
        image: `/backgrounds/${file}`,
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
