# Dominant Colors

Extract the most prominent colors from any image for UI theming and color palette generation.

## Overview

Dominant color extraction analyzes an image and returns the most prominent colors sorted by frequency. Perfect for auto-theming UI based on images (like Spotify), generating color placeholders, or creating color palettes.

## Functions

### dominantColors

Extract dominant colors from an image asynchronously.

```typescript
function dominantColors(input: Buffer, count?: number): Promise<DominantColorsResult>
function dominantColorsSync(input: Buffer, count?: number): DominantColorsResult
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `Buffer` | Image buffer (JPEG, PNG, WebP, etc.) |
| `count` | `number` | Maximum number of colors to extract (default: 5) |

#### Returns

`DominantColorsResult` object:

| Property | Type | Description |
|----------|------|-------------|
| `colors` | `DominantColor[]` | Array of dominant colors sorted by prominence |
| `primary` | `DominantColor` | The most dominant color (same as `colors[0]`) |

#### DominantColor

| Property | Type | Description |
|----------|------|-------------|
| `r` | `number` | Red component (0-255) |
| `g` | `number` | Green component (0-255) |
| `b` | `number` | Blue component (0-255) |
| `hex` | `string` | Hex color string (e.g., "#FF5733") |

#### Example

```typescript
import { dominantColors } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

// Get default 5 colors
const result = await dominantColors(buffer);
console.log(result.primary.hex); // "#3498DB"

// Get 8 colors for a richer palette
const palette = await dominantColors(buffer, 8);
palette.colors.forEach(color => {
  console.log(`${color.hex} - rgb(${color.r}, ${color.g}, ${color.b})`);
});
```

---

## Use Cases

### UI Theming (Spotify-style)

```typescript
import { dominantColors } from 'imgkit';

async function getAlbumTheme(albumArt: Buffer) {
  const { primary, colors } = await dominantColors(albumArt, 3);

  return {
    background: primary.hex,
    accent: colors[1]?.hex || primary.hex,
    text: isLight(primary) ? '#000000' : '#FFFFFF',
  };
}

// Helper to determine if color is light or dark
function isLight(color: { r: number; g: number; b: number }) {
  const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
  return brightness > 128;
}
```

### Image Placeholder

```typescript
import { dominantColors } from 'imgkit';

async function getPlaceholderStyle(imageBuffer: Buffer) {
  const { primary } = await dominantColors(imageBuffer, 1);

  return {
    backgroundColor: primary.hex,
    backgroundImage: `linear-gradient(135deg, ${primary.hex}, ${adjustBrightness(primary.hex, -20)})`,
  };
}
```

### Color Palette Generator

```typescript
import { dominantColors } from 'imgkit';

async function generatePalette(imageBuffer: Buffer) {
  const { colors } = await dominantColors(imageBuffer, 6);

  return colors.map(color => ({
    hex: color.hex,
    rgb: `rgb(${color.r}, ${color.g}, ${color.b})`,
    css: `--color-${colors.indexOf(color) + 1}: ${color.hex};`,
  }));
}
```

---

## Performance

| Image Size | Time |
|------------|------|
| 640x480 | ~5-10ms |
| 1920x1080 | ~15-25ms |
| 4000x3000 | ~40-60ms |

---

## Tips

1. **Use fewer colors for simpler UI** - 1-3 colors is often enough for theming
2. **Primary is always the most prominent** - Use it as your main theme color
3. **Check brightness for contrast** - Ensure text is readable against the background
4. **Sync version for SSR** - Use `dominantColorsSync` for server-side rendering where blocking is acceptable
