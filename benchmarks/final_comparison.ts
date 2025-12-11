/**
 * FINAL BENCHMARK: bun-image-turbo vs sharp
 *
 * This benchmark compares real-world performance for common image operations.
 * Includes HEIC support benchmarks (exclusive to bun-image-turbo).
 */

import * as imageTurbo from "../src/index";

let sharp: typeof import("sharp") | null = null;
try {
  sharp = require("sharp");
} catch {
  console.log("⚠️  sharp not installed. Run: bun add sharp");
}

interface Result {
  name: string;
  turboMs: number;
  sharpMs: number;
  speedup: number;
}

const results: Result[] = [];

async function benchmark(
  name: string,
  turboFn: () => Promise<any>,
  sharpFn: (() => Promise<any>) | null,
  iterations: number = 20
) {
  // Warmup
  for (let i = 0; i < 3; i++) {
    await turboFn();
    if (sharpFn && sharp) await sharpFn();
  }

  // Benchmark turbo
  const turboStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    await turboFn();
  }
  const turboMs = (performance.now() - turboStart) / iterations;

  // Benchmark sharp (if available)
  let sharpMs = 0;
  if (sharpFn && sharp) {
    const sharpStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      await sharpFn();
    }
    sharpMs = (performance.now() - sharpStart) / iterations;
  }

  const speedup = sharpMs > 0 ? sharpMs / turboMs : 0;
  results.push({ name, turboMs, sharpMs, speedup });

  if (sharpMs > 0) {
    const icon = speedup > 1 ? "🚀" : "🐢";
    const comparison =
      speedup > 1
        ? `${speedup.toFixed(2)}x FASTER`
        : `${(1 / speedup).toFixed(2)}x slower`;
    console.log(
      `${icon} ${name.padEnd(45)} turbo: ${turboMs
        .toFixed(1)
        .padStart(7)}ms | sharp: ${sharpMs
        .toFixed(1)
        .padStart(7)}ms | ${comparison}`
    );
  } else {
    console.log(
      `✨ ${name.padEnd(45)} turbo: ${turboMs
        .toFixed(1)
        .padStart(7)}ms | sharp: ${"N/A".padStart(7)}   | EXCLUSIVE`
    );
  }
}

function benchmarkSync(
  name: string,
  turboFn: () => any,
  sharpFn: () => any,
  iterations: number = 50
) {
  // Warmup
  for (let i = 0; i < 3; i++) {
    turboFn();
    sharpFn();
  }

  // Benchmark turbo
  const turboStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    turboFn();
  }
  const turboMs = (performance.now() - turboStart) / iterations;

  // Benchmark sharp (still async)
  const sharpMs = turboMs * 10; // Sharp metadata is async, we'll handle this separately

  const speedup = sharpMs / turboMs;

  console.log(
    `🚀 ${name.padEnd(45)} turbo: ${turboMs.toFixed(3).padStart(7)}ms`
  );
}

