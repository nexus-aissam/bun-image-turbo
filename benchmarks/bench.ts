/**
 * bun-image-turbo Benchmarks
 *
 * Comprehensive performance comparison against sharp
 *
 * Run with: bun run benchmarks/bench.ts
 */

// Our package
import * as imageTurbo from "../src/index";

// Competitor (install with: bun add sharp)
let sharp: typeof import("sharp") | null = null;
try {
  sharp = require("sharp");
} catch {
  console.log("⚠️  sharp package not installed. Run: bun add sharp");
  console.log("   Skipping comparison benchmarks.\n");
}

// Test image sizes
const SIZES = {
  small: { width: 100, height: 100 },
  medium: { width: 800, height: 600 },
  large: { width: 1920, height: 1080 },
  xlarge: { width: 3840, height: 2160 },
};

const ITERATIONS = 50;
const CONCURRENT_OPS = 50;

interface BenchResult {
  name: string;
  ops: number;
  avgMs: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
}

// Create a test PNG image using sharp (for benchmarking both libs with same input)
async function createTestImage(width: number, height: number): Promise<Buffer> {
  // Create raw pixel data (RGB gradient)
  const channels = 3;
  const pixels = Buffer.alloc(width * height * channels);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      pixels[idx] = Math.floor((x / width) * 255); // R
      pixels[idx + 1] = Math.floor((y / height) * 255); // G
      pixels[idx + 2] = 128; // B
    }
  }

  // Use sharp to create a valid PNG (since it's installed for benchmarking)
  if (sharp) {
    return sharp!(pixels, {
      raw: { width, height, channels },
    })
      .png()
      .toBuffer();
  }

  // Fallback: create a minimal valid PNG manually
  // This is a simplified PNG generator for the gradient
  return createMinimalPng(width, height, pixels);
}

// Minimal PNG generator (fallback if sharp not available)
function createMinimalPng(
  width: number,
  height: number,
  pixels: Buffer
): Buffer {
  // For simplicity, use BMP as fallback (bun-image-turbo supports it)
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const imageSize = rowSize * height;
  const fileSize = 54 + imageSize;

  const buffer = Buffer.alloc(fileSize);

  // BMP Header
  buffer.write("BM", 0);
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
  buffer.writeInt32LE(2835, 38);
  buffer.writeInt32LE(2835, 42);
  buffer.writeUInt32LE(0, 46);
  buffer.writeUInt32LE(0, 50);

  // Copy pixel data (BGR format for BMP, bottom-up)
  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 3;
      buffer[offset++] = pixels[srcIdx + 2]; // B
      buffer[offset++] = pixels[srcIdx + 1]; // G
      buffer[offset++] = pixels[srcIdx]; // R
    }
    // Padding
    while ((offset - 54) % 4 !== 0) {
      buffer[offset++] = 0;
    }
  }

  return buffer;
}

async function benchmark(
  name: string,
  fn: () => Promise<void>,
  iterations: number
): Promise<BenchResult> {
  // Warmup
  for (let i = 0; i < 3; i++) {
    await fn();
  }

  const times: number[] = [];
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    const iterStart = performance.now();
    await fn();
    times.push(performance.now() - iterStart);
  }

  const totalMs = performance.now() - start;
  const avgMs = totalMs / iterations;
  const ops = 1000 / avgMs;
  const minMs = Math.min(...times);
  const maxMs = Math.max(...times);

  return { name, ops, avgMs, totalMs, minMs, maxMs };
}

function benchmarkSync(
  name: string,
  fn: () => void,
  iterations: number
): BenchResult {
  // Warmup
  for (let i = 0; i < 3; i++) {
    fn();
  }

  const times: number[] = [];
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    const iterStart = performance.now();
    fn();
    times.push(performance.now() - iterStart);
  }

  const totalMs = performance.now() - start;
  const avgMs = totalMs / iterations;
  const ops = 1000 / avgMs;
  const minMs = Math.min(...times);
  const maxMs = Math.max(...times);

  return { name, ops, avgMs, totalMs, minMs, maxMs };
}

function formatResult(result: BenchResult): string {
  return (
    `${result.name.padEnd(40)} ` +
    `${result.avgMs.toFixed(2).padStart(8)} ms/op  ` +
    `${result.ops.toFixed(2).padStart(8)} ops/sec  ` +
    `(min: ${result.minMs.toFixed(2)}ms, max: ${result.maxMs.toFixed(2)}ms)`
  );
}

