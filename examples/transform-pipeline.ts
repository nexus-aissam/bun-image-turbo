/**
 * Transform Pipeline Example
 *
 * Demonstrates how to apply multiple transformations in a single call
 * for maximum performance.
 *
 * Run with: bun examples/transform-pipeline.ts
 */

import { transform, metadata, version } from '../src/index';
import { existsSync } from 'fs';

// Create a simple 10x10 gradient image (BMP format for simplicity)
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

  // Pixel data (gradient)
  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      buffer[offset++] = Math.floor((x / width) * 255); // B
      buffer[offset++] = Math.floor((y / height) * 255); // G
      buffer[offset++] = 128; // R
    }
    while ((offset - 54) % 4 !== 0) {
      buffer[offset++] = 0;
    }
  }

  return buffer;
}

async function main() {
  console.log('='.repeat(60));
  console.log('  bun-image-turbo Transform Pipeline Examples');
  console.log('='.repeat(60));
  console.log(`\nLibrary version: ${version()}\n`);

  const testImage = createTestBMP();
  console.log('Created test image: 10x10 BMP gradient\n');

  // Example 1: Simple resize + format conversion
  console.log('1. Resize + Convert to WebP');
  console.log('-'.repeat(40));
  const result1 = await transform(testImage, {
    resize: { width: 20, height: 20 },
    output: { format: 'webp', webp: { quality: 80 } }
  });
  const info1 = await metadata(result1);
  console.log(`   Output: ${info1.width}x${info1.height} ${info1.format}`);
  console.log(`   Size: ${result1.length} bytes`);
  console.log('');

  // Example 2: Resize + Grayscale
  console.log('2. Resize + Grayscale + JPEG');
  console.log('-'.repeat(40));
  const result2 = await transform(testImage, {
    resize: { width: 50 },
    grayscale: true,
    output: { format: 'jpeg', jpeg: { quality: 85 } }
  });
  const info2 = await metadata(result2);
  console.log(`   Output: ${info2.width}x${info2.height} ${info2.format}`);
  console.log(`   Size: ${result2.length} bytes`);
  console.log('');

  // Example 3: Full transform pipeline
  console.log('3. Full Pipeline (resize + rotate + grayscale + sharpen)');
  console.log('-'.repeat(40));
  const result3 = await transform(testImage, {
    resize: { width: 100, height: 100, fit: 'cover' },
    rotate: 90,
    grayscale: true,
    sharpen: 10,
    output: { format: 'png' }
  });
  const info3 = await metadata(result3);
  console.log(`   Output: ${info3.width}x${info3.height} ${info3.format}`);
  console.log(`   Size: ${result3.length} bytes`);
  console.log('');

  // Example 4: Blur + Brightness + Contrast
  console.log('4. Blur + Brightness + Contrast');
  console.log('-'.repeat(40));
  const result4 = await transform(testImage, {
    resize: { width: 50 },
    blur: 2,
    brightness: 10,
    contrast: 5,
    output: { format: 'jpeg', jpeg: { quality: 90 } }
  });
  const info4 = await metadata(result4);
  console.log(`   Output: ${info4.width}x${info4.height} ${info4.format}`);
  console.log(`   Size: ${result4.length} bytes`);
  console.log('');

  // Example 5: Different fit modes
  console.log('5. Different Fit Modes');
  console.log('-'.repeat(40));

  const fitModes = ['cover', 'contain', 'fill'] as const;
  for (const fit of fitModes) {
    const result = await transform(testImage, {
      resize: { width: 30, height: 20, fit },
      output: { format: 'png' }
    });
    const info = await metadata(result);
    console.log(`   ${fit.padEnd(10)}: ${info.width}x${info.height}`);
  }
  console.log('');

  // Try with a real image if available
  const testImagePath = './benchmarks/1mb/1mb-jpg-example-file.jpg';
  if (existsSync(testImagePath)) {
    console.log('6. Real Image Transform Pipeline');
    console.log('-'.repeat(40));

    const file = Bun.file(testImagePath);
    const realImage = Buffer.from(await file.arrayBuffer());

    const start = performance.now();
    const transformed = await transform(realImage, {
      resize: { width: 400, height: 300, fit: 'cover' },
      rotate: 90,
      grayscale: true,
      sharpen: 5,
      output: { format: 'webp', webp: { quality: 80 } }
    });
    const elapsed = performance.now() - start;

    const transformedInfo = await metadata(transformed);
    console.log(`   Output: ${transformedInfo.width}x${transformedInfo.height} ${transformedInfo.format}`);
    console.log(`   Size: ${(transformed.length / 1024).toFixed(2)} KB`);
    console.log(`   Time: ${elapsed.toFixed(2)}ms`);
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('  All transform examples completed successfully!');
  console.log('='.repeat(60));
}

main().catch(console.error);
