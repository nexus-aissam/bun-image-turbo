# Cropping Examples

This example demonstrates the powerful cropping capabilities of imgkit, including aspect ratio cropping, coordinate-based cropping, and the crop+resize pipeline.

## Source Code

```typescript
/**
 * Cropping Examples
 * Demonstrates all cropping modes and use cases
 */

import {
  crop,
  cropSync,
  transform,
  metadata,
  version
} from 'imgkit';

async function main() {
  console.log(`imgkit v${version()}\n`);

  // Download a test image
  console.log('Downloading test image...');
  const response = await fetch('https://picsum.photos/1920/1080');
  const imageBuffer = Buffer.from(await response.arrayBuffer());

  const info = await metadata(imageBuffer);
  console.log(`Original: ${info.width}x${info.height}\n`);

  // ============================================
  // Mode 1: Aspect Ratio Cropping
  // ============================================
  console.log('=== Aspect Ratio Cropping ===');

  // Square crop (1:1) - perfect for profile pictures
  const square = await crop(imageBuffer, { aspectRatio: "1:1" });
  const squareInfo = await metadata(square);
  console.log(`Square (1:1): ${squareInfo.width}x${squareInfo.height}`);
  await Bun.write('output/crop-square.png', square);

  // Widescreen crop (16:9) - YouTube thumbnails
  const widescreen = await crop(imageBuffer, { aspectRatio: "16:9" });
  const widescreenInfo = await metadata(widescreen);
  console.log(`Widescreen (16:9): ${widescreenInfo.width}x${widescreenInfo.height}`);
  await Bun.write('output/crop-widescreen.png', widescreen);

  // Portrait crop (9:16) - Instagram stories, TikTok
  const portrait = await crop(imageBuffer, { aspectRatio: "9:16" });
  const portraitInfo = await metadata(portrait);
  console.log(`Portrait (9:16): ${portraitInfo.width}x${portraitInfo.height}`);
  await Bun.write('output/crop-portrait.png', portrait);

  // ============================================
  // Mode 2: Gravity-Based Cropping
  // ============================================
  console.log('\n=== Gravity-Based Cropping ===');

  // Crop from different anchor points
  const gravities = ['Center', 'North', 'South', 'NorthWest', 'SouthEast'] as const;

  for (const gravity of gravities) {
    const cropped = await crop(imageBuffer, {
      aspectRatio: "1:1",
      gravity
    });
    await Bun.write(`output/crop-${gravity.toLowerCase()}.png`, cropped);
    console.log(`Cropped from ${gravity}`);
  }

  // ============================================
  // Mode 3: Coordinate-Based Cropping
  // ============================================
  console.log('\n=== Coordinate-Based Cropping ===');

  // Extract specific region
  const region = await crop(imageBuffer, {
    x: 100,
    y: 100,
    width: 500,
    height: 400
  });
  const regionInfo = await metadata(region);
  console.log(`Region crop: ${regionInfo.width}x${regionInfo.height}`);
  await Bun.write('output/crop-region.png', region);

  // ============================================
  // Mode 4: Dimensions + Gravity
  // ============================================
  console.log('\n=== Dimensions with Gravity ===');

  // Crop 600x600 from center
  const centerCrop = await crop(imageBuffer, {
    width: 600,
    height: 600,
    gravity: 'Center'
  });
  console.log('600x600 from center');
  await Bun.write('output/crop-center-600.png', centerCrop);

  // Crop 400x400 from top-left corner
  const cornerCrop = await crop(imageBuffer, {
    width: 400,
    height: 400,
    gravity: 'NorthWest'
  });
  console.log('400x400 from NorthWest');
  await Bun.write('output/crop-corner.png', cornerCrop);

  // ============================================
  // Crop + Resize Pipeline (Most Powerful)
  // ============================================
  console.log('\n=== Crop + Resize Pipeline ===');

  // Profile picture: crop to square, resize to 256px
  const profile = await transform(imageBuffer, {
    crop: { aspectRatio: "1:1" },
    resize: { width: 256 },
    output: { format: 'Jpeg', jpeg: { quality: 85 } }
  });
  console.log(`Profile picture: ${(profile.length / 1024).toFixed(1)}KB`);
  await Bun.write('output/profile.jpg', profile);

  // YouTube thumbnail: 16:9 at 1280px
  const youtube = await transform(imageBuffer, {
    crop: { aspectRatio: "16:9", gravity: 'Center' },
    resize: { width: 1280 },
    sharpen: 5,
    output: { format: 'WebP', webp: { quality: 80 } }
  });
  console.log(`YouTube thumbnail: ${(youtube.length / 1024).toFixed(1)}KB`);
  await Bun.write('output/youtube-thumb.webp', youtube);

  // Instagram story: 9:16 at 1080px width
  const story = await transform(imageBuffer, {
    crop: { aspectRatio: "9:16" },
    resize: { width: 1080 },
    output: { format: 'Jpeg', jpeg: { quality: 90 } }
  });
  console.log(`Instagram story: ${(story.length / 1024).toFixed(1)}KB`);
  await Bun.write('output/instagram-story.jpg', story);

  // Twitter header: 3:1 aspect ratio
  const twitterHeader = await transform(imageBuffer, {
    crop: { aspectRatio: "3:1" },
    resize: { width: 1500 },
    output: { format: 'Jpeg', jpeg: { quality: 85 } }
  });
  console.log(`Twitter header: ${(twitterHeader.length / 1024).toFixed(1)}KB`);
  await Bun.write('output/twitter-header.jpg', twitterHeader);

  // ============================================
  // Sync Version
  // ============================================
  console.log('\n=== Sync Version ===');
  const syncResult = cropSync(imageBuffer, { aspectRatio: "4:3" });
  const syncInfo = await metadata(syncResult);
  console.log(`Sync crop (4:3): ${syncInfo.width}x${syncInfo.height}`);

  console.log('\n✅ All cropping examples completed!');
  console.log('Check the output/ folder for results.');
}

// Ensure output directory exists
import { mkdirSync, existsSync } from 'fs';
if (!existsSync('output')) {
  mkdirSync('output');
}

main().catch(console.error);
```

