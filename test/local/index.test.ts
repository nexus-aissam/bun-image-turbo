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
  toTensor,
  toTensorSync,
  version,
} from "../../dist/index.mjs";

let testImage: Buffer;

beforeAll(async () => {
  // Download a test image
  const response = await fetch("https://picsum.photos/800/600");
  testImage = Buffer.from(await response.arrayBuffer());
});

describe("imgkit", () => {
  describe("version", () => {
    it("should return version string", () => {
      const v = version();
      expect(typeof v).toBe("string");
      expect(v).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  describe("metadata", () => {
    it("should get image metadata (async)", async () => {
      const meta = await metadata(testImage);

      expect(meta.width).toBe(800);
      expect(meta.height).toBe(600);
      expect(meta.format).toBe("jpeg");
      expect(meta.channels).toBeGreaterThan(0);
      expect(typeof meta.hasAlpha).toBe("boolean");
    });

    it("should get image metadata (sync)", () => {
      const meta = metadataSync(testImage);

      expect(meta.width).toBe(800);
      expect(meta.height).toBe(600);
      expect(meta.format).toBe("jpeg");
    });
  });

  describe("resize", () => {
    it("should resize image to specific dimensions (async)", async () => {
      const resized = await resize(testImage, { width: 400, height: 300 });
      const meta = await metadata(resized);

      expect(meta.width).toBe(400);
      expect(meta.height).toBe(300);
    });

    it("should resize image width only (async)", async () => {
      const resized = await resize(testImage, { width: 400 });
      const meta = await metadata(resized);

      expect(meta.width).toBe(400);
      expect(meta.height).toBe(300); // Maintains aspect ratio
    });

    it("should resize image (sync)", () => {
      const resized = resizeSync(testImage, { width: 200 });
      const meta = metadataSync(resized);

      expect(meta.width).toBe(200);
    });
  });

  describe("crop", () => {
    it("should crop image with explicit coordinates (async)", async () => {
      const cropped = await crop(testImage, { x: 100, y: 50, width: 400, height: 300 });
      const meta = await metadata(cropped);

      expect(meta.width).toBe(400);
      expect(meta.height).toBe(300);
    });

    it("should crop image with explicit coordinates (sync)", () => {
      const cropped = cropSync(testImage, { x: 0, y: 0, width: 200, height: 200 });
      const meta = metadataSync(cropped);

      expect(meta.width).toBe(200);
      expect(meta.height).toBe(200);
    });

    it("should crop to aspect ratio 1:1 (centered)", async () => {
      const cropped = await crop(testImage, { aspectRatio: "1:1" });
      const meta = await metadata(cropped);

      // 800x600 -> 1:1 should be 600x600 (centered)
      expect(meta.width).toBe(600);
      expect(meta.height).toBe(600);
    });

    it("should crop to aspect ratio 16:9", async () => {
      const cropped = await crop(testImage, { aspectRatio: "16:9" });
      const meta = await metadata(cropped);

      // 800x600 is already close to 16:9, so width stays, height adjusts
      expect(meta.width).toBe(800);
      expect(meta.height).toBe(450); // 800 / 16 * 9 = 450
    });

    it("should crop with gravity north", async () => {
      const cropped = await crop(testImage, { width: 400, height: 300, gravity: "north" });
      const meta = await metadata(cropped);

      expect(meta.width).toBe(400);
      expect(meta.height).toBe(300);
    });

    it("should crop with gravity southEast", async () => {
      const cropped = await crop(testImage, { width: 200, height: 200, gravity: "southEast" });
      const meta = await metadata(cropped);

      expect(meta.width).toBe(200);
      expect(meta.height).toBe(200);
    });

    it("should crop with gravity center (default)", async () => {
      const cropped = await crop(testImage, { width: 300, height: 300, gravity: "center" });
      const meta = await metadata(cropped);

      expect(meta.width).toBe(300);
      expect(meta.height).toBe(300);
    });

    it("should crop with gravity south", async () => {
      const cropped = await crop(testImage, { width: 400, height: 200, gravity: "south" });
      const meta = await metadata(cropped);

      expect(meta.width).toBe(400);
      expect(meta.height).toBe(200);
    });

    it("should crop with gravity east", async () => {
      const cropped = await crop(testImage, { width: 200, height: 400, gravity: "east" });
      const meta = await metadata(cropped);

      expect(meta.width).toBe(200);
      expect(meta.height).toBe(400);
    });

    it("should crop with gravity west", async () => {
      const cropped = await crop(testImage, { width: 200, height: 400, gravity: "west" });
      const meta = await metadata(cropped);

      expect(meta.width).toBe(200);
      expect(meta.height).toBe(400);
    });

    it("should crop with gravity northWest", async () => {
      const cropped = await crop(testImage, { width: 250, height: 250, gravity: "northWest" });
      const meta = await metadata(cropped);

      expect(meta.width).toBe(250);
      expect(meta.height).toBe(250);
    });

    it("should crop with gravity northEast", async () => {
      const cropped = await crop(testImage, { width: 250, height: 250, gravity: "northEast" });
      const meta = await metadata(cropped);

      expect(meta.width).toBe(250);
      expect(meta.height).toBe(250);
    });

    it("should crop with gravity southWest", async () => {
      const cropped = await crop(testImage, { width: 250, height: 250, gravity: "southWest" });
      const meta = await metadata(cropped);

      expect(meta.width).toBe(250);
      expect(meta.height).toBe(250);
    });

    it("should crop to aspect ratio 4:3", async () => {
      const cropped = await crop(testImage, { aspectRatio: "4:3" });
      const meta = await metadata(cropped);

      // 800x600 -> 4:3 should be 800x600 (already 4:3)
      expect(meta.width).toBe(800);
      expect(meta.height).toBe(600);
    });

    it("should crop to aspect ratio 3:2", async () => {
      const cropped = await crop(testImage, { aspectRatio: "3:2" });
      const meta = await metadata(cropped);

      // 800x600 is 4:3, crop to 3:2 (wider) keeps width, adjusts height
      expect(meta.width).toBe(800);
      expect(meta.height).toBe(533); // 800 / 3 * 2 = 533.33
    });

    it("should crop to aspect ratio 9:16 (portrait)", async () => {
      const cropped = await crop(testImage, { aspectRatio: "9:16" });
      const meta = await metadata(cropped);

      // 800x600 -> 9:16 portrait, height stays, width adjusts
      expect(meta.width).toBe(338); // 600 / 16 * 9 = 337.5 rounds to 338
      expect(meta.height).toBe(600);
    });

    it("should crop to aspect ratio with gravity north", async () => {
      const cropped = await crop(testImage, { aspectRatio: "1:1", gravity: "north" });
      const meta = await metadata(cropped);

      expect(meta.width).toBe(600);
      expect(meta.height).toBe(600);
    });

    it("should crop to aspect ratio with gravity southWest", async () => {
      const cropped = await crop(testImage, { aspectRatio: "16:9", gravity: "southWest" });
      const meta = await metadata(cropped);

      expect(meta.width).toBe(800);
      expect(meta.height).toBe(450);
    });

    it("should handle crop at image boundaries", async () => {
      // Crop from the edge of the image
      const cropped = await crop(testImage, { x: 700, y: 500, width: 100, height: 100 });
      const meta = await metadata(cropped);

      expect(meta.width).toBe(100);
      expect(meta.height).toBe(100);
    });

    it("should crop small region from center", async () => {
      const cropped = await crop(testImage, { width: 50, height: 50, gravity: "center" });
      const meta = await metadata(cropped);

      expect(meta.width).toBe(50);
      expect(meta.height).toBe(50);
    });
  });

  describe("toJpeg", () => {
    it("should convert to JPEG (async)", async () => {
      const jpeg = await toJpeg(testImage, { quality: 80 });
      const meta = await metadata(jpeg);

      expect(meta.format).toBe("jpeg");
      expect(jpeg.length).toBeGreaterThan(0);
    });

    it("should convert to JPEG (sync)", () => {
      const jpeg = toJpegSync(testImage, { quality: 80 });
      const meta = metadataSync(jpeg);

      expect(meta.format).toBe("jpeg");
    });

    it("should respect quality setting", async () => {
      const highQuality = await toJpeg(testImage, { quality: 95 });
      const lowQuality = await toJpeg(testImage, { quality: 30 });

      expect(highQuality.length).toBeGreaterThan(lowQuality.length);
    });
  });

  describe("toPng", () => {
    it("should convert to PNG (async)", async () => {
      const png = await toPng(testImage);
      const meta = await metadata(png);

      expect(meta.format).toBe("png");
    });

    it("should convert to PNG (sync)", () => {
      const png = toPngSync(testImage);
      const meta = metadataSync(png);

      expect(meta.format).toBe("png");
    });
  });

  describe("toWebp", () => {
    it("should convert to WebP (async)", async () => {
      const webp = await toWebp(testImage, { quality: 80 });
      const meta = await metadata(webp);

      expect(meta.format).toBe("webp");
    });

    it("should convert to WebP (sync)", () => {
      const webp = toWebpSync(testImage, { quality: 80 });
      const meta = metadataSync(webp);

      expect(meta.format).toBe("webp");
    });

    it("should produce smaller file than JPEG", async () => {
      const jpeg = await toJpeg(testImage, { quality: 80 });
      const webp = await toWebp(testImage, { quality: 80 });

      expect(webp.length).toBeLessThan(jpeg.length);
    });
  });

  describe("transform", () => {
    it("should resize and convert format (async)", async () => {
      const result = await transform(testImage, {
        resize: { width: 300 },
        output: { format: "webp", webp: { quality: 75 } },
      });

      const meta = await metadata(result);
      expect(meta.width).toBe(300);
      expect(meta.format).toBe("webp");
    });

    it("should resize and convert format (sync)", () => {
      const result = transformSync(testImage, {
        resize: { width: 300 },
        output: { format: "jpeg", jpeg: { quality: 75 } },
      });

      const meta = metadataSync(result);
      expect(meta.width).toBe(300);
      expect(meta.format).toBe("jpeg");
    });

    it("should apply grayscale", async () => {
      const result = await transform(testImage, {
        grayscale: true,
        output: { format: "jpeg" },
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle resize with fit cover option", async () => {
      // Use fill to force exact dimensions
      const result = await transform(testImage, {
        resize: { width: 100, height: 100, fit: "fill" },
        output: { format: "webp" },
      });

      const meta = await metadata(result);
      expect(meta.width).toBe(100);
      expect(meta.height).toBe(100);
    });

    it("should crop then resize in pipeline", async () => {
      // Crop to 1:1 aspect ratio first, then resize
      const result = await transform(testImage, {
        crop: { aspectRatio: "1:1" },
        resize: { width: 200 },
        output: { format: "webp" },
      });

      const meta = await metadata(result);
      expect(meta.width).toBe(200);
      expect(meta.height).toBe(200); // 1:1 maintained after resize
      expect(meta.format).toBe("webp");
    });

    it("should crop with gravity then resize", async () => {
      const result = await transform(testImage, {
        crop: { width: 400, height: 400, gravity: "center" },
        resize: { width: 100 },
        output: { format: "jpeg" },
      });

      const meta = await metadata(result);
      expect(meta.width).toBe(100);
      expect(meta.height).toBe(100);
    });
  });

  describe("blurhash", () => {
    it("should generate blurhash (async)", async () => {
      const result = await blurhash(testImage, 4, 3);

      expect(result).toBeDefined();
      expect(result.hash).toBeDefined();
      expect(typeof result.hash).toBe("string");
      expect(result.hash.length).toBeGreaterThan(0);
    });

    it("should generate blurhash (sync)", () => {
      const result = blurhashSync(testImage, 4, 3);

      expect(result).toBeDefined();
      expect(result.hash).toBeDefined();
      expect(typeof result.hash).toBe("string");
    });

    it("should generate different hashes for different component counts", async () => {
      const hash1 = await blurhash(testImage, 4, 3);
      const hash2 = await blurhash(testImage, 6, 4);

      expect(hash1.hash).not.toBe(hash2.hash);
    });
  });

  describe("error handling", () => {
    it("should throw on invalid input", async () => {
      const invalidBuffer = Buffer.from("not an image");

      await expect(metadata(invalidBuffer)).rejects.toThrow();
    });

    it("should throw on empty buffer", async () => {
      const emptyBuffer = Buffer.alloc(0);

      await expect(metadata(emptyBuffer)).rejects.toThrow();
    });
  });

  describe("toTensor", () => {
    it("should convert image to tensor (async)", async () => {
      const tensor = await toTensor(testImage, {
        width: 224,
        height: 224,
        normalization: "Imagenet",
        layout: "Chw",
      });

      expect(tensor.shape).toEqual([3, 224, 224]);
      expect(tensor.dtype).toBe("Float32");
      expect(tensor.layout).toBe("Chw");
      expect(tensor.width).toBe(224);
      expect(tensor.height).toBe(224);
      expect(tensor.channels).toBe(3);
      // Float32: 3 * 224 * 224 * 4 bytes = 602112 bytes
      expect(tensor.data.length).toBe(3 * 224 * 224 * 4);
    });

    it("should convert image to tensor (sync)", () => {
      const tensor = toTensorSync(testImage, {
        width: 224,
        height: 224,
        layout: "Chw",
      });

      expect(tensor.shape).toEqual([3, 224, 224]);
      expect(tensor.dtype).toBe("Float32");
    });

    it("should add batch dimension when requested", async () => {
      const tensor = await toTensor(testImage, {
        width: 224,
        height: 224,
        batch: true,
      });

      expect(tensor.shape).toEqual([1, 3, 224, 224]);
    });

    it("should use HWC layout for TensorFlow", async () => {
      const tensor = await toTensor(testImage, {
        width: 224,
        height: 224,
        layout: "Hwc",
      });

      expect(tensor.shape).toEqual([224, 224, 3]);
      expect(tensor.layout).toBe("Hwc");
    });

    it("should support Uint8 dtype", async () => {
      const tensor = await toTensor(testImage, {
        width: 100,
        height: 100,
        dtype: "Uint8",
      });

      expect(tensor.dtype).toBe("Uint8");
      // Uint8: 3 * 100 * 100 * 1 byte = 30000 bytes
      expect(tensor.data.length).toBe(3 * 100 * 100);
    });

    it("should convert to Float32Array", async () => {
      const tensor = await toTensor(testImage, {
        width: 64,
        height: 64,
        normalization: "ZeroOne",
      });

      const float32 = tensor.toFloat32Array();
      expect(float32).toBeInstanceOf(Float32Array);
      expect(float32.length).toBe(3 * 64 * 64);
      // ZeroOne normalization: values should be between 0 and 1
      expect(float32[0]).toBeGreaterThanOrEqual(0);
      expect(float32[0]).toBeLessThanOrEqual(1);
    });

    it("should convert to Uint8Array", async () => {
      const tensor = await toTensor(testImage, {
        width: 64,
        height: 64,
        dtype: "Uint8",
      });

      const uint8 = tensor.toUint8Array();
      expect(uint8).toBeInstanceOf(Uint8Array);
      expect(uint8.length).toBe(3 * 64 * 64);
    });

    it("should apply CLIP normalization", async () => {
      const tensor = await toTensor(testImage, {
        width: 224,
        height: 224,
        normalization: "Clip",
      });

      expect(tensor.dtype).toBe("Float32");
      const float32 = tensor.toFloat32Array();
      // CLIP normalized values can be negative (after subtracting mean)
      expect(float32.length).toBe(3 * 224 * 224);
    });

    it("should work without resize (original size)", async () => {
      const tensor = await toTensor(testImage);

      expect(tensor.width).toBe(800);
      expect(tensor.height).toBe(600);
      expect(tensor.shape).toEqual([3, 600, 800]);
    });
  });

  describe("WebP shrink-on-load", () => {
    let webpImage: Buffer;

    beforeAll(async () => {
      // Convert test image to WebP for shrink-on-load tests
      webpImage = await toWebp(testImage, { quality: 90 });
    });

    it("should resize WebP image (async)", async () => {
      const resized = await resize(webpImage, { width: 200 });
      const meta = await metadata(resized);

      expect(meta.width).toBe(200);
      expect(meta.height).toBe(150); // Maintains aspect ratio (800x600 -> 200x150)
    });

    it("should resize WebP image (sync)", () => {
      const resized = resizeSync(webpImage, { width: 200 });
      const meta = metadataSync(resized);

      expect(meta.width).toBe(200);
      expect(meta.height).toBe(150);
    });

    it("should transform WebP with resize and output WebP", async () => {
      const result = await transform(webpImage, {
        resize: { width: 200 },
        output: { format: "webp", webp: { quality: 80 } },
      });

      const meta = await metadata(result);
      expect(meta.width).toBe(200);
      expect(meta.height).toBe(150);
      expect(meta.format).toBe("webp");
    });

    it("should handle large downscale with shrink-on-load", async () => {
      // Create a larger WebP image for testing aggressive downscale
      const largeWebp = await transform(testImage, {
        resize: { width: 1600, height: 1200 },
        output: { format: "webp" },
      });

      // Downscale to small thumbnail (8x reduction)
      const thumbnail = await transform(largeWebp, {
        resize: { width: 200 },
        output: { format: "webp" },
      });

      const meta = await metadata(thumbnail);
      expect(meta.width).toBe(200);
      expect(meta.format).toBe("webp");
    });

    it("should resize WebP with specific height", async () => {
      const resized = await resize(webpImage, { height: 150 });
      const meta = await metadata(resized);

      expect(meta.height).toBe(150);
      expect(meta.width).toBe(200); // Maintains aspect ratio
    });

    it("should resize WebP with both width and height", async () => {
      const result = await transform(webpImage, {
        resize: { width: 100, height: 100, fit: "fill" },
        output: { format: "webp" },
      });

      const meta = await metadata(result);
      expect(meta.width).toBe(100);
      expect(meta.height).toBe(100);
    });
  });
});
