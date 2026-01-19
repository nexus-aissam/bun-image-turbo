# API Endpoint

Build an HTTP server for on-the-fly image processing.

## Source Code

```typescript
/**
 * API Endpoint Example
 * HTTP server for image processing
 *
 * Endpoints:
 * - POST /resize?width=800&height=600
 * - POST /convert?format=webp&quality=80
 * - POST /transform (JSON body)
 * - POST /metadata
 * - POST /blurhash
 */

import { metadata, resize, toJpeg, toPng, toWebp, transform, blurhash } from 'imgkit';

const PORT = 3000;

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    // Only accept POST
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers });
    }

    try {
      // Get image from request body
      const body = await req.arrayBuffer();
      if (body.byteLength === 0) {
        return new Response('No image provided', { status: 400, headers });
      }

      // Size limit (10MB)
      if (body.byteLength > 10 * 1024 * 1024) {
        return new Response('Image too large (max 10MB)', { status: 413, headers });
      }

      const buffer = Buffer.from(body);

      // Route handling
      switch (path) {
        case '/metadata': {
          const info = await metadata(buffer);
          return Response.json(info, { headers });
        }

        case '/resize': {
          const width = parseInt(url.searchParams.get('width') || '800');
          const height = url.searchParams.get('height')
            ? parseInt(url.searchParams.get('height')!)
            : undefined;
          const fit = (url.searchParams.get('fit') as any) || 'cover';

          const result = await resize(buffer, { width, height, fit });
          return new Response(result, {
            // Note: resize() always outputs PNG format
            headers: { ...headers, 'Content-Type': 'image/png' }
          });
        }

        case '/convert': {
          const format = url.searchParams.get('format') || 'webp';
          const quality = parseInt(url.searchParams.get('quality') || '80');

          let result: Buffer;
          let contentType: string;

          switch (format) {
            case 'jpeg':
            case 'jpg':
              result = await toJpeg(buffer, { quality });
              contentType = 'image/jpeg';
              break;
            case 'png':
              result = await toPng(buffer);
              contentType = 'image/png';
              break;
            case 'webp':
            default:
              result = await toWebp(buffer, { quality });
              contentType = 'image/webp';
              break;
          }

          return new Response(result, {
            headers: { ...headers, 'Content-Type': contentType }
          });
        }

        case '/transform': {
          // Get transform options from query params or JSON body
          const contentType = req.headers.get('content-type');
          let options: any;

          if (contentType?.includes('application/json')) {
            // If JSON body, parse options from there
            // Note: This requires sending image via multipart or base64
            return new Response('JSON body not supported yet', { status: 400 });
          }

          // Use query params
          const width = url.searchParams.get('width');
          const height = url.searchParams.get('height');
          const format = url.searchParams.get('format') || 'webp';
          const quality = parseInt(url.searchParams.get('quality') || '80');
          const grayscale = url.searchParams.get('grayscale') === 'true';
          const rotate = url.searchParams.get('rotate');
          const blur = url.searchParams.get('blur');
          const sharpen = url.searchParams.get('sharpen');

          options = {
            output: {
              format,
              [format]: { quality }
            }
          };

          if (width || height) {
            options.resize = {
              width: width ? parseInt(width) : undefined,
              height: height ? parseInt(height) : undefined,
              fit: url.searchParams.get('fit') || 'cover'
            };
          }

          if (grayscale) options.grayscale = true;
          if (rotate) options.rotate = parseInt(rotate);
          if (blur) options.blur = parseInt(blur);
          if (sharpen) options.sharpen = parseInt(sharpen);

          const result = await transform(buffer, options);
          const resultContentType = format === 'png' ? 'image/png' :
                                   format === 'jpeg' ? 'image/jpeg' : 'image/webp';

          return new Response(result, {
            headers: { ...headers, 'Content-Type': resultContentType }
          });
        }

        case '/blurhash': {
          const componentsX = parseInt(url.searchParams.get('x') || '4');
          const componentsY = parseInt(url.searchParams.get('y') || '3');
          const result = await blurhash(buffer, componentsX, componentsY);
          return Response.json(result, { headers });
        }

        default:
          return new Response('Not found', { status: 404, headers });
      }
    } catch (error) {
      console.error('Processing error:', error);
      return new Response(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { status: 500, headers }
      );
    }
  }
});

console.log(`🖼️  Image processing API running at http://localhost:${PORT}`);
console.log('');
console.log('Endpoints:');
console.log('  POST /metadata              - Get image metadata');
console.log('  POST /resize?width=800      - Resize image');
console.log('  POST /convert?format=webp   - Convert format');
console.log('  POST /transform?...         - Apply transformations');
console.log('  POST /blurhash              - Generate blurhash');
console.log('');
console.log('Example:');
console.log('  curl -X POST -F "file=@image.jpg" http://localhost:3000/resize?width=400');
```

## Running the Server

```bash
cd examples
bun install
bun run api
```

## API Usage

### Get Metadata

```bash
curl -X POST --data-binary @photo.jpg \
  http://localhost:3000/metadata
