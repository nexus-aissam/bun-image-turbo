# Error Handling

Proper error handling ensures your application gracefully handles invalid images and edge cases.

## Common Errors

### Invalid Image Data

```typescript
import { metadata } from 'imgkit';

try {
  const info = await metadata(Buffer.from('not an image'));
} catch (error) {
  console.error(error.message);
  // "Failed to detect image format" or similar
}
```

### Empty Buffer

```typescript
try {
  const info = await metadata(Buffer.alloc(0));
} catch (error) {
  console.error(error.message);
  // "Empty buffer" or "Invalid image data"
}
```

### Unsupported Format

```typescript
try {
  const info = await metadata(heicBuffer);
} catch (error) {
  if (error.message.includes('HEIC')) {
    console.error('HEIC not supported on this platform');
  }
}
```

### Invalid Options

```typescript
try {
  // Invalid quality value
  await toJpeg(buffer, { quality: 150 });
} catch (error) {
  console.error(error.message);
  // "Quality must be between 1 and 100"
}
```

## Error Handling Patterns

### Basic Try-Catch

```typescript
import { transform } from 'imgkit';

async function processImage(buffer: Buffer) {
  try {
    return await transform(buffer, {
      resize: { width: 800 },
      output: { format: 'webp' }
    });
  } catch (error) {
    console.error('Image processing failed:', error.message);
    throw error;
  }
}
```

### With Fallback

```typescript
async function processWithFallback(buffer: Buffer) {
  try {
    return await transform(buffer, {
      resize: { width: 800 },
      output: { format: 'webp' }
    });
  } catch (error) {
    console.warn('WebP failed, trying JPEG:', error.message);

    // Fallback to JPEG
    return await toJpeg(buffer, { quality: 80 });
  }
}
```

### Validation Before Processing

```typescript
import { metadata, transform } from 'imgkit';

async function safeProcess(buffer: Buffer) {
  // Validate first
  let info;
  try {
    info = await metadata(buffer);
  } catch (error) {
    throw new Error(`Invalid image: ${error.message}`);
  }

  // Check constraints
  if (info.width > 10000 || info.height > 10000) {
    throw new Error('Image too large (max 10000x10000)');
  }

  // Process
  return transform(buffer, {
    resize: { width: 800 },
    output: { format: 'webp' }
  });
}
```

### HTTP Endpoint Error Handling

```typescript
import { transform, metadata } from 'imgkit';

app.post('/resize', async (req) => {
  try {
    const body = await req.arrayBuffer();

    if (body.byteLength === 0) {
      return new Response('No image provided', { status: 400 });
    }

    if (body.byteLength > 10 * 1024 * 1024) {
      return new Response('Image too large (max 10MB)', { status: 413 });
    }

    const buffer = Buffer.from(body);
    const info = await metadata(buffer);

    const result = await transform(buffer, {
      resize: { width: 800 },
      output: { format: 'webp' }
    });

    return new Response(result, {
      headers: { 'Content-Type': 'image/webp' }
    });

  } catch (error) {
    console.error('Processing error:', error);

    if (error.message.includes('format')) {
      return new Response('Unsupported image format', { status: 415 });
    }

    return new Response('Image processing failed', { status: 500 });
  }
});
```

## Error Types

### Format Detection Errors

```typescript
// Thrown when image format cannot be detected
"Failed to detect image format"
"Unknown image format"
"Unsupported format: xyz"
```

### HEIC-Specific Errors

```typescript
// Thrown when HEIC is not supported
"HEIC decoding not supported on this platform"
"libheif not available"
```

### Decode Errors

```typescript
// Thrown when image data is corrupted
"Failed to decode image"
"Invalid JPEG data"
"Corrupt PNG file"
```

### Parameter Errors

```typescript
// Thrown for invalid options
"Quality must be between 1 and 100"
"Width must be positive"
"Invalid fit mode"
```

## Best Practices

### 1. Always Validate Input

```typescript
function validateBuffer(buffer: Buffer): void {
  if (!buffer || buffer.length === 0) {
    throw new Error('Empty or null buffer');
  }

  if (buffer.length > 50 * 1024 * 1024) {
    throw new Error('Buffer too large (max 50MB)');
  }
}
```

### 2. Use Type Guards

```typescript
function isImageError(error: unknown): error is Error {
  return error instanceof Error;
}

try {
  await processImage(buffer);
} catch (error) {
  if (isImageError(error)) {
    console.error('Image error:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### 3. Log Errors with Context

```typescript
async function processImage(buffer: Buffer, filename: string) {
  try {
    return await transform(buffer, options);
  } catch (error) {
    console.error(`Failed to process ${filename}:`, {
      error: error.message,
      bufferSize: buffer.length,
      options
    });
    throw error;
  }
}
```

### 4. Provide User-Friendly Messages

```typescript
function getUserMessage(error: Error): string {
  if (error.message.includes('format')) {
    return 'This file type is not supported. Please use JPEG, PNG, or WebP.';
  }
  if (error.message.includes('HEIC')) {
    return 'HEIC files are only supported on macOS. Please convert to JPEG first.';
  }
  if (error.message.includes('corrupt')) {
    return 'The image file appears to be damaged. Please try a different file.';
  }
  return 'An error occurred while processing your image.';
}
```

## Sync Error Handling

Sync functions throw the same errors:

```typescript
import { transformSync } from 'imgkit';

try {
  const result = transformSync(buffer, options);
} catch (error) {
  console.error('Sync processing failed:', error.message);
}
```
