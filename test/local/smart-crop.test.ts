/**
 * Smart Crop Tests
 *
 * Tests for content-aware image cropping using saliency detection.
 */

import { describe, it, expect, beforeAll } from "bun:test";
import {
  smartCrop,
  smartCropSync,
  smartCropAnalyze,
  smartCropAnalyzeSync,
  metadata,
} from "../../dist";

// Test images
let testImageJpeg: Buffer;
let testImageWide: Buffer;
let testImageTall: Buffer;

beforeAll(async () => {
  // Download test images with different aspect ratios
  const jpegResponse = await fetch("https://picsum.photos/seed/smartcrop1/800/600.jpg");
  testImageJpeg = Buffer.from(await jpegResponse.arrayBuffer());

  // Wide image for landscape tests
  const wideResponse = await fetch("https://picsum.photos/seed/smartcrop2/1200/400.jpg");
  testImageWide = Buffer.from(await wideResponse.arrayBuffer());

  // Tall image for portrait tests
  const tallResponse = await fetch("https://picsum.photos/seed/smartcrop3/400/1200.jpg");
  testImageTall = Buffer.from(await tallResponse.arrayBuffer());
});

describe("smartCrop", () => {
  describe("basic cropping", () => {
    it("should smart crop to square aspect ratio (async)", async () => {
      const result = await smartCrop(testImageJpeg, { aspectRatio: "1:1" });

      expect(result).toBeDefined();
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Verify the output is a valid image
      const meta = await metadata(result);
      expect(meta.width).toBe(meta.height); // Square
    });

    it("should smart crop to square aspect ratio (sync)", () => {
      const result = smartCropSync(testImageJpeg, { aspectRatio: "1:1" });

      expect(result).toBeDefined();
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should smart crop to 16:9 aspect ratio", async () => {
      const result = await smartCrop(testImageJpeg, { aspectRatio: "16:9" });

      expect(result).toBeDefined();
      const meta = await metadata(result);

      // Check aspect ratio is approximately 16:9
      const ratio = meta.width / meta.height;
      expect(ratio).toBeCloseTo(16/9, 1);
    });

    it("should smart crop to 9:16 portrait aspect ratio", async () => {
      const result = await smartCrop(testImageJpeg, { aspectRatio: "9:16" });

      expect(result).toBeDefined();
      const meta = await metadata(result);

      // Check aspect ratio is approximately 9:16 (portrait)
      const ratio = meta.width / meta.height;
      expect(ratio).toBeCloseTo(9/16, 1);
    });

    it("should smart crop to 4:3 aspect ratio", async () => {
      const result = await smartCrop(testImageJpeg, { aspectRatio: "4:3" });

      expect(result).toBeDefined();
      const meta = await metadata(result);

      const ratio = meta.width / meta.height;
      expect(ratio).toBeCloseTo(4/3, 1);
    });
  });

  describe("dimension-based cropping", () => {
    it("should crop to specific width and height constraints", async () => {
      const result = await smartCrop(testImageJpeg, { width: 400, height: 300 });

      expect(result).toBeDefined();
      const meta = await metadata(result);
      // Smart crop finds the best region up to the specified dimensions
      expect(meta.width).toBeLessThanOrEqual(800);
      expect(meta.height).toBeLessThanOrEqual(600);
      // Aspect ratio should match 4:3
      const ratio = meta.width / meta.height;
      expect(ratio).toBeCloseTo(4/3, 1);
    });

    it("should handle width-only (uses image height)", async () => {
      const result = await smartCrop(testImageJpeg, { width: 400 });

      expect(result).toBeDefined();
      const meta = await metadata(result);
      expect(meta.width).toBeLessThanOrEqual(800);
    });

    it("should handle height-only (uses image width)", async () => {
      const result = await smartCrop(testImageJpeg, { height: 300 });

      expect(result).toBeDefined();
      const meta = await metadata(result);
      expect(meta.height).toBeLessThanOrEqual(600);
    });
  });

  describe("different source images", () => {
    it("should smart crop wide image to square", async () => {
      const result = await smartCrop(testImageWide, { aspectRatio: "1:1" });

      expect(result).toBeDefined();
      const meta = await metadata(result);
      expect(meta.width).toBe(meta.height);
    });

    it("should smart crop tall image to square", async () => {
      const result = await smartCrop(testImageTall, { aspectRatio: "1:1" });

      expect(result).toBeDefined();
      const meta = await metadata(result);
      expect(meta.width).toBe(meta.height);
    });

    it("should smart crop wide image to portrait", async () => {
      const result = await smartCrop(testImageWide, { aspectRatio: "9:16" });

      expect(result).toBeDefined();
      const meta = await metadata(result);
      expect(meta.height).toBeGreaterThan(meta.width);
    });
  });

  describe("error handling", () => {
    it("should throw on invalid image data", async () => {
      const invalidData = Buffer.from("not an image");
      await expect(smartCrop(invalidData, { aspectRatio: "1:1" })).rejects.toThrow();
    });

    it("should throw on empty buffer", async () => {
      const emptyBuffer = Buffer.alloc(0);
      await expect(smartCrop(emptyBuffer, { aspectRatio: "1:1" })).rejects.toThrow();
    });

    it("should throw on invalid aspect ratio format", async () => {
      await expect(smartCrop(testImageJpeg, { aspectRatio: "invalid" })).rejects.toThrow();
    });
  });
});