```

Response:
```json
{
  "width": 1920,
  "height": 1080,
  "format": "jpeg",
  "channels": 3,
  "hasAlpha": false
}
```

### Resize Image

```bash
# Resize to 800px width (outputs PNG)
curl -X POST --data-binary @photo.jpg \
  "http://localhost:3000/resize?width=800" \
  --output resized.png

# Resize with specific dimensions (outputs PNG)
curl -X POST --data-binary @photo.jpg \
  "http://localhost:3000/resize?width=400&height=300&fit=cover" \
  --output thumbnail.png

# For other formats, use /transform instead:
curl -X POST --data-binary @photo.jpg \
  "http://localhost:3000/transform?width=800&format=jpeg&quality=85" \
  --output resized.jpg
```

### Convert Format

```bash
# Convert to WebP
curl -X POST --data-binary @photo.jpg \
  "http://localhost:3000/convert?format=webp&quality=85" \
  --output photo.webp

# Convert to PNG
curl -X POST --data-binary @photo.jpg \
  "http://localhost:3000/convert?format=png" \
  --output photo.png
```

### Transform Pipeline

```bash
# Resize + grayscale + sharpen
curl -X POST --data-binary @photo.jpg \
  "http://localhost:3000/transform?width=800&grayscale=true&sharpen=10&format=webp" \
  --output transformed.webp

# Rotate + resize
curl -X POST --data-binary @photo.jpg \
  "http://localhost:3000/transform?width=600&rotate=90&format=jpeg&quality=90" \
  --output rotated.jpg
```

### Generate Blurhash

```bash
curl -X POST --data-binary @photo.jpg \
  "http://localhost:3000/blurhash?x=4&y=3"
```

Response:
```json
{
  "hash": "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
  "width": 1920,
  "height": 1080
}
```

## JavaScript Client

```typescript
async function processImage(file: File, options: {
  width?: number;
  format?: 'jpeg' | 'webp' | 'png';
  quality?: number;
}) {
  const params = new URLSearchParams();
  if (options.width) params.set('width', options.width.toString());
  if (options.format) params.set('format', options.format);
  if (options.quality) params.set('quality', options.quality.toString());

  const response = await fetch(
    `http://localhost:3000/transform?${params}`,
    {
      method: 'POST',
      body: file,
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.blob();
}

// Usage
const file = document.querySelector('input[type="file"]').files[0];
const processed = await processImage(file, {
  width: 800,
  format: 'webp',
  quality: 85
});
```

## Production Considerations

1. **Rate limiting** - Add request limits
2. **Authentication** - Protect endpoints
3. **Caching** - Cache processed images
4. **CDN** - Serve from edge
5. **Monitoring** - Track performance

## Next Steps

- [Batch Processing](/examples/batch-processing) - Process multiple files
