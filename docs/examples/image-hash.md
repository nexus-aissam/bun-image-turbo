# Perceptual Hashing

Detect duplicate and similar images using native SIMD-accelerated perceptual hashing.

## What is Perceptual Hashing?

Unlike cryptographic hashes (MD5, SHA), perceptual hashes allow **similar images to produce similar hashes**. This means:

- Resized images still match
- Compressed images still match
- Slightly edited images still match
- Different images produce different hashes

## Basic Usage

```typescript
import { imageHash, imageHashDistance } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

// Generate perceptual hash
const result = await imageHash(buffer);

console.log(`Hash: ${result.hash}`);
console.log(`Image: ${result.width}x${result.height}`);
console.log(`Algorithm: ${result.algorithm}`);
console.log(`Hash size: ${result.hashSize}x${result.hashSize}`);
```

## Duplicate Detection

Compare two images to determine if they're similar:

```typescript
import { imageHash, imageHashDistance } from 'imgkit';

async function areSimilar(image1: Buffer, image2: Buffer): Promise<boolean> {
  const hash1 = await imageHash(image1);
  const hash2 = await imageHash(image2);

  const distance = await imageHashDistance(hash1.hash, hash2.hash);

  // Distance thresholds:
  // 0     = Identical
  // 1-5   = Very similar (likely same image, minor edits)
  // 6-10  = Similar (possible match)
  // >10   = Different images

  return distance < 5;
}

// Usage
const image1 = Buffer.from(await Bun.file('original.jpg').arrayBuffer());
const image2 = Buffer.from(await Bun.file('edited.jpg').arrayBuffer());

if (await areSimilar(image1, image2)) {
  console.log('Images are duplicates!');
} else {
  console.log('Images are different');
}
```

## Content Moderation System

Build a system to detect near-duplicate uploads:

```typescript
import { imageHash, imageHashDistance, imageHashSync } from 'imgkit';

interface ImageRecord {
  id: string;
  hash: string;
  url: string;
}

class DuplicateDetector {
  private knownHashes: ImageRecord[] = [];

  async addImage(id: string, buffer: Buffer, url: string): Promise<void> {
    const { hash } = await imageHash(buffer);
    this.knownHashes.push({ id, hash, url });
  }

  async findDuplicates(buffer: Buffer, threshold: number = 5): Promise<ImageRecord[]> {
    const { hash } = await imageHash(buffer);
    const duplicates: ImageRecord[] = [];

    for (const known of this.knownHashes) {
      const distance = await imageHashDistance(hash, known.hash);
      if (distance <= threshold) {
        duplicates.push(known);
      }
    }

    return duplicates;
  }
}

// Usage
const detector = new DuplicateDetector();

// Add existing images to database
await detector.addImage('1', existingImage1, 'https://cdn.example.com/1.jpg');
await detector.addImage('2', existingImage2, 'https://cdn.example.com/2.jpg');

// Check new upload for duplicates
const duplicates = await detector.findDuplicates(newUpload);
if (duplicates.length > 0) {
  console.log('This image has already been uploaded!');
  console.log('Existing copies:', duplicates);
}
```

## Algorithms Comparison

Choose the right algorithm for your use case:

```typescript
import { imageHash } from 'imgkit';

const buffer = Buffer.from(await Bun.file('photo.jpg').arrayBuffer());

// PHash (Perceptual Hash) - Best for most use cases
// Uses DCT (Discrete Cosine Transform)
// Most robust to scaling, cropping, and compression
const pHash = await imageHash(buffer, { algorithm: 'PHash' });

// DHash (Difference Hash) - Fast, good for similar images
// Compares adjacent pixel gradients
// Good for detecting minor edits
const dHash = await imageHash(buffer, { algorithm: 'DHash' });

// AHash (Average Hash) - Fastest, least robust
// Compares pixels to average brightness
// Good for exact or near-exact matches
const aHash = await imageHash(buffer, { algorithm: 'AHash' });

// BlockHash - Good balance of speed and accuracy
// Divides image into blocks
// Good general-purpose choice
const blockHash = await imageHash(buffer, { algorithm: 'BlockHash' });

console.log('PHash:', pHash.hash);
console.log('DHash:', dHash.hash);
console.log('AHash:', aHash.hash);
console.log('BlockHash:', blockHash.hash);
```

### Algorithm Recommendations

| Use Case | Recommended | Why |
|----------|-------------|-----|
| General duplicate detection | `PHash` | Most robust to transformations |
| Fast bulk processing | `AHash` | Fastest computation |
| Detecting minor edits | `DHash` | Sensitive to gradient changes |
| Balanced performance | `BlockHash` | Good speed/accuracy trade-off |

## Hash Sizes

Larger hash sizes provide more accuracy but use more memory:

```typescript
import { imageHash } from 'imgkit';

// 8x8 (64 bits) - Default, fastest, good for most cases
const hash8 = await imageHash(buffer, { size: 'Size8' });

// 16x16 (256 bits) - More accurate, still fast
const hash16 = await imageHash(buffer, { size: 'Size16' });

// 32x32 (1024 bits) - Highest accuracy, slower
const hash32 = await imageHash(buffer, { size: 'Size32' });

console.log('8x8 hash length:', hash8.hash.length);
console.log('16x16 hash length:', hash16.hash.length);
console.log('32x32 hash length:', hash32.hash.length);
```

