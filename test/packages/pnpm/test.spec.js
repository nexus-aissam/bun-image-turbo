import { describe, it, before } from "node:test";
import assert from "node:assert";
import {
  metadata,
  metadataSync,
  resize,
  resizeSync,
  crop,
  cropSync,
  toJpeg,
  toJpegSync,
  toPng,
  toPngSync,
  toWebp,
  toWebpSync,
  transform,
  transformSync,
  blurhash,
  blurhashSync,
  version,
  writeExif,
  writeExifSync,
  stripExif,
  stripExifSync,
} from "imgkit";

let jpegImage;
let pngImage;

before(async () => {
  console.log("Downloading test images...");
  const jpegResponse = await fetch("https://picsum.photos/800/600.jpg");
  jpegImage = Buffer.from(await jpegResponse.arrayBuffer());
  pngImage = await toPng(jpegImage);
  console.log("Test images ready!");
});

describe("imgkit - Node.js Test Suite", () => {

  describe("version()", () => {
    it("should return version string", () => {
      const v = version();
      assert.strictEqual(typeof v, "string");
      assert.match(v, /^\d+\.\d+\.\d+/);
      console.log(`  Version: ${v}`);
    });
  });

  describe("metadata()", () => {
    it("should get JPEG metadata (async)", async () => {
      const meta = await metadata(jpegImage);
      assert.strictEqual(meta.width, 800);
      assert.strictEqual(meta.height, 600);
      assert.strictEqual(meta.format, "jpeg");
    });

    it("should get JPEG metadata (sync)", () => {
      const meta = metadataSync(jpegImage);
      assert.strictEqual(meta.width, 800);
      assert.strictEqual(meta.format, "jpeg");
    });

    it("should get PNG metadata", async () => {
      const meta = await metadata(pngImage);
      assert.strictEqual(meta.format, "png");
    });
  });

  describe("resize()", () => {
    it("should resize with width only", async () => {
      const resized = await resize(jpegImage, { width: 200 });
      const meta = await metadata(resized);
      assert.strictEqual(meta.width, 200);
    });

    it("should resize with height only", async () => {
      const resized = await resize(jpegImage, { height: 150 });
      const meta = await metadata(resized);
      assert.strictEqual(meta.height, 150);
    });

    it("should resize with fill fit mode", async () => {
      const resized = await resize(jpegImage, {
        width: 300,
        height: 200,
        fit: "Fill"
      });
      const meta = await metadata(resized);
      assert.strictEqual(meta.width, 300);
      assert.strictEqual(meta.height, 200);
    });

    it("should resize (sync)", () => {
      const resized = resizeSync(jpegImage, { width: 100 });
      const meta = metadataSync(resized);
      assert.strictEqual(meta.width, 100);
    });
  });

  describe("crop()", () => {
    it("should crop with explicit coordinates (async)", async () => {
      const cropped = await crop(jpegImage, { x: 100, y: 50, width: 400, height: 300 });
      const meta = await metadata(cropped);
      assert.strictEqual(meta.width, 400);
      assert.strictEqual(meta.height, 300);
    });

    it("should crop with explicit coordinates (sync)", () => {
      const cropped = cropSync(jpegImage, { x: 0, y: 0, width: 200, height: 200 });
      const meta = metadataSync(cropped);
      assert.strictEqual(meta.width, 200);
      assert.strictEqual(meta.height, 200);
    });

    it("should crop to aspect ratio 1:1", async () => {
      const cropped = await crop(jpegImage, { aspectRatio: "1:1" });
      const meta = await metadata(cropped);
      assert.strictEqual(meta.width, 600);
      assert.strictEqual(meta.height, 600);
    });

    it("should crop to aspect ratio 16:9", async () => {
      const cropped = await crop(jpegImage, { aspectRatio: "16:9" });
      const meta = await metadata(cropped);
      assert.strictEqual(meta.width, 800);
      assert.strictEqual(meta.height, 450);
    });

    it("should crop with gravity north", async () => {
      const cropped = await crop(jpegImage, { width: 400, height: 300, gravity: "north" });
      const meta = await metadata(cropped);
      assert.strictEqual(meta.width, 400);
      assert.strictEqual(meta.height, 300);
    });

    it("should crop with gravity center", async () => {
      const cropped = await crop(jpegImage, { width: 300, height: 300, gravity: "center" });
      const meta = await metadata(cropped);
      assert.strictEqual(meta.width, 300);
      assert.strictEqual(meta.height, 300);
    });

    it("should crop with gravity southEast", async () => {
      const cropped = await crop(jpegImage, { width: 200, height: 200, gravity: "southEast" });
      const meta = await metadata(cropped);
      assert.strictEqual(meta.width, 200);
      assert.strictEqual(meta.height, 200);
    });

    it("should crop to aspect ratio with gravity", async () => {
      const cropped = await crop(jpegImage, { aspectRatio: "1:1", gravity: "north" });
      const meta = await metadata(cropped);
      assert.strictEqual(meta.width, 600);
      assert.strictEqual(meta.height, 600);
    });
  });

  describe("toJpeg()", () => {
    it("should convert PNG to JPEG", async () => {
      const jpeg = await toJpeg(pngImage, { quality: 85 });
      const meta = await metadata(jpeg);
      assert.strictEqual(meta.format, "jpeg");
    });

    it("should convert to JPEG (sync)", () => {
      const jpeg = toJpegSync(pngImage, { quality: 75 });
      const meta = metadataSync(jpeg);
      assert.strictEqual(meta.format, "jpeg");
    });

    it("should respect quality setting", async () => {
      const highQuality = await toJpeg(pngImage, { quality: 100 });
      const lowQuality = await toJpeg(pngImage, { quality: 50 });
      assert.ok(highQuality.length > lowQuality.length);
    });
  });

  describe("toPng()", () => {
    it("should convert JPEG to PNG", async () => {
      const png = await toPng(jpegImage);
      const meta = await metadata(png);
      assert.strictEqual(meta.format, "png");
    });

    it("should convert to PNG (sync)", () => {
      const png = toPngSync(jpegImage);
      const meta = metadataSync(png);
      assert.strictEqual(meta.format, "png");
    });
  });

  describe("toWebp()", () => {
    it("should convert JPEG to WebP", async () => {
      const webp = await toWebp(jpegImage, { quality: 85 });
      const meta = await metadata(webp);
      assert.strictEqual(meta.format, "webp");
    });

    it("should convert PNG to WebP", async () => {
      const webp = await toWebp(pngImage, { quality: 80 });
      const meta = await metadata(webp);
      assert.strictEqual(meta.format, "webp");
    });

    it("should convert to WebP (sync)", () => {
      const webp = toWebpSync(jpegImage, { quality: 75 });
      const meta = metadataSync(webp);
      assert.strictEqual(meta.format, "webp");
    });

    it("should support lossless mode", async () => {
      const lossy = await toWebp(jpegImage, { quality: 80, lossless: false });
      const lossless = await toWebp(jpegImage, { lossless: true });
      const lossyMeta = await metadata(lossy);
      const losslessMeta = await metadata(lossless);
      assert.strictEqual(lossyMeta.format, "webp");
      assert.strictEqual(losslessMeta.format, "webp");
    });
  });

  describe("transform()", () => {
    it("should resize and convert in one operation", async () => {
      const result = await transform(jpegImage, {
        resize: { width: 300 },
        output: {
          format: "WebP",
          webp: { quality: 85 }
        },
      });
      const meta = await metadata(result);
      assert.strictEqual(meta.width, 300);
      assert.strictEqual(meta.format, "webp");
    });

    it("should transform (sync)", () => {
      const result = transformSync(jpegImage, {
        resize: { width: 150 },
        output: { format: "Png" },
      });
      const meta = metadataSync(result);
      assert.strictEqual(meta.width, 150);
      assert.strictEqual(meta.format, "png");
    });

    it("should rotate image", async () => {
      const rotated = await transform(jpegImage, {
        rotate: 90,
        output: { format: "Jpeg" },
      });
      const meta = await metadata(rotated);
      assert.strictEqual(meta.width, 600);
      assert.strictEqual(meta.height, 800);
    });

    it("should apply grayscale", async () => {
      const gray = await transform(jpegImage, {
        grayscale: true,
        output: { format: "Jpeg" },
      });
      const meta = await metadata(gray);
      assert.strictEqual(meta.format, "jpeg");
    });
  });

  describe("blurhash()", () => {
    it("should generate blurhash", async () => {
      const result = await blurhash(jpegImage, 4, 3);
      assert.strictEqual(typeof result.hash, "string");
      assert.ok(result.hash.length > 10);
      console.log(`  Blurhash: ${result.hash}`);
    });

    it("should generate blurhash (sync)", () => {
      const result = blurhashSync(jpegImage, 4, 3);
      assert.strictEqual(typeof result.hash, "string");
      assert.ok(result.hash.length > 10);
    });
  });

  describe("EXIF functions", () => {
    it("should write EXIF metadata", async () => {
      const withExif = await writeExif(jpegImage, {
        artist: "Test Artist",
        copyright: "Test Copyright 2024",
        software: "imgkit test",
      });
      assert.ok(withExif.length > 0);
    });

    it("should write EXIF metadata (sync)", () => {
      const withExif = writeExifSync(jpegImage, {
        artist: "Sync Test",
        userComment: "Testing sync EXIF write",
      });
      assert.ok(withExif.length > 0);
    });

    it("should strip EXIF metadata", async () => {
      const withExif = await writeExif(jpegImage, {
        artist: "To Be Stripped",
      });
      const stripped = await stripExif(withExif);
      assert.ok(stripped.length <= withExif.length);
    });

    it("should strip EXIF metadata (sync)", () => {
      const withExif = writeExifSync(jpegImage, {
        artist: "To Be Stripped Sync",
      });
      const stripped = stripExifSync(withExif);
      assert.ok(stripped.length <= withExif.length);
    });
  });

  describe("Edge Cases", () => {
    it("should handle small resize", async () => {
      const tiny = await resize(jpegImage, { width: 50 });
      const meta = await metadata(tiny);
      assert.strictEqual(meta.width, 50);
    });

    it("should handle upscaling", async () => {
      const small = await resize(jpegImage, { width: 100 });
      const upscaled = await resize(small, { width: 400 });
      const meta = await metadata(upscaled);
      assert.strictEqual(meta.width, 400);
    });

    it("should handle chained transforms", async () => {
      let result = jpegImage;
      result = await resize(result, { width: 400 });
      result = await toWebp(result, { quality: 90 });
      result = await resize(result, { width: 200 });
      result = await toJpeg(result, { quality: 85 });
      const meta = await metadata(result);
      assert.strictEqual(meta.width, 200);
      assert.strictEqual(meta.format, "jpeg");
    });
  });

  describe("Performance", () => {
    it("should resize quickly", async () => {
      const start = performance.now();
      for (let i = 0; i < 10; i++) {
        await resize(jpegImage, { width: 200 });
      }
      const elapsed = performance.now() - start;
      console.log(`  10x resize: ${elapsed.toFixed(2)}ms (${(elapsed/10).toFixed(2)}ms avg)`);
      assert.ok(elapsed < 5000);
    });

    it("should convert formats quickly", async () => {
      const start = performance.now();
      for (let i = 0; i < 10; i++) {
        await toWebp(jpegImage, { quality: 85 });
      }
      const elapsed = performance.now() - start;
      console.log(`  10x toWebp: ${elapsed.toFixed(2)}ms (${(elapsed/10).toFixed(2)}ms avg)`);
      assert.ok(elapsed < 5000);
    });
  });
});
