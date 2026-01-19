# Smart Crop Examples

Content-aware image cropping that automatically finds the most interesting region.

## Basic Usage

### Square Crop (Instagram)

```typescript
import { smartCrop } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

// Smart crop to square - finds the best region automatically
const square = await smartCrop(buffer, { aspectRatio: '1:1' });

await Bun.write('instagram.png', square);
```

### Landscape Crop (YouTube)

```typescript
// 16:9 for YouTube thumbnails
const youtube = await smartCrop(buffer, { aspectRatio: '16:9' });

await Bun.write('youtube-thumb.png', youtube);
```

### Portrait Crop (Stories/TikTok)

```typescript
// 9:16 for vertical content
const portrait = await smartCrop(buffer, { aspectRatio: '9:16' });

await Bun.write('story.png', portrait);
```

## Social Media Thumbnail Generator

Generate thumbnails for all major platforms:

```typescript
import { smartCrop, resize, toJpeg } from 'imgkit';

async function generateSocialThumbnails(imagePath: string) {
  const buffer = Buffer.from(await Bun.file(imagePath).arrayBuffer());

  // Generate crops for each platform
  const [instagram, youtube, twitter, tiktok, linkedin] = await Promise.all([
    smartCrop(buffer, { aspectRatio: '1:1' }),     // Instagram post
    smartCrop(buffer, { aspectRatio: '16:9' }),   // YouTube thumbnail
    smartCrop(buffer, { aspectRatio: '16:9' }),   // Twitter card
    smartCrop(buffer, { aspectRatio: '9:16' }),   // TikTok/Reels
    smartCrop(buffer, { aspectRatio: '1.91:1' }), // LinkedIn
  ]);

  // Resize to platform-specific dimensions
  const thumbnails = {
    instagram: await resize(instagram, { width: 1080, height: 1080 }),
    youtube: await resize(youtube, { width: 1280, height: 720 }),
    twitter: await resize(twitter, { width: 1200, height: 675 }),
    tiktok: await resize(tiktok, { width: 1080, height: 1920 }),
    linkedin: await resize(linkedin, { width: 1200, height: 628 }),
  };

  return thumbnails;
}

// Usage
const thumbs = await generateSocialThumbnails('photo.jpg');
await Bun.write('instagram.png', thumbs.instagram);
await Bun.write('youtube.png', thumbs.youtube);
```

## Profile Picture Generator

Create profile pictures in multiple sizes:

```typescript
import { smartCrop, resize } from 'imgkit';

async function generateProfilePictures(uploadBuffer: Buffer) {
  // Smart crop to square (face detection built into saliency)
  const cropped = await smartCrop(uploadBuffer, { aspectRatio: '1:1' });

  // Generate all standard sizes
  const sizes = await Promise.all([
    resize(cropped, { width: 24, height: 24 }),   // xs
    resize(cropped, { width: 32, height: 32 }),   // sm
    resize(cropped, { width: 48, height: 48 }),   // md
    resize(cropped, { width: 64, height: 64 }),   // lg
    resize(cropped, { width: 128, height: 128 }), // xl
    resize(cropped, { width: 256, height: 256 }), // 2xl
    resize(cropped, { width: 512, height: 512 }), // original
  ]);

  return {
    xs: sizes[0],
    sm: sizes[1],
    md: sizes[2],
    lg: sizes[3],
    xl: sizes[4],
    '2xl': sizes[5],
    original: sizes[6],
  };
}
```

## E-commerce Product Images

Generate product images for different views:

```typescript
import { smartCrop, resize, toWebp } from 'imgkit';

async function generateProductImages(productImage: Buffer) {
  // Different aspect ratios for different uses
  const [thumbnail, card, detail, hero] = await Promise.all([
    smartCrop(productImage, { aspectRatio: '1:1' }),   // Grid thumbnail
    smartCrop(productImage, { aspectRatio: '4:3' }),   // Product card
    smartCrop(productImage, { aspectRatio: '3:4' }),   // Detail view
    smartCrop(productImage, { aspectRatio: '21:9' }),  // Hero banner
  ]);

  // Resize and convert to WebP for web
  return {
    thumbnail: await toWebp(await resize(thumbnail, { width: 300 }), { quality: 85 }),
    card: await toWebp(await resize(card, { width: 600 }), { quality: 85 }),
    detail: await toWebp(await resize(detail, { width: 800 }), { quality: 90 }),
    hero: await toWebp(await resize(hero, { width: 1920 }), { quality: 85 }),
  };
}
```

## Analyze Before Cropping

Get crop coordinates without cropping:

```typescript
import { smartCropAnalyze } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

// Analyze the best crop region
const analysis = await smartCropAnalyze(buffer, { aspectRatio: '1:1' });

console.log('Best crop region:');
console.log(`  Position: (${analysis.x}, ${analysis.y})`);
console.log(`  Size: ${analysis.width}x${analysis.height}`);
console.log(`  Quality Score: ${analysis.score.toFixed(2)}`);

// You can use these coordinates with your own cropping logic
// or pass them to the regular crop() function
```

## HTTP API Endpoint

Create an image cropping API:

```typescript
import { smartCrop, toJpeg } from 'imgkit';

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/smart-crop') {
      const imageUrl = url.searchParams.get('url');
      const aspect = url.searchParams.get('aspect') || '1:1';

      if (!imageUrl) {
        return new Response('Missing url parameter', { status: 400 });
      }

      try {
        // Fetch the image
        const response = await fetch(imageUrl);
        const buffer = Buffer.from(await response.arrayBuffer());

        // Smart crop
        const cropped = await smartCrop(buffer, { aspectRatio: aspect });

        // Convert to JPEG for smaller size
        const jpeg = await toJpeg(cropped, { quality: 85 });

        return new Response(jpeg, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=86400'
          }
        });
      } catch (error) {
        return new Response(`Error: ${error.message}`, { status: 500 });
      }
    }

    return new Response('Smart Crop API\n\nUsage: /smart-crop?url=IMAGE_URL&aspect=16:9');
  }
});

// Usage: http://localhost:3000/smart-crop?url=https://example.com/image.jpg&aspect=1:1
```

## Batch Processing

Process multiple images efficiently:

```typescript
import { smartCrop } from 'imgkit';
import { readdir } from 'fs/promises';

async function batchSmartCrop(inputDir: string, outputDir: string, aspectRatio: string) {
  const files = await readdir(inputDir);
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

  console.log(`Processing ${imageFiles.length} images...`);

  const results = await Promise.all(
    imageFiles.map(async (file) => {
      const input = Buffer.from(await Bun.file(`${inputDir}/${file}`).arrayBuffer());
      const cropped = await smartCrop(input, { aspectRatio });
      await Bun.write(`${outputDir}/${file}`, cropped);
      return file;
    })
  );

  console.log(`Processed ${results.length} images`);
}

// Usage
await batchSmartCrop('./uploads', './thumbnails', '1:1');
```

## Comparison: Manual vs Smart Crop

```typescript
import { crop, smartCrop } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

// Manual crop - you need to know the coordinates
const manual = await crop(buffer, {
  x: 100,
  y: 50,
  width: 500,
  height: 500
});

// Smart crop - automatically finds the best region
const smart = await smartCrop(buffer, { aspectRatio: '1:1' });

// Smart crop is better because:
// 1. No need to calculate coordinates
// 2. Finds faces and interesting content
// 3. Works with any image regardless of composition
```