## Running the Example

```bash
cd examples
bun install
bun run crop
```

## Output

```text
imgkit v1.6.0

Downloading test image...
Original: 1920x1080

=== Aspect Ratio Cropping ===
Square (1:1): 1080x1080
Widescreen (16:9): 1920x1080
Portrait (9:16): 607x1080

=== Gravity-Based Cropping ===
Cropped from Center
Cropped from North
Cropped from South
Cropped from NorthWest
Cropped from SouthEast

=== Coordinate-Based Cropping ===
Region crop: 500x400

=== Dimensions with Gravity ===
600x600 from center
400x400 from NorthWest

=== Crop + Resize Pipeline ===
Profile picture: 18.2KB
YouTube thumbnail: 45.3KB
Instagram story: 89.1KB
Twitter header: 32.7KB

=== Sync Version ===
Sync crop (4:3): 1440x1080

✅ All cropping examples completed!
```

## Use Cases

### Social Media Image Preparation

```typescript
import { transform } from 'imgkit';

// Prepare images for multiple platforms from a single source
async function prepareSocialMedia(input: Buffer) {
  const outputs = {
    // Instagram square post
    instagram: await transform(input, {
      crop: { aspectRatio: "1:1" },
      resize: { width: 1080 },
      output: { format: 'Jpeg', jpeg: { quality: 85 } }
    }),

    // Instagram story
    instagramStory: await transform(input, {
      crop: { aspectRatio: "9:16" },
      resize: { width: 1080 },
      output: { format: 'Jpeg', jpeg: { quality: 90 } }
    }),

    // Facebook cover
    facebookCover: await transform(input, {
      crop: { aspectRatio: "820:312" },
      resize: { width: 820 },
      output: { format: 'Jpeg', jpeg: { quality: 85 } }
    }),

    // Twitter post
    twitter: await transform(input, {
      crop: { aspectRatio: "16:9" },
      resize: { width: 1200 },
      output: { format: 'Jpeg', jpeg: { quality: 85 } }
    }),

    // LinkedIn post
    linkedin: await transform(input, {
      crop: { aspectRatio: "1.91:1" },
      resize: { width: 1200 },
      output: { format: 'Jpeg', jpeg: { quality: 85 } }
    })
  };

  return outputs;
}
```

### AI Training Data Preparation

```typescript
import { crop, transform } from 'imgkit';

// Prepare images for AI/ML training
async function prepareTrainingData(input: Buffer) {
  // Create square crops at different sizes for training
  const sizes = [64, 128, 256, 512];
  const results = [];

  for (const size of sizes) {
    const processed = await transform(input, {
      crop: { aspectRatio: "1:1" },
      resize: { width: size, height: size },
      output: { format: 'Png' }  // PNG for lossless training data
    });
    results.push({ size, buffer: processed });
  }

  return results;
}

// Data augmentation: crop from different positions
async function augmentWithCrops(input: Buffer) {
  const gravities = [
    'Center', 'North', 'South', 'East', 'West',
    'NorthWest', 'NorthEast', 'SouthWest', 'SouthEast'
  ] as const;

  const augmented = [];
  for (const gravity of gravities) {
    const cropped = await transform(input, {
      crop: { aspectRatio: "1:1", gravity },
      resize: { width: 224 },  // ImageNet standard
      output: { format: 'Png' }
    });
    augmented.push({ gravity, buffer: cropped });
  }

  return augmented;
}
```

