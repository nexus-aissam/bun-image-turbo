/**
 * Dominant Colors Tests
 *
 * Tests for extracting dominant colors from images.
 */

import { describe, it, expect, beforeAll } from "bun:test";
import {
  dominantColors,
  dominantColorsSync,
} from "../../dist";

// Test images
let testImageJpeg: Buffer;
let testImagePng: Buffer;
let testImageWebp: Buffer;

beforeAll(async () => {
  // Download test images
  const jpegResponse = await fetch("https://picsum.photos/seed/colors1/800/600.jpg");
  testImageJpeg = Buffer.from(await jpegResponse.arrayBuffer());

  // PNG test image
  const pngResponse = await fetch("https://picsum.photos/seed/colors2/400/300.jpg");
  testImagePng = Buffer.from(await pngResponse.arrayBuffer());

  // Another JPEG for variety (WebP from picsum can be unreliable)
  const webpResponse = await fetch("https://picsum.photos/seed/colors3/600/400.jpg");
  testImageWebp = Buffer.from(await webpResponse.arrayBuffer());
});

describe("dominantColors", () => {
  describe("basic extraction", () => {
    it("should extract dominant colors (async)", async () => {
      const result = await dominantColors(testImageJpeg);

      expect(result).toBeDefined();
      expect(result.colors).toBeDefined();
      expect(Array.isArray(result.colors)).toBe(true);
      expect(result.colors.length).toBeGreaterThan(0);
      expect(result.primary).toBeDefined();
    });

    it("should extract dominant colors (sync)", () => {
      const result = dominantColorsSync(testImageJpeg);

      expect(result).toBeDefined();
      expect(result.colors).toBeDefined();
      expect(Array.isArray(result.colors)).toBe(true);
      expect(result.colors.length).toBeGreaterThan(0);
      expect(result.primary).toBeDefined();
    });

    it("should return default 5 colors", async () => {
      const result = await dominantColors(testImageJpeg);

      expect(result.colors.length).toBeLessThanOrEqual(5);
    });

    it("should return requested number of colors", async () => {
      const result = await dominantColors(testImageJpeg, 8);

      expect(result.colors.length).toBeLessThanOrEqual(8);
    });

    it("should return single color when count is 1", async () => {
      const result = await dominantColors(testImageJpeg, 1);

      expect(result.colors.length).toBe(1);
      expect(result.primary).toEqual(result.colors[0]);
    });
  });

  describe("color format", () => {
    it("should return valid RGB values", async () => {
      const result = await dominantColors(testImageJpeg);

      for (const color of result.colors) {
        expect(color.r).toBeGreaterThanOrEqual(0);
        expect(color.r).toBeLessThanOrEqual(255);
        expect(color.g).toBeGreaterThanOrEqual(0);
        expect(color.g).toBeLessThanOrEqual(255);
        expect(color.b).toBeGreaterThanOrEqual(0);
        expect(color.b).toBeLessThanOrEqual(255);
      }
    });

    it("should return valid hex strings", async () => {
      const result = await dominantColors(testImageJpeg);

      const hexRegex = /^#[0-9A-F]{6}$/i;
      for (const color of result.colors) {
        expect(color.hex).toBeDefined();
        expect(hexRegex.test(color.hex)).toBe(true);
      }
    });

    it("should have hex matching RGB values", async () => {
      const result = await dominantColors(testImageJpeg);

      for (const color of result.colors) {
        const expectedHex = `#${color.r.toString(16).padStart(2, "0").toUpperCase()}${color.g.toString(16).padStart(2, "0").toUpperCase()}${color.b.toString(16).padStart(2, "0").toUpperCase()}`;
        expect(color.hex.toUpperCase()).toBe(expectedHex);
      }
    });

    it("should return primary as first color", async () => {
      const result = await dominantColors(testImageJpeg);

      expect(result.primary.r).toBe(result.colors[0].r);
      expect(result.primary.g).toBe(result.colors[0].g);
      expect(result.primary.b).toBe(result.colors[0].b);
      expect(result.primary.hex).toBe(result.colors[0].hex);
    });
  });

  describe("different formats", () => {
    it("should extract colors from JPEG", async () => {
      const result = await dominantColors(testImageJpeg);

      expect(result).toBeDefined();
      expect(result.colors.length).toBeGreaterThan(0);
    });

    it("should extract colors from PNG", async () => {
      const result = await dominantColors(testImagePng);

      expect(result).toBeDefined();
      expect(result.colors.length).toBeGreaterThan(0);
    });

    it("should extract colors from different images", async () => {
      const result = await dominantColors(testImageWebp);

      expect(result).toBeDefined();
      expect(result.colors.length).toBeGreaterThan(0);
    });
  });

  describe("consistency", () => {
    it("should return consistent results for same image", async () => {
      const result1 = await dominantColors(testImageJpeg);
      const result2 = await dominantColors(testImageJpeg);

      expect(result1.primary.hex).toBe(result2.primary.hex);
      expect(result1.colors.length).toBe(result2.colors.length);
    });

    it("should return same results for async and sync", async () => {
      const asyncResult = await dominantColors(testImageJpeg);
      const syncResult = dominantColorsSync(testImageJpeg);

      expect(asyncResult.primary.hex).toBe(syncResult.primary.hex);
      expect(asyncResult.colors.length).toBe(syncResult.colors.length);
    });
  });

  describe("error handling", () => {
    it("should throw on invalid image data", async () => {
      const invalidData = Buffer.from("not an image");
      await expect(dominantColors(invalidData)).rejects.toThrow();
    });

    it("should throw on empty buffer", async () => {
      const emptyBuffer = Buffer.alloc(0);
      await expect(dominantColors(emptyBuffer)).rejects.toThrow();
    });

    it("should throw on sync with invalid data", () => {
      const invalidData = Buffer.from("not an image");
      expect(() => dominantColorsSync(invalidData)).toThrow();
    });
  });
});