function formatComparison(ours: BenchResult, theirs: BenchResult): string {
  const speedup = theirs.avgMs / ours.avgMs;
  const faster = speedup > 1;
  const emoji = faster ? "🚀" : "🐢";
  const comparison = faster
    ? `${speedup.toFixed(2)}x faster`
    : `${(1 / speedup).toFixed(2)}x slower`;
  return `${emoji} bun-image-turbo is ${comparison} than sharp`;
}

async function main() {
  console.log("=".repeat(80));
  console.log("                    bun-image-turbo Benchmarks");
  console.log("=".repeat(80));
  console.log(`Platform: ${process.platform}-${process.arch}`);
  console.log(`Runtime: Bun ${Bun.version}`);
  console.log(`Iterations: ${ITERATIONS}`);
  console.log(`Concurrent Operations: ${CONCURRENT_OPS}`);
  console.log("=".repeat(80));

  // Create test images
  console.log("\n📦 Creating test images...");
  const testImages = {
    small: await createTestImage(SIZES.small.width, SIZES.small.height),
    medium: await createTestImage(SIZES.medium.width, SIZES.medium.height),
    large: await createTestImage(SIZES.large.width, SIZES.large.height),
  };
  console.log("   Done!\n");

  const allResults: {
    category: string;
    results: BenchResult[];
    comparison?: string;
  }[] = [];

  // ============================================
  // METADATA
  // ============================================
  console.log("📊 Metadata Extraction\n");

  const metaResults: BenchResult[] = [];

  const turboMeta = benchmarkSync(
    "bun-image-turbo metadataSync()",
    () => {
      imageTurbo.metadataSync(testImages.medium);
    },
    ITERATIONS
  );
  metaResults.push(turboMeta);
  console.log(formatResult(turboMeta));

  if (sharp) {
    const sharpMeta = await benchmark(
      "sharp metadata()",
      async () => {
        await sharp!(testImages.medium).metadata();
      },
      ITERATIONS
    );
    metaResults.push(sharpMeta);
    console.log(formatResult(sharpMeta));
    console.log("\n" + formatComparison(turboMeta, sharpMeta));
    allResults.push({
      category: "Metadata",
      results: metaResults,
      comparison: formatComparison(turboMeta, sharpMeta),
    });
  } else {
    allResults.push({ category: "Metadata", results: metaResults });
  }

  // ============================================
  // RESIZE (Small -> Thumbnail)
  // ============================================
  console.log("\n📊 Resize: Medium (800x600) → Thumbnail (200x150)\n");

  const resizeSmallResults: BenchResult[] = [];

  const turboResizeSmall = await benchmark(
    "bun-image-turbo resize()",
    async () => {
      await imageTurbo.resize(testImages.medium, { width: 200, height: 150 });
    },
    ITERATIONS
  );
  resizeSmallResults.push(turboResizeSmall);
  console.log(formatResult(turboResizeSmall));

  if (sharp) {
    const sharpResizeSmall = await benchmark(
      "sharp resize()",
      async () => {
        await sharp!(testImages.medium).resize(200, 150).toBuffer();
      },
      ITERATIONS
    );
    resizeSmallResults.push(sharpResizeSmall);
    console.log(formatResult(sharpResizeSmall));
    console.log("\n" + formatComparison(turboResizeSmall, sharpResizeSmall));
    allResults.push({
      category: "Resize (Thumbnail)",
      results: resizeSmallResults,
      comparison: formatComparison(turboResizeSmall, sharpResizeSmall),
    });
  } else {
    allResults.push({
      category: "Resize (Thumbnail)",
      results: resizeSmallResults,
    });
  }

  // ============================================
  // RESIZE (Large)
  // ============================================
  console.log("\n📊 Resize: Large (1920x1080) → Medium (800x600)\n");

  const resizeLargeResults: BenchResult[] = [];

  const turboResizeLarge = await benchmark(
    "bun-image-turbo resize()",
    async () => {
      await imageTurbo.resize(testImages.large, { width: 800, height: 600 });
    },
    ITERATIONS
  );
  resizeLargeResults.push(turboResizeLarge);
  console.log(formatResult(turboResizeLarge));

  if (sharp) {
    const sharpResizeLarge = await benchmark(
      "sharp resize()",
      async () => {
        await sharp!(testImages.large).resize(800, 600).toBuffer();
      },
      ITERATIONS
    );
    resizeLargeResults.push(sharpResizeLarge);
    console.log(formatResult(sharpResizeLarge));
    console.log("\n" + formatComparison(turboResizeLarge, sharpResizeLarge));
    allResults.push({
      category: "Resize (Large)",
      results: resizeLargeResults,
      comparison: formatComparison(turboResizeLarge, sharpResizeLarge),
    });
  } else {
    allResults.push({
      category: "Resize (Large)",
      results: resizeLargeResults,
    });
  }

  // ============================================
  // CONVERT TO JPEG
  // ============================================
  console.log("\n📊 Convert to JPEG (quality: 80)\n");

  const jpegResults: BenchResult[] = [];

  const turboJpeg = await benchmark(
    "bun-image-turbo toJpeg()",
    async () => {
      await imageTurbo.toJpeg(testImages.medium, { quality: 80 });
    },
    ITERATIONS
  );
  jpegResults.push(turboJpeg);
  console.log(formatResult(turboJpeg));

  if (sharp) {
    const sharpJpeg = await benchmark(
      "sharp jpeg()",
      async () => {
        await sharp!(testImages.medium).jpeg({ quality: 80 }).toBuffer();
      },
      ITERATIONS
    );
    jpegResults.push(sharpJpeg);
    console.log(formatResult(sharpJpeg));
    console.log("\n" + formatComparison(turboJpeg, sharpJpeg));
    allResults.push({
      category: "JPEG Encode",
      results: jpegResults,
      comparison: formatComparison(turboJpeg, sharpJpeg),
    });
  } else {
    allResults.push({ category: "JPEG Encode", results: jpegResults });
  }

  // ============================================
  // CONVERT TO PNG
  // ============================================
  console.log("\n📊 Convert to PNG\n");

  const pngResults: BenchResult[] = [];

  const turboPng = await benchmark(
    "bun-image-turbo toPng()",
    async () => {
      await imageTurbo.toPng(testImages.medium);
    },
    ITERATIONS
  );
  pngResults.push(turboPng);
  console.log(formatResult(turboPng));

  if (sharp) {
    const sharpPng = await benchmark(
      "sharp png()",
      async () => {
        await sharp!(testImages.medium).png().toBuffer();
      },
      ITERATIONS
    );
    pngResults.push(sharpPng);
    console.log(formatResult(sharpPng));
    console.log("\n" + formatComparison(turboPng, sharpPng));
    allResults.push({
      category: "PNG Encode",
      results: pngResults,
      comparison: formatComparison(turboPng, sharpPng),
    });
  } else {
    allResults.push({ category: "PNG Encode", results: pngResults });
  }

  // ============================================
  // CONVERT TO WEBP
  // ============================================
  console.log("\n📊 Convert to WebP (quality: 80)\n");

  const webpResults: BenchResult[] = [];

  const turboWebp = await benchmark(
    "bun-image-turbo toWebp()",
    async () => {
      await imageTurbo.toWebp(testImages.medium, { quality: 80 });
    },
    ITERATIONS
  );
  webpResults.push(turboWebp);
  console.log(formatResult(turboWebp));

  if (sharp) {
    const sharpWebp = await benchmark(
      "sharp webp()",
      async () => {
        await sharp!(testImages.medium).webp({ quality: 80 }).toBuffer();
      },
      ITERATIONS
    );
    webpResults.push(sharpWebp);
    console.log(formatResult(sharpWebp));
    console.log("\n" + formatComparison(turboWebp, sharpWebp));
    allResults.push({
      category: "WebP Encode",
      results: webpResults,
      comparison: formatComparison(turboWebp, sharpWebp),
    });
  } else {
    allResults.push({ category: "WebP Encode", results: webpResults });
  }

  // ============================================
  // TRANSFORM (Multiple Operations)
  // ============================================
  console.log("\n📊 Transform Pipeline (resize + rotate + grayscale)\n");

  const transformResults: BenchResult[] = [];

  const turboTransform = await benchmark(
    "bun-image-turbo transform()",
    async () => {
      await imageTurbo.transform(testImages.medium, {
        resize: { width: 400, height: 300 },
        rotate: 90,
        grayscale: true,
        output: { format: "jpeg", jpeg: { quality: 80 } },
      });
    },
    ITERATIONS
  );
  transformResults.push(turboTransform);
  console.log(formatResult(turboTransform));

  if (sharp) {
    const sharpTransform = await benchmark(
      "sharp pipeline()",
      async () => {
        await sharp!(testImages.medium)
          .resize(400, 300)
          .rotate(90)
          .grayscale()
          .jpeg({ quality: 80 })
          .toBuffer();
      },
      ITERATIONS
    );
    transformResults.push(sharpTransform);
    console.log(formatResult(sharpTransform));
    console.log("\n" + formatComparison(turboTransform, sharpTransform));
    allResults.push({
      category: "Transform Pipeline",
      results: transformResults,
      comparison: formatComparison(turboTransform, sharpTransform),
    });
  } else {
    allResults.push({
      category: "Transform Pipeline",
      results: transformResults,
    });
  }

  // ============================================
  // BLURHASH
  // ============================================
  console.log("\n📊 Blurhash Generation\n");

  const blurhashResults: BenchResult[] = [];

  const turboBlurhash = await benchmark(
    "bun-image-turbo blurhash()",
    async () => {
      await imageTurbo.blurhash(testImages.small, 4, 3);
    },
    ITERATIONS
  );
  blurhashResults.push(turboBlurhash);
  console.log(formatResult(turboBlurhash));
  allResults.push({ category: "Blurhash", results: blurhashResults });

  // ============================================
  // SYNC vs ASYNC
  // ============================================
  console.log("\n📊 Sync vs Async Comparison\n");

  const syncAsync: BenchResult[] = [];

  const turboSync = benchmarkSync(
    "bun-image-turbo resizeSync()",
    () => {
      imageTurbo.resizeSync(testImages.medium, { width: 200 });
    },
    ITERATIONS
  );
  syncAsync.push(turboSync);
  console.log(formatResult(turboSync));

  const turboAsync = await benchmark(
    "bun-image-turbo resize()",
    async () => {
      await imageTurbo.resize(testImages.medium, { width: 200 });
    },
    ITERATIONS
  );
  syncAsync.push(turboAsync);
  console.log(formatResult(turboAsync));

  // ============================================
  // STRESS TEST (Concurrent Operations)
  // ============================================
  console.log("\n📊 Stress Test (Concurrent Operations)\n");

  // bun-image-turbo stress test
  const stressStart = performance.now();
  const stressPromises = Array.from({ length: CONCURRENT_OPS }, (_, i) =>
    imageTurbo.resize(testImages.medium, { width: 200 + (i % 10) * 10 })
  );
  await Promise.all(stressPromises);
  const turboStressTime = performance.now() - stressStart;
  const turboStressThroughput = (CONCURRENT_OPS / turboStressTime) * 1000;
  console.log(
    `bun-image-turbo (${CONCURRENT_OPS} concurrent)`.padEnd(40) +
      `${turboStressTime.toFixed(2).padStart(8)} ms total  ` +
      `${turboStressThroughput.toFixed(2).padStart(8)} ops/sec`
  );

  if (sharp) {
    const sharpStressStart = performance.now();
    const sharpStressPromises = Array.from({ length: CONCURRENT_OPS }, (_, i) =>
      sharp!(testImages.medium)
        .resize(200 + (i % 10) * 10)
        .toBuffer()
    );
    await Promise.all(sharpStressPromises);
    const sharpStressTime = performance.now() - sharpStressStart;
    const sharpStressThroughput = (CONCURRENT_OPS / sharpStressTime) * 1000;
    console.log(
      `sharp (${CONCURRENT_OPS} concurrent)`.padEnd(40) +
        `${sharpStressTime.toFixed(2).padStart(8)} ms total  ` +
        `${sharpStressThroughput.toFixed(2).padStart(8)} ops/sec`
    );

    const stressSpeedup = sharpStressTime / turboStressTime;
    const stressFaster = stressSpeedup > 1;
    const stressEmoji = stressFaster ? "🚀" : "🐢";
    const stressComparison = stressFaster
      ? `${stressSpeedup.toFixed(2)}x faster`
      : `${(1 / stressSpeedup).toFixed(2)}x slower`;
    console.log(
      `\n${stressEmoji} bun-image-turbo is ${stressComparison} under stress`
    );
  }

  // ============================================
  // REAL-WORLD FILE TESTS
  // ============================================
  const testFiles = {
    // 1MB files
    "1mb_jpeg": "./benchmarks/1mb/1mb-jpg-example-file.jpg",
    "1mb_png": "./benchmarks/1mb/1mb-dummy-png-download.png",
    // 10MB files
    "10mb_jpeg": "./benchmarks/10mb/10mb-example-jpg.jpg",
    "10mb_png": "./benchmarks/10mb/11mb.png",
    "10mb_webp": "./benchmarks/10mb/10mb.webp",
    "10mb_bmp": "./benchmarks/10mb/10mb.bmp",
  };

  const loadedFiles: Record<string, Buffer> = {};

  // Load all test files
  console.log("\n📦 Loading real-world test files...");
  for (const [name, path] of Object.entries(testFiles)) {
    try {
      const file = Bun.file(path);
      if (await file.exists()) {
        loadedFiles[name] = Buffer.from(await file.arrayBuffer());
        console.log(
          `   ✓ ${name}: ${(loadedFiles[name].length / 1024 / 1024).toFixed(
            2
          )} MB`
        );
      }
    } catch (e) {
      // Skip missing files
    }
  }

  // ============================================
  // 1MB FILE TESTS
  // ============================================
  if (loadedFiles["1mb_jpeg"]) {
    console.log(`\n${"=".repeat(80)}`);
    console.log("                    1MB JPEG Tests");
    console.log("=".repeat(80));

    const jpeg1mb = loadedFiles["1mb_jpeg"];

    // Metadata
    console.log("\n📊 Metadata (1MB JPEG)\n");
    const turbo1mbMeta = benchmarkSync(
      "bun-image-turbo metadata",
      () => {
        imageTurbo.metadataSync(jpeg1mb);
      },
      50
    );
    console.log(formatResult(turbo1mbMeta));

    if (sharp) {
      const sharp1mbMeta = await benchmark(
        "sharp metadata",
        async () => {
          await sharp!(jpeg1mb).metadata();
        },
        50
      );
      console.log(formatResult(sharp1mbMeta));
      console.log("\n" + formatComparison(turbo1mbMeta, sharp1mbMeta));
    }

    // Resize
    console.log("\n📊 Resize 1MB JPEG → 800px\n");
    const turbo1mbResize = await benchmark(
      "bun-image-turbo resize",
      async () => {
        await imageTurbo.resize(jpeg1mb, { width: 800 });
      },
      20
    );
    console.log(formatResult(turbo1mbResize));

    if (sharp) {
      const sharp1mbResize = await benchmark(
        "sharp resize",
        async () => {
          await sharp!(jpeg1mb).resize(800).toBuffer();
        },
        20
      );
      console.log(formatResult(sharp1mbResize));
      console.log("\n" + formatComparison(turbo1mbResize, sharp1mbResize));
    }

    // Transform pipeline
    console.log("\n📊 Transform Pipeline (1MB JPEG)\n");
    const turbo1mbTransform = await benchmark(
      "bun-image-turbo transform",
      async () => {
        await imageTurbo.transform(jpeg1mb, {
          resize: { width: 600 },
          grayscale: true,
          output: { format: "webp", webp: { quality: 80 } },
        });
      },
      20
    );
    console.log(formatResult(turbo1mbTransform));

    if (sharp) {
      const sharp1mbTransform = await benchmark(
        "sharp transform",
        async () => {
          await sharp!(jpeg1mb)
            .resize(600)
            .grayscale()
            .webp({ quality: 80 })
            .toBuffer();
        },
        20
      );
      console.log(formatResult(sharp1mbTransform));
      console.log(
        "\n" + formatComparison(turbo1mbTransform, sharp1mbTransform)
      );
    }
  }

  // ============================================
  // 1MB PNG TESTS
  // ============================================
  if (loadedFiles["1mb_png"]) {
    console.log(`\n${"=".repeat(80)}`);
    console.log("                    1MB PNG Tests");
    console.log("=".repeat(80));

    const png1mb = loadedFiles["1mb_png"];

    // Metadata
    console.log("\n📊 Metadata (1MB PNG)\n");
    const turboPngMeta = benchmarkSync(
      "bun-image-turbo metadata",
      () => {
        imageTurbo.metadataSync(png1mb);
      },
      50
    );
    console.log(formatResult(turboPngMeta));

    if (sharp) {
      const sharpPngMeta = await benchmark(
        "sharp metadata",
        async () => {
          await sharp!(png1mb).metadata();
        },
        50
      );
      console.log(formatResult(sharpPngMeta));
      console.log("\n" + formatComparison(turboPngMeta, sharpPngMeta));
    }

    // Resize
    console.log("\n📊 Resize 1MB PNG → 400px\n");
    const turboPngResize = await benchmark(
      "bun-image-turbo resize",
      async () => {
        await imageTurbo.resize(png1mb, { width: 400 });
      },
      20
    );
    console.log(formatResult(turboPngResize));

    if (sharp) {
      const sharpPngResize = await benchmark(
        "sharp resize",
        async () => {
          await sharp!(png1mb).resize(400).toBuffer();
        },
        20
      );
      console.log(formatResult(sharpPngResize));
      console.log("\n" + formatComparison(turboPngResize, sharpPngResize));
    }
  }

  // ============================================
  // 10MB JPEG TESTS
  // ============================================
  if (loadedFiles["10mb_jpeg"]) {
    console.log(`\n${"=".repeat(80)}`);
    console.log("                    10MB JPEG Tests");
    console.log("=".repeat(80));

    const jpeg10mb = loadedFiles["10mb_jpeg"];

    // Metadata
    console.log("\n📊 Metadata (10MB JPEG)\n");
    const turbo10mbMeta = benchmarkSync(
      "bun-image-turbo metadata",
      () => {
        imageTurbo.metadataSync(jpeg10mb);
      },
      50
    );
    console.log(formatResult(turbo10mbMeta));

    if (sharp) {
      const sharp10mbMeta = await benchmark(
        "sharp metadata",
        async () => {
          await sharp!(jpeg10mb).metadata();
        },
        50
      );
      console.log(formatResult(sharp10mbMeta));
      console.log("\n" + formatComparison(turbo10mbMeta, sharp10mbMeta));
    }

    // Resize
    console.log("\n📊 Resize 10MB JPEG → 800px\n");
    const turbo10mbResize = await benchmark(
      "bun-image-turbo resize",
      async () => {
        await imageTurbo.resize(jpeg10mb, { width: 800 });
      },
      10
    );
    console.log(formatResult(turbo10mbResize));

    if (sharp) {
      const sharp10mbResize = await benchmark(
        "sharp resize",
        async () => {
          await sharp!(jpeg10mb).resize(800).toBuffer();
        },
        10
      );
      console.log(formatResult(sharp10mbResize));
      console.log("\n" + formatComparison(turbo10mbResize, sharp10mbResize));
    }

    // To WebP
    console.log("\n📊 Convert 10MB JPEG → WebP\n");
    const turbo10mbWebp = await benchmark(
      "bun-image-turbo toWebp",
      async () => {
        await imageTurbo.toWebp(jpeg10mb, { quality: 80 });
      },
      3
    );
    console.log(formatResult(turbo10mbWebp));

    if (sharp) {
      const sharp10mbWebp = await benchmark(
        "sharp webp",
        async () => {
          await sharp!(jpeg10mb).webp({ quality: 80 }).toBuffer();
        },
        3
      );
      console.log(formatResult(sharp10mbWebp));
      console.log("\n" + formatComparison(turbo10mbWebp, sharp10mbWebp));
    }
  }

  // ============================================
  // 10MB PNG TESTS
  // ============================================
  if (loadedFiles["10mb_png"]) {
    console.log(`\n${"=".repeat(80)}`);
    console.log("                    10MB PNG Tests");
    console.log("=".repeat(80));

    const png10mb = loadedFiles["10mb_png"];

    // Metadata
    console.log("\n📊 Metadata (10MB PNG)\n");
    const turboPng10mbMeta = benchmarkSync(
      "bun-image-turbo metadata",
      () => {
        imageTurbo.metadataSync(png10mb);
      },
      50
    );
    console.log(formatResult(turboPng10mbMeta));

    if (sharp) {
      const sharpPng10mbMeta = await benchmark(
        "sharp metadata",
        async () => {
          await sharp!(png10mb).metadata();
        },
        50
      );
      console.log(formatResult(sharpPng10mbMeta));
      console.log("\n" + formatComparison(turboPng10mbMeta, sharpPng10mbMeta));
    }

    // Resize
    console.log("\n📊 Resize 10MB PNG → 800px\n");
    const turboPng10mbResize = await benchmark(
      "bun-image-turbo resize",
      async () => {
        await imageTurbo.resize(png10mb, { width: 800 });
      },
      5
    );
    console.log(formatResult(turboPng10mbResize));

    if (sharp) {
      const sharpPng10mbResize = await benchmark(
        "sharp resize",
        async () => {
          await sharp!(png10mb).resize(800).toBuffer();
        },
        5
      );
      console.log(formatResult(sharpPng10mbResize));
      console.log(
        "\n" + formatComparison(turboPng10mbResize, sharpPng10mbResize)
      );
    }
  }

  // ============================================
  // 10MB WEBP TESTS
  // ============================================
  if (loadedFiles["10mb_webp"]) {
    console.log(`\n${"=".repeat(80)}`);
    console.log("                    10MB WebP Tests");
    console.log("=".repeat(80));

    const webp10mb = loadedFiles["10mb_webp"];

    // Metadata
    console.log("\n📊 Metadata (10MB WebP)\n");
    const turboWebp10mbMeta = benchmarkSync(
      "bun-image-turbo metadata",
      () => {
        imageTurbo.metadataSync(webp10mb);
      },
      50
    );
    console.log(formatResult(turboWebp10mbMeta));

    if (sharp) {
      const sharpWebp10mbMeta = await benchmark(
        "sharp metadata",
        async () => {
          await sharp!(webp10mb).metadata();
        },
        50
      );
      console.log(formatResult(sharpWebp10mbMeta));
      console.log(
        "\n" + formatComparison(turboWebp10mbMeta, sharpWebp10mbMeta)
      );
    }

    // Resize
    console.log("\n📊 Resize 10MB WebP → 800px\n");
    const turboWebp10mbResize = await benchmark(
      "bun-image-turbo resize",
      async () => {
        await imageTurbo.resize(webp10mb, { width: 800 });
      },
      5
    );
    console.log(formatResult(turboWebp10mbResize));

    if (sharp) {
      const sharpWebp10mbResize = await benchmark(
        "sharp resize",
        async () => {
          await sharp!(webp10mb).resize(800).toBuffer();
        },
        5
      );
      console.log(formatResult(sharpWebp10mbResize));
      console.log(
        "\n" + formatComparison(turboWebp10mbResize, sharpWebp10mbResize)
      );
    }
  }

  // ============================================
  // HEIC TESTS
  // ============================================
  const heicFile = "./benchmarks/heic/image.heic";
  let heicBuffer: Buffer | null = null;

  try {
    const heicFileObj = Bun.file(heicFile);
    if (await heicFileObj.exists()) {
      heicBuffer = Buffer.from(await heicFileObj.arrayBuffer());
      console.log(`\n${"=".repeat(80)}`);
      console.log("                    HEIC Tests (iPhone Photo)");
      console.log("=".repeat(80));
      console.log(
        `   File size: ${(heicBuffer.length / 1024 / 1024).toFixed(2)} MB`
      );

      // HEIC Metadata
      console.log("\n📊 Metadata (HEIC)\n");
      const turboHeicMeta = benchmarkSync(
        "bun-image-turbo metadata",
        () => {
          imageTurbo.metadataSync(heicBuffer!);
        },
        50
      );
      console.log(formatResult(turboHeicMeta));

      // Show HEIC metadata details
      const heicInfo = imageTurbo.metadataSync(heicBuffer);
      console.log(
        `   → Format: ${heicInfo.format}, ${heicInfo.width}x${heicInfo.height}, ${heicInfo.channels} channels`
      );

      // HEIC to JPEG
      console.log("\n📊 Convert HEIC → JPEG\n");
      const turboHeicJpeg = await benchmark(
        "bun-image-turbo toJpeg",
        async () => {
          await imageTurbo.toJpeg(heicBuffer!, { quality: 85 });
        },
        20
      );
      console.log(formatResult(turboHeicJpeg));

      // HEIC to WebP
      console.log("\n📊 Convert HEIC → WebP\n");
      const turboHeicWebp = await benchmark(
        "bun-image-turbo toWebp",
        async () => {
          await imageTurbo.toWebp(heicBuffer!, { quality: 80 });
        },
        20
      );
      console.log(formatResult(turboHeicWebp));

      // HEIC Resize
      console.log("\n📊 Resize HEIC → 800px\n");
      const turboHeicResize = await benchmark(
        "bun-image-turbo resize",
        async () => {
          await imageTurbo.resize(heicBuffer!, { width: 800 });
        },
        20
      );
      console.log(formatResult(turboHeicResize));

      // HEIC Transform Pipeline
      console.log("\n📊 Transform HEIC (resize + grayscale → WebP)\n");
      const turboHeicTransform = await benchmark(
        "bun-image-turbo transform",
        async () => {
          await imageTurbo.transform(heicBuffer!, {
            resize: { width: 600 },
            grayscale: true,
            output: { format: "webp", webp: { quality: 80 } },
          });
        },
        20
      );
      console.log(formatResult(turboHeicTransform));

      // HEIC Blurhash
      console.log("\n📊 Blurhash from HEIC\n");
      const turboHeicBlurhash = await benchmark(
        "bun-image-turbo blurhash",
        async () => {
          await imageTurbo.blurhash(heicBuffer!, 4, 3);
        },
        10
      );
      console.log(formatResult(turboHeicBlurhash));

      // HEIC Thumbnail generation (common use case)
      console.log("\n📊 Generate Thumbnail from HEIC (200px)\n");
      const turboHeicThumb = await benchmark(
        "bun-image-turbo thumbnail",
        async () => {
          const resized = await imageTurbo.resize(heicBuffer!, { width: 200 });
          await imageTurbo.toJpeg(resized, { quality: 80 });
        },
        20
      );
      console.log(formatResult(turboHeicThumb));

      console.log(
        "\n✨ HEIC support: Native decoding via libheif (no sharp equivalent)"
      );
    }
  } catch (e) {
    console.log("\n⚠️  HEIC test file not found, skipping HEIC benchmarks");
  }

  // ============================================
  // MEMORY STRESS TEST
  // ============================================
  console.log("\n📊 Memory Stress Test (Large Images)\n");

  const memoryStressStart = performance.now();
  for (let i = 0; i < 20; i++) {
    await imageTurbo.resize(testImages.large, { width: 400 });
  }
  const memoryStressTime = performance.now() - memoryStressStart;
  console.log(
    `bun-image-turbo (20x large resize)`.padEnd(40) +
      `${memoryStressTime.toFixed(2).padStart(8)} ms total  ` +
      `${((20 / memoryStressTime) * 1000).toFixed(2).padStart(8)} ops/sec`
  );

  if (sharp) {
    const sharpMemoryStart = performance.now();
    for (let i = 0; i < 20; i++) {
      await sharp!(testImages.large).resize(400).toBuffer();
    }
    const sharpMemoryTime = performance.now() - sharpMemoryStart;
    console.log(
      `sharp (20x large resize)`.padEnd(40) +
        `${sharpMemoryTime.toFixed(2).padStart(8)} ms total  ` +
        `${((20 / sharpMemoryTime) * 1000).toFixed(2).padStart(8)} ops/sec`
    );

    const memSpeedup = sharpMemoryTime / memoryStressTime;
    const memFaster = memSpeedup > 1;
    console.log(
      `\n${memFaster ? "🚀" : "🐢"} bun-image-turbo is ${
        memFaster
          ? memSpeedup.toFixed(2) + "x faster"
          : (1 / memSpeedup).toFixed(2) + "x slower"
      } with large images`
    );
  }

  // ============================================
  // SUMMARY TABLE
  // ============================================
  console.log("\n" + "=".repeat(80));
  console.log("                              Summary");
  console.log("=".repeat(80));

  console.log("\n| Operation | bun-image-turbo | sharp | Difference |");
  console.log("|-----------|-----------------|-------|------------|");

  for (const { category, results } of allResults) {
    const turboResult = results[0];
    const sharpResult = results[1];

    if (sharpResult) {
      const speedup = sharpResult.avgMs / turboResult.avgMs;
      const diff =
        speedup > 1
          ? `**${speedup.toFixed(2)}x faster**`
          : `${(1 / speedup).toFixed(2)}x slower`;
      console.log(
        `| ${category.padEnd(17)} | ${turboResult.avgMs
          .toFixed(2)
          .padStart(13)} ms | ${sharpResult.avgMs
          .toFixed(2)
          .padStart(5)} ms | ${diff.padStart(18)} |`
      );
    } else {
      console.log(
        `| ${category.padEnd(17)} | ${turboResult.avgMs
          .toFixed(2)
          .padStart(13)} ms | ${"N/A".padStart(5)} | ${"-".padStart(18)} |`
      );
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("Benchmark completed!");
  console.log("=".repeat(80));
}

main().catch(console.error);
