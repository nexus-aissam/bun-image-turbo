import * as imageTurbo from "../src/index";
const sharp = require("sharp");

async function main() {
  const file = Bun.file("./benchmarks/1mb/1mb-jpg-example-file.jpg");
  const buf = Buffer.from(await file.arrayBuffer());

  const meta = imageTurbo.metadataSync(buf);
  console.log("1MB JPEG Source:", meta.width, "x", meta.height);

  // Calculate shrink
  const targetWidth = 800;
  const shrink = meta.width / targetWidth;
  console.log("Shrink ratio:", shrink.toFixed(2), "(need >= 4 for 1/2 scale)");

  // Benchmark turbo
  const turboStart = performance.now();
  for (let i = 0; i < 10; i++) {
    await imageTurbo.resize(buf, { width: 800 });
  }
  const turboTime = (performance.now() - turboStart) / 10;

  // Benchmark sharp
  const sharpStart = performance.now();
  for (let i = 0; i < 10; i++) {
    await sharp(buf).resize(800).toBuffer();
  }
  const sharpTime = (performance.now() - sharpStart) / 10;

  console.log("\nResize to 800px:");
  console.log("  imgkit:", turboTime.toFixed(1), "ms");
  console.log("  sharp:", sharpTime.toFixed(1), "ms");

  const speedup = sharpTime / turboTime;
  if (speedup > 1) {
    console.log("  Result: 🚀", speedup.toFixed(2) + "x FASTER than sharp!");
  } else {
    console.log("  Result: 🐢", (1/speedup).toFixed(2) + "x slower than sharp");
  }

  // Now test 10MB JPEG
  const file10mb = Bun.file("./benchmarks/10mb/10mb-example-jpg.jpg");
  const buf10mb = Buffer.from(await file10mb.arrayBuffer());

  const meta10mb = imageTurbo.metadataSync(buf10mb);
  console.log("\n10MB JPEG Source:", meta10mb.width, "x", meta10mb.height);
  console.log("Shrink ratio:", (meta10mb.width / 800).toFixed(2));

  // Benchmark turbo 10MB
  const turbo10Start = performance.now();
  for (let i = 0; i < 5; i++) {
    await imageTurbo.resize(buf10mb, { width: 800 });
  }
  const turbo10Time = (performance.now() - turbo10Start) / 5;

  // Benchmark sharp 10MB
  const sharp10Start = performance.now();
  for (let i = 0; i < 5; i++) {
    await sharp(buf10mb).resize(800).toBuffer();
  }
  const sharp10Time = (performance.now() - sharp10Start) / 5;

  console.log("\nResize to 800px:");
  console.log("  imgkit:", turbo10Time.toFixed(1), "ms");
  console.log("  sharp:", sharp10Time.toFixed(1), "ms");

  const speedup10 = sharp10Time / turbo10Time;
  if (speedup10 > 1) {
    console.log("  Result: 🚀", speedup10.toFixed(2) + "x FASTER than sharp!");
  } else {
    console.log("  Result: 🐢", (1/speedup10).toFixed(2) + "x slower than sharp");
  }
}

main();
