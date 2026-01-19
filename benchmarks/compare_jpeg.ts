import * as imageTurbo from "../src/index";
const sharp = require("sharp");

async function main() {
  const file = Bun.file("./benchmarks/1mb/1mb-jpg-example-file.jpg");
  const buf = Buffer.from(await file.arrayBuffer());

  console.log("=== 1MB JPEG (2205x1240 -> 800px) ===\n");

  // Our transform to JPEG (shrink-on-load + JPEG output)
  let start = performance.now();
  for (let i = 0; i < 10; i++) {
    await imageTurbo.transform(buf, {
      resize: { width: 800 },
      output: { format: "jpeg", jpeg: { quality: 80 } }
    });
  }
  const turboJpeg = (performance.now() - start) / 10;
  console.log("imgkit (resize -> JPEG):", turboJpeg.toFixed(1), "ms");

  // Sharp resize to JPEG
  start = performance.now();
  for (let i = 0; i < 10; i++) {
    await sharp(buf).resize(800).jpeg({ quality: 80 }).toBuffer();
  }
  const sharpJpeg = (performance.now() - start) / 10;
  console.log("sharp (resize -> JPEG):", sharpJpeg.toFixed(1), "ms");

  const speedup = sharpJpeg / turboJpeg;
  if (speedup > 1) {
    console.log("\n🚀 imgkit is", speedup.toFixed(2) + "x FASTER!");
  } else {
    console.log("\n🐢 imgkit is", (1/speedup).toFixed(2) + "x slower");
  }

  // Now test 10MB
  console.log("\n=== 10MB JPEG (11384x4221 -> 800px) ===\n");

  const file10 = Bun.file("./benchmarks/10mb/10mb-example-jpg.jpg");
  const buf10 = Buffer.from(await file10.arrayBuffer());

  start = performance.now();
  for (let i = 0; i < 5; i++) {
    await imageTurbo.transform(buf10, {
      resize: { width: 800 },
      output: { format: "jpeg", jpeg: { quality: 80 } }
    });
  }
  const turbo10 = (performance.now() - start) / 5;
  console.log("imgkit (resize -> JPEG):", turbo10.toFixed(1), "ms");

  start = performance.now();
  for (let i = 0; i < 5; i++) {
    await sharp(buf10).resize(800).jpeg({ quality: 80 }).toBuffer();
  }
  const sharp10 = (performance.now() - start) / 5;
  console.log("sharp (resize -> JPEG):", sharp10.toFixed(1), "ms");

  const speedup10 = sharp10 / turbo10;
  if (speedup10 > 1) {
    console.log("\n🚀 imgkit is", speedup10.toFixed(2) + "x FASTER!");
  } else {
    console.log("\n🐢 imgkit is", (1/speedup10).toFixed(2) + "x slower");
  }
}

main();
