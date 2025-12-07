/**
 * Basic Usage Example
 *
 * Run with: bun examples/basic-usage.ts
 * Or with Node.js: npx ts-node examples/basic-usage.ts
 */

import { metadata, metadataSync, resize, toJpeg, toPng, toWebp, version } from '../src/index';
import { existsSync } from 'fs';

// Create a simple 10x10 BMP test image (more reliable than PNG)
function createTestBMP(): Buffer {
  const width = 10;
  const height = 10;
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const imageSize = rowSize * height;
  const fileSize = 54 + imageSize;

  const buffer = Buffer.alloc(fileSize);

  // BMP Header
  buffer.write('BM', 0);
  buffer.writeUInt32LE(fileSize, 2);
  buffer.writeUInt32LE(0, 6);
  buffer.writeUInt32LE(54, 10);

  // DIB Header
  buffer.writeUInt32LE(40, 14);
  buffer.writeInt32LE(width, 18);
  buffer.writeInt32LE(height, 22);
  buffer.writeUInt16LE(1, 26);
  buffer.writeUInt16LE(24, 28);
  buffer.writeUInt32LE(0, 30);
  buffer.writeUInt32LE(imageSize, 34);

  // Pixel data (red gradient)
  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      buffer[offset++] = 0;   // B
      buffer[offset++] = 0;   // G
      buffer[offset++] = 255; // R (red)
    }
    while ((offset - 54) % 4 !== 0) {
      buffer[offset++] = 0;
    }
  }

  return buffer;
}

const TEST_IMAGE = createTestBMP();

async function main() {
  console.log('='.repeat(60));
  console.log('  bun-image-turbo Basic Usage Examples');
  console.log('='.repeat(60));
  console.log(`\nLibrary version: ${version()}\n`);

  // Example 1: Get metadata (sync)
  console.log('1. Metadata Extraction (Sync)');
  console.log('-'.repeat(40));
  const info = metadataSync(TEST_IMAGE);
  console.log(`   Format: ${info.format}`);
  console.log(`   Dimensions: ${info.width}x${info.height}`);
  console.log(`   Has Alpha: ${info.hasAlpha}`);
  console.log('');

  // Example 2: Get metadata (async)
  console.log('2. Metadata Extraction (Async)');
  console.log('-'.repeat(40));
  const infoAsync = await metadata(TEST_IMAGE);
  console.log(`   Format: ${infoAsync.format}`);
  console.log(`   Dimensions: ${infoAsync.width}x${infoAsync.height}`);
  console.log('');

  // Example 3: Convert to JPEG
  console.log('3. Convert to JPEG');
  console.log('-'.repeat(40));
  const jpeg = await toJpeg(TEST_IMAGE, { quality: 90 });
  console.log(`   Input size: ${TEST_IMAGE.length} bytes`);
  console.log(`   Output size: ${jpeg.length} bytes`);
  console.log(`   Output format: JPEG`);
  console.log('');

  // Example 4: Convert to WebP
  console.log('4. Convert to WebP');
  console.log('-'.repeat(40));
  const webp = await toWebp(TEST_IMAGE, { quality: 80 });
  console.log(`   Input size: ${TEST_IMAGE.length} bytes`);
  console.log(`   Output size: ${webp.length} bytes`);
  console.log(`   Output format: WebP`);
  console.log('');

  // Example 5: Convert to PNG
  console.log('5. Convert to PNG');
  console.log('-'.repeat(40));
  const png = await toPng(TEST_IMAGE, { compression: 6 });
  console.log(`   Input size: ${TEST_IMAGE.length} bytes`);
  console.log(`   Output size: ${png.length} bytes`);
  console.log(`   Output format: PNG`);
  console.log('');

  // Try with a real image if available
  const testImagePath = './benchmarks/1mb/1mb-jpg-example-file.jpg';
  if (existsSync(testImagePath)) {
    console.log('6. Real Image Processing');
    console.log('-'.repeat(40));

    const file = Bun.file(testImagePath);
    const realImage = Buffer.from(await file.arrayBuffer());

    const realInfo = metadataSync(realImage);
    console.log(`   Original: ${realInfo.width}x${realInfo.height} ${realInfo.format}`);

    // Resize
    const resized = await resize(realImage, { width: 200 });
    const resizedInfo = metadataSync(resized);
    console.log(`   Resized: ${resizedInfo.width}x${resizedInfo.height}`);

    // Convert to WebP
    const webpReal = await toWebp(realImage, { quality: 80 });
    console.log(`   WebP size: ${(webpReal.length / 1024).toFixed(2)} KB`);
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('  All examples completed successfully!');
  console.log('='.repeat(60));
}

main().catch(console.error);
