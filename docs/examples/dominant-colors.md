# Dominant Color Examples

Extract prominent colors from images for UI theming, placeholders, and color palettes.

## Basic Usage

### Extract Primary Color

```typescript
import { dominantColors } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

const result = await dominantColors(buffer);
console.log(`Primary color: ${result.primary.hex}`);
// Output: Primary color: #3498DB
```

### Get Color Palette

```typescript
// Get 8 dominant colors
const palette = await dominantColors(buffer, 8);

palette.colors.forEach((color, i) => {
  console.log(`Color ${i + 1}: ${color.hex}`);
});
```

## Spotify-Style Album Art Theming

Auto-theme UI based on album artwork:

```typescript
import { dominantColors } from 'imgkit';

interface Theme {
  background: string;
  accent: string;
  text: string;
}

async function getAlbumTheme(albumArt: Buffer): Promise<Theme> {
  const { primary, colors } = await dominantColors(albumArt, 3);

  // Calculate if primary color is light or dark
  const brightness = (primary.r * 299 + primary.g * 587 + primary.b * 114) / 1000;
  const isLight = brightness > 128;

  return {
    background: primary.hex,
    accent: colors[1]?.hex || darken(primary.hex, 20),
    text: isLight ? '#1a1a1a' : '#ffffff',
  };
}

// Usage
const artwork = Buffer.from(await Bun.file('album.jpg').arrayBuffer());
const theme = await getAlbumTheme(artwork);

// Apply to CSS
document.documentElement.style.setProperty('--bg-color', theme.background);
document.documentElement.style.setProperty('--accent-color', theme.accent);
document.documentElement.style.setProperty('--text-color', theme.text);
```

## Image Placeholder Generator

Create colored placeholders while images load:

```typescript
import { dominantColors, thumbhash } from 'imgkit';

async function generatePlaceholder(imageBuffer: Buffer) {
  // Get primary color for instant placeholder
  const { primary } = await dominantColors(imageBuffer, 1);

  // Also generate thumbhash for detailed placeholder
  const thumb = await thumbhash(imageBuffer);

  return {
    // Instant solid color placeholder
    solidColor: primary.hex,
    // Gradient placeholder
    gradient: `linear-gradient(135deg, ${primary.hex}, ${darken(primary.hex, 30)})`,
    // ThumbHash for detailed blur
    thumbhash: thumb.dataUrl,
  };
}

// Usage in HTML/CSS
const placeholder = await generatePlaceholder(imageBuffer);
const img = document.querySelector('img');
img.style.backgroundColor = placeholder.solidColor;
```

## E-commerce Product Cards

Match card backgrounds to product images:

```typescript
import { dominantColors } from 'imgkit';

interface ProductCard {
  productId: string;
  imageUrl: string;
  theme: {
    cardBg: string;
    borderColor: string;
    buttonBg: string;
  };
}

async function generateProductTheme(productImage: Buffer): Promise<ProductCard['theme']> {
  const { primary, colors } = await dominantColors(productImage, 4);

  // Use a lighter version of primary for card background
  const cardBg = lighten(primary.hex, 40);

  return {
    cardBg,
    borderColor: primary.hex,
    buttonBg: colors[1]?.hex || primary.hex,
  };
}
```

## Color Palette API Endpoint

Create an API that returns color palettes:

```typescript
import { dominantColors } from 'imgkit';

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/palette') {
      const imageUrl = url.searchParams.get('url');
      const count = parseInt(url.searchParams.get('count') || '5');

      if (!imageUrl) {
        return Response.json({ error: 'Missing url parameter' }, { status: 400 });
      }

      try {
        // Fetch the image
        const response = await fetch(imageUrl);
        const buffer = Buffer.from(await response.arrayBuffer());

        // Extract colors
        const result = await dominantColors(buffer, count);

        return Response.json({
          primary: result.primary,
          palette: result.colors,
          css: result.colors.map((c, i) => `--color-${i + 1}: ${c.hex};`).join('\n'),
        });
      } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }
    }

    return Response.json({
      usage: '/palette?url=IMAGE_URL&count=5',
    });
  },
});

// Usage: http://localhost:3000/palette?url=https://example.com/image.jpg&count=6
```

## Accessibility: Auto Text Color

Choose contrasting text color based on background:

```typescript
import { dominantColors } from 'imgkit';

function getContrastColor(hex: string): string {
  // Remove # if present
  const color = hex.replace('#', '');

  // Parse RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

async function getAccessibleTheme(imageBuffer: Buffer) {
  const { primary } = await dominantColors(imageBuffer, 1);

  return {
    background: primary.hex,
    text: getContrastColor(primary.hex),
  };
}
```

## Batch Processing

Extract colors from multiple images:

```typescript
import { dominantColors } from 'imgkit';
import { readdir } from 'fs/promises';

async function batchExtractColors(inputDir: string) {
  const files = await readdir(inputDir);
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

  const results = await Promise.all(
    imageFiles.map(async (file) => {
      const buffer = Buffer.from(
        await Bun.file(`${inputDir}/${file}`).arrayBuffer()
      );
      const colors = await dominantColors(buffer, 5);

      return {
        file,
        primary: colors.primary.hex,
        palette: colors.colors.map(c => c.hex),
      };
    })
  );

  return results;
}

// Usage
const colors = await batchExtractColors('./images');
console.log(JSON.stringify(colors, null, 2));
```

## React Component Example

```tsx
import { useEffect, useState } from 'react';

interface ImageCardProps {
  src: string;
  alt: string;
}

function ImageCard({ src, alt }: ImageCardProps) {
  const [bgColor, setBgColor] = useState('#f0f0f0');

  useEffect(() => {
    // Fetch image and extract color (would need server endpoint)
    fetch(`/api/dominant-color?url=${encodeURIComponent(src)}`)
      .then(res => res.json())
      .then(data => setBgColor(data.primary.hex));
  }, [src]);

  return (
    <div
      style={{
        backgroundColor: bgColor,
        padding: '1rem',
        borderRadius: '8px',
        transition: 'background-color 0.3s ease',
      }}
    >
      <img src={src} alt={alt} />
    </div>
  );
}
```

## Helper Functions

Useful color manipulation helpers:

```typescript
// Lighten a hex color by percentage
function lighten(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

// Darken a hex color by percentage
function darken(hex: string, percent: number): string {
  return lighten(hex, -percent);
}

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 0, b: 0 };
}
```
