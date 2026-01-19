/**
 * Basic Usage Examples for imgkit
 */

import {
  metadata,
  resize,
  toJpeg,
  toPng,
  toWebp,
  transform,
  blurhash,
  version
} from 'imgkit';

async function main() {
  console.log(`imgkit v${version()}\n`);

  // Download sample image
  console.log('Downloading sample image...');
  const response = await fetch('https://picsum.photos/1920/1080');
  const imageBuffer = Buffer.from(await response.arrayBuffer());
  console.log(`Downloaded: ${(imageBuffer.length / 1024).toFixed(2)} KB\n`);

  // 1. Get Metadata
  console.log('=== Metadata ===');
  const meta = await metadata(imageBuffer);
  console.log(`Dimensions: ${meta.width}x${meta.height}`);
  console.log(`Format: ${meta.format}`);
  console.log(`Has Alpha: ${meta.hasAlpha}\n`);

  // 2. Resize
  console.log('=== Resize ===');
  const resized = await resize(imageBuffer, { width: 800 });
  const resizedMeta = await metadata(resized);
  console.log(`Resized to: ${resizedMeta.width}x${resizedMeta.height}`);
  await Bun.write('./output/resized.jpg', resized);
  console.log('Saved: output/resized.jpg\n');

  // 3. Convert Formats
  console.log('=== Format Conversion ===');

  const webp = await toWebp(imageBuffer, { quality: 80 });
  await Bun.write('./output/converted.webp', webp);
  console.log(`WebP: ${(webp.length / 1024).toFixed(2)} KB`);

  const jpeg = await toJpeg(imageBuffer, { quality: 85 });
  await Bun.write('./output/converted.jpg', jpeg);
  console.log(`JPEG: ${(jpeg.length / 1024).toFixed(2)} KB`);

  const png = await toPng(imageBuffer);
  await Bun.write('./output/converted.png', png);
  console.log(`PNG: ${(png.length / 1024).toFixed(2)} KB\n`);

  // 4. Transform (resize + convert + effects)
  console.log('=== Transform ===');
  const transformed = await transform(imageBuffer, {
    resize: { width: 600, height: 400, fit: 'cover' },
    output: { format: 'webp', webp: { quality: 80 } }
  });
  await Bun.write('./output/transformed.webp', transformed);
  console.log(`Transformed: ${(transformed.length / 1024).toFixed(2)} KB`);

  // Grayscale
  const grayscale = await transform(imageBuffer, {
    grayscale: true,
    resize: { width: 400 },
    output: { format: 'jpeg', jpeg: { quality: 80 } }
  });
  await Bun.write('./output/grayscale.jpg', grayscale);
  console.log(`Grayscale: ${(grayscale.length / 1024).toFixed(2)} KB\n`);

  // 5. Blurhash
  console.log('=== Blurhash ===');
  const hash = await blurhash(imageBuffer, 4, 3);
  console.log(`Hash: ${hash.hash}\n`);

  // 6. Thumbnail
  console.log('=== Thumbnail ===');
  const thumb = await transform(imageBuffer, {
    resize: { width: 150, height: 150, fit: 'cover' },
    output: { format: 'webp', webp: { quality: 60 } }
  });
  await Bun.write('./output/thumbnail.webp', thumb);
  console.log(`Thumbnail: ${(thumb.length / 1024).toFixed(2)} KB\n`);

  console.log('All examples completed! Check ./output folder');
}

// Create output directory
await Bun.write('./output/.gitkeep', '');

main().catch(console.error);
