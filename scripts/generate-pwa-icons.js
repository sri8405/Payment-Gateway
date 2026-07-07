const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputImagePath = path.join(__dirname, '..', 'public', 'assets', 'guruji.jpg');
const outputDir = path.join(__dirname, '..', 'public', 'icons');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (!fs.existsSync(inputImagePath)) {
    console.error('Source image not found:', inputImagePath);
    process.exit(1);
  }

  console.log('Generating PWA icons...');

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    try {
      await sharp(inputImagePath)
        .resize(size, size, {
          fit: 'cover',
          position: 'center',
        })
        .toFile(outputPath);
      console.log(`Generated icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`Error generating ${size}x${size} icon:`, error);
    }
  }

  console.log('Finished generating icons.');
}

generateIcons();