### E-commerce Product Images

```typescript
import { transform, crop } from 'imgkit';

// Generate multiple product image sizes
async function generateProductImages(input: Buffer) {
  return {
    // Main product image (square)
    main: await transform(input, {
      crop: { aspectRatio: "1:1" },
      resize: { width: 800 },
      sharpen: 3,
      output: { format: 'WebP', webp: { quality: 85 } }
    }),

    // Thumbnail for listings
    thumbnail: await transform(input, {
      crop: { aspectRatio: "1:1" },
      resize: { width: 200 },
      sharpen: 5,
      output: { format: 'WebP', webp: { quality: 80 } }
    }),

    // Cart preview
    cart: await transform(input, {
      crop: { aspectRatio: "1:1" },
      resize: { width: 100 },
      output: { format: 'WebP', webp: { quality: 75 } }
    }),

    // Zoom image (high quality)
    zoom: await transform(input, {
      crop: { aspectRatio: "1:1" },
      resize: { width: 1600 },
      sharpen: 2,
      output: { format: 'WebP', webp: { quality: 90 } }
    })
  };
}
```

### Face/Region Extraction

```typescript
import { crop, transform } from 'imgkit';

// Extract detected face region (coordinates from face detection API)
async function extractFace(
  input: Buffer,
  faceBox: { x: number; y: number; width: number; height: number }
) {
  // Add padding around face
  const padding = 0.2;
  const paddedWidth = faceBox.width * (1 + padding * 2);
  const paddedHeight = faceBox.height * (1 + padding * 2);
  const paddedX = Math.max(0, faceBox.x - faceBox.width * padding);
  const paddedY = Math.max(0, faceBox.y - faceBox.height * padding);

  return crop(input, {
    x: Math.round(paddedX),
    y: Math.round(paddedY),
    width: Math.round(paddedWidth),
    height: Math.round(paddedHeight)
  });
}

// Create avatar from face detection
async function createAvatar(
  input: Buffer,
  faceBox: { x: number; y: number; width: number; height: number }
) {
  const face = await extractFace(input, faceBox);

  return transform(face, {
    crop: { aspectRatio: "1:1" },
    resize: { width: 128 },
    output: { format: 'Jpeg', jpeg: { quality: 85 } }
  });
}
```

## Performance

Cropping is a **zero-copy operation** - it's essentially free:

| Operation | Time | Memory |
|-----------|------|--------|
| Crop (any size) | ~0ms | Zero additional |
| Crop + Encode PNG | ~5ms | Output buffer only |
| Crop + Resize + WebP | ~8ms | Minimal |

::: tip Performance Tip
Always **crop first, then resize**. The `transform()` pipeline is optimized this way - cropping reduces the number of pixels for all subsequent operations.
:::

## Gravity Reference

| Gravity | Position | Best For |
|---------|----------|----------|
| `Center` | Middle of image | General use, faces |
| `North` | Top center | Sky/landscape shots |
| `South` | Bottom center | Ground-focused shots |
| `East` | Right center | Right-aligned subjects |
| `West` | Left center | Left-aligned subjects |
| `NorthWest` | Top-left corner | Logo placement |
| `NorthEast` | Top-right corner | Watermarks |
| `SouthWest` | Bottom-left corner | Signatures |
| `SouthEast` | Bottom-right corner | Timestamps |

## Key Takeaways

1. **Zero-copy** - Cropping uses pointer arithmetic, not pixel copying
2. **Aspect ratio mode** - Perfect for social media and responsive images
3. **Gravity control** - 9 anchor points for precise cropping
4. **Pipeline optimization** - Crop first reduces work for resize/effects
5. **Use transform()** - Single decode/encode is faster than chaining

## Next Steps

- [Basic Usage](/examples/basic-usage) - Core functionality
- [API Endpoint](/examples/api-endpoint) - HTTP server with cropping
- [Batch Processing](/examples/batch-processing) - Process multiple files
- [Transform API](/api/transform) - Full pipeline documentation
