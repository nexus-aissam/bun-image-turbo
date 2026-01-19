# imgkit Examples

Standalone examples using the `imgkit` npm package.

## Setup

```bash
cd test/examples
bun install
```

## Examples

### Basic Usage
Core functionality: metadata, resize, convert, transform, blurhash.

```bash
bun run basic
```

### HEIC Conversion
Convert HEIC/HEIF images (macOS ARM64 only).

```bash
# Add image.heic to this folder first
bun run heic
```

### API Endpoint
HTTP server for on-the-fly image processing.

```bash
bun run api

# Test:
curl "http://localhost:3000/process?url=https://picsum.photos/1920/1080&width=800&format=webp" -o test.webp
```

### Batch Processing
Process multiple images in parallel.

```bash
mkdir input
# Add images to input folder
bun run batch ./input ./output
```

## API Quick Reference

```typescript
import {
  metadata,      // Get image info
  resize,        // Resize image
  toJpeg,        // Convert to JPEG
  toPng,         // Convert to PNG
  toWebp,        // Convert to WebP
  transform,     // Resize + convert + effects
  blurhash,      // Generate placeholder hash
  version        // Get library version
} from 'imgkit';

// All functions have sync versions: metadataSync, resizeSync, etc.
```
