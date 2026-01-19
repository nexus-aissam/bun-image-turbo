# Batch Processing

Process multiple images efficiently with parallel execution.

## Source Code

```typescript
/**
 * Batch Processing Example
 * Process multiple images in parallel
 *
 * Usage:
 *   bun run batch ./input ./output
 *   bun run batch ./photos ./thumbnails --width=200 --format=webp
 */

import { readdir, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname, basename } from 'path';
import { metadata, transform } from 'imgkit';

// Supported input formats
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.heic', '.heif'];

interface Options {
  width?: number;
  height?: number;
  format: 'jpeg' | 'png' | 'webp';
  quality: number;
  concurrency: number;
}

async function processImage(
  inputPath: string,
  outputPath: string,
  options: Options
): Promise<{ success: boolean; time: number; inputSize: number; outputSize: number }> {
  const start = performance.now();

  try {
    const inputBuffer = Buffer.from(await Bun.file(inputPath).arrayBuffer());
    const inputSize = inputBuffer.length;

    const result = await transform(inputBuffer, {
      resize: options.width || options.height ? {
        width: options.width,
        height: options.height,
        fit: 'inside'
      } : undefined,
      output: {
        format: options.format,
        [options.format]: { quality: options.quality }
      }
    });

    await Bun.write(outputPath, result);

    return {
      success: true,
      time: performance.now() - start,
      inputSize,
      outputSize: result.length
    };
  } catch (error) {
    console.error(`Error processing ${inputPath}:`, error);
    return {
      success: false,
      time: performance.now() - start,
      inputSize: 0,
      outputSize: 0
    };
  }
}

async function batchProcess(inputDir: string, outputDir: string, options: Options) {
  // Validate input directory
  if (!existsSync(inputDir)) {
    console.error(`Input directory not found: ${inputDir}`);
    process.exit(1);
  }

  // Create output directory
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  // Get all image files
  const files = await readdir(inputDir);
  const imageFiles = files.filter(f =>
    SUPPORTED_FORMATS.includes(extname(f).toLowerCase())
  );

  if (imageFiles.length === 0) {
    console.log('No image files found in input directory');
    return;
  }

  console.log(`Found ${imageFiles.length} images to process`);
  console.log(`Options: ${JSON.stringify(options, null, 2)}\n`);

  // Process in batches for controlled concurrency
  const results: Array<{
    file: string;
    success: boolean;
    time: number;
    inputSize: number;
    outputSize: number;
  }> = [];

  const startTime = performance.now();

  // Process with concurrency limit
  for (let i = 0; i < imageFiles.length; i += options.concurrency) {
    const batch = imageFiles.slice(i, i + options.concurrency);

    const batchResults = await Promise.all(
      batch.map(async (file) => {
        const inputPath = join(inputDir, file);
        const outputName = basename(file, extname(file)) + '.' + options.format;
        const outputPath = join(outputDir, outputName);

        const result = await processImage(inputPath, outputPath, options);

        // Progress indicator
        const progress = Math.min(i + options.concurrency, imageFiles.length);
        process.stdout.write(`\rProcessing: ${progress}/${imageFiles.length}`);

        return { file, ...result };
      })
    );

    results.push(...batchResults);
  }

  console.log('\n');

  // Calculate stats
  const totalTime = performance.now() - startTime;
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const totalInputSize = successful.reduce((sum, r) => sum + r.inputSize, 0);
  const totalOutputSize = successful.reduce((sum, r) => sum + r.outputSize, 0);
  const avgTime = successful.reduce((sum, r) => sum + r.time, 0) / successful.length;

  // Print results
  console.log('=== Results ===');
  console.log(`Total files: ${imageFiles.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');
  console.log(`Total time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`Average per image: ${avgTime.toFixed(0)}ms`);
  console.log(`Throughput: ${(successful.length / (totalTime / 1000)).toFixed(1)} images/sec`);
  console.log('');
  console.log(`Input size: ${(totalInputSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Output size: ${(totalOutputSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Compression: ${((1 - totalOutputSize / totalInputSize) * 100).toFixed(1)}% reduction`);

  if (failed.length > 0) {
    console.log('\nFailed files:');
    failed.forEach(f => console.log(`  - ${f.file}`));
  }

  console.log(`\n✅ Output saved to: ${outputDir}`);
}

// Parse command line arguments
function parseArgs(): { inputDir: string; outputDir: string; options: Options } {
  const args = process.argv.slice(2);

  const inputDir = args[0] || './input';
  const outputDir = args[1] || './output';

  const options: Options = {
    format: 'webp',
    quality: 80,
    concurrency: 4
  };

  for (const arg of args) {
    if (arg.startsWith('--width=')) {
      options.width = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--height=')) {
      options.height = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--format=')) {
      options.format = arg.split('=')[1] as any;
    } else if (arg.startsWith('--quality=')) {
      options.quality = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--concurrency=')) {
      options.concurrency = parseInt(arg.split('=')[1]);
    }
  }

  return { inputDir, outputDir, options };
}

// Main
const { inputDir, outputDir, options } = parseArgs();

console.log('🖼️  Batch Image Processor');
console.log('========================\n');
console.log(`Input: ${inputDir}`);
console.log(`Output: ${outputDir}\n`);

batchProcess(inputDir, outputDir, options);
```

## Running the Example

```bash
cd examples
bun install

# Basic usage
bun run batch ./photos ./output

# With options
bun run batch ./photos ./thumbnails --width=200 --format=webp --quality=75

# High concurrency
bun run batch ./photos ./output --concurrency=8
```

## Command Line Options

| Option | Default | Description |
|--------|---------|-------------|
| `--width=N` | - | Target width |
| `--height=N` | - | Target height |
| `--format=F` | webp | Output format (jpeg, png, webp) |
| `--quality=N` | 80 | Quality 1-100 |
| `--concurrency=N` | 4 | Parallel operations |

## Output

```text
🖼️  Batch Image Processor
========================

Input: ./photos
Output: ./thumbnails

Found 50 images to process
Options: {
  "width": 200,
  "format": "webp",
  "quality": 75,
  "concurrency": 4
}

Processing: 50/50

=== Results ===
Total files: 50
Successful: 50
Failed: 0

Total time: 2.34s
Average per image: 47ms
Throughput: 21.4 images/sec

Input size: 156.23MB
Output size: 2.45MB
Compression: 98.4% reduction

✅ Output saved to: ./thumbnails
```

## Performance Tips

### 1. Optimal Concurrency

```typescript
// For CPU-bound work, match CPU cores
const os = require('os');
const concurrency = os.cpus().length;

// For I/O-bound work, higher concurrency is OK
const concurrency = 10;
```

### 2. Memory Management

For very large batches, process in chunks:

```typescript
const BATCH_SIZE = 100;

for (let i = 0; i < files.length; i += BATCH_SIZE) {
  const batch = files.slice(i, i + BATCH_SIZE);
  await processBatch(batch);

  // Force garbage collection between batches
  if (global.gc) global.gc();
}
```

### 3. Progress Reporting

```typescript
let processed = 0;

const results = await Promise.all(
  files.map(async (file) => {
    const result = await processImage(file);
    processed++;

    // Progress bar
    const percent = ((processed / files.length) * 100).toFixed(1);
    process.stdout.write(`\rProgress: ${percent}% (${processed}/${files.length})`);

    return result;
  })
);
```

## Concurrency Comparison

Processing 50 images (10MB total):

| Concurrency | Time | Throughput |
|-------------|------|------------|
| 1 | 12.5s | 4/sec |
| 2 | 6.8s | 7/sec |
| 4 | 3.9s | 13/sec |
| 8 | 2.4s | 21/sec |
| 16 | 2.1s | 24/sec |

Diminishing returns after ~8 concurrent operations.

## Error Handling

```typescript
async function safeBatch(files: string[], options: Options) {
  const results = await Promise.allSettled(
    files.map(f => processImage(f, options))
  );

  const successful = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');

  console.log(`Success: ${successful.length}, Failed: ${failed.length}`);

  // Log failures
  failed.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`${files[i]}: ${r.reason}`);
    }
  });
}
```

## Use Cases

- **Photo Library**: Convert entire photo collection to WebP
- **Website Migration**: Optimize all images for new site
- **Thumbnail Generation**: Create thumbnails for image gallery
- **Format Conversion**: Convert legacy formats to modern ones
- **Backup Processing**: Process before cloud backup

## Next Steps

- [API Endpoint](/examples/api-endpoint) - HTTP server
- [Guide](/guide/) - Learn more features
