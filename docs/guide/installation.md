# Installation

## Package Managers

::: code-group

```bash [bun]
bun add imgkit
```

```bash [npm]
npm install imgkit
```

```bash [yarn]
yarn add imgkit
```

```bash [pnpm]
pnpm add imgkit
```

:::

## Requirements

- **Bun** 1.0+ or **Node.js** 18+
- No additional dependencies required (prebuilt binaries included)

## Supported Platforms

Prebuilt binaries are available for **all major platforms**:

| Platform | Architecture | Supported | HEIC |
|----------|--------------|:---------:|:----:|
| macOS | ARM64 (M1/M2/M3/M4/M5) | ✅ | ✅ |
| macOS | x64 (Intel) | ✅ | ❌ |
| Linux | x64 (glibc) | ✅ | ❌ |
| Linux | x64 (musl/Alpine) | ✅ | ❌ |
| Linux | ARM64 (glibc) | ✅ | ❌ |
| Windows | x64 | ✅ | ❌ |
| Windows | ARM64 | ✅ | ❌ |

::: tip All Platforms Supported
All platforms listed above are fully supported. HEIC/HEIF support is only available on **macOS ARM64** due to libheif requirements. All other image formats (JPEG, PNG, WebP, GIF, BMP, TIFF, ICO) work on **all platforms**.
:::

## Verifying Installation

```typescript
import { version, metadata } from 'imgkit';

// Check version
console.log(`imgkit v${version()}`);

// Test with an image
const buffer = await Bun.file('image.jpg').arrayBuffer();
const info = await metadata(Buffer.from(buffer));
console.log(info);
```

## Building from Source

If you need to build from source (requires Rust 1.70+):

```bash
# Clone the repository
git clone https://github.com/nexus-aissam/imgkit.git
cd imgkit

# Install dependencies
bun install

# Build native module
bun run build

# Build TypeScript
bun run build:ts
```

### Build Requirements

- Rust 1.70+
- NASM (for TurboJPEG SIMD)
- CMake 3.10+
- C/C++ compiler

::: details macOS Build Dependencies

```bash
brew install nasm cmake
```

:::

::: details Linux Build Dependencies

```bash
# Ubuntu/Debian
sudo apt-get install nasm cmake build-essential

# Fedora
sudo dnf install nasm cmake gcc-c++
```

:::
