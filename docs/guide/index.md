# Introduction

**imgkit** is a high-performance image processing library for Bun and Node.js, built with Rust and napi-rs.

## Why imgkit?

### Performance

Built from the ground up for speed:

- **950x faster** metadata extraction for WebP images
- **38x faster** JPEG metadata parsing
- **2.6x faster** under concurrent load
- Zero-copy buffer handling with Rust
- **Cross-platform** - macOS, Linux, Windows (all architectures)

### HEIC Support

The **only** high-performance image library with native HEIC/HEIF support:

- Read iPhone photos directly
- Convert HEIC to JPEG, PNG, WebP
- Full metadata extraction
- Shrink-on-decode optimization

### Modern Architecture

- Written in Rust for memory safety and performance
- TypeScript-first with full type definitions
- Both async and sync APIs
- Cross-platform (macOS, Linux, Windows)

## Comparison with sharp

| Feature | imgkit | sharp |
|---------|:---------------:|:-----:|
| HEIC Support | ✅ | ❌ |
| Blurhash | ✅ | ❌ |
| Metadata Speed | 950x faster | baseline |
| Concurrent Perf | 2.6x faster | baseline |
| Transform Speed | 1.6x faster | baseline |
| TypeScript | First-class | Types included |

## Supported Formats

| Format | Read | Write |
|--------|:----:|:-----:|
| JPEG | ✅ | ✅ |
| PNG | ✅ | ✅ |
| WebP | ✅ | ✅ |
| HEIC/HEIF | ✅ | ❌ |
| AVIF | ✅ | ❌ |
| GIF | ✅ | ✅ |
| BMP | ✅ | ✅ |
| TIFF | ✅ | ❌ |
| ICO | ✅ | ❌ |

## Next Steps

- [Installation](/guide/installation) - Get started with imgkit
- [Quick Start](/guide/quick-start) - Learn the basics
- [API Reference](/api/) - Explore all functions
