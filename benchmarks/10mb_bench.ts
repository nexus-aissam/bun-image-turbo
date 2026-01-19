import * as imageTurbo from "../src/index";
const sharp = require("sharp");

async function benchmark(name: string, fn: () => Promise<void>, iterations: number) {
  for (let i = 0; i < 3; i++) await fn();
  const times: number[] = [];
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const iterStart = performance.now();
    await fn();
    times.push(performance.now() - iterStart);
  }
  const avgMs = (performance.now() - start) / iterations;
  return { name, avgMs, minMs: Math.min(...times), maxMs: Math.max(...times) };
}

function benchmarkSync(name: string, fn: () => void, iterations: number) {
  for (let i = 0; i < 3; i++) fn();
  const times: number[] = [];
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const iterStart = performance.now();
    fn();
    times.push(performance.now() - iterStart);
  }
  const avgMs = (performance.now() - start) / iterations;
  return { name, avgMs, minMs: Math.min(...times), maxMs: Math.max(...times) };
}

console.log("================================================================================");
console.log("                    10MB File Benchmarks");
console.log("================================================================================\n");

const files: Record<string, string> = {
  jpeg: "./benchmarks/10mb/10mb-example-jpg.jpg",
  png: "./benchmarks/10mb/11mb.png",
  webp: "./benchmarks/10mb/10mb.webp",
};

async function main() {
  for (const [format, path] of Object.entries(files)) {
    const file = Bun.file(path);
    if (!(await file.exists())) continue;

    const buf = Buffer.from(await file.arrayBuffer());
    const meta = imageTurbo.metadataSync(buf);
    console.log(`\n📊 ${format.toUpperCase()} (${(buf.length / 1024 / 1024).toFixed(2)} MB, ${meta.width}x${meta.height})\n`);

    // Metadata
    const turboMeta = benchmarkSync("imgkit meta", () => imageTurbo.metadataSync(buf), 50);
    const sharpMeta = await benchmark("sharp meta", async () => { await sharp(buf).metadata(); }, 50);
    console.log(`Metadata: turbo=${turboMeta.avgMs.toFixed(3)}ms vs sharp=${sharpMeta.avgMs.toFixed(3)}ms (${(sharpMeta.avgMs/turboMeta.avgMs).toFixed(1)}x faster)`);

    // Resize 800px
    try {
      const turboResize = await benchmark("imgkit resize", async () => { await imageTurbo.resize(buf, { width: 800 }); }, 5);
      const sharpResize = await benchmark("sharp resize", async () => { await sharp(buf).resize(800).toBuffer(); }, 5);
      const speedup = sharpResize.avgMs / turboResize.avgMs;
      const status = speedup > 1 ? `🚀 ${speedup.toFixed(2)}x faster` : `🐢 ${(1/speedup).toFixed(2)}x slower`;
      console.log(`Resize 800: turbo=${turboResize.avgMs.toFixed(1)}ms vs sharp=${sharpResize.avgMs.toFixed(1)}ms ${status}`);
    } catch (e: any) {
      console.log(`Resize 800: SKIPPED - ${e.message}`);
    }
  }

  console.log("\n================================================================================");
}

main();