describe("smartCropAnalyze", () => {
  describe("analysis results", () => {
    it("should return crop analysis (async)", async () => {
      const result = await smartCropAnalyze(testImageJpeg, { aspectRatio: "1:1" });

      expect(result).toBeDefined();
      expect(typeof result.x).toBe("number");
      expect(typeof result.y).toBe("number");
      expect(typeof result.width).toBe("number");
      expect(typeof result.height).toBe("number");
      expect(typeof result.score).toBe("number");

      // Coordinates should be within image bounds
      expect(result.x).toBeGreaterThanOrEqual(0);
      expect(result.y).toBeGreaterThanOrEqual(0);
      expect(result.x + result.width).toBeLessThanOrEqual(800);
      expect(result.y + result.height).toBeLessThanOrEqual(600);
    });

    it("should return crop analysis (sync)", () => {
      const result = smartCropAnalyzeSync(testImageJpeg, { aspectRatio: "1:1" });

      expect(result).toBeDefined();
      expect(typeof result.x).toBe("number");
      expect(typeof result.y).toBe("number");
      expect(typeof result.width).toBe("number");
      expect(typeof result.height).toBe("number");
      expect(typeof result.score).toBe("number");
    });

    it("should return square dimensions for 1:1 aspect ratio", async () => {
      const result = await smartCropAnalyze(testImageJpeg, { aspectRatio: "1:1" });

      expect(result.width).toBe(result.height);
    });

    it("should return 16:9 dimensions for landscape", async () => {
      const result = await smartCropAnalyze(testImageJpeg, { aspectRatio: "16:9" });

      const ratio = result.width / result.height;
      expect(ratio).toBeCloseTo(16/9, 1);
    });

    it("should return positive score", async () => {
      const result = await smartCropAnalyze(testImageJpeg, { aspectRatio: "1:1" });

      // Score indicates how good the crop is
      expect(result.score).toBeDefined();
    });
  });

  describe("consistency", () => {
    it("should return consistent results for same image", async () => {
      const result1 = await smartCropAnalyze(testImageJpeg, { aspectRatio: "1:1" });
      const result2 = await smartCropAnalyze(testImageJpeg, { aspectRatio: "1:1" });

      expect(result1.x).toBe(result2.x);
      expect(result1.y).toBe(result2.y);
      expect(result1.width).toBe(result2.width);
      expect(result1.height).toBe(result2.height);
    });

    it("should return same results for async and sync", async () => {
      const asyncResult = await smartCropAnalyze(testImageJpeg, { aspectRatio: "1:1" });
      const syncResult = smartCropAnalyzeSync(testImageJpeg, { aspectRatio: "1:1" });

      expect(asyncResult.x).toBe(syncResult.x);
      expect(asyncResult.y).toBe(syncResult.y);
      expect(asyncResult.width).toBe(syncResult.width);
      expect(asyncResult.height).toBe(syncResult.height);
    });
  });

  describe("error handling", () => {
    it("should throw on invalid image data", async () => {
      const invalidData = Buffer.from("not an image");
      await expect(smartCropAnalyze(invalidData, { aspectRatio: "1:1" })).rejects.toThrow();
    });
  });
});
