# Contributing to imgkit

Thank you for your interest in contributing to imgkit! This document provides guidelines and instructions for contributing to this high-performance native image processing library.

## Table of Contents

- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Running Tests](#running-tests)
- [Pull Request Process](#pull-request-process)
- [Code Style Guidelines](#code-style-guidelines)

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- A clear and descriptive title
- Detailed steps to reproduce the issue
- Expected behavior vs actual behavior
- Your environment (OS, Bun version, Rust version)
- Code samples or test cases if applicable
- Screenshots if relevant

### Suggesting Features

Feature suggestions are welcome! Please:

- Use a clear and descriptive title
- Provide a detailed description of the proposed feature
- Explain why this feature would be useful
- Include code examples showing how it might be used
- Consider the performance implications for a high-performance library

### Code Contributions

1. Fork the repository
2. Create a new branch for your feature or bugfix
3. Make your changes following our code style guidelines
4. Add or update tests as needed
5. Ensure all tests pass
6. Submit a pull request

## Development Setup

### Prerequisites

- **Rust**: Install from [rustup.rs](https://rustup.rs)
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```

- **Bun**: Install from [bun.sh](https://bun.sh)
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

- **Node.js** (optional, for napi-rs compatibility testing)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/nexus-aissam/imgkit.git
   cd imgkit
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Build the native module**
   ```bash
   # Build native Rust module
   bun run build

   # Build TypeScript bindings
   bun run build:ts

   # Or build everything at once
   bun run build:all
   ```

4. **Verify the setup**
   ```bash
   bun test
   ```

### Project Structure

```
imgkit/
├── rust/src/           # Rust source code
│   ├── lib.rs          # Main library entry point & napi bindings
│   ├── resize.rs       # Image resizing (fast_image_resize)
│   ├── crop.rs         # Cropping & smart crop (smartcrop2)
│   ├── transform.rs    # Image transformations
│   ├── encode.rs       # Format encoding (JPEG, PNG, WebP)
│   ├── tensor.rs       # ML tensor conversion (SIMD)
│   ├── metadata/       # Metadata extraction per format
│   ├── metadata_write.rs # EXIF writing
│   ├── decode/         # Format-specific decoders
│   ├── error.rs        # Error types
│   └── types.rs        # Shared type definitions
├── src/                # TypeScript source
│   └── index.ts        # TypeScript bindings & exports
├── test/               # Test suites
│   ├── local/          # Local unit tests
│   └── packages/       # Package manager integration tests
├── benchmarks/         # Performance benchmarks
├── examples/           # Usage examples
├── docs/               # VitePress documentation
└── dist/               # Built output
```

## Running Tests

### Local Tests

Run local unit tests:
```bash
bun test
# or
bun run test:local
```

Run specific test file:
```bash
bun test test/local/resize.test.ts
```

### Package Manager Tests

Test with different package managers:
```bash
# Test with Bun
bun run test:bun

# Test with npm
bun run test:npm

# Test with yarn
bun run test:yarn

# Test with pnpm
bun run test:pnpm

# Run all package tests
bun run test:packages

# Run everything
bun run test:all
```

### Benchmarks

Run performance benchmarks:
```bash
bun run bench
```

This runs comparison benchmarks against sharp to verify performance.

## Pull Request Process

### Before Submitting

1. **Update documentation**: Update README.md and relevant docs if needed
2. **Add tests**: Ensure new features have adequate test coverage
3. **Run tests**: All tests must pass (`cargo test` and `bun test`)
4. **Format code**: Run `cargo fmt` and ensure TypeScript follows our style
5. **Lint code**: Run `cargo clippy -- -D warnings`
6. **Update CHANGELOG**: Add a note about your changes

### PR Checklist

- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Code follows style guidelines
- [ ] Commits are clear and descriptive
- [ ] No unnecessary dependencies added
- [ ] Performance impact considered
- [ ] Backwards compatibility maintained (or breaking changes documented)

### PR Title Format

Use conventional commits format:
- `feat: add HEIC format support`
- `fix: correct color space conversion in WebP`
- `perf: optimize thumbnail generation`
- `docs: update API documentation`
- `test: add tests for smart cropping`

### Review Process

1. Maintainers will review your PR within a few days
2. Address any requested changes
3. Once approved, a maintainer will merge your PR
4. Your contribution will be included in the next release

## Code Style Guidelines

### Rust Code Style

1. **Follow Rust conventions**:
   ```bash
   cargo fmt
   cargo clippy -- -D warnings
   ```

2. **Naming conventions**:
   - Functions: `snake_case`
   - Types/Structs: `PascalCase`
   - Constants: `SCREAMING_SNAKE_CASE`

3. **Error handling**:
   - Use `Result` types for operations that can fail
   - Provide meaningful error messages
   - Document error conditions

4. **Documentation**:
   ```rust
   /// Resizes an image to the specified dimensions.
   ///
   /// # Arguments
   ///
   /// * `input` - Input image buffer
   /// * `width` - Target width in pixels
   /// * `height` - Target height in pixels
   ///
   /// # Returns
   ///
   /// Returns a `Result` containing the resized image buffer or an error.
   ///
   /// # Examples
   ///
   /// ```
   /// let resized = resize_image(&input, 800, 600)?;
   /// ```
   pub fn resize_image(input: &[u8], width: u32, height: u32) -> Result<Vec<u8>> {
       // Implementation
   }
   ```

5. **Performance considerations**:
   - Profile before optimizing
   - Document performance-critical sections
   - Use benchmarks to validate improvements
   - Prefer zero-copy operations where possible

### TypeScript Code Style

1. **Use TypeScript strict mode**

2. **Naming conventions**:
   - Functions: `camelCase`
   - Types/Interfaces: `PascalCase`
   - Constants: `UPPER_SNAKE_CASE`

3. **Documentation**:
   ```typescript
   /**
    * Resizes an image to the specified dimensions.
    * 
    * @param input - Input image buffer
    * @param width - Target width in pixels
    * @param height - Target height in pixels
    * @returns Promise resolving to resized image buffer
    * 
    * @example
    * ```typescript
    * const resized = await resizeImage(input, 800, 600);
    * ```
    */
   export async function resizeImage(
     input: Buffer,
     width: number,
     height: number
   ): Promise<Buffer> {
     // Implementation
   }
   ```

4. **Testing**:
   - Write descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)
   - Test edge cases and error conditions

### Commit Messages

Follow conventional commits:
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `perf`: Performance improvement
- `docs`: Documentation changes
- `test`: Test additions/modifications
- `refactor`: Code refactoring
- `chore`: Build process or tooling changes

Example:
```
feat(resize): add bicubic interpolation support

Implements bicubic interpolation algorithm for higher quality
image resizing. Adds new ResizeFilter enum and benchmarks.

Closes #123
```

## Getting Help

- **Documentation**: Check the [README.md](README.md) and [online docs](https://nexus-aissam.github.io/imgkit/)
- **API Reference**: See [API docs](https://nexus-aissam.github.io/imgkit/api/)
- **Issues**: Search [existing issues](https://github.com/nexus-aissam/imgkit/issues) or create a new one
- **Discussions**: Use GitHub Discussions for questions and ideas

## License

By contributing to imgkit, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing! 🚀