## Batch Processing

Process multiple images efficiently:

```typescript
import { imageHashSync, imageHashDistanceSync } from 'imgkit';
import { readdir } from 'fs/promises';

async function findAllDuplicates(directory: string) {
  const files = await readdir(directory);
  const images = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

  // Generate hashes for all images (sync for batch processing)
  const hashes = await Promise.all(
    images.map(async (filename) => {
      const buffer = Buffer.from(
        await Bun.file(`${directory}/${filename}`).arrayBuffer()
      );
      return {
        filename,
        hash: imageHashSync(buffer).hash
      };
    })
  );

  // Find duplicates
  const duplicateGroups: string[][] = [];
  const processed = new Set<number>();

  for (let i = 0; i < hashes.length; i++) {
    if (processed.has(i)) continue;

    const group = [hashes[i].filename];
    processed.add(i);

    for (let j = i + 1; j < hashes.length; j++) {
      if (processed.has(j)) continue;

      const distance = imageHashDistanceSync(hashes[i].hash, hashes[j].hash);
      if (distance < 5) {
        group.push(hashes[j].filename);
        processed.add(j);
      }
    }

    if (group.length > 1) {
      duplicateGroups.push(group);
    }
  }

  return duplicateGroups;
}

// Usage
const duplicates = await findAllDuplicates('./images');
console.log('Duplicate groups:', duplicates);
```

## API Endpoint for Similarity Check

```typescript
import { imageHash, imageHashDistance } from 'imgkit';

// Store of known image hashes (in production, use a database)
const hashDatabase: Map<string, string> = new Map();

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // Generate hash for an image
    if (url.pathname === '/hash' && req.method === 'POST') {
      const formData = await req.formData();
      const file = formData.get('image') as File;
      const buffer = Buffer.from(await file.arrayBuffer());

      const result = await imageHash(buffer);

      return Response.json({
        hash: result.hash,
        width: result.width,
        height: result.height,
        algorithm: result.algorithm
      });
    }

    // Check for similar images
    if (url.pathname === '/check-duplicate' && req.method === 'POST') {
      const formData = await req.formData();
      const file = formData.get('image') as File;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { hash } = await imageHash(buffer);

      // Check against known hashes
      const matches: { id: string; distance: number }[] = [];
      for (const [id, knownHash] of hashDatabase) {
        const distance = await imageHashDistance(hash, knownHash);
        if (distance < 10) {
          matches.push({ id, distance });
        }
      }

      return Response.json({
        isDuplicate: matches.length > 0,
        matches: matches.sort((a, b) => a.distance - b.distance)
      });
    }

    // Register new image
    if (url.pathname === '/register' && req.method === 'POST') {
      const formData = await req.formData();
      const file = formData.get('image') as File;
      const id = formData.get('id') as string;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { hash } = await imageHash(buffer);
      hashDatabase.set(id, hash);

      return Response.json({ success: true, id, hash });
    }

    return new Response('Not Found', { status: 404 });
  }
});
```

## Reverse Image Search

Build a simple reverse image search:

```typescript
import { imageHash, imageHashDistance } from 'imgkit';

interface IndexedImage {
  id: string;
  hash: string;
  metadata: {
    url: string;
    title: string;
    tags: string[];
  };
}

class ReverseImageSearch {
  private index: IndexedImage[] = [];

  async addToIndex(id: string, buffer: Buffer, metadata: IndexedImage['metadata']) {
    const { hash } = await imageHash(buffer, { algorithm: 'PHash', size: 'Size16' });
    this.index.push({ id, hash, metadata });
  }

  async search(queryImage: Buffer, maxResults: number = 10): Promise<Array<IndexedImage & { distance: number }>> {
    const { hash: queryHash } = await imageHash(queryImage, { algorithm: 'PHash', size: 'Size16' });

    const results: Array<IndexedImage & { distance: number }> = [];

    for (const item of this.index) {
      const distance = await imageHashDistance(queryHash, item.hash);
      results.push({ ...item, distance });
    }

    // Sort by distance and return top matches
    return results
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxResults);
  }
}

// Usage
const search = new ReverseImageSearch();

// Index your image library
await search.addToIndex('1', image1Buffer, {
  url: 'https://example.com/1.jpg',
  title: 'Sunset Beach',
  tags: ['beach', 'sunset', 'ocean']
});

// Search for similar images
const results = await search.search(queryImage);
console.log('Similar images:', results);
```

## Performance Tips

1. **Use sync for batch processing** - Avoids async overhead
2. **Choose appropriate hash size** - Size8 is usually sufficient
3. **Pre-compute hashes** - Store hashes in database, not re-compute each time
4. **Use PHash for robustness** - Best against transformations
5. **Set appropriate thresholds** - Balance false positives vs false negatives

## Distance Thresholds Guide

| Distance | Meaning | Recommended Action |
|----------|---------|-------------------|
| 0 | Identical | Definite duplicate |
| 1-3 | Near-identical | Highly likely duplicate |
| 4-7 | Very similar | Probable duplicate, review |
| 8-12 | Somewhat similar | Possible match, manual check |
| 13+ | Different | Not duplicates |

## See Also

- [API Reference](/api/image-hash) - Full API documentation
- [Benchmarks](/guide/performance) - Performance comparisons
- [ThumbHash](/examples/thumbhash) - For image placeholders
