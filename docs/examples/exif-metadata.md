# EXIF Metadata Example

Write and manage EXIF metadata in your images. Perfect for AI-generated content attribution.

## Basic EXIF Writing

Add metadata to a JPEG or WebP image:

```typescript
import { writeExif, toJpeg } from 'imgkit';

// Load image
const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

// Add EXIF metadata
const withExif = await writeExif(buffer, {
  imageDescription: 'Sunset over the Pacific Ocean',
  artist: 'John Doe',
  copyright: 'Copyright 2026 John Doe. All rights reserved.',
  software: 'imgkit v1.4.0',
  dateTime: '2026:01:07 14:30:00'
});

await Bun.write('photo-with-exif.jpg', withExif);
console.log('Added EXIF metadata to photo');
```

## AI-Generated Image Metadata

Store AI generation parameters for reproducibility:

```typescript
import { writeExif, toWebp } from 'imgkit';

// Your AI-generated image buffer
const aiImage = Buffer.from(await Bun.file('generated.png').arrayBuffer());

// Convert to WebP and add metadata
const webp = await toWebp(aiImage, { quality: 90 });

const withMetadata = await writeExif(webp, {
  imageDescription: 'A majestic dragon flying over a medieval castle at sunset',
  artist: 'Stable Diffusion XL',
  software: 'ComfyUI v1.0',
  copyright: 'CC BY 4.0',
  userComment: JSON.stringify({
    // Store all generation parameters
    prompt: 'A majestic dragon flying over a medieval castle at sunset, 8k, detailed, fantasy art',
    negative_prompt: 'blurry, low quality, watermark, text',
    model: 'stable-diffusion-xl-base-1.0',
    sampler: 'DPM++ 2M Karras',
    steps: 30,
    cfg_scale: 7.5,
    seed: 1234567890,
    width: 1024,
    height: 1024,
    clip_skip: 2,
    vae: 'sdxl_vae.safetensors'
  })
});

await Bun.write('ai-artwork.webp', withMetadata);
console.log('Saved AI image with full generation metadata');
```

## Strip Metadata for Privacy

Remove all EXIF data before sharing:

```typescript
import { stripExif } from 'imgkit';

// Load image with sensitive metadata (GPS, camera info, etc.)
const photo = Buffer.from(await Bun.file('vacation-photo.jpg').arrayBuffer());

// Remove all EXIF data
const clean = await stripExif(photo);

await Bun.write('safe-to-share.jpg', clean);
console.log('Stripped all metadata - safe to share online');
```

## Batch Process with Metadata

Add consistent branding to multiple images:

```typescript
import { writeExif, toJpeg } from 'imgkit';
import { readdir } from 'fs/promises';

const inputDir = './raw-images';
const outputDir = './branded-images';

// Get all image files
const files = (await readdir(inputDir)).filter(f =>
  /\.(jpg|jpeg|png|webp)$/i.test(f)
);

console.log(`Processing ${files.length} images...`);

const results = await Promise.all(
  files.map(async (file) => {
    const input = Buffer.from(
      await Bun.file(`${inputDir}/${file}`).arrayBuffer()
    );

    // Convert to JPEG with branding
    const jpeg = await toJpeg(input, { quality: 90 });

    const branded = await writeExif(jpeg, {
      artist: 'My Photography Studio',
      copyright: 'Copyright 2026 My Photography Studio',
      software: 'Image Pipeline v2.0',
      dateTime: new Date().toISOString()
        .replace(/[-T]/g, ':')
        .replace(/\..+/, '')
        .replace(/:/, ':')
    });

    const outputName = file.replace(/\.[^.]+$/, '.jpg');
    await Bun.write(`${outputDir}/${outputName}`, branded);

    return outputName;
  })
);

console.log(`Processed: ${results.join(', ')}`);
```

## Transform with EXIF

Add metadata during image transformation:

```typescript
import { transform } from 'imgkit';

const input = Buffer.from(await Bun.file('raw.png').arrayBuffer());

const result = await transform(input, {
  // Resize and optimize
  resize: { width: 1920, height: 1080, fit: 'cover' },
  sharpen: 5,

  // Output as JPEG
  output: {
    format: 'jpeg',
    jpeg: { quality: 85 }
  },

  // Add EXIF in the same operation
  exif: {
    imageDescription: 'Hero image for website',
    software: 'Content Pipeline',
    copyright: 'Copyright 2026 My Company'
  }
});

await Bun.write('hero-image.jpg', result);
```

## API Endpoint with Metadata

