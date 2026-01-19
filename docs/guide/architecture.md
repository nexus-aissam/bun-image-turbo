# Architecture

Deep dive into how imgkit achieves its performance.

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Core | Rust | Memory safety, zero-cost abstractions |
| Node Bindings | [napi-rs](https://napi.rs) | Zero-copy buffer handling |
| JPEG Codec | [TurboJPEG](https://crates.io/crates/turbojpeg) | SIMD-accelerated encode/decode |
| Resize Engine | [fast_image_resize](https://crates.io/crates/fast_image_resize) | Multi-threaded with Rayon |
| WebP Codec | [libwebp](https://crates.io/crates/webp) | Google's optimized encoder |
| HEIC Decoder | [libheif-rs](https://crates.io/crates/libheif-rs) | Apple format support |
| Blurhash | [blurhash](https://crates.io/crates/blurhash) | Placeholder generation |

## Processing Pipeline

```
Input Buffer
    │
    ▼
┌─────────────────────────────────────┐
│  Format Detection (magic bytes)     │
│  - JPEG: FFD8                       │
│  - PNG: 89504E47                    │
│  - WebP: RIFF....WEBP               │
│  - HEIC: ftyp + brand check         │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  Decode with Shrink-on-Load         │
│  - JPEG: TurboJPEG + scale factor   │
│  - HEIC: libheif + target size      │
│  - Others: image crate              │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  DynamicImage (Rust image crate)    │
│  - RGB8 or RGBA8 pixel buffer       │
│  - Width, height, color info        │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  Transformations (in order)         │
│  1. Resize (multi-step if needed)   │
│  2. Rotate (90/180/270)             │
│  3. Flip (H/V)                      │
│  4. Grayscale                       │
│  5. Blur                            │
│  6. Sharpen (unsharp mask)          │
│  7. Brightness                      │
│  8. Contrast                        │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  Encode                             │
│  - JPEG: TurboJPEG with SIMD        │
│  - PNG: image crate with filters    │
│  - WebP: libwebp                    │
│  - GIF/BMP: image crate             │
└─────────────────────────────────────┘
    │
    ▼
Output Buffer (napi Buffer)
```

## Key Optimizations

### 1. TurboJPEG with SIMD

Uses libjpeg-turbo which automatically detects CPU features:

- **x86_64**: SSE2, AVX2 (when available)
- **ARM64**: NEON

This provides 2-6x speedup over pure Rust JPEG codecs.

```rust
// Encode with TurboJPEG
let image = turbojpeg::Image {
    pixels: rgb.as_raw().as_slice(),
    width: width as usize,
    pitch: width as usize * 3,
    height: height as usize,
    format: turbojpeg::PixelFormat::RGB,
};
turbojpeg::compress(image, quality, turbojpeg::Subsamp::Sub2x2)
```

### 2. Shrink-on-Decode

JPEG supports decoding at reduced resolution (1/8, 1/4, 1/2, 1/1):

```rust
// Calculate optimal scale factor
fn calculate_jpeg_scale_factor(src_w, src_h, target_w, target_h) -> (i32, i32) {
    let shrink = min(src_w / target_w, src_h / target_h);

    if shrink >= 8.0 { (1, 8) }      // 12.5%
    else if shrink >= 4.0 { (1, 4) } // 25%
    else if shrink >= 2.0 { (1, 2) } // 50%
    else { (1, 1) }                  // 100%
}
```

This matches sharp's `fastShrinkOnLoad` behavior.

### 3. Multi-Step Resize

For large scale reductions (>75% smaller), uses progressive halving:

```rust
// Keep halving until within 2x of target
while current_width > dst_width * 2 && current_height > dst_height * 2 {
    // Halve using Box filter (fast, good for downscaling)
    current_img = resize_with_box_filter(current_img, w/2, h/2);
}
// Final pass with Bilinear
resize_with_bilinear(current_img, dst_width, dst_height)
```

### 4. Adaptive Algorithm Selection

When no filter is specified:

```rust
fn get_resize_algorithm(scale_factor: f64) -> ResizeAlg {
    if scale_factor < 0.25 {
        Box        // >4x downscale: fastest
    } else if scale_factor < 0.5 {
        Bilinear   // 2-4x: fast, good quality
    } else if scale_factor < 0.75 {
        CatmullRom // 1.33-2x: balanced
    } else {
        Lanczos3   // <1.33x: best quality
    }
}
```

### 5. Header-Only Metadata

Metadata extraction reads only file headers, not full decode:

```rust
// JPEG: Parse markers until SOF0/SOF2 (dimensions)
// PNG: Read IHDR chunk (first chunk after signature)
// WebP: Read VP8/VP8L/VP8X chunks
// HEIC: Read ftyp + primary image handle
```

This is why metadata is 950x faster than sharp for WebP.

### 6. RGB vs RGBA Paths

Separate code paths for images with/without alpha:

```rust
if has_alpha {
    // RGBA path - 4 bytes per pixel
    // Premultiply alpha → resize → unpremultiply
    resize_rgba(img, ...)
} else {
    // RGB path - 3 bytes per pixel (25% less data)
    resize_rgb(img, ...)
}
```

### 7. Zero-Copy Buffer Handling

napi-rs provides zero-copy buffer transfer between Node.js and Rust:

```rust
// Input: Node Buffer → Rust slice (no copy)
pub fn metadata_sync(input: Buffer) -> Result<ImageMetadata> {
    decode::get_metadata(&input)  // &input is a slice
}

// Output: Rust Vec → Node Buffer (no copy)
Ok(Buffer::from(output))  // Transfers ownership
```

## Async Architecture

Async functions use `tokio::task::spawn_blocking` to run CPU-intensive work off the main thread:

```rust
#[napi]
pub async fn transform(input: Buffer, options: TransformOptions) -> Result<Buffer> {
    tokio::task::spawn_blocking(move || {
        // Heavy image processing runs in thread pool
        transform::transform_image(&input, &options)
    })
    .await
    .map_err(|e| Error::from_reason(format!("Task error: {}", e)))?
    .map_err(|e| e.into())
}
```

This prevents blocking the Node.js event loop during image processing.

## Memory Protection

Large image protection prevents memory exhaustion:

```rust
const MAX_PIXELS_DEFAULT: u64 = 100_000_000; // 100 megapixels

// Check before decoding
let pixel_count = width as u64 * height as u64;
if pixel_count > MAX_PIXELS_DEFAULT {
    return Err(ImageError::DecodeError("Image too large"));
}
```

## Build Targets

The library is built for all major platforms via GitHub Actions:

| Target | Platform | HEIC |
|--------|----------|:----:|
| `aarch64-apple-darwin` | macOS ARM64 | ✅ |
| `x86_64-apple-darwin` | macOS Intel | ❌ |
| `x86_64-unknown-linux-gnu` | Linux x64 | ❌ |
| `aarch64-unknown-linux-gnu` | Linux ARM64 | ❌ |
| `x86_64-unknown-linux-musl` | Alpine Linux | ❌ |
| `x86_64-pc-windows-msvc` | Windows x64 | ❌ |
| `aarch64-pc-windows-msvc` | Windows ARM64 | ❌ |

HEIC is only enabled on macOS ARM64 because:
- libheif requires Homebrew on macOS (has latest version)
- Linux distros have older libheif versions with API incompatibilities
- Windows lacks easy libheif installation

## Source Code

The Rust source is organized as:

```
rust/src/
├── lib.rs       # napi bindings, exports
├── decode.rs    # Image decoding, shrink-on-load
├── encode.rs    # Image encoding (JPEG/PNG/WebP)
├── resize.rs    # Resize algorithms, multi-step
├── transform.rs # Transform pipeline
└── error.rs     # Error types
```

## Contributing

See the [GitHub repository](https://github.com/nexus-aissam/imgkit) for:
- Build instructions
- Development setup
- Pull request guidelines
