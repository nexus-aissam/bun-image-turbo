/**
 * API Endpoint Example
 *
 * HTTP server for on-the-fly image processing
 */

import { transform, metadata, toWebp, toJpeg } from 'imgkit';

const imageCache = new Map<string, Buffer>();

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Health check
  if (url.pathname === '/health') {
    return new Response('OK');
  }

  // Get metadata: GET /metadata?url=<image-url>
  if (url.pathname === '/metadata') {
    const imageUrl = url.searchParams.get('url');
    if (!imageUrl) {
      return Response.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    try {
      const response = await fetch(imageUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      const meta = await metadata(buffer);
      return Response.json(meta);
    } catch (error: any) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  // Process image: GET /process?url=<image-url>&width=...&height=...&format=...&quality=...
  if (url.pathname === '/process') {
    const imageUrl = url.searchParams.get('url');
    const width = parseInt(url.searchParams.get('width') || '0') || undefined;
    const height = parseInt(url.searchParams.get('height') || '0') || undefined;
    const format = (url.searchParams.get('format') || 'webp') as 'jpeg' | 'png' | 'webp';
    const quality = parseInt(url.searchParams.get('quality') || '80');

    if (!imageUrl) {
      return Response.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    const cacheKey = `${imageUrl}-${width}-${height}-${format}-${quality}`;

    // Check cache
    if (imageCache.has(cacheKey)) {
      return new Response(imageCache.get(cacheKey), {
        headers: {
          'Content-Type': `image/${format}`,
          'Cache-Control': 'public, max-age=31536000',
          'X-Cache': 'HIT'
        }
      });
    }

    try {
      const response = await fetch(imageUrl);
      const buffer = Buffer.from(await response.arrayBuffer());

      const processed = await transform(buffer, {
        resize: width || height ? { width, height, fit: 'inside' } : undefined,
        output: {
          format,
          jpeg: format === 'jpeg' ? { quality } : undefined,
          webp: format === 'webp' ? { quality } : undefined,
        }
      });

      // Cache (limit size)
      if (imageCache.size < 100) {
        imageCache.set(cacheKey, processed);
      }

      return new Response(processed, {
        headers: {
          'Content-Type': `image/${format}`,
          'Cache-Control': 'public, max-age=31536000',
          'X-Cache': 'MISS'
        }
      });
    } catch (error: any) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  // Upload: POST /upload
  if (url.pathname === '/upload' && req.method === 'POST') {
    try {
      const formData = await req.formData();
      const file = formData.get('image') as File;

      if (!file) {
        return Response.json({ error: 'No image provided' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const width = parseInt(formData.get('width') as string || '0') || undefined;
      const height = parseInt(formData.get('height') as string || '0') || undefined;
      const format = (formData.get('format') as string || 'webp') as 'jpeg' | 'png' | 'webp';
      const quality = parseInt(formData.get('quality') as string || '80');

      const processed = await transform(buffer, {
        resize: width || height ? { width, height, fit: 'inside' } : undefined,
        output: {
          format,
          jpeg: format === 'jpeg' ? { quality } : undefined,
          webp: format === 'webp' ? { quality } : undefined,
        }
      });

      return new Response(processed, {
        headers: {
          'Content-Type': `image/${format}`,
          'Content-Disposition': `attachment; filename="processed.${format}"`
        }
      });
    } catch (error: any) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  return new Response('Not Found', { status: 404 });
}

const server = Bun.serve({
  port: 3000,
  fetch: handleRequest,
});

console.log(`Image processing server running at http://localhost:${server.port}

Endpoints:
  GET  /health
  GET  /metadata?url=<image-url>
  GET  /process?url=<image-url>&width=800&height=600&format=webp&quality=80
  POST /upload (FormData: image, width, height, format, quality)

Example:
  curl "http://localhost:3000/process?url=https://picsum.photos/1920/1080&width=800&format=webp" -o test.webp
`);
