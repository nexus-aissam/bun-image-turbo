# ThumbHash Placeholders

Generate compact, visually pleasing image placeholders with ThumbHash.

## Basic Usage

```typescript
import { thumbhash } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

// Generate ThumbHash
const { dataUrl, hash, width, height, hasAlpha } = await thumbhash(buffer);

console.log(`Original: ${width}x${height}`);
console.log(`Has alpha: ${hasAlpha}`);
console.log(`Hash size: ${hash.length} bytes`);

// Use dataUrl directly in HTML
const html = `<img src="${dataUrl}" alt="placeholder" />`;
```

## Progressive Image Loading

Show a blurred placeholder while the full image loads:

```typescript
import { thumbhash } from 'imgkit';

// On image upload/processing
async function processImage(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const { hash, dataUrl } = await thumbhash(buffer);

  // Store with your image data
  return {
    url: await uploadToStorage(buffer),
    thumbhash: hash,        // Store compact hash (~25 bytes)
    placeholder: dataUrl    // Or store ready-to-use data URL
  };
}
```

### React Component

```tsx
import { useState } from 'react';

interface ImageProps {
  src: string;
  placeholder: string;
  alt: string;
}

function ProgressiveImage({ src, placeholder, alt }: ImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      {/* Placeholder (always visible until loaded) */}
      <img
        src={placeholder}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'blur(20px)',
          transform: 'scale(1.1)',
          opacity: loaded ? 0 : 1,
          transition: 'opacity 0.3s ease'
        }}
      />

      {/* Full image */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
      />
    </div>
  );
}
```

## Store and Restore

Store compact hash in database, restore when needed:

```typescript
import { thumbhash, thumbhashToDataUrl } from 'imgkit';

// On upload: generate and store hash
async function saveImage(buffer: Buffer, db: Database) {
  const { hash } = await thumbhash(buffer);

  await db.images.insert({
    id: generateId(),
    url: await uploadToStorage(buffer),
    thumbhash: hash  // ~25 bytes
  });
}

// On display: restore placeholder
async function getImageWithPlaceholder(id: string, db: Database) {
  const image = await db.images.findById(id);

  return {
    url: image.url,
    placeholder: thumbhashToDataUrl(image.thumbhash)
  };
}
```

## API Endpoint

Serve placeholders via HTTP:

```typescript
import { thumbhash, thumbhashToRgba } from 'imgkit';

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // Generate ThumbHash from URL
    if (url.pathname === '/thumbhash') {
      const imageUrl = url.searchParams.get('url');
      if (!imageUrl) {
        return new Response('Missing url parameter', { status: 400 });
      }

      const response = await fetch(imageUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      const result = await thumbhash(buffer);

      return Response.json({
        hash: result.hash.toString('base64'),
        width: result.width,
        height: result.height,
        hasAlpha: result.hasAlpha,
        dataUrl: result.dataUrl
      });
    }

    // Decode ThumbHash to PNG
    if (url.pathname === '/decode') {
      const hashBase64 = url.searchParams.get('hash');
      if (!hashBase64) {
        return new Response('Missing hash parameter', { status: 400 });
      }

      const hash = Buffer.from(hashBase64, 'base64');
      const { rgba, width, height } = await thumbhashToRgba(hash);

      // Return as PNG (would need PNG encoder)
      return Response.json({
        width,
        height,
        pixels: rgba.length
      });
    }

    return new Response('Not Found', { status: 404 });
  }
});
```

## Batch Processing

Generate placeholders for multiple images:

```typescript
import { thumbhash } from 'imgkit';
import { readdir } from 'fs/promises';

async function generatePlaceholders(directory: string) {
  const files = await readdir(directory);
  const images = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

  const results = await Promise.all(
    images.map(async (filename) => {
      const buffer = Buffer.from(
        await Bun.file(`${directory}/${filename}`).arrayBuffer()
      );

      const { hash, width, height, hasAlpha } = await thumbhash(buffer);

      return {
        filename,
        width,
        height,
        hasAlpha,
        hashBase64: hash.toString('base64')
      };
    })
  );

  return results;
}

// Usage
const placeholders = await generatePlaceholders('./images');
console.log(JSON.stringify(placeholders, null, 2));
```

## ThumbHash vs BlurHash

| Feature | ThumbHash | BlurHash |
|---------|-----------|----------|
| Alpha channel | ✅ Yes | ❌ No |
| Aspect ratio | ✅ Preserved | ❌ Fixed |
| Color accuracy | Better | Good |
| Hash size | ~25 bytes | ~28 chars |
| Output | Binary | Base83 string |

### When to use ThumbHash

- Images with transparency (PNG logos, icons)
- Need accurate aspect ratio
- Want smoother gradients
- Storing binary data is fine

### When to use BlurHash

- Need string-safe format (URLs, JSON)
- Existing BlurHash infrastructure
- Simple opaque images
