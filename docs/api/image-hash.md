# imageHash

Generate perceptual hashes for image similarity detection.

Perceptual hashing creates fingerprints that allow comparing images for visual similarity. Unlike cryptographic hashes, similar images produce similar hashes, enabling duplicate detection, content moderation, and reverse image search.

## Why Use Perceptual Hashing?

### The Problem

Traditional cryptographic hashes (MD5, SHA-256) produce completely different outputs for even tiny changes:

```typescript
// Same image, resized
const original = hash(image);      // "a1b2c3d4..."
const resized = hash(smallImage);  // "x9y8z7w6..." - Completely different!
```

### The Solution

Perceptual hashes produce similar outputs for visually similar images:

```typescript
import { imageHash, imageHashDistance } from 'imgkit';

const original = await imageHash(image);      // "AQID..."
const resized = await imageHash(smallImage);  // "AQIE..." - Similar!

const distance = await imageHashDistance(original.hash, resized.hash);
// distance = 2 (very similar!)
```

## Usage

```typescript
import {
  imageHash,
  imageHashSync,
  imageHashDistance,
  imageHashDistanceSync
} from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

// Generate hash (async)
const result = await imageHash(buffer);
console.log(result.hash);       // Base64-encoded hash
console.log(result.algorithm);  // "PHash"
console.log(result.hashSize);   // 8

// Generate hash (sync)
const resultSync = imageHashSync(buffer);

// With options
const customHash = await imageHash(buffer, {
  algorithm: 'DHash',
  size: 'Size16'
});
```

## Functions

### imageHash(input, options?)

Generate a perceptual hash from an image asynchronously.

```typescript
async function imageHash(
  input: Buffer,
  options?: ImageHashOptions
): Promise<ImageHashResult>
```

**Parameters:**
- `input` - Image buffer (JPEG, PNG, WebP, GIF, BMP, HEIC)
- `options` - Optional configuration

**Returns:** `Promise<ImageHashResult>`

### imageHashSync(input, options?)

Generate a perceptual hash from an image synchronously.

```typescript
function imageHashSync(
  input: Buffer,
  options?: ImageHashOptions
): ImageHashResult
```

### imageHashDistance(hash1, hash2)

Calculate the hamming distance between two perceptual hashes asynchronously.

```typescript
async function imageHashDistance(
  hash1: string,
  hash2: string
): Promise<number>
```

**Parameters:**
- `hash1` - First hash (base64 string from imageHash)
- `hash2` - Second hash (base64 string from imageHash)

**Returns:** `Promise<number>` - Hamming distance (0 = identical)

### imageHashDistanceSync(hash1, hash2)

Calculate the hamming distance synchronously.

```typescript
function imageHashDistanceSync(
  hash1: string,
  hash2: string
): number
```

## Types

### ImageHashOptions

```typescript
interface ImageHashOptions {
  /** Hash algorithm (default: 'PHash') */
  algorithm?: HashAlgorithm;
  /** Hash size (default: 'Size8') */
  size?: HashSize;
}
```

### HashAlgorithm

```typescript
type HashAlgorithm =
  | 'PHash'     // Perceptual hash using DCT (recommended)
  | 'DHash'     // Difference hash using gradients
  | 'AHash'     // Average hash (fastest)
  | 'BlockHash'; // Block-based hash
```

### HashSize

```typescript
type HashSize =
  | 'Size8'   // 8x8 = 64 bits (fastest, default)
  | 'Size16'  // 16x16 = 256 bits (more accurate)
  | 'Size32'; // 32x32 = 1024 bits (highest accuracy)
```

### ImageHashResult

```typescript
interface ImageHashResult {
  /** Base64-encoded hash string */
  hash: string;
  /** Original image width */
  width: number;
  /** Original image height */
  height: number;
  /** Hash size used (8, 16, or 32) */
  hashSize: number;
  /** Algorithm used */
  algorithm: string;
}
```

## Algorithms Explained

### PHash (Perceptual Hash)

Uses Discrete Cosine Transform (DCT) to analyze frequency components.

```typescript
const result = await imageHash(buffer, { algorithm: 'PHash' });
```

**Best for:**
- General duplicate detection
- Images with scaling, cropping, compression
- Highest robustness to transformations

**How it works:**
1. Resize to 32x32 grayscale
2. Apply DCT transform
3. Keep low-frequency components
4. Generate binary hash from median

### DHash (Difference Hash)

Compares adjacent pixel gradients to detect changes.

```typescript
const result = await imageHash(buffer, { algorithm: 'DHash' });
```

