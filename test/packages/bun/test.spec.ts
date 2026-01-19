import { describe, it, expect, beforeAll } from "bun:test";
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

let jpegImage: Buffer;
let pngImage: Buffer;

beforeAll(async () => {
  console.log("Downloading test images...");

  const jpegResponse = await fetch("https://picsum.photos/800/600.jpg");
  jpegImage = Buffer.from(await jpegResponse.arrayBuffer());

  // Create PNG from JPEG
  pngImage = await toPng(jpegImage);

  console.log("Test images ready!");
});

describe("imgkit - Complete Test Suite", () => {
  // ============================================
  // VERSION
  // ============================================
  describe("version()", () => {
    it("should return version string", () => {
      const v = version();
      expect(typeof v).toBe("string");
      expect(v).toMatch(/^\d+\.\d+\.\d+/);
      console.log(`  Version: ${v}`);
    });
  });

  // ============================================
  // METADATA
  // ============================================
  describe("metadata()", () => {
    it("should get JPEG metadata (async)", async () => {
      const meta = await metadata(jpegImage);
      expect(meta.width).toBe(800);
      expect(meta.height).toBe(600);
      expect(meta.format).toBe("jpeg");
      expect(meta.channels).toBeGreaterThan(0);
      expect(typeof meta.hasAlpha).toBe("boolean");
    });

    it("should get JPEG metadata (sync)", () => {
      const meta = metadataSync(jpegImage);
      expect(meta.width).toBe(800);
      expect(meta.height).toBe(600);
      expect(meta.format).toBe("jpeg");
    });

    it("should get PNG metadata", async () => {
      const meta = await metadata(pngImage);
      expect(meta.format).toBe("png");
      expect(meta.width).toBeGreaterThan(0);
      expect(meta.height).toBeGreaterThan(0);
    });
  });

  // ============================================
  // RESIZE
  // ============================================
  describe("resize()", () => {
    it("should resize with width only (async)", async () => {
      const resized = await resize(jpegImage, { width: 200 });
      const meta = await metadata(resized);
      expect(meta.width).toBe(200);
      expect(meta.height).toBeGreaterThan(0);
    });

    it("should resize with height only (async)", async () => {
      const resized = await resize(jpegImage, { height: 150 });
      const meta = await metadata(resized);
      expect(meta.height).toBe(150);
      expect(meta.width).toBeGreaterThan(0);
    });

    it("should resize with fill fit mode", async () => {
      const resized = await resize(jpegImage, {
        width: 300,
        height: 200,
        fit: "Fill" as any,
      });
      const meta = await metadata(resized);
      expect(meta.width).toBe(300);
      expect(meta.height).toBe(200);
    });

    it("should resize (sync)", () => {
      const resized = resizeSync(jpegImage, { width: 100 });
      const meta = metadataSync(resized);
      expect(meta.width).toBe(100);
    });

    it("should resize with cover fit mode", async () => {
      const cover = await resize(jpegImage, {
        width: 200,
        height: 200,
        fit: "Cover" as any,
      });
      const coverMeta = await metadata(cover);
      // Cover mode maintains aspect ratio while covering target area
      expect(coverMeta.width).toBeGreaterThanOrEqual(200);
      expect(coverMeta.height).toBeGreaterThanOrEqual(150);
    });

    it("should resize with contain fit mode", async () => {
      const contain = await resize(jpegImage, {
        width: 200,
        height: 200,
        fit: "Contain" as any,
      });
      const containMeta = await metadata(contain);
      expect(containMeta.width).toBeLessThanOrEqual(200);
      expect(containMeta.height).toBeLessThanOrEqual(200);
    });
  });

  // ============================================
  // CROP
  // ============================================
  describe("crop()", () => {
    it("should crop with explicit coordinates (async)", async () => {
      const cropped = await crop(jpegImage, {
        x: 100,
        y: 50,
        width: 400,
        height: 300,
      });
      const meta = await metadata(cropped);
      expect(meta.width).toBe(400);
      expect(meta.height).toBe(300);
    });

    it("should crop with explicit coordinates (sync)", () => {
      const cropped = cropSync(jpegImage, {
        x: 0,
        y: 0,
        width: 200,
        height: 200,
      });
      const meta = metadataSync(cropped);
      expect(meta.width).toBe(200);
      expect(meta.height).toBe(200);
    });

    it("should crop to aspect ratio 1:1 (centered)", async () => {
      const cropped = await crop(jpegImage, { aspectRatio: "1:1" });
      const meta = await metadata(cropped);
      // 800x600 -> 1:1 should be 600x600 (centered)
      expect(meta.width).toBe(600);
      expect(meta.height).toBe(600);
    });

    it("should crop to aspect ratio 16:9", async () => {
      const cropped = await crop(jpegImage, { aspectRatio: "16:9" });
      const meta = await metadata(cropped);
      // 800x600 -> 16:9, width stays, height adjusts
      expect(meta.width).toBe(800);
      expect(meta.height).toBe(450);
    });

    it("should crop with gravity north", async () => {
      const cropped = await crop(jpegImage, {
        width: 400,
        height: 300,
        gravity: "north",
      });
      const meta = await metadata(cropped);
      expect(meta.width).toBe(400);
      expect(meta.height).toBe(300);
    });

    it("should crop with gravity center", async () => {
      const cropped = await crop(jpegImage, {
        width: 300,
        height: 300,
        gravity: "center",
      });
      const meta = await metadata(cropped);
      expect(meta.width).toBe(300);
      expect(meta.height).toBe(300);
    });

    it("should crop with gravity southEast", async () => {
      const cropped = await crop(jpegImage, {
        width: 200,
        height: 200,
        gravity: "southEast",
      });
      const meta = await metadata(cropped);
      expect(meta.width).toBe(200);
      expect(meta.height).toBe(200);
    });

    it("should crop to aspect ratio with gravity", async () => {
      const cropped = await crop(jpegImage, {
        aspectRatio: "1:1",
        gravity: "north",
      });
      const meta = await metadata(cropped);
      expect(meta.width).toBe(600);
      expect(meta.height).toBe(600);
    });
  });

  // ============================================
  // FORMAT CONVERSION - JPEG
  // ============================================
  describe("toJpeg()", () => {
    it("should convert PNG to JPEG (async)", async () => {
      const jpeg = await toJpeg(pngImage, { quality: 85 });
      const meta = await metadata(jpeg);
      expect(meta.format).toBe("jpeg");
    });

    it("should convert to JPEG (sync)", () => {
      const jpeg = toJpegSync(pngImage, { quality: 75 });
      const meta = metadataSync(jpeg);
      expect(meta.format).toBe("jpeg");
    });

    it("should respect quality setting", async () => {
      const highQuality = await toJpeg(pngImage, { quality: 100 });
      const lowQuality = await toJpeg(pngImage, { quality: 50 });
      expect(highQuality.length).toBeGreaterThan(lowQuality.length);
    });
  });

  // ============================================
  // FORMAT CONVERSION - PNG
  // ============================================
  describe("toPng()", () => {
    it("should convert JPEG to PNG (async)", async () => {
      const png = await toPng(jpegImage);
      const meta = await metadata(png);
      expect(meta.format).toBe("png");
    });

    it("should convert to PNG (sync)", () => {
      const png = toPngSync(jpegImage);
      const meta = metadataSync(png);
      expect(meta.format).toBe("png");
    });
  });

  // ============================================
  // FORMAT CONVERSION - WEBP
  // ============================================
  describe("toWebp()", () => {
    it("should convert JPEG to WebP (async)", async () => {
      const webp = await toWebp(jpegImage, { quality: 85 });
      const meta = await metadata(webp);
      expect(meta.format).toBe("webp");
    });

    it("should convert PNG to WebP (async)", async () => {
      const webp = await toWebp(pngImage, { quality: 80 });
      const meta = await metadata(webp);
      expect(meta.format).toBe("webp");
    });

    it("should convert to WebP (sync)", () => {
      const webp = toWebpSync(jpegImage, { quality: 75 });
      const meta = metadataSync(webp);
      expect(meta.format).toBe("webp");
    });

    it("should support lossless mode", async () => {
      const lossy = await toWebp(jpegImage, { quality: 80, lossless: false });
      const lossless = await toWebp(jpegImage, { lossless: true });
      const lossyMeta = await metadata(lossy);
      const losslessMeta = await metadata(lossless);
      expect(lossyMeta.format).toBe("webp");
      expect(losslessMeta.format).toBe("webp");
    });
  });

  // ============================================
  // TRANSFORM (Combined Operations)
  // ============================================
  describe("transform()", () => {
    it("should resize and convert in one operation (async)", async () => {
      const result = await transform(jpegImage, {
        resize: { width: 300 },
        output: {
          format: "WebP" as any,
          webp: { quality: 85 },
        },
      });
      const meta = await metadata(result);
      expect(meta.width).toBe(300);
      expect(meta.format).toBe("webp");
    });

    it("should transform (sync)", () => {
      const result = transformSync(jpegImage, {
        resize: { width: 150 },
        output: { format: "Png" as any },
      });
      const meta = metadataSync(result);
      expect(meta.width).toBe(150);
      expect(meta.format).toBe("png");
    });

    it("should apply filters", async () => {
      const result = await transform(jpegImage, {
        resize: { width: 200 },
        output: {
          format: "Jpeg" as any,
          jpeg: { quality: 80 },
        },
        blur: 2.0,
        sharpen: 1.5,
        brightness: 1.1,
        contrast: 1.1,
      });
      const meta = await metadata(result);
      expect(meta.width).toBe(200);
      expect(meta.format).toBe("jpeg");
    });

    it("should rotate image", async () => {
      const rotated = await transform(jpegImage, {
        rotate: 90,
        output: { format: "Jpeg" as any },
      });
      const meta = await metadata(rotated);
      expect(meta.width).toBe(600);
      expect(meta.height).toBe(800);
    });

    it("should flip image horizontally", async () => {
      const flipped = await transform(jpegImage, {
        flipH: true,
        output: { format: "Jpeg" as any },
      });
      const meta = await metadata(flipped);
      expect(meta.width).toBe(800);
      expect(meta.height).toBe(600);
    });

    it("should flip image vertically", async () => {
      const flipped = await transform(jpegImage, {
        flipV: true,
        output: { format: "Jpeg" as any },
      });
      const meta = await metadata(flipped);
      expect(meta.width).toBe(800);
      expect(meta.height).toBe(600);
    });

    it("should apply grayscale", async () => {
      const gray = await transform(jpegImage, {
        grayscale: true,
        output: { format: "Jpeg" as any },
      });
      const meta = await metadata(gray);
      expect(meta.format).toBe("jpeg");
    });
  });

  // ============================================
  // BLURHASH
  // ============================================
  describe("blurhash()", () => {
    it("should generate blurhash (async)", async () => {
      const result = await blurhash(jpegImage, 4, 3);
      expect(typeof result.hash).toBe("string");
      expect(result.hash.length).toBeGreaterThan(10);
      console.log(`  Blurhash: ${result.hash}`);
    });

    it("should generate blurhash (sync)", () => {
      const result = blurhashSync(jpegImage, 4, 3);
      expect(typeof result.hash).toBe("string");
      expect(result.hash.length).toBeGreaterThan(10);
    });

    it("should work with different component sizes", async () => {
      const small = await blurhash(jpegImage, 2, 2);
      const large = await blurhash(jpegImage, 9, 9);
      expect(large.hash.length).toBeGreaterThan(small.hash.length);
    });
  });

  // ============================================
  // EXIF
  // ============================================
  describe("EXIF functions", () => {
    it("should write EXIF metadata (async)", async () => {
      const withExif = await writeExif(jpegImage, {
        artist: "Test Artist",
        copyright: "Test Copyright 2024",
        software: "imgkit test",
      });
      expect(withExif.length).toBeGreaterThan(0);
    });

    it("should write EXIF metadata (sync)", () => {
      const withExif = writeExifSync(jpegImage, {
        artist: "Sync Test",
        userComment: "Testing sync EXIF write",
      });
      expect(withExif.length).toBeGreaterThan(0);
    });

    it("should strip EXIF metadata (async)", async () => {
      const withExif = await writeExif(jpegImage, {
        artist: "To Be Stripped",
        copyright: "Will Be Removed",
      });
      const stripped = await stripExif(withExif);
      expect(stripped.length).toBeLessThanOrEqual(withExif.length);
    });

    it("should strip EXIF metadata (sync)", () => {
      const withExif = writeExifSync(jpegImage, {
        artist: "To Be Stripped Sync",
      });
      const stripped = stripExifSync(withExif);
      expect(stripped.length).toBeLessThanOrEqual(withExif.length);
    });

    it("should write comprehensive EXIF data", async () => {
      const withExif = await writeExif(jpegImage, {
        artist: "AI Generator",
        copyright: "2024 Test Suite",
        software: "imgkit v1.4.0",
        userComment: JSON.stringify({
          model: "test-model",
          prompt: "test prompt",
          seed: 12345,
        }),
        dateTimeOriginal: "2024:01:15 10:30:00",
        make: "Test Camera",
        model: "Test Model X",
      });
      expect(withExif.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================
  describe("Edge Cases", () => {
    it("should handle small resize", async () => {
      const tiny = await resize(jpegImage, { width: 50 });
      const meta = await metadata(tiny);
      expect(meta.width).toBe(50);
    });

    it("should handle upscaling", async () => {
      const small = await resize(jpegImage, { width: 100 });
      const upscaled = await resize(small, { width: 400 });
      const meta = await metadata(upscaled);
      expect(meta.width).toBe(400);
    });

    it("should handle chained transforms", async () => {
      let result = jpegImage;

      // Resize
      result = await resize(result, { width: 400 });

      // Convert to WebP
      result = await toWebp(result, { quality: 90 });

      // Resize again
      result = await resize(result, { width: 200 });

      // Convert to JPEG
      result = await toJpeg(result, { quality: 85 });

      const meta = await metadata(result);
      expect(meta.width).toBe(200);
      expect(meta.format).toBe("jpeg");
    });
  });

  // ============================================
  // PERFORMANCE SANITY CHECK
  // ============================================
  describe("Performance", () => {
    it("should resize quickly", async () => {
      const start = performance.now();
      for (let i = 0; i < 10; i++) {
        await resize(jpegImage, { width: 200 });
      }
      const elapsed = performance.now() - start;
      console.log(
        `  10x resize: ${elapsed.toFixed(2)}ms (${(elapsed / 10).toFixed(
          2
        )}ms avg)`
      );
      expect(elapsed).toBeLessThan(5000);
    });

    it("should convert formats quickly", async () => {
      const start = performance.now();
      for (let i = 0; i < 10; i++) {
        await toWebp(jpegImage, { quality: 85 });
      }
      const elapsed = performance.now() - start;
      console.log(
        `  10x toWebp: ${elapsed.toFixed(2)}ms (${(elapsed / 10).toFixed(
          2
        )}ms avg)`
      );
      expect(elapsed).toBeLessThan(5000);
    });
  });
});
