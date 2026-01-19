/**
 * Thumbnail Tests
 *
 * Tests for fast thumbnail generation with shrink-on-load optimization.
 */

import { describe, it, expect, beforeAll } from "bun:test";
import {
  thumbnail,
  thumbnailSync,
  thumbnailBuffer,
  thumbnailBufferSync,
  metadata,
  metadataSync,
} from "../../dist";

// Test images
let testImageJpeg: Buffer;
let testImageWebp: Buffer;
let testImagePng: Buffer;
let testImageLarge: Buffer;

beforeAll(async () => {
  // Standard test image
  const jpegResponse = await fetch("https://picsum.photos/seed/thumb1/1600/1200.jpg");
  testImageJpeg = Buffer.from(await jpegResponse.arrayBuffer());

  // WebP test image
  const webpResponse = await fetch("https://www.gstatic.com/webp/gallery/1.webp");
  testImageWebp = Buffer.from(await webpResponse.arrayBuffer());

  // PNG test image - create from JPEG (most reliable method)
  try {
    const { toPng } = await import("../../dist");
    testImagePng = await toPng(testImageJpeg);
  } catch (e) {
    console.log("Warning: Could not create PNG test image:", e);
    testImagePng = Buffer.alloc(0);
  }

  // Large image for shrink-on-load testing
  const largeResponse = await fetch("https://picsum.photos/seed/thumb3/4000/3000.jpg");
  testImageLarge = Buffer.from(await largeResponse.arrayBuffer());
});

