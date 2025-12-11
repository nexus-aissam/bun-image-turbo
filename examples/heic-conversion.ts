/**
 * HEIC Conversion Example
 *
 * This example demonstrates how to work with HEIC/HEIF files
 * (commonly used by iPhones) using bun-image-turbo.
 */

import {
  metadata,
  toJpeg,
  toPng,
  toWebp,
  resize,
  transform,
} from "../src/index";

async function main() {
  // Example: Read a HEIC file
  // Default to the benchmark HEIC file if no argument provided
  const heicPath = process.argv[2] || "./benchmarks/heic/image.heic";

  console.log(`\n📱 HEIC Conversion Demo`);
  console.log(`========================\n`);

  try {
    const file = Bun.file(heicPath);

    if (!(await file.exists())) {
      console.log(`⚠️  File not found: ${heicPath}`);
      console.log(
        `\nUsage: bun run examples/heic-conversion.ts <path-to-heic-file>`
      );
      console.log(`\nExample:`);
      console.log(
        `  bun run examples/heic-conversion.ts ~/Pictures/IMG_1234.HEIC`
      );
      return;
    }

    const heicBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(heicBuffer);

    // 1. Get metadata
    console.log("📊 Getting metadata...");
    const info = await metadata(buffer);
    console.log(`   Format: ${info.format}`);
    console.log(`   Dimensions: ${info.width}x${info.height}`);
    console.log(`   Channels: ${info.channels}`);
    console.log(`   Has Alpha: ${info.hasAlpha}`);
    console.log(`   Bit Depth: ${info.bitsPerSample}`);

    // 2. Convert to JPEG
    console.log("\n🔄 Converting to JPEG...");
    const jpeg = await toJpeg(buffer, { quality: 90 });
    await Bun.write("output.jpg", jpeg);
    console.log(
      `   ✅ Saved: output.jpg (${(jpeg.length / 1024).toFixed(1)} KB)`
    );

    // 3. Convert to PNG
    console.log("\n🔄 Converting to PNG...");
    const png = await toPng(buffer);
    await Bun.write("output.png", png);
    console.log(
      `   ✅ Saved: output.png (${(png.length / 1024).toFixed(1)} KB)`
    );

    // 4. Convert to WebP
    console.log("\n🔄 Converting to WebP...");
    const webp = await toWebp(buffer, { quality: 85 });
    await Bun.write("output.webp", webp);
    console.log(
      `   ✅ Saved: output.webp (${(webp.length / 1024).toFixed(1)} KB)`
    );

    // 5. Create thumbnail
    console.log("\n🖼️  Creating thumbnail...");
    const thumbnail = await resize(buffer, { width: 200 });
    const thumbJpeg = await toJpeg(thumbnail, { quality: 80 });
    await Bun.write("thumbnail.jpg", thumbJpeg);
    const thumbInfo = await metadata(thumbnail);
    console.log(
      `   ✅ Saved: thumbnail.jpg (${thumbInfo.width}x${thumbInfo.height})`
    );

    // 6. Full transform pipeline
    console.log("\n🎨 Applying transformations...");
    const transformed = await transform(buffer, {
      resize: { width: 800 },
      grayscale: true,
      sharpen: 10,
      output: { format: "webp", webp: { quality: 80 } },
    });
    await Bun.write("transformed.webp", transformed);
    console.log(`   ✅ Saved: transformed.webp (grayscale, sharpened)`);

    console.log("\n✨ Done! All conversions complete.\n");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main();
