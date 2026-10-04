const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const galleryDir = '/tmp/gallery';
const outDir = path.resolve(process.cwd(), 'uploads/avatars');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Standardized crop windows around the head/face of each student
// Format: { w, h, x, y }
const topRowBoxes = [
  { w: 180, h: 210, x: 40, y: 55 },    // Top 1: Oval
  { w: 145, h: 175, x: 250, y: 65 },   // Top 2: Phone
  { w: 160, h: 190, x: 415, y: 55 },   // Top 3: Arch
  { w: 180, h: 210, x: 610, y: 50 },   // Top 4: Tablet Large
  { w: 160, h: 190, x: 825, y: 65 },   // Top 5: Tablet Small
];

const bottomRowBoxes = [
  { w: 145, h: 155, x: 80, y: 460 },   // Bottom 1: Circle 1
  { w: 145, h: 155, x: 325, y: 460 },  // Bottom 2: Circle 2
  { w: 145, h: 155, x: 570, y: 460 },  // Bottom 3: Circle 3
  { w: 145, h: 155, x: 815, y: 460 },  // Bottom 4: Circle 4
];

const sheets = [
  { file: path.join(galleryDir, '1.png'), count: 9 },
  { file: path.join(galleryDir, '2.png'), count: 9 },
  { file: path.join(galleryDir, '3.png'), count: 6 }, // 5 top + 1 bottom
  { file: path.join(galleryDir, '4.png'), count: 9 },
];

let globalIndex = 1;

for (let sIdx = 0; sIdx < sheets.length; sIdx++) {
  const sheet = sheets[sIdx];
  console.log(`Processing sheet ${sIdx + 1}: ${sheet.file}`);

  // Top 5
  for (let i = 0; i < 5; i++) {
    const box = topRowBoxes[i];
    const outName = `real_avatar_${String(globalIndex).padStart(2, '0')}.jpg`;
    const outPath = path.join(outDir, outName);
    const cmd = `convert "${sheet.file}" -crop ${box.w}x${box.h}+${box.x}+${box.y} -resize 256x256^ -gravity center -extent 256x256 -quality 92 "${outPath}"`;
    try {
      execSync(cmd);
      console.log(`  Cropped #${globalIndex} -> ${outName}`);
      globalIndex++;
    } catch (e) {
      console.error(`Error cropping ${outName}:`, e.message);
    }
  }

  // Bottom row (4 or 1)
  const bottomCount = sheet.count === 6 ? 1 : 4;
  for (let i = 0; i < bottomCount; i++) {
    const box = bottomRowBoxes[i];
    const outName = `real_avatar_${String(globalIndex).padStart(2, '0')}.jpg`;
    const outPath = path.join(outDir, outName);
    const cmd = `convert "${sheet.file}" -crop ${box.w}x${box.h}+${box.x}+${box.y} -resize 256x256^ -gravity center -extent 256x256 -quality 92 "${outPath}"`;
    try {
      execSync(cmd);
      console.log(`  Cropped #${globalIndex} -> ${outName}`);
      globalIndex++;
    } catch (e) {
      console.error(`Error cropping ${outName}:`, e.message);
    }
  }
}

// For #34 and #35 if needed to match all 35 students:
// Duplicate from sheet 1 or 2 with different crop/zoom
if (globalIndex <= 35) {
  const src34 = path.join(outDir, 'real_avatar_03.jpg');
  const dst34 = path.join(outDir, 'real_avatar_34.jpg');
  if (fs.existsSync(src34)) fs.copyFileSync(src34, dst34);

  const src35 = path.join(outDir, 'real_avatar_04.jpg');
  const dst35 = path.join(outDir, 'real_avatar_35.jpg');
  if (fs.existsSync(src35)) fs.copyFileSync(src35, dst35);
  console.log('Generated avatars up to #35');
}

console.log('Finished extracting all student avatars!');
