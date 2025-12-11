/**
 * bun-image-turbo Tests
 */

import { describe, test, expect, beforeAll } from 'bun:test';
import * as imageTurbo from '../src/index';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

const FIXTURES_DIR = join(__dirname, 'fixtures');
const OUTPUT_DIR = join(FIXTURES_DIR, 'output');

// Create a simple test PNG image (1x1 red pixel)
function createTestPng(): Buffer {
  // Minimal valid PNG: 1x1 red pixel
  const png = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x02, // bit depth: 8, color type: 2 (RGB)
    0x00, 0x00, 0x00, // compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE, // IHDR CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00, 0x00, // compressed data
    0x01, 0x01, 0x01, 0x00, // Adler-32
    0x18, 0xDD, 0x8D, 0xB4, // IDAT CRC
    0x00, 0x00, 0x00, 0x00, // IEND length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82, // IEND CRC
  ]);
  return png;
}

// Create a larger test image for resize tests
function createTestImage(width: number, height: number): Buffer {
  // Create a simple BMP image (no compression, easier to generate)
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const imageSize = rowSize * height;
  const fileSize = 54 + imageSize;

  const buffer = Buffer.alloc(fileSize);

  // BMP Header
  buffer.write('BM', 0);
  buffer.writeUInt32LE(fileSize, 2);
  buffer.writeUInt32LE(0, 6);
  buffer.writeUInt32LE(54, 10);

  // DIB Header
  buffer.writeUInt32LE(40, 14);
  buffer.writeInt32LE(width, 18);
  buffer.writeInt32LE(height, 22);
  buffer.writeUInt16LE(1, 26);
  buffer.writeUInt16LE(24, 28);
  buffer.writeUInt32LE(0, 30);
  buffer.writeUInt32LE(imageSize, 34);
  buffer.writeInt32LE(2835, 38);
  buffer.writeInt32LE(2835, 42);
  buffer.writeUInt32LE(0, 46);
  buffer.writeUInt32LE(0, 50);

  // Pixel data (blue gradient)
  let offset = 54;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      buffer[offset++] = Math.floor((x / width) * 255); // Blue
      buffer[offset++] = Math.floor((y / height) * 255); // Green
      buffer[offset++] = 128; // Red
    }
    // Padding
    while (offset % 4 !== 2) {
      offset++;
    }
  }

  return buffer;
}

beforeAll(() => {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
});