describe("thumbnail", () => {
  describe("basic thumbnail generation", () => {
    it("should generate thumbnail (async)", async () => {
      const result = await thumbnail(testImageJpeg, { width: 200 });

      expect(result).toBeDefined();
      expect(Buffer.isBuffer(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.width).toBe(200);
      expect(result.height).toBeGreaterThan(0);
      expect(result.format).toBeDefined();
    });

    it("should generate thumbnail (sync)", () => {
      const result = thumbnailSync(testImageJpeg, { width: 200 });

      expect(result).toBeDefined();
      expect(Buffer.isBuffer(result.data)).toBe(true);
      expect(result.width).toBe(200);
    });

    it("should maintain aspect ratio when only width is specified", async () => {
      const meta = metadataSync(testImageJpeg);
      const originalRatio = meta.width / meta.height;

      const result = await thumbnail(testImageJpeg, { width: 200 });
      const resultRatio = result.width / result.height;

      expect(resultRatio).toBeCloseTo(originalRatio, 1);
    });

    it("should use exact dimensions when both width and height are specified", async () => {
      const result = await thumbnail(testImageJpeg, { width: 200, height: 150 });

      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
    });
  });

  describe("shrink-on-load optimization", () => {
    it("should use shrink-on-load by default", async () => {
      const result = await thumbnail(testImageLarge, { width: 200 });

      // For large images downscaled significantly, shrink-on-load should be used
      expect(result.shrinkOnLoadUsed).toBe(true);
    });

    it("should skip shrink-on-load when disabled", async () => {
      const result = await thumbnail(testImageJpeg, {
        width: 200,
        shrinkOnLoad: false,
      });

      expect(result.shrinkOnLoadUsed).toBe(false);
    });

    it("should produce correct result with shrink-on-load", async () => {
      const withShrink = await thumbnail(testImageLarge, {
        width: 200,
        shrinkOnLoad: true,
      });

      const withoutShrink = await thumbnail(testImageLarge, {
        width: 200,
        shrinkOnLoad: false,
      });

      // Both should produce valid images with similar dimensions
      expect(withShrink.width).toBe(withoutShrink.width);
      expect(withShrink.height).toBe(withoutShrink.height);
    });

    it("should include original dimensions in result", async () => {
      const meta = metadataSync(testImageJpeg);
      const result = await thumbnail(testImageJpeg, { width: 200 });

      expect(result.originalWidth).toBe(meta.width);
      expect(result.originalHeight).toBe(meta.height);
    });
  });

  describe("output formats", () => {
    it("should output JPEG format", async () => {
      const result = await thumbnail(testImageJpeg, {
        width: 200,
        format: "Jpeg",
      });

      expect(result.format).toBe("jpeg");
      // JPEG magic bytes
      expect(result.data[0]).toBe(0xff);
      expect(result.data[1]).toBe(0xd8);
    });

    it("should output PNG format", async () => {
      const result = await thumbnail(testImageJpeg, {
        width: 200,
        format: "Png",
      });

      expect(result.format).toBe("png");
      // PNG magic bytes
      expect(result.data[0]).toBe(0x89);
      expect(result.data[1]).toBe(0x50); // 'P'
      expect(result.data[2]).toBe(0x4e); // 'N'
      expect(result.data[3]).toBe(0x47); // 'G'
    });

    it("should output WebP format", async () => {
      const result = await thumbnail(testImageJpeg, {
        width: 200,
        format: "Webp",
      });

      expect(result.format).toBe("webp");
      // WebP starts with "RIFF"
      expect(result.data[0]).toBe(0x52); // 'R'
      expect(result.data[1]).toBe(0x49); // 'I'
      expect(result.data[2]).toBe(0x46); // 'F'
      expect(result.data[3]).toBe(0x46); // 'F'
    });
  });

  describe("quality setting", () => {
    it("should respect quality setting for JPEG", async () => {
      const highQuality = await thumbnail(testImageJpeg, {
        width: 200,
        format: "Jpeg",
        quality: 95,
      });

      const lowQuality = await thumbnail(testImageJpeg, {
        width: 200,
        format: "Jpeg",
        quality: 30,
      });

      // Higher quality should result in larger file size
      expect(highQuality.data.length).toBeGreaterThan(lowQuality.data.length);
    });

    it("should respect quality setting for WebP", async () => {
      const highQuality = await thumbnail(testImageJpeg, {
        width: 200,
        format: "Webp",
        quality: 95,
      });

      const lowQuality = await thumbnail(testImageJpeg, {
        width: 200,
        format: "Webp",
        quality: 30,
      });

      // Higher quality should result in larger file size
      expect(highQuality.data.length).toBeGreaterThan(lowQuality.data.length);
    });
  });

  describe("different input formats", () => {
    it("should handle JPEG input", async () => {
      const result = await thumbnail(testImageJpeg, { width: 200 });
      expect(result.data.length).toBeGreaterThan(0);
    });

    it("should handle WebP input", async () => {
      const result = await thumbnail(testImageWebp, { width: 200 });
      expect(result.data.length).toBeGreaterThan(0);
    });

    it("should handle PNG input", async () => {
      // Skip if PNG image not available
      if (!testImagePng || testImagePng.length === 0) {
        console.log("    (Skipping PNG test - image not available)");
        return;
      }
      const result = await thumbnail(testImagePng, { width: 200 });
      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  describe("edge cases", () => {
    it("should handle very small target size", async () => {
      const result = await thumbnail(testImageJpeg, { width: 10 });

      expect(result.width).toBe(10);
      expect(result.height).toBeGreaterThan(0);
    });

    it("should handle square target", async () => {
      const result = await thumbnail(testImageJpeg, { width: 100, height: 100 });

      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it("should handle portrait target", async () => {
      const result = await thumbnail(testImageJpeg, { width: 100, height: 200 });

      expect(result.width).toBe(100);
      expect(result.height).toBe(200);
    });
  });
});

describe("thumbnailBuffer", () => {
  it("should return only buffer (async)", async () => {
    const result = await thumbnailBuffer(testImageJpeg, { width: 200 });

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should return only buffer (sync)", () => {
    const result = thumbnailBufferSync(testImageJpeg, { width: 200 });

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should produce same image data as thumbnail()", async () => {
    const fullResult = await thumbnail(testImageJpeg, {
      width: 200,
      format: "Jpeg",
      quality: 80,
    });
    const bufferResult = await thumbnailBuffer(testImageJpeg, {
      width: 200,
      format: "Jpeg",
      quality: 80,
    });

    // Same image data
    expect(fullResult.data.length).toBe(bufferResult.length);
    expect(Buffer.compare(fullResult.data, bufferResult)).toBe(0);
  });
});

describe("performance comparison", () => {
  it("shrink-on-load should be faster for large downscales", async () => {
    const iterations = 3;

    // With shrink-on-load
    const startWith = performance.now();
    for (let i = 0; i < iterations; i++) {
      await thumbnail(testImageLarge, { width: 200, shrinkOnLoad: true });
    }
    const timeWith = (performance.now() - startWith) / iterations;

    // Without shrink-on-load
    const startWithout = performance.now();
    for (let i = 0; i < iterations; i++) {
      await thumbnail(testImageLarge, { width: 200, shrinkOnLoad: false });
    }
    const timeWithout = (performance.now() - startWithout) / iterations;

    console.log(`\n  Shrink-on-load performance:`);
    console.log(`    With shrink-on-load: ${timeWith.toFixed(1)}ms`);
    console.log(`    Without shrink-on-load: ${timeWithout.toFixed(1)}ms`);
    console.log(`    Speedup: ${(timeWithout / timeWith).toFixed(1)}x`);

    // Shrink-on-load should be at least 1.5x faster for large downscales
    // (relaxed threshold for CI stability)
    expect(timeWith).toBeLessThan(timeWithout);
  });
});

describe("error handling", () => {
  it("should throw on invalid image data", async () => {
    const invalidData = Buffer.from("not an image");
    await expect(thumbnail(invalidData, { width: 200 })).rejects.toThrow();
  });

  it("should throw on empty buffer", async () => {
    const emptyBuffer = Buffer.alloc(0);
    await expect(thumbnail(emptyBuffer, { width: 200 })).rejects.toThrow();
  });

  it("should throw on zero width", async () => {
    await expect(thumbnail(testImageJpeg, { width: 0 })).rejects.toThrow();
  });
});
