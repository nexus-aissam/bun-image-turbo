/**
 * Batch Processing Example
 *
 * Process multiple images in parallel
 */

import { transform, metadata, blurhash, version } from 'imgkit';
import { readdir } from 'fs/promises';
import { join, extname, basename } from 'path';

const outputSizes = [
  { name: 'large', width: 1920, quality: 85 },
  { name: 'medium', width: 1200, quality: 80 },
  { name: 'small', width: 800, quality: 80 },
  { name: 'thumb', width: 300, height: 300, fit: 'cover' as const, quality: 70 },
];

async function processImage(inputPath: string, outputDir: string) {
  const start = performance.now();
  const filename = basename(inputPath);
  const name = filename.replace(extname(filename), '');

  const buffer = Buffer.from(await Bun.file(inputPath).arrayBuffer());
  const meta = await metadata(buffer);
  const hash = await blurhash(buffer, 4, 3);

  const outputs = await Promise.all(
    outputSizes.map(async (size) => {
      const outPath = join(outputDir, `${name}-${size.name}.webp`);
      const result = await transform(buffer, {
        resize: { width: size.width, height: size.height, fit: size.fit || 'inside' },
        output: { format: 'webp', webp: { quality: size.quality } }
      });
      await Bun.write(outPath, result);
      return { name: size.name, size: result.length, path: outPath };
    })
  );

  return {
    filename,
    original: { width: meta.width, height: meta.height, size: meta.size },
    blurhash: hash.hash,
    outputs,
    time: performance.now() - start
  };
}

async function main() {
  const inputDir = process.argv[2] || './input';
  const outputDir = process.argv[3] || './output';

  console.log(`imgkit v${version()}`);
  console.log(`Batch Processing\n`);
  console.log(`Input: ${inputDir}`);
  console.log(`Output: ${outputDir}\n`);

  // Get image files
  let files: string[];
  try {
    files = (await readdir(inputDir)).filter(f =>
      ['.jpg', '.jpeg', '.png', '.webp', '.heic'].includes(extname(f).toLowerCase())
    );
  } catch {
    console.log(`Input directory not found. Creating ${inputDir}...`);
    await Bun.write(join(inputDir, '.gitkeep'), '');
    console.log('Please add images to the input folder and run again.');
    return;
  }

  if (files.length === 0) {
    console.log('No images found. Add images to input folder.');
    return;
  }

  console.log(`Found ${files.length} images\n`);
  await Bun.write(join(outputDir, '.gitkeep'), '');

  const results = [];
  const start = performance.now();

  // Process with concurrency
  const concurrency = 4;
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (file) => {
        try {
          const result = await processImage(join(inputDir, file), outputDir);
          console.log(`✓ ${file} (${result.time.toFixed(0)}ms)`);
          return result;
        } catch (error: any) {
          console.log(`✗ ${file}: ${error.message}`);
          return null;
        }
      })
    );
    results.push(...batchResults.filter(Boolean));
  }

  const totalTime = performance.now() - start;

  // Summary
  console.log(`\n=== Summary ===`);
  console.log(`Processed: ${results.length}/${files.length}`);
  console.log(`Total time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`Avg per image: ${(totalTime / results.length).toFixed(0)}ms`);

  // Save manifest
  const manifest = {
    processedAt: new Date().toISOString(),
    total: results.length,
    totalTimeMs: totalTime,
    images: results
  };
  await Bun.write(join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nManifest: ${join(outputDir, 'manifest.json')}`);
}

main().catch(console.error);
