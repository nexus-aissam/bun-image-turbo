/**
 * Blurhash Demo
 *
 * Demonstrates how to generate blurhash placeholders for lazy loading.
 *
 * Run with: bun examples/blurhash-demo.ts
 */

import { blurhash, blurhashSync, metadata, resize, version } from '../src/index';
import { existsSync } from 'fs';

// Create a colorful test image
function createColorfulBMP(): Buffer {
  const width = 32;
  const height = 32;
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

  // Pixel data (colorful gradient)
  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      // Create a colorful pattern
      buffer[offset++] = Math.floor(Math.sin(x * 0.3) * 127 + 128); // B
      buffer[offset++] = Math.floor(Math.cos(y * 0.3) * 127 + 128); // G
      buffer[offset++] = Math.floor(Math.sin((x + y) * 0.2) * 127 + 128); // R
    }
    while ((offset - 54) % 4 !== 0) {
      buffer[offset++] = 0;
    }
  }

  return buffer;
}

async function main() {
  console.log('='.repeat(60));
  console.log('  bun-image-turbo Blurhash Demo');
  console.log('='.repeat(60));
  console.log(`\nLibrary version: ${version()}\n`);

  const testImage = createColorfulBMP();
  console.log('Created test image: 32x32 colorful BMP\n');

  // Example 1: Basic blurhash generation (async)
  console.log('1. Basic Blurhash (Async)');
  console.log('-'.repeat(40));
  const result1 = await blurhash(testImage, 4, 3);
  console.log(`   Hash: ${result1.hash}`);
  console.log(`   Dimensions: ${result1.width}x${result1.height}`);
  console.log(`   Components: 4x3`);
  console.log('');

  // Example 2: Blurhash sync
  console.log('2. Blurhash (Sync)');
  console.log('-'.repeat(40));
  const result2 = blurhashSync(testImage, 4, 3);
  console.log(`   Hash: ${result2.hash}`);
  console.log('');

  // Example 3: Different component sizes
  console.log('3. Different Component Sizes');
  console.log('-'.repeat(40));
  const componentSizes = [
    [2, 2],
    [4, 3],
    [4, 4],
    [5, 4],
    [6, 5],
  ];

  for (const [x, y] of componentSizes) {
    const result = await blurhash(testImage, x, y);
    console.log(`   ${x}x${y}: ${result.hash} (${result.hash.length} chars)`);
  }
  console.log('');

  // Example 4: Performance comparison
  console.log('4. Performance Test (1000 iterations)');
  console.log('-'.repeat(40));

  const iterations = 1000;
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    blurhashSync(testImage, 4, 3);
  }
  const elapsed = performance.now() - start;
  const opsPerSec = (iterations / elapsed) * 1000;

  console.log(`   Time: ${elapsed.toFixed(2)}ms`);
  console.log(`   Ops/sec: ${opsPerSec.toFixed(2)}`);
  console.log('');

  // Try with a real image if available
  const testImagePath = './benchmarks/1mb/1mb-jpg-example-file.jpg';
  if (existsSync(testImagePath)) {
    console.log('5. Real Image Blurhash');
    console.log('-'.repeat(40));

    const file = Bun.file(testImagePath);
    const realImage = Buffer.from(await file.arrayBuffer());

    const info = await metadata(realImage);
    console.log(`   Original: ${info.width}x${info.height} ${info.format}`);

    // Resize first for faster blurhash (recommended practice)
    const thumbnail = await resize(realImage, { width: 32 });
    const thumbInfo = await metadata(thumbnail);

    const start = performance.now();
    const realResult = await blurhash(thumbnail, 4, 3);
    const elapsed = performance.now() - start;

    console.log(`   Thumbnail: ${thumbInfo.width}x${thumbInfo.height}`);
    console.log(`   Blurhash: ${realResult.hash}`);
    console.log(`   Time: ${elapsed.toFixed(2)}ms`);
    console.log('');

    // Show how to use in HTML
    console.log('6. Usage in HTML/CSS');
    console.log('-'.repeat(40));
    console.log(`   <!-- Use with a blurhash decoder library -->`);
    console.log(`   <img`);
    console.log(`     src="image.jpg"`);
    console.log(`     data-blurhash="${realResult.hash}"`);
    console.log(`     loading="lazy"`);
    console.log(`   />`);
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('  Blurhash demo completed successfully!');
  console.log('='.repeat(60));
}

main().catch(console.error);
