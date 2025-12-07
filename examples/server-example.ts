/**
 * Server Example - Image Processing API
 *
 * A simple HTTP server that demonstrates real-world usage
 * of bun-image-turbo for image processing APIs.
 *
 * Run with: bun examples/server-example.ts
 *
 * Then test with:
 *   curl http://localhost:3000/health
 *   curl http://localhost:3000/resize?width=200 --data-binary @image.jpg -H "Content-Type: image/jpeg" -o output.jpg
 */

import { metadata, resize, transform, toWebp, blurhash, version } from '../src/index';

const PORT = 3000;

// Simple router
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  // Health check
  if (path === '/health') {
    return Response.json({
      status: 'ok',
      version: version(),
      endpoints: ['/health', '/metadata', '/resize', '/webp', '/transform', '/blurhash']
    });
  }

  // All other endpoints require POST with image data
  if (req.method !== 'POST') {
    return Response.json(
      { error: 'POST request with image data required' },
      { status: 405 }
    );
  }

  try {
    const buffer = Buffer.from(await req.arrayBuffer());

    if (buffer.length === 0) {
      return Response.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }

    // Metadata endpoint
    if (path === '/metadata') {
      const info = await metadata(buffer);
      return Response.json(info);
    }

    // Resize endpoint
    if (path === '/resize') {
      const width = parseInt(url.searchParams.get('width') || '400');
      const height = url.searchParams.get('height')
        ? parseInt(url.searchParams.get('height')!)
        : undefined;
      const fit = (url.searchParams.get('fit') || 'cover') as any;

      const start = performance.now();
      const result = await resize(buffer, { width, height, fit });
      const elapsed = performance.now() - start;

      return new Response(result, {
        headers: {
          'Content-Type': 'image/jpeg',
          'X-Processing-Time': `${elapsed.toFixed(2)}ms`,
          'X-Original-Size': buffer.length.toString(),
          'X-Output-Size': result.length.toString(),
        }
      });
    }

    // WebP conversion endpoint
    if (path === '/webp') {
      const quality = parseInt(url.searchParams.get('quality') || '80');
      const width = url.searchParams.get('width')
        ? parseInt(url.searchParams.get('width')!)
        : undefined;

      const start = performance.now();
      let result: Buffer;

      if (width) {
        // Resize + convert
        result = await transform(buffer, {
          resize: { width },
          output: { format: 'webp', webp: { quality } }
        });
      } else {
        // Just convert
        result = await toWebp(buffer, { quality });
      }

      const elapsed = performance.now() - start;

      return new Response(result, {
        headers: {
          'Content-Type': 'image/webp',
          'X-Processing-Time': `${elapsed.toFixed(2)}ms`,
          'X-Original-Size': buffer.length.toString(),
          'X-Output-Size': result.length.toString(),
        }
      });
    }

    // Full transform endpoint
    if (path === '/transform') {
      const width = parseInt(url.searchParams.get('width') || '800');
      const height = url.searchParams.get('height')
        ? parseInt(url.searchParams.get('height')!)
        : undefined;
      const format = (url.searchParams.get('format') || 'webp') as 'jpeg' | 'png' | 'webp';
      const quality = parseInt(url.searchParams.get('quality') || '80');
      const grayscale = url.searchParams.get('grayscale') === 'true';
      const rotate = url.searchParams.get('rotate')
        ? parseInt(url.searchParams.get('rotate')!) as 90 | 180 | 270
        : undefined;
      const blur = url.searchParams.get('blur')
        ? parseFloat(url.searchParams.get('blur')!)
        : undefined;

      const start = performance.now();
      const result = await transform(buffer, {
        resize: { width, height, fit: 'cover' },
        rotate,
        grayscale,
        blur,
        output: {
          format,
          jpeg: format === 'jpeg' ? { quality } : undefined,
          webp: format === 'webp' ? { quality } : undefined,
        }
      });
      const elapsed = performance.now() - start;

      const contentType = format === 'jpeg' ? 'image/jpeg'
        : format === 'png' ? 'image/png'
        : 'image/webp';

      return new Response(result, {
        headers: {
          'Content-Type': contentType,
          'X-Processing-Time': `${elapsed.toFixed(2)}ms`,
          'X-Original-Size': buffer.length.toString(),
          'X-Output-Size': result.length.toString(),
        }
      });
    }

    // Blurhash endpoint
    if (path === '/blurhash') {
      const componentsX = parseInt(url.searchParams.get('x') || '4');
      const componentsY = parseInt(url.searchParams.get('y') || '3');

      // Resize to small thumbnail for faster blurhash
      const thumbnail = await resize(buffer, { width: 32 });

      const start = performance.now();
      const result = await blurhash(thumbnail, componentsX, componentsY);
      const elapsed = performance.now() - start;

      return Response.json({
        hash: result.hash,
        width: result.width,
        height: result.height,
        processingTime: `${elapsed.toFixed(2)}ms`
      });
    }

    return Response.json(
      { error: 'Unknown endpoint' },
      { status: 404 }
    );

  } catch (error: any) {
    return Response.json(
      { error: error.message || 'Processing failed' },
      { status: 500 }
    );
  }
}

// Start server
console.log('='.repeat(60));
console.log('  bun-image-turbo Server Example');
console.log('='.repeat(60));
console.log(`\nLibrary version: ${version()}`);
console.log(`\nStarting server on http://localhost:${PORT}\n`);
console.log('Available endpoints:');
console.log('  GET  /health              - Health check');
console.log('  POST /metadata            - Get image metadata');
console.log('  POST /resize?width=400    - Resize image');
console.log('  POST /webp?quality=80     - Convert to WebP');
console.log('  POST /transform?...       - Full transform pipeline');
console.log('  POST /blurhash?x=4&y=3    - Generate blurhash');
console.log('\nExample:');
console.log('  curl http://localhost:3000/health');
console.log('  curl -X POST http://localhost:3000/metadata --data-binary @image.jpg');
console.log('');

Bun.serve({
  port: PORT,
  fetch: handleRequest,
});

console.log(`Server running at http://localhost:${PORT}`);