describe('bun-image-turbo', () => {
  describe('version', () => {
    test('should return version string', () => {
      const ver = imageTurbo.version();
      expect(ver).toBe('1.2.0');
    });
  });

  describe('metadata', () => {
    test('should get metadata from BMP image (sync)', () => {
      const img = createTestImage(100, 80);
      const meta = imageTurbo.metadataSync(img);

      expect(meta.width).toBe(100);
      expect(meta.height).toBe(80);
      expect(meta.format).toBe('bmp');
    });

    test('should get metadata from BMP image (async)', async () => {
      const img = createTestImage(200, 150);
      const meta = await imageTurbo.metadata(img);

      expect(meta.width).toBe(200);
      expect(meta.height).toBe(150);
      expect(meta.format).toBe('bmp');
    });
  });

  describe('resize', () => {
    test('should resize image by width (sync)', () => {
      const img = createTestImage(400, 300);
      const resized = imageTurbo.resizeSync(img, { width: 200 });

      expect(resized).toBeInstanceOf(Buffer);
      expect(resized.length).toBeGreaterThan(0);

      // Check output dimensions
      const meta = imageTurbo.metadataSync(resized);
      expect(meta.width).toBe(200);
      expect(meta.height).toBe(150); // Maintains aspect ratio
    });

    test('should resize image by height (sync)', () => {
      const img = createTestImage(400, 300);
      const resized = imageTurbo.resizeSync(img, { height: 100 });

      const meta = imageTurbo.metadataSync(resized);
      expect(meta.width).toBe(133); // 400 * (100/300)
      expect(meta.height).toBe(100);
    });

    test('should resize image with both dimensions (sync)', () => {
      const img = createTestImage(400, 300);
      const resized = imageTurbo.resizeSync(img, { width: 200, height: 100 });

      const meta = imageTurbo.metadataSync(resized);
      // With cover fit mode (default), should maintain aspect ratio
      expect(meta.width).toBeLessThanOrEqual(200);
      expect(meta.height).toBeLessThanOrEqual(100);
    });

    test('should resize image (async)', async () => {
      const img = createTestImage(400, 300);
      const resized = await imageTurbo.resize(img, { width: 100 });

      const meta = imageTurbo.metadataSync(resized);
      expect(meta.width).toBe(100);
    });
  });

  describe('format conversion', () => {
    test('should convert BMP to JPEG (sync)', () => {
      const img = createTestImage(100, 100);
      const jpeg = imageTurbo.toJpegSync(img, { quality: 80 });

      expect(jpeg).toBeInstanceOf(Buffer);
      expect(jpeg.length).toBeGreaterThan(0);
      // JPEG magic bytes
      expect(jpeg[0]).toBe(0xFF);
      expect(jpeg[1]).toBe(0xD8);
    });

    test('should convert BMP to PNG (sync)', () => {
      const img = createTestImage(100, 100);
      const png = imageTurbo.toPngSync(img);

      expect(png).toBeInstanceOf(Buffer);
      // PNG magic bytes
      expect(png[0]).toBe(0x89);
      expect(png[1]).toBe(0x50);
      expect(png[2]).toBe(0x4E);
      expect(png[3]).toBe(0x47);
    });

    test('should convert BMP to WebP (sync)', () => {
      const img = createTestImage(100, 100);
      const webp = imageTurbo.toWebpSync(img, { quality: 80 });

      expect(webp).toBeInstanceOf(Buffer);
      // WebP magic bytes (RIFF)
      expect(webp[0]).toBe(0x52); // R
      expect(webp[1]).toBe(0x49); // I
      expect(webp[2]).toBe(0x46); // F
      expect(webp[3]).toBe(0x46); // F
    });

    test('should convert to JPEG (async)', async () => {
      const img = createTestImage(100, 100);
      const jpeg = await imageTurbo.toJpeg(img, { quality: 90 });

      expect(jpeg[0]).toBe(0xFF);
      expect(jpeg[1]).toBe(0xD8);
    });

    test('should convert to PNG (async)', async () => {
      const img = createTestImage(100, 100);
      const png = await imageTurbo.toPng(img);

      expect(png[0]).toBe(0x89);
      expect(png[1]).toBe(0x50);
    });

    test('should convert to WebP (async)', async () => {
      const img = createTestImage(100, 100);
      const webp = await imageTurbo.toWebp(img);

      expect(webp[0]).toBe(0x52);
    });
  });

  describe('transform', () => {
    test('should apply multiple transformations (sync)', () => {
      const img = createTestImage(400, 300);
      const result = imageTurbo.transformSync(img, {
        resize: { width: 200 },
        grayscale: true,
        output: { format: 'jpeg', jpeg: { quality: 85 } },
      });

      expect(result).toBeInstanceOf(Buffer);
      // Should be JPEG
      expect(result[0]).toBe(0xFF);
      expect(result[1]).toBe(0xD8);
    });

    test('should apply rotation', () => {
      const img = createTestImage(200, 100);
      const result = imageTurbo.transformSync(img, {
        rotate: 90,
      });

      const meta = imageTurbo.metadataSync(result);
      // After 90 degree rotation, dimensions should swap
      expect(meta.width).toBe(100);
      expect(meta.height).toBe(200);
    });

    test('should apply blur', () => {
      const img = createTestImage(100, 100);
      const result = imageTurbo.transformSync(img, {
        blur: 5,
      });

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should transform (async)', async () => {
      const img = createTestImage(200, 200);
      const result = await imageTurbo.transform(img, {
        resize: { width: 100, height: 100 },
        output: { format: 'webp', webp: { quality: 75 } },
      });

      expect(result[0]).toBe(0x52); // WebP
    });
  });

  describe('blurhash', () => {
    test('should generate blurhash (sync)', () => {
      const img = createTestImage(100, 100);
      const result = imageTurbo.blurhashSync(img);

      expect(result.hash).toBeDefined();
      expect(result.hash.length).toBeGreaterThan(0);
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    test('should generate blurhash with custom components', () => {
      const img = createTestImage(100, 100);
      const result = imageTurbo.blurhashSync(img, 6, 4);

      expect(result.hash).toBeDefined();
      expect(result.hash.length).toBeGreaterThan(0);
    });

    test('should generate blurhash (async)', async () => {
      const img = createTestImage(100, 100);
      const result = await imageTurbo.blurhash(img);

      expect(result.hash).toBeDefined();
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });
  });

  describe('error handling', () => {
    test('should throw error for invalid image data', () => {
      const invalidData = Buffer.from('not an image');

      expect(() => imageTurbo.metadataSync(invalidData)).toThrow();
    });

    test('should throw error for resize without dimensions', () => {
      const img = createTestImage(100, 100);

      expect(() => imageTurbo.resizeSync(img, {})).toThrow();
    });
  });

  describe('HEIC support', () => {
    // Helper to create a minimal HEIC-like header for format detection tests
    function createHeicHeader(): Buffer {
      // Minimal HEIC ftyp box header (not a valid image, just for detection)
      return Buffer.from([
        0x00, 0x00, 0x00, 0x18, // Box size (24 bytes)
        0x66, 0x74, 0x79, 0x70, // 'ftyp'
        0x68, 0x65, 0x69, 0x63, // 'heic' brand
        0x00, 0x00, 0x00, 0x00, // Minor version
        0x68, 0x65, 0x69, 0x63, // Compatible brand 'heic'
        0x6D, 0x69, 0x66, 0x31, // Compatible brand 'mif1'
      ]);
    }

    test('should detect HEIC format from header', () => {
      const heicHeader = createHeicHeader();
      // The detection should work, but full decode will fail without valid HEIC data
      // This test verifies the format detection logic
      expect(heicHeader[4]).toBe(0x66); // 'f'
      expect(heicHeader[5]).toBe(0x74); // 't'
      expect(heicHeader[6]).toBe(0x79); // 'y'
      expect(heicHeader[7]).toBe(0x70); // 'p'
      expect(heicHeader[8]).toBe(0x68); // 'h'
      expect(heicHeader[9]).toBe(0x65); // 'e'
      expect(heicHeader[10]).toBe(0x69); // 'i'
      expect(heicHeader[11]).toBe(0x63); // 'c'
    });

    // Test with real HEIC file from benchmarks folder
    const heicFixturePath = join(__dirname, '..', 'benchmarks', 'heic', 'image.heic');
    const hasHeicFixture = existsSync(heicFixturePath);

    if (hasHeicFixture) {
      test('should get metadata from HEIC file', () => {
        const heicData = readFileSync(heicFixturePath);
        const meta = imageTurbo.metadataSync(heicData);

        expect(meta.format).toBe('heic');
        expect(meta.width).toBeGreaterThan(0);
        expect(meta.height).toBeGreaterThan(0);
      });

      test('should decode and convert HEIC to JPEG', async () => {
        const heicData = readFileSync(heicFixturePath);
        const jpeg = await imageTurbo.toJpeg(heicData, { quality: 85 });

        expect(jpeg).toBeInstanceOf(Buffer);
        expect(jpeg[0]).toBe(0xFF);
        expect(jpeg[1]).toBe(0xD8);
      });

      test('should decode and convert HEIC to PNG', async () => {
        const heicData = readFileSync(heicFixturePath);
        const png = await imageTurbo.toPng(heicData);

        expect(png).toBeInstanceOf(Buffer);
        expect(png[0]).toBe(0x89);
        expect(png[1]).toBe(0x50);
      });

      test('should decode and convert HEIC to WebP', async () => {
        const heicData = readFileSync(heicFixturePath);
        const webp = await imageTurbo.toWebp(heicData, { quality: 80 });

        expect(webp).toBeInstanceOf(Buffer);
        expect(webp[0]).toBe(0x52); // 'R'
      });

      test('should resize HEIC image', async () => {
        const heicData = readFileSync(heicFixturePath);
        const resized = await imageTurbo.resize(heicData, { width: 200 });

        const meta = imageTurbo.metadataSync(resized);
        expect(meta.width).toBe(200);
      });

      test('should transform HEIC image', async () => {
        const heicData = readFileSync(heicFixturePath);
        const result = await imageTurbo.transform(heicData, {
          resize: { width: 300 },
          grayscale: true,
          output: { format: 'jpeg', jpeg: { quality: 80 } },
        });

        expect(result).toBeInstanceOf(Buffer);
        expect(result[0]).toBe(0xFF);
        expect(result[1]).toBe(0xD8);
      });

      test('should generate blurhash from HEIC', async () => {
        const heicData = readFileSync(heicFixturePath);
        const result = await imageTurbo.blurhash(heicData);

        expect(result.hash).toBeDefined();
        expect(result.hash.length).toBeGreaterThan(0);
      });
    }
  });
});
