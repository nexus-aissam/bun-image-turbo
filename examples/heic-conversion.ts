/**
 * HEIC/HEIF Conversion Examples
 *
 * HEIC support is only available on macOS ARM64 (Apple Silicon)
 */

import {
  metadata,
  toJpeg,
  toWebp,
  toPng,
  transform,
  version
} from 'imgkit';

async function main() {
  console.log(`imgkit v${version()}`);
  console.log('HEIC Conversion Examples\n');

  // Check if HEIC file exists
  const heicFile = Bun.file('./image.heic');
  if (!(await heicFile.exists())) {
    console.log('No image.heic found in current directory.');
    console.log('Please provide a HEIC file to test.\n');
    return;
  }

  const heicBuffer = Buffer.from(await heicFile.arrayBuffer());
  console.log(`HEIC file size: ${(heicBuffer.length / 1024).toFixed(2)} KB\n`);

  try {
    // 1. Get Metadata
    console.log('=== HEIC Metadata ===');
    const meta = await metadata(heicBuffer);
    console.log(`Dimensions: ${meta.width}x${meta.height}`);
    console.log(`Format: ${meta.format}`);
    console.log(`Color Space: ${meta.space}`);
    console.log(`Channels: ${meta.channels}\n`);

    // 2. Convert to JPEG
    console.log('=== Convert to JPEG ===');
    const jpeg = await toJpeg(heicBuffer, { quality: 85 });
    await Bun.write('./output/heic-to-jpeg.jpg', jpeg);
    console.log(`JPEG: ${(jpeg.length / 1024).toFixed(2)} KB\n`);

    // 3. Convert to WebP
    console.log('=== Convert to WebP ===');
    const webp = await toWebp(heicBuffer, { quality: 80 });
    await Bun.write('./output/heic-to-webp.webp', webp);
    console.log(`WebP: ${(webp.length / 1024).toFixed(2)} KB\n`);

    // 4. Convert to PNG
    console.log('=== Convert to PNG ===');
    const png = await toPng(heicBuffer);
    await Bun.write('./output/heic-to-png.png', png);
    console.log(`PNG: ${(png.length / 1024).toFixed(2)} KB\n`);

    // 5. Resize and Convert
    console.log('=== Resize and Convert ===');
    const resized = await transform(heicBuffer, {
      resize: { width: 1200, height: 800, fit: 'inside' },
      output: { format: 'jpeg', jpeg: { quality: 85 } }
    });
    await Bun.write('./output/heic-resized.jpg', resized);
    console.log(`Resized: ${(resized.length / 1024).toFixed(2)} KB\n`);

    // 6. Web-optimized versions
    console.log('=== Web-optimized Versions ===');

    const large = await transform(heicBuffer, {
      resize: { width: 1920 },
      output: { format: 'webp', webp: { quality: 85 } }
    });
    await Bun.write('./output/heic-large.webp', large);
    console.log(`Large (1920w): ${(large.length / 1024).toFixed(2)} KB`);

    const medium = await transform(heicBuffer, {
      resize: { width: 800 },
      output: { format: 'webp', webp: { quality: 80 } }
    });
    await Bun.write('./output/heic-medium.webp', medium);
    console.log(`Medium (800w): ${(medium.length / 1024).toFixed(2)} KB`);

    const thumb = await transform(heicBuffer, {
      resize: { width: 200, height: 200, fit: 'cover' },
      output: { format: 'webp', webp: { quality: 70 } }
    });
    await Bun.write('./output/heic-thumb.webp', thumb);
    console.log(`Thumbnail: ${(thumb.length / 1024).toFixed(2)} KB\n`);

    console.log('All HEIC examples completed! Check ./output folder');
  } catch (error: any) {
    if (error.message?.includes('HEIC') || error.message?.includes('Unsupported')) {
      console.error('HEIC support is not available on this platform.');
      console.error('HEIC is only supported on macOS ARM64 (Apple Silicon).');
    } else {
      throw error;
    }
  }
}

// Create output directory
await Bun.write('./output/.gitkeep', '');

main().catch(console.error);