**Best for:**
- Detecting minor edits
- Fast processing
- Images with similar structure

**How it works:**
1. Resize to (hash_size+1) x hash_size
2. Compare each pixel to its right neighbor
3. Generate binary hash from comparisons

### AHash (Average Hash)

Simplest algorithm, compares pixels to average brightness.

```typescript
const result = await imageHash(buffer, { algorithm: 'AHash' });
```

**Best for:**
- Fastest processing
- Exact or near-exact matches
- High-volume batch processing

**How it works:**
1. Resize to hash_size x hash_size
2. Calculate average pixel value
3. Generate binary hash (1 if pixel > average)

### BlockHash

Divides image into blocks and compares block averages.

```typescript
const result = await imageHash(buffer, { algorithm: 'BlockHash' });
```

**Best for:**
- Balanced speed and accuracy
- General-purpose use
- When unsure which algorithm to use

## Distance Interpretation

The hamming distance represents how many bits differ between two hashes:

| Distance | Similarity | Interpretation |
|----------|------------|----------------|
| 0 | 100% | Identical images |
| 1-5 | 95%+ | Very similar (likely duplicates) |
| 6-10 | 85-95% | Similar (possible match) |
| 11-15 | 70-85% | Somewhat similar |
| 16+ | <70% | Different images |

```typescript
const distance = await imageHashDistance(hash1, hash2);

if (distance === 0) {
  console.log('Identical');
} else if (distance <= 5) {
  console.log('Very similar - likely duplicate');
} else if (distance <= 10) {
  console.log('Similar - review manually');
} else {
  console.log('Different images');
}
```

## Examples

### Basic Hash Generation

```typescript
import { imageHash } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());
const { hash, width, height } = await imageHash(buffer);

console.log(`Hash: ${hash}`);
console.log(`Image: ${width}x${height}`);
```

### Duplicate Detection

```typescript
import { imageHash, imageHashDistance } from 'imgkit';

async function isDuplicate(image1: Buffer, image2: Buffer): Promise<boolean> {
  const hash1 = await imageHash(image1);
  const hash2 = await imageHash(image2);
  const distance = await imageHashDistance(hash1.hash, hash2.hash);
  return distance <= 5;
}
```

### Batch Processing with Sync

```typescript
import { imageHashSync, imageHashDistanceSync } from 'imgkit';

const images = [buffer1, buffer2, buffer3, buffer4];
const hashes = images.map(img => imageHashSync(img).hash);

// Compare all pairs
for (let i = 0; i < hashes.length; i++) {
  for (let j = i + 1; j < hashes.length; j++) {
    const distance = imageHashDistanceSync(hashes[i], hashes[j]);
    if (distance <= 5) {
      console.log(`Images ${i} and ${j} are duplicates (distance: ${distance})`);
    }
  }
}
```

### Custom Algorithm and Size

```typescript
import { imageHash } from 'imgkit';

// High accuracy configuration
const accurateHash = await imageHash(buffer, {
  algorithm: 'PHash',
  size: 'Size16'
});

// Fast processing configuration
const fastHash = await imageHash(buffer, {
  algorithm: 'AHash',
  size: 'Size8'
});
```

## Performance

Benchmarks on Apple M3 Pro with 800x600 JPEG:

| Configuration | Time | Throughput |
|--------------|------|------------|
| PHash Size8 | 8.5ms | 118 img/s |
| DHash Size8 | 7.2ms | 139 img/s |
| AHash Size8 | 6.8ms | 147 img/s |
| PHash Size16 | 12.1ms | 83 img/s |
| PHash Size32 | 18.4ms | 54 img/s |

**10-50x faster than JavaScript-based alternatives!**

## Use Cases

### Content Moderation
Detect and block previously flagged images.

### Copyright Detection
Find unauthorized use of copyrighted images.

### Reverse Image Search
Find visually similar images in a database.

### Deduplication
Remove duplicate uploads in storage systems.

### Near-Duplicate Detection
Find edited versions of images.

## Technical Details

- Uses `image_hasher` Rust crate for native SIMD acceleration
- Hashes are base64-encoded for easy storage and transmission
- Supports all formats: JPEG, PNG, WebP, GIF, BMP, HEIC
- Thread-safe: can be used in parallel processing
- Zero-copy buffer handling via napi-rs

## See Also

- [Examples](/examples/image-hash) - Real-world code examples
- [ThumbHash](/api/thumbhash) - For visual placeholders
- [BlurHash](/api/blurhash) - For blur placeholders
