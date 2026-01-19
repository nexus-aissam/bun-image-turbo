# Async vs Sync

imgkit provides both async and sync versions of all functions.

## Function Pairs

| Async | Sync |
|-------|------|
| `metadata()` | `metadataSync()` |
| `resize()` | `resizeSync()` |
| `toJpeg()` | `toJpegSync()` |
| `toPng()` | `toPngSync()` |
| `toWebp()` | `toWebpSync()` |
| `transform()` | `transformSync()` |
| `blurhash()` | `blurhashSync()` |

## When to Use Async

Use async functions for:

- **Web servers** - Don't block request handling
- **Batch processing** - Process multiple images concurrently
- **Large images** - Long operations shouldn't freeze the app
- **Production code** - Better resource utilization

```typescript
import { transform } from 'imgkit';

// Server endpoint
app.post('/resize', async (req) => {
  const buffer = await req.arrayBuffer();

  // Non-blocking - other requests can be handled
  const result = await transform(Buffer.from(buffer), {
    resize: { width: 800 },
    output: { format: 'webp' }
  });

  return new Response(result);
});
```

## When to Use Sync

Use sync functions for:

- **CLI tools** - Simpler code, sequential processing
- **Scripts** - One-off operations
- **Build tools** - When order matters
- **Testing** - Simpler test setup

```typescript
import { transformSync } from 'imgkit';

// CLI tool
const input = Bun.file(process.argv[2]).arrayBuffer();
const result = transformSync(Buffer.from(input), {
  resize: { width: 800 },
  output: { format: 'jpeg' }
});
Bun.write('output.jpg', result);
```

## Async Examples

### Single Image

```typescript
import { transform } from 'imgkit';

async function processImage(path: string) {
  const buffer = Buffer.from(await Bun.file(path).arrayBuffer());
  return transform(buffer, {
    resize: { width: 800 },
    output: { format: 'webp' }
  });
}

const result = await processImage('photo.jpg');
```

### Multiple Images (Concurrent)

```typescript
import { transform } from 'imgkit';

async function processMany(paths: string[]) {
  return Promise.all(
    paths.map(async (path) => {
      const buffer = Buffer.from(await Bun.file(path).arrayBuffer());
      return transform(buffer, {
        resize: { width: 800 },
        output: { format: 'webp' }
      });
    })
  );
}

const results = await processMany(['a.jpg', 'b.jpg', 'c.jpg']);
```

### With Error Handling

```typescript
import { transform } from 'imgkit';

async function safeProcess(buffer: Buffer) {
  try {
    return await transform(buffer, {
      resize: { width: 800 },
      output: { format: 'webp' }
    });
  } catch (error) {
    console.error('Processing failed:', error.message);
    return null;
  }
}
```

## Sync Examples

### Single Image

```typescript
import { transformSync } from 'imgkit';

const buffer = Buffer.from(Bun.file('photo.jpg').arrayBuffer());
const result = transformSync(buffer, {
  resize: { width: 800 },
  output: { format: 'webp' }
});
Bun.write('output.webp', result);
```

### Sequential Processing

```typescript
import { metadataSync, transformSync } from 'imgkit';

const files = ['a.jpg', 'b.jpg', 'c.jpg'];

for (const file of files) {
  const buffer = Buffer.from(Bun.file(file).arrayBuffer());

  const info = metadataSync(buffer);
  console.log(`${file}: ${info.width}x${info.height}`);

  const result = transformSync(buffer, {
    resize: { width: 800 },
    output: { format: 'webp' }
  });

  Bun.write(file.replace('.jpg', '.webp'), result);
}
```

## Performance Comparison

Async is better for concurrent workloads:

```typescript
// Async: 62ms for 50 operations
const start = performance.now();
await Promise.all(
  Array(50).fill(buffer).map(b => transform(b, options))
);
console.log(`Async: ${performance.now() - start}ms`);

// Sync: 150ms+ for 50 operations (sequential)
const start2 = performance.now();
Array(50).fill(buffer).forEach(b => transformSync(b, options));
console.log(`Sync: ${performance.now() - start2}ms`);
```

## Mixing Async and Sync

You can use both in the same codebase:

```typescript
import {
  metadata,      // async
  metadataSync,  // sync
  transform,     // async
  transformSync  // sync
} from 'imgkit';

// Quick sync check
const info = metadataSync(buffer);

// Async processing
if (info.width > 1000) {
  const result = await transform(buffer, {
    resize: { width: 1000 },
    output: { format: 'webp' }
  });
}
```

## Best Practices

### Do

```typescript
// ✅ Use async in servers
app.get('/image', async (req) => {
  const result = await transform(buffer, options);
  return new Response(result);
});

// ✅ Use async for batch processing
await Promise.all(files.map(f => processAsync(f)));

// ✅ Use sync in CLI tools
const result = transformSync(buffer, options);
```

### Don't

```typescript
// ❌ Don't use sync in servers (blocks all requests)
app.get('/image', (req) => {
  const result = transformSync(buffer, options);  // BAD!
  return new Response(result);
});

// ❌ Don't await sync functions
const result = await transformSync(buffer, options);  // Pointless
```