HTTP endpoint that processes uploads and adds metadata:

```typescript
import { writeExif, toWebp, metadata } from 'imgkit';

const server = Bun.serve({
  port: 3000,

  async fetch(req) {
    if (req.method !== 'POST') {
      return new Response('POST image to /process', { status: 405 });
    }

    const url = new URL(req.url);

    if (url.pathname === '/process') {
      const formData = await req.formData();
      const file = formData.get('image') as File;
      const artist = formData.get('artist') as string || 'Unknown';
      const description = formData.get('description') as string || '';

      if (!file) {
        return new Response('No image provided', { status: 400 });
      }

      const input = Buffer.from(await file.arrayBuffer());

      // Get original metadata
      const info = await metadata(input);

      // Convert to WebP and add EXIF
      const webp = await toWebp(input, { quality: 85 });
      const result = await writeExif(webp, {
        imageDescription: description,
        artist: artist,
        software: 'My Image API v1.0',
        dateTime: new Date().toISOString()
          .replace(/[-T]/g, ':')
          .replace(/\..+/, ''),
        userComment: JSON.stringify({
          originalFormat: info.format,
          originalSize: `${info.width}x${info.height}`,
          processedAt: new Date().toISOString()
        })
      });

      return new Response(result, {
        headers: {
          'Content-Type': 'image/webp',
          'Content-Disposition': 'attachment; filename="processed.webp"'
        }
      });
    }

    return new Response('Not found', { status: 404 });
  }
});

console.log(`Server running at http://localhost:${server.port}`);
```

## Read EXIF Back (External Tool)

To read EXIF metadata, use tools like `exiftool`:

```bash
# Install exiftool
brew install exiftool  # macOS
apt install exiftool   # Linux

# Read all EXIF data
exiftool ai-artwork.webp

# Read specific fields
exiftool -ImageDescription -Artist -UserComment ai-artwork.webp

# Output as JSON
exiftool -json ai-artwork.webp
```

Example output:
```
Image Description: A majestic dragon flying over a medieval castle
Artist: Stable Diffusion XL
Software: ComfyUI v1.0
User Comment: {"prompt":"A majestic dragon...","seed":1234567890,...}
```

## Complete Example Script

Save as `exif-demo.ts` and run with `bun run exif-demo.ts`:

```typescript
import {
  writeExif,
  writeExifSync,
  stripExif,
  toJpeg,
  toWebp,
  metadata
} from 'imgkit';

async function main() {
  console.log('=== EXIF Metadata Demo ===\n');

  // Load test image
  const input = Buffer.from(
    await Bun.file('test-image.jpg').arrayBuffer()
  );

  const info = await metadata(input);
  console.log(`Original: ${info.width}x${info.height} ${info.format}`);

  // 1. Add basic metadata
  console.log('\n1. Adding basic EXIF...');
  const basic = await writeExif(input, {
    imageDescription: 'Test image with EXIF',
    artist: 'Demo User',
    software: 'imgkit'
  });
  await Bun.write('output/basic-exif.jpg', basic);
  console.log('   Saved: output/basic-exif.jpg');

  // 2. AI metadata with JSON
  console.log('\n2. Adding AI generation metadata...');
  const webp = await toWebp(input, { quality: 90 });
  const aiMeta = await writeExif(webp, {
    imageDescription: 'AI-enhanced photo',
    software: 'AI Enhancer v1.0',
    userComment: JSON.stringify({
      model: 'real-esrgan-x4',
      scale: 4,
      denoise: 0.5
    })
  });
  await Bun.write('output/ai-metadata.webp', aiMeta);
  console.log('   Saved: output/ai-metadata.webp');

  // 3. Strip metadata
  console.log('\n3. Stripping all metadata...');
  const stripped = await stripExif(basic);
  await Bun.write('output/stripped.jpg', stripped);
  console.log('   Saved: output/stripped.jpg');

  // 4. Sync version
  console.log('\n4. Using sync API...');
  const syncResult = writeExifSync(input, {
    copyright: 'Sync Demo Copyright'
  });
  await Bun.write('output/sync-exif.jpg', syncResult);
  console.log('   Saved: output/sync-exif.jpg');

  console.log('\n=== Done! ===');
  console.log('Use "exiftool output/*.jpg output/*.webp" to verify metadata');
}

main().catch(console.error);
```

## Next Steps

- [API Reference: EXIF](/api/exif) - Full API documentation
- [Types: ExifOptions](/api/types#exifoptions) - All available fields
- [Basic Usage](/examples/basic-usage) - Core functionality
