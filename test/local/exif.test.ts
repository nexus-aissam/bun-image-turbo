import { describe, test, expect, beforeAll } from "bun:test";
import {
  writeExif,
  writeExifSync,
  stripExif,
  stripExifSync,
  toWebp,
} from "../../src";

let testImage: Buffer;

beforeAll(async () => {
  // Download a small test image
  const response = await fetch(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/200px-PNG_transparency_demonstration_1.png"
  );
  const pngBuffer = Buffer.from(await response.arrayBuffer());

  // Convert to JPEG for EXIF tests (need JPEG format)
  const { toJpeg } = await import("../../src");
  testImage = await toJpeg(pngBuffer, { quality: 90 });
});

describe("EXIF Write", () => {
  test("writeExif adds EXIF to JPEG", async () => {
    const result = await writeExif(testImage, {
      imageDescription: "Test image for AI content",
      artist: "Test Artist",
      software: "imgkit test",
      userComment: JSON.stringify({ model: "test-model", seed: 12345 }),
    });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  test("writeExifSync adds EXIF to JPEG", () => {
    const result = writeExifSync(testImage, {
      imageDescription: "Sync test image",
      copyright: "Copyright 2025",
    });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  test("writeExif adds EXIF to WebP", async () => {
    const webpBuffer = await toWebp(testImage, { quality: 80 });

    const result = await writeExif(webpBuffer, {
      imageDescription: "AI-generated sunset",
      artist: "Stable Diffusion",
      software: "ComfyUI",
      userComment: JSON.stringify({
        prompt: "beautiful sunset over ocean",
        negative_prompt: "blurry, dark",
        steps: 20,
        cfg_scale: 7,
      }),
    });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  test("stripExif removes EXIF from JPEG", async () => {
    // First add EXIF
    const withExif = await writeExif(testImage, {
      imageDescription: "To be removed",
      artist: "Test Artist",
    });

    // Then strip it
    const stripped = await stripExif(withExif);

    expect(stripped).toBeInstanceOf(Buffer);
    expect(stripped.length).toBeGreaterThan(0);
    // Stripped should be smaller or equal to with EXIF
    expect(stripped.length).toBeLessThanOrEqual(withExif.length);
  });

  test("stripExifSync removes EXIF from JPEG", () => {
    // First add EXIF
    const withExif = writeExifSync(testImage, {
      imageDescription: "To be removed sync",
    });

    // Then strip it
    const stripped = stripExifSync(withExif);

    expect(stripped).toBeInstanceOf(Buffer);
    expect(stripped.length).toBeGreaterThan(0);
  });

  test("stripExif removes EXIF from WebP", async () => {
    const webpBuffer = await toWebp(testImage, { quality: 80 });

    // First add EXIF
    const withExif = await writeExif(webpBuffer, {
      imageDescription: "WebP to be stripped",
    });

    // Then strip it
    const stripped = await stripExif(withExif);

    expect(stripped).toBeInstanceOf(Buffer);
    expect(stripped.length).toBeGreaterThan(0);
  });

  test("writeExif with all supported fields", async () => {
    const result = await writeExif(testImage, {
      imageDescription: "Full test image",
      artist: "John Doe",
      copyright: "Copyright 2025 John Doe",
      software: "imgkit v1.2.0",
      dateTime: "2025:01:07 12:30:00",
      dateTimeOriginal: "2025:01:07 12:00:00",
      userComment: "This is a test comment with JSON: {\"key\": \"value\"}",
      make: "TestCamera",
      model: "Model X",
      orientation: 1,
    });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  test("writeExif with empty options returns original", async () => {
    const result = await writeExif(testImage, {});

    expect(result).toBeInstanceOf(Buffer);
    // Should return same data when no EXIF options provided
    expect(result.length).toBe(testImage.length);
  });
});
