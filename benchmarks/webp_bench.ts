/**
 * WebP Shrink-on-Load Performance Benchmark
 * Compares imgkit vs sharp for WebP resize operations
 * Uses consistent test images for reliable measurements
 */

import { resize, metadata, transform } from "../src";
import sharp from "sharp";

// Generate a synthetic test image of specified size for consistent benchmarks
async function generateTestWebP(
  width: number,
  height: number
): Promise<Buffer> {
  // Create a gradient image with some detail for realistic compression
  const channels = 3;
  const pixels = Buffer.alloc(width * height * channels);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      // Create a pattern with gradients and variation
      pixels[idx] = ((x * 255) / width) | 0; // R: horizontal gradient
      pixels[idx + 1] = ((y * 255) / height) | 0; // G: vertical gradient
      pixels[idx + 2] = (((x + y) * 127) / (width + height)) | 0; // B: diagonal
    }
  }

  return sharp(pixels, { raw: { width, height, channels } })
    .webp({ quality: 90 })
    .toBuffer();
}

async function benchmarkSize(
  width: number,
  height: number,
  targetWidth: number
) {
  // Generate consistent test WebP image
  const webpBuffer = await generateTestWebP(width, height);

  const iterations = 20; // More iterations for stable results

  // Warmup - use transform for fair comparison (both output WebP)
  for (let i = 0; i < 3; i++) {
    await transform(webpBuffer, {
      resize: { width: targetWidth },
      output: { format: "webp" },
    });
    await sharp(webpBuffer).resize(targetWidth).webp().toBuffer();
  }

  // Benchmark imgkit (output WebP for fair comparison)
  const turboStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    await transform(webpBuffer, {
      resize: { width: targetWidth },
      output: { format: "webp" },
    });
  }
  const turboAvg = (performance.now() - turboStart) / iterations;

  // Benchmark sharp (explicitly output WebP)
  const sharpStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    await sharp(webpBuffer).resize(targetWidth).webp().toBuffer();
  }
  const sharpAvg = (performance.now() - sharpStart) / iterations;

  const speedup = sharpAvg / turboAvg;
  const winner = turboAvg < sharpAvg ? "turbo" : "sharp";

  console.log(
    width +
      "x" +
      height +
      " → " +
      targetWidth +
      "px | " +
      "turbo: " +
      turboAvg.toFixed(1) +
      "ms, " +
      "sharp: " +
      sharpAvg.toFixed(1) +
      "ms, " +
      "speedup: " +
      speedup.toFixed(2) +
      "x " +
      (winner === "turbo" ? "✅" : "")
  );

  return { turboAvg, sharpAvg, speedup };
}

async function benchmark() {
  console.log("=== WebP SHRINK-ON-LOAD BENCHMARK ===\n");
  console.log("Testing various image sizes...\n");

  const results: Array<{
    turboAvg: number;
    sharpAvg: number;
    speedup: number;
  }> = [];

  // Test different sizes
  results.push(await benchmarkSize(800, 600, 200));
  results.push(await benchmarkSize(1600, 1200, 200));
  results.push(await benchmarkSize(2000, 1500, 200));
  results.push(await benchmarkSize(3000, 2000, 200));
  results.push(await benchmarkSize(4000, 3000, 400));

  // Summary
  const avgSpeedup =
    results.reduce((sum, r) => sum + r.speedup, 0) / results.length;
  console.log("\n--- SUMMARY ---");
  console.log("Average speedup: " + avgSpeedup.toFixed(2) + "x");

  if (avgSpeedup > 1) {
    console.log("✅ imgkit is faster on average!");
  } else {
    console.log("⚠️ sharp is faster on average");
  }
}

benchmark().catch(console.error);
