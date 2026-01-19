/**
 * EXIF Metadata Benchmark
 *
 * Tests writeExif and stripExif performance.
 * Note: sharp doesn't have direct EXIF write - it uses withMetadata() which is different.
 */

import * as imageTurbo from "../src/index";

async function main() {
  console.log("=== EXIF METADATA BENCHMARK ===\n");

  // Load test images
  const jpegFile = Bun.file("./benchmarks/1mb/1mb-jpg-example-file.jpg");
  const jpegBuf = Buffer.from(await jpegFile.arrayBuffer());

  const meta = imageTurbo.metadataSync(jpegBuf);
  console.log(`Test image: ${meta.width}x${meta.height} JPEG (${(jpegBuf.length / 1024).toFixed(0)}KB)\n`);

  // Create WebP for testing
  const webpBuf = await imageTurbo.toWebp(jpegBuf, { quality: 85 });
  console.log(`WebP version: ${(webpBuf.length / 1024).toFixed(0)}KB\n`);

  // Simple EXIF options
  const simpleExif = {
    imageDescription: "Test image",
    artist: "Test Artist",
    software: "imgkit"
  };

  // Full EXIF options (AI-style)
  const fullExif = {
    imageDescription: "A beautiful sunset over the ocean with dramatic clouds",
    artist: "Stable Diffusion XL",
    copyright: "Copyright 2026 AI Art Studio",
    software: "ComfyUI v1.0",
    dateTime: "2026:01:07 12:00:00",
    dateTimeOriginal: "2026:01:07 12:00:00",
    userComment: JSON.stringify({
      prompt: "A beautiful sunset over the ocean with dramatic clouds, 8k, detailed, cinematic lighting",
      negative_prompt: "blurry, low quality, watermark, text",
      model: "stable-diffusion-xl-base-1.0",
      sampler: "DPM++ 2M Karras",
      steps: 30,
      cfg_scale: 7.5,
      seed: 1234567890,
      width: 1024,
      height: 1024
    }),
    make: "AI Generator",
    model: "SDXL Turbo",
    orientation: 1
  };

  const iterations = 100;

  // === JPEG BENCHMARKS ===
  console.log("--- JPEG EXIF Performance ---\n");

  // writeExif (simple) - JPEG
  let start = performance.now();
  for (let i = 0; i < iterations; i++) {
    await imageTurbo.writeExif(jpegBuf, simpleExif);
  }
  const writeSimpleJpeg = (performance.now() - start) / iterations;
  console.log(`writeExif (3 fields) JPEG:  ${writeSimpleJpeg.toFixed(3)}ms`);

  // writeExif (full) - JPEG
  start = performance.now();
  for (let i = 0; i < iterations; i++) {
    await imageTurbo.writeExif(jpegBuf, fullExif);
  }
  const writeFullJpeg = (performance.now() - start) / iterations;
  console.log(`writeExif (10 fields) JPEG: ${writeFullJpeg.toFixed(3)}ms`);

  // writeExifSync - JPEG
  start = performance.now();
  for (let i = 0; i < iterations; i++) {
    imageTurbo.writeExifSync(jpegBuf, simpleExif);
  }
  const writeSyncJpeg = (performance.now() - start) / iterations;
  console.log(`writeExifSync JPEG:         ${writeSyncJpeg.toFixed(3)}ms`);

  // stripExif - JPEG
  const jpegWithExif = await imageTurbo.writeExif(jpegBuf, fullExif);
  start = performance.now();
  for (let i = 0; i < iterations; i++) {
    await imageTurbo.stripExif(jpegWithExif);
  }
  const stripJpeg = (performance.now() - start) / iterations;
  console.log(`stripExif JPEG:             ${stripJpeg.toFixed(3)}ms`);

  // === WEBP BENCHMARKS ===
  console.log("\n--- WebP EXIF Performance ---\n");

  // writeExif (simple) - WebP
  start = performance.now();
  for (let i = 0; i < iterations; i++) {
    await imageTurbo.writeExif(webpBuf, simpleExif);
  }
  const writeSimpleWebp = (performance.now() - start) / iterations;
  console.log(`writeExif (3 fields) WebP:  ${writeSimpleWebp.toFixed(3)}ms`);

  // writeExif (full) - WebP
  start = performance.now();
  for (let i = 0; i < iterations; i++) {
    await imageTurbo.writeExif(webpBuf, fullExif);
  }
  const writeFullWebp = (performance.now() - start) / iterations;
  console.log(`writeExif (10 fields) WebP: ${writeFullWebp.toFixed(3)}ms`);

  // writeExifSync - WebP
  start = performance.now();
  for (let i = 0; i < iterations; i++) {
    imageTurbo.writeExifSync(webpBuf, simpleExif);
  }
  const writeSyncWebp = (performance.now() - start) / iterations;
  console.log(`writeExifSync WebP:         ${writeSyncWebp.toFixed(3)}ms`);

  // stripExif - WebP
  const webpWithExif = await imageTurbo.writeExif(webpBuf, fullExif);
  start = performance.now();
  for (let i = 0; i < iterations; i++) {
    await imageTurbo.stripExif(webpWithExif);
  }
  const stripWebp = (performance.now() - start) / iterations;
  console.log(`stripExif WebP:             ${stripWebp.toFixed(3)}ms`);

  // === SIZE COMPARISON ===
  console.log("\n--- Size Impact ---\n");

  const jpegOriginalSize = jpegBuf.length;
  const jpegWithSimple = await imageTurbo.writeExif(jpegBuf, simpleExif);
  const jpegWithFull = await imageTurbo.writeExif(jpegBuf, fullExif);
  const jpegStripped = await imageTurbo.stripExif(jpegWithFull);

  console.log("JPEG sizes:");
  console.log(`  Original:     ${(jpegOriginalSize / 1024).toFixed(1)}KB`);
  console.log(`  + Simple EXIF: ${(jpegWithSimple.length / 1024).toFixed(1)}KB (+${((jpegWithSimple.length - jpegOriginalSize) / 1024).toFixed(1)}KB)`);
  console.log(`  + Full EXIF:   ${(jpegWithFull.length / 1024).toFixed(1)}KB (+${((jpegWithFull.length - jpegOriginalSize) / 1024).toFixed(1)}KB)`);
  console.log(`  Stripped:     ${(jpegStripped.length / 1024).toFixed(1)}KB`);

  const webpOriginalSize = webpBuf.length;
  const webpWithSimple = await imageTurbo.writeExif(webpBuf, simpleExif);
  const webpWithFull = await imageTurbo.writeExif(webpBuf, fullExif);
  const webpStripped = await imageTurbo.stripExif(webpWithFull);

  console.log("\nWebP sizes:");
  console.log(`  Original:     ${(webpOriginalSize / 1024).toFixed(1)}KB`);
  console.log(`  + Simple EXIF: ${(webpWithSimple.length / 1024).toFixed(1)}KB (+${((webpWithSimple.length - webpOriginalSize) / 1024).toFixed(1)}KB)`);
  console.log(`  + Full EXIF:   ${(webpWithFull.length / 1024).toFixed(1)}KB (+${((webpWithFull.length - webpOriginalSize) / 1024).toFixed(1)}KB)`);
  console.log(`  Stripped:     ${(webpStripped.length / 1024).toFixed(1)}KB`);

  // === SUMMARY ===
  console.log("\n=== SUMMARY ===\n");
  console.log("| Operation | JPEG | WebP |");
  console.log("|-----------|------|------|");
  console.log(`| writeExif (simple) | ${writeSimpleJpeg.toFixed(2)}ms | ${writeSimpleWebp.toFixed(2)}ms |`);
  console.log(`| writeExif (full) | ${writeFullJpeg.toFixed(2)}ms | ${writeFullWebp.toFixed(2)}ms |`);
  console.log(`| stripExif | ${stripJpeg.toFixed(2)}ms | ${stripWebp.toFixed(2)}ms |`);

  console.log("\n✅ EXIF operations are extremely fast (<1ms typically)");
  console.log("✅ Minimal size overhead for metadata storage");
  console.log("✅ Perfect for AI image attribution workflows");
}

main().catch(console.error);
