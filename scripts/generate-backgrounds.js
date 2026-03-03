const fs = require("fs");
const path = require("path");

const backgroundsDir = path.join(__dirname, "..", "public", "backgrounds");
const outputFile = path.join(__dirname, "..", "lib", "backgrounds.ts");

const sourceExtensions = [".jpg", ".jpeg", ".png"];

async function generateBackgrounds() {
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.warn("sharp not found — skipping WebP conversion, using original files");
    return generateBackgroundsWithoutConversion();
  }

  const files = fs.readdirSync(backgroundsDir);
  const sourceFiles = files
    .filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return sourceExtensions.includes(ext);
    })
    .sort();

  const backgrounds = [];

  for (const file of sourceFiles) {
    const rawName = path.basename(file, path.extname(file));
    const webpFile = `${rawName}.webp`;
    const srcPath = path.join(backgroundsDir, file);
    const destPath = path.join(backgroundsDir, webpFile);

    // Convert to WebP if it doesn't exist or source is newer
    const srcStat = fs.statSync(srcPath);
    const destExists = fs.existsSync(destPath);
    const destStat = destExists ? fs.statSync(destPath) : null;

    if (!destExists || srcStat.mtimeMs > destStat.mtimeMs) {
      const srcSize = (srcStat.size / 1024).toFixed(0);
      await sharp(srcPath).webp({ quality: 95 }).toFile(destPath);
      const newSize = (fs.statSync(destPath).size / 1024).toFixed(0);
      console.log(`  Converted ${file} (${srcSize}KB) → ${webpFile} (${newSize}KB)`);
    }

    // Parse name and premium flag
    let name = rawName.replace(/^\d+-/, "");
    const isPremium = name.startsWith("premium-");
    if (isPremium) {
      name = name.replace(/^premium-/, "");
    }
    const displayName = name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    backgrounds.push({
      id: isPremium ? `premium-${name}` : name,
      name: displayName,
      image: `/backgrounds/${webpFile}`,
      premium: isPremium,
    });
  }

  writeOutput(backgrounds);
}

function generateBackgroundsWithoutConversion() {
  const files = fs.readdirSync(backgroundsDir);
  const allExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

  const backgrounds = files
    .filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return allExtensions.includes(ext);
    })
    .sort()
    .map((file) => {
      const rawName = path.basename(file, path.extname(file));
      let name = rawName.replace(/^\d+-/, "");
      const isPremium = name.startsWith("premium-");
      if (isPremium) {
        name = name.replace(/^premium-/, "");
      }
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

  writeOutput(backgrounds);
}

function writeOutput(backgrounds) {
  const content = `// Auto-generated file - do not edit manually
// Run "npm run generate-backgrounds" to update

import { BackgroundPreset } from "@/components/Editor";

export const BACKGROUNDS: BackgroundPreset[] = ${JSON.stringify(backgrounds, null, 2)};
`;

  fs.writeFileSync(outputFile, content);
  console.log(`Generated ${backgrounds.length} backgrounds in ${outputFile}`);
}

generateBackgrounds();