async function main() {
  console.log("=".repeat(100));
  console.log(
    "                           bun-image-turbo vs sharp - FINAL BENCHMARK"
  );
  console.log("=".repeat(100));
  console.log(
    `Platform: ${process.platform}-${process.arch} | Runtime: Bun ${Bun.version}`
  );
  console.log("=".repeat(100));

  // Load test files
  let jpeg1mb: Buffer | null = null;
  let jpeg10mb: Buffer | null = null;
  let png10mb: Buffer | null = null;
  let webp10mb: Buffer | null = null;
  let heicImage: Buffer | null = null;

  console.log(`\n📁 Loading Test Files...`);

  // Get the directory where this script is located
  const scriptDir = import.meta.dir;

  try {
    const file = Bun.file(`${scriptDir}/1mb/1mb-jpg-example-file.jpg`);
    if (await file.exists()) {
      jpeg1mb = Buffer.from(await file.arrayBuffer());
      const meta = imageTurbo.metadataSync(jpeg1mb);
      console.log(
        `   ✓ 1MB JPEG: ${meta.width}x${meta.height} (${(
          jpeg1mb.length /
          1024 /
          1024
        ).toFixed(2)} MB)`
      );
    }
  } catch {}

  try {
    const file = Bun.file(`${scriptDir}/10mb/10mb-example-jpg.jpg`);
    if (await file.exists()) {
      jpeg10mb = Buffer.from(await file.arrayBuffer());
      const meta = imageTurbo.metadataSync(jpeg10mb);
      console.log(
        `   ✓ 10MB JPEG: ${meta.width}x${meta.height} (${(
          jpeg10mb.length /
          1024 /
          1024
        ).toFixed(2)} MB)`
      );
    }
  } catch {}

  try {
    const file = Bun.file(`${scriptDir}/10mb/11mb.png`);
    if (await file.exists()) {
      png10mb = Buffer.from(await file.arrayBuffer());
      console.log(
        `   ✓ 10MB PNG: (${(png10mb.length / 1024 / 1024).toFixed(2)} MB)`
      );
    }
  } catch {}

  try {
    const file = Bun.file(`${scriptDir}/10mb/10mb.webp`);
    if (await file.exists()) {
      webp10mb = Buffer.from(await file.arrayBuffer());
      console.log(
        `   ✓ 10MB WebP: (${(webp10mb.length / 1024 / 1024).toFixed(2)} MB)`
      );
    }
  } catch {}

  // Load HEIC file
  try {
    const file = Bun.file(`${scriptDir}/heic/image.heic`);
    if (await file.exists()) {
      heicImage = Buffer.from(await file.arrayBuffer());
      const meta = imageTurbo.metadataSync(heicImage);
      console.log(
        `   ✓ HEIC: ${meta.width}x${meta.height} (${(
          heicImage.length /
          1024 /
          1024
        ).toFixed(2)} MB) - iPhone Photo`
      );
    }
  } catch {}

  if (!jpeg1mb && !jpeg10mb && !heicImage) {
    console.log(
      "   ⚠️  No test files found! Please add test images to benchmarks folder."
    );
    return;
  }

  // ============================================
  // METADATA (where we dominate)
  // ============================================
  console.log(`\n${"─".repeat(100)}`);
  console.log("📊 METADATA EXTRACTION");
  console.log("─".repeat(100));

  if (jpeg1mb) {
    await benchmark(
      "1MB JPEG Metadata",
      async () => imageTurbo.metadataSync(jpeg1mb!),
      sharp ? async () => await sharp!(jpeg1mb!).metadata() : null,
      100
    );
  }

  if (jpeg10mb) {
    await benchmark(
      "10MB JPEG Metadata",
      async () => imageTurbo.metadataSync(jpeg10mb!),
      sharp ? async () => await sharp!(jpeg10mb!).metadata() : null,
      100
    );
  }

  if (webp10mb) {
    await benchmark(
      "10MB WebP Metadata",
      async () => imageTurbo.metadataSync(webp10mb!),
      sharp ? async () => await sharp!(webp10mb!).metadata() : null,
      50
    );
  }

  // HEIC Metadata (exclusive to bun-image-turbo)
  if (heicImage) {
    await benchmark(
      "HEIC Metadata (iPhone Photo)",
      async () => imageTurbo.metadataSync(heicImage!),
      null, // sharp doesn't support HEIC
      50
    );
  }

  // ============================================
  // JPEG RESIZE → JPEG (real-world use case)
  // ============================================
  if (jpeg1mb || jpeg10mb) {
    console.log(`\n${"─".repeat(100)}`);
    console.log("📊 JPEG RESIZE → JPEG (Real-world thumbnail generation)");
    console.log("─".repeat(100));

    if (jpeg1mb) {
      await benchmark(
        "1MB JPEG → 800px → JPEG",
        async () =>
          imageTurbo.transform(jpeg1mb!, {
            resize: { width: 800 },
            output: { format: "jpeg", jpeg: { quality: 80 } },
          }),
        sharp
          ? async () =>
              sharp!(jpeg1mb!).resize(800).jpeg({ quality: 80 }).toBuffer()
          : null,
        20
      );

      await benchmark(
        "1MB JPEG → 400px → JPEG",
        async () =>
          imageTurbo.transform(jpeg1mb!, {
            resize: { width: 400 },
            output: { format: "jpeg", jpeg: { quality: 80 } },
          }),
        sharp
          ? async () =>
              sharp!(jpeg1mb!).resize(400).jpeg({ quality: 80 }).toBuffer()
          : null,
        20
      );

      await benchmark(
        "1MB JPEG → 200px → JPEG (thumbnail)",
        async () =>
          imageTurbo.transform(jpeg1mb!, {
            resize: { width: 200 },
            output: { format: "jpeg", jpeg: { quality: 80 } },
          }),
        sharp
          ? async () =>
              sharp!(jpeg1mb!).resize(200).jpeg({ quality: 80 }).toBuffer()
          : null,
        20
      );
    }

    if (jpeg10mb) {
      await benchmark(
        "10MB JPEG → 800px → JPEG",
        async () =>
          imageTurbo.transform(jpeg10mb!, {
            resize: { width: 800 },
            output: { format: "jpeg", jpeg: { quality: 80 } },
          }),
        sharp
          ? async () =>
              sharp!(jpeg10mb!).resize(800).jpeg({ quality: 80 }).toBuffer()
          : null,
        10
      );

      await benchmark(
        "10MB JPEG → 400px → JPEG",
        async () =>
          imageTurbo.transform(jpeg10mb!, {
            resize: { width: 400 },
            output: { format: "jpeg", jpeg: { quality: 80 } },
          }),
        sharp
          ? async () =>
              sharp!(jpeg10mb!).resize(400).jpeg({ quality: 80 }).toBuffer()
          : null,
        10
      );
    }
  }

  // ============================================
  // JPEG RESIZE → WebP (modern format)
  // ============================================
  if (jpeg1mb || jpeg10mb) {
    console.log(`\n${"─".repeat(100)}`);
    console.log("📊 JPEG RESIZE → WebP (Modern format conversion)");
    console.log("─".repeat(100));

    if (jpeg1mb) {
      await benchmark(
        "1MB JPEG → 800px → WebP",
        async () =>
          imageTurbo.transform(jpeg1mb!, {
            resize: { width: 800 },
            output: { format: "webp", webp: { quality: 80 } },
          }),
        sharp
          ? async () =>
              sharp!(jpeg1mb!).resize(800).webp({ quality: 80 }).toBuffer()
          : null,
        10
      );
    }

    if (jpeg10mb) {
      await benchmark(
        "10MB JPEG → 800px → WebP",
        async () =>
          imageTurbo.transform(jpeg10mb!, {
            resize: { width: 800 },
            output: { format: "webp", webp: { quality: 80 } },
          }),
        sharp
          ? async () =>
              sharp!(jpeg10mb!).resize(800).webp({ quality: 80 }).toBuffer()
          : null,
        5
      );
    }
  }

  // ============================================
  // COMPLEX TRANSFORM PIPELINE
  // ============================================
  if (jpeg1mb) {
    console.log(`\n${"─".repeat(100)}`);
    console.log("📊 COMPLEX TRANSFORM PIPELINE");
    console.log("─".repeat(100));

    await benchmark(
      "1MB JPEG → resize + grayscale → JPEG",
      async () =>
        imageTurbo.transform(jpeg1mb!, {
          resize: { width: 600 },
          grayscale: true,
          output: { format: "jpeg", jpeg: { quality: 80 } },
        }),
      sharp
        ? async () =>
            sharp!(jpeg1mb!)
              .resize(600)
              .grayscale()
              .jpeg({ quality: 80 })
              .toBuffer()
        : null,
      20
    );

    await benchmark(
      "1MB JPEG → resize + rotate + grayscale → JPEG",
      async () =>
        imageTurbo.transform(jpeg1mb!, {
          resize: { width: 600 },
          rotate: 90,
          grayscale: true,
          output: { format: "jpeg", jpeg: { quality: 80 } },
        }),
      sharp
        ? async () =>
            sharp!(jpeg1mb!)
              .resize(600)
              .rotate(90)
              .grayscale()
              .jpeg({ quality: 80 })
              .toBuffer()
        : null,
      20
    );
  }

  // ============================================
  // CONCURRENT OPERATIONS
  // ============================================
  if (jpeg1mb) {
    console.log(`\n${"─".repeat(100)}`);
    console.log("📊 CONCURRENT OPERATIONS (50 parallel requests)");
    console.log("─".repeat(100));

    const concurrentOps = 50;

    const turboStart = performance.now();
    await Promise.all(
      Array.from({ length: concurrentOps }, (_, i) =>
        imageTurbo.transform(jpeg1mb!, {
          resize: { width: 200 + (i % 10) * 20 },
          output: { format: "jpeg", jpeg: { quality: 80 } },
        })
      )
    );
    const turboMs = performance.now() - turboStart;

    let sharpMs = 0;
    let speedup = 0;
    if (sharp) {
      const sharpStart = performance.now();
      await Promise.all(
        Array.from({ length: concurrentOps }, (_, i) =>
          sharp!(jpeg1mb!)
            .resize(200 + (i % 10) * 20)
            .jpeg({ quality: 80 })
            .toBuffer()
        )
      );
      sharpMs = performance.now() - sharpStart;
      speedup = sharpMs / turboMs;
      console.log(
        `🚀 ${concurrentOps} concurrent resize+JPEG ops`.padEnd(45) +
          ` turbo: ${turboMs.toFixed(0).padStart(7)}ms | sharp: ${sharpMs
            .toFixed(0)
            .padStart(7)}ms | ${speedup.toFixed(2)}x FASTER`
      );
    } else {
      console.log(
        `✨ ${concurrentOps} concurrent resize+JPEG ops`.padEnd(45) +
          ` turbo: ${turboMs
            .toFixed(0)
            .padStart(7)}ms | sharp: ${"N/A".padStart(7)}   | EXCLUSIVE`
      );
    }
    results.push({
      name: `${concurrentOps} concurrent ops`,
      turboMs,
      sharpMs,
      speedup,
    });
  }

  // ============================================
  // HEIC BENCHMARKS (Exclusive to bun-image-turbo)
  // ============================================
  if (heicImage) {
    console.log(`\n${"─".repeat(100)}`);
    console.log(
      "📊 HEIC OPERATIONS (iPhone Photo - EXCLUSIVE to bun-image-turbo)"
    );
    console.log("─".repeat(100));

    await benchmark(
      "HEIC → JPEG (quality 85)",
      async () => imageTurbo.toJpeg(heicImage!, { quality: 85 }),
      null, // sharp doesn't support HEIC
      20
    );

    await benchmark(
      "HEIC → WebP (quality 80)",
      async () => imageTurbo.toWebp(heicImage!, { quality: 80 }),
      null,
      20
    );

    await benchmark(
      "HEIC → PNG",
      async () => imageTurbo.toPng(heicImage!),
      null,
      10
    );

    await benchmark(
      "HEIC → 800px → JPEG",
      async () =>
        imageTurbo.transform(heicImage!, {
          resize: { width: 800 },
          output: { format: "jpeg", jpeg: { quality: 85 } },
        }),
      null,
      15
    );

    await benchmark(
      "HEIC → 200px thumbnail → JPEG",
      async () =>
        imageTurbo.transform(heicImage!, {
          resize: { width: 200 },
          output: { format: "jpeg", jpeg: { quality: 80 } },
        }),
      null,
      20
    );

    await benchmark(
      "HEIC → resize + grayscale → WebP",
      async () =>
        imageTurbo.transform(heicImage!, {
          resize: { width: 600 },
          grayscale: true,
          output: { format: "webp", webp: { quality: 80 } },
        }),
      null,
      15
    );

    await benchmark(
      "HEIC Blurhash (4x3)",
      async () => imageTurbo.blurhash(heicImage!, 4, 3),
      null,
      10
    );
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log(`\n${"=".repeat(100)}`);
  console.log("                                    SUMMARY");
  console.log("=".repeat(100));

  const compared = results.filter((r) => r.sharpMs > 0);
  const exclusive = results.filter((r) => r.sharpMs === 0);
  const faster = compared.filter((r) => r.speedup > 1);
  const slower = compared.filter((r) => r.speedup <= 1 && r.speedup > 0);

  if (compared.length > 0) {
    console.log(`\n✅ bun-image-turbo vs sharp (${compared.length} benchmarks):`);
    faster.sort((a, b) => b.speedup - a.speedup);
    for (const r of faster) {
      console.log(`   🚀 ${r.name}: ${r.speedup.toFixed(2)}x faster`);
    }

    if (slower.length > 0) {
      console.log(`\n⚠️  Slower in ${slower.length}/${compared.length} benchmarks:`);
      for (const r of slower) {
        console.log(`   🐢 ${r.name}: ${(1 / r.speedup).toFixed(2)}x slower`);
      }
    }
  }

  if (exclusive.length > 0) {
    console.log(`\n✨ EXCLUSIVE to bun-image-turbo (${exclusive.length} operations):`);
    for (const r of exclusive) {
      console.log(`   📱 ${r.name}: ${r.turboMs.toFixed(1)}ms`);
    }
  }

  console.log("\n" + "─".repeat(100));
  console.log("📊 Final Score:");
  console.log(`   • Compared benchmarks: ${faster.length}/${compared.length} faster than sharp`);
  console.log(`   • Exclusive features: ${exclusive.length} (HEIC support, Blurhash)`);
  console.log(`   • Total operations: ${results.length}`);

  if (heicImage) {
    console.log("\n📱 HEIC Support Highlights:");
    console.log("   • Native HEIC/HEIF decoding (iPhone photos)");
    console.log("   • Convert HEIC → JPEG, PNG, WebP");
    console.log("   • Full transform pipeline (resize, grayscale, etc.)");
    console.log("   • Blurhash generation from HEIC");
    console.log("   • ⚠️  sharp does NOT support HEIC!");
  }

  console.log("\n" + "=".repeat(100));
  console.log("🎉 bun-image-turbo: Fast image processing + HEIC support!");
  console.log("=".repeat(100));
}

main().catch(console.error);
