const fs = require("fs");
const path = require("path");

const backgroundsDir = path.join(__dirname, "..", "public", "backgrounds");
const outputFile = path.join(__dirname, "..", "lib", "backgrounds.ts");

const sourceExtensions = [".jpg", ".jpeg", ".png"];

// Recursively find all source image files
function findSourceFiles(dir, relativeBase = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(relativeBase, entry.name);

    if (entry.isDirectory()) {
      files.push(...findSourceFiles(fullPath, relativePath));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (sourceExtensions.includes(ext)) {
        files.push({ fullPath, relativePath, dir });
      }
    }
  }

  return files;
}

async function generateBackgrounds() {
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.warn("sharp not found — skipping WebP conversion, using original files");
    return generateBackgroundsWithoutConversion();
  }

  const sourceFiles = findSourceFiles(backgroundsDir).sort((a, b) =>
    a.relativePath.localeCompare(b.relativePath)
  );

  const backgrounds = [];

  for (const { fullPath, relativePath, dir } of sourceFiles) {
    const rawName = path.basename(relativePath, path.extname(relativePath));
    const webpFileName = `${rawName}.webp`;
    const webpPath = path.join(dir, webpFileName);

    // Convert to WebP if it doesn't exist or source is newer
    const srcStat = fs.statSync(fullPath);
    const destExists = fs.existsSync(webpPath);
    const destStat = destExists ? fs.statSync(webpPath) : null;

    if (!destExists || srcStat.mtimeMs > destStat.mtimeMs) {
      const srcSize = (srcStat.size / 1024).toFixed(0);
      await sharp(fullPath).webp({ quality: 95 }).toFile(webpPath);
      const newSize = (fs.statSync(webpPath).size / 1024).toFixed(0);
      console.log(`  Converted ${relativePath} (${srcSize}KB) → ${webpFileName} (${newSize}KB)`);
    }

    // Determine premium and category from path
    const relDir = path.dirname(relativePath);
    const isPremium = relDir.startsWith("premium");
    const category = isPremium && relDir.includes(path.sep)
      ? relDir.split(path.sep).slice(1).join("/")
      : isPremium ? relDir.replace("premium", "").replace(/^\//, "") || undefined
      : undefined;

    // Clean name: remove number prefix
    const name = rawName.replace(/^\d+-/, "");
    const displayName = name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // Build public URL path
    const webpRelative = path.join(path.dirname(relativePath), webpFileName);
    const publicPath = `/backgrounds/${webpRelative.split(path.sep).join("/")}`;

    // Use file creation/modification time as addedAt date
    const addedAt = srcStat.birthtime > srcStat.mtime ? srcStat.mtime : srcStat.birthtime;
    const addedDate = addedAt.toISOString().split("T")[0]; // YYYY-MM-DD

    const bg = {
      id: isPremium ? `premium-${name}` : name,
      name: displayName,
      image: publicPath,
      premium: isPremium,
    };
    if (category) bg.category = category;
    bg.addedAt = addedDate;

    backgrounds.push(bg);
  }

  writeOutput(backgrounds);
}

function generateBackgroundsWithoutConversion() {
  const allExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

  function findAllFiles(dir, relativeBase = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(relativeBase, entry.name);
      if (entry.isDirectory()) {
        files.push(...findAllFiles(fullPath, relativePath));
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (allExtensions.includes(ext)) {
          const stat = fs.statSync(fullPath);
          const addedAt = stat.birthtime > stat.mtime ? stat.mtime : stat.birthtime;
          files.push({ relativePath, addedAt });
        }
      }
    }
    return files;
  }

  const allFiles = findAllFiles(backgroundsDir).sort((a, b) =>
    a.relativePath.localeCompare(b.relativePath)
  );

  const backgrounds = allFiles.map(({ relativePath, addedAt }) => {
    const rawName = path.basename(relativePath, path.extname(relativePath));
    const relDir = path.dirname(relativePath);
    const isPremium = relDir.startsWith("premium");
    const category = isPremium && relDir.includes(path.sep)
      ? relDir.split(path.sep).slice(1).join("/")
      : isPremium ? relDir.replace("premium", "").replace(/^\//, "") || undefined
      : undefined;

    const name = rawName.replace(/^\d+-/, "");
    const displayName = name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const publicPath = `/backgrounds/${relativePath.split(path.sep).join("/")}`;
    const addedDate = addedAt.toISOString().split("T")[0];

    const bg = {
      id: isPremium ? `premium-${name}` : name,
      name: displayName,
      image: publicPath,
      premium: isPremium,
    };
    if (category) bg.category = category;
    bg.addedAt = addedDate;

    return bg;
  });

  writeOutput(backgrounds);
}

function writeOutput(backgrounds) {
  const content = `// Auto-generated file - do not edit manually
// Run "npm run generate-backgrounds" to update

import { BackgroundPreset } from "@/components/editor/types";

export const BACKGROUNDS: BackgroundPreset[] = ${JSON.stringify(backgrounds, null, 2)};
`;

  fs.writeFileSync(outputFile, content);
  console.log(`Generated ${backgrounds.length} backgrounds in ${outputFile}`);
}

generateBackgrounds();
