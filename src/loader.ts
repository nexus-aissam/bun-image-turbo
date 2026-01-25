/**
 * Native binding loader for imgkit
 *
 * Handles platform-specific binary loading for different OS/architectures.
 * Supports both Node.js and Bun runtimes.
 */

// Declare Bun global for TypeScript
declare const Bun: unknown;

import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

// Detect Bun runtime
const isBun = typeof Bun !== "undefined";

// Create require function that works in both ESM and CJS contexts
// Bun: Use globalThis.require which Bun provides for native module loading
// Node.js ESM: Use createRequire(import.meta.url)
// Node.js CJS: Use native require
const nativeRequire: NodeJS.Require | null = (() => {
  // Bun provides a global require that works with native modules
  if (isBun && typeof globalThis.require === "function") {
    return globalThis.require as NodeJS.Require;
  }
  // Node.js ESM context
  if (typeof import.meta?.url === "string") {
    return createRequire(import.meta.url);
  }
  // Node.js CJS context
  if (typeof require !== "undefined") {
    return require;
  }
  return null;
})();

/**
 * Get current directory for ESM
 */
export function getCurrentDir(): string {
  try {
    return dirname(fileURLToPath(import.meta.url));
  } catch {
    return __dirname;
  }
}

/**
 * Load the native binding for the current platform
 */
export function loadNativeBinding(): any {
  const platform = process.platform;
  const arch = process.arch;

  // Map to napi-rs target names and package names
  // Binary names follow napi-rs conventions, package names are simplified
  let targetName: string;
  let packageSuffix: string;
  switch (platform) {
    case "darwin":
      targetName = arch === "arm64" ? "darwin-arm64" : "darwin-x64";
      packageSuffix = targetName;
      break;
    case "linux":
      // Check for musl vs glibc
      const isMusl =
        existsSync("/etc/alpine-release") ||
        process.env.npm_config_libc === "musl";
      if (arch === "arm64") {
        targetName = isMusl ? "linux-arm64-musl" : "linux-arm64-gnu";
      } else {
        targetName = isMusl ? "linux-x64-musl" : "linux-x64-gnu";
      }
      packageSuffix = targetName;
      break;
    case "win32":
      // Binary uses win32-*-msvc, package uses windows-*
      targetName = arch === "arm64" ? "win32-arm64-msvc" : "win32-x64-msvc";
      packageSuffix = arch === "arm64" ? "windows-arm64" : "windows-x64";
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}-${arch}`);
  }

  const currentDir = getCurrentDir();
  const binaryName = `image-turbo.${targetName}.node`;
  const optionalPackageName = `imgkit-${packageSuffix}`;

  // Try loading from different locations
  const possiblePaths = [
    // Same directory as this file (dist/)
    join(currentDir, binaryName),
    // Parent directory (package root)
    join(currentDir, "..", binaryName),
    // Optional dependency package (installed in node_modules)
    join(currentDir, "..", "..", optionalPackageName, binaryName),
    // CWD (development)
    join(process.cwd(), binaryName),
  ];

  const errors: string[] = [];

  // Strategy 1: Try requiring the optional package directly first (works best in Bun)
  // Bun's module resolution handles optional dependencies well
  if (isBun) {
    try {
      return nativeRequire!(optionalPackageName);
    } catch (e) {
      errors.push(`Package ${optionalPackageName}: ${(e as Error).message}`);
    }
  }

  // Strategy 2: Try loading from file paths
  for (const modulePath of possiblePaths) {
    try {
      if (existsSync(modulePath)) {
        return nativeRequire!(modulePath);
      }
    } catch (e) {
      errors.push(`Path ${modulePath}: ${(e as Error).message}`);
      continue;
    }
  }

  // Strategy 3: Try requiring the optional package directly (Node.js fallback)
  if (!isBun) {
    try {
      return nativeRequire!(optionalPackageName);
    } catch (e) {
      errors.push(`Package ${optionalPackageName}: ${(e as Error).message}`);
    }
  }

  // Strategy 4 (Bun only): Try using Bun's plugin system for native modules
  if (isBun) {
    for (const modulePath of possiblePaths) {
      try {
        if (existsSync(modulePath)) {
          // Use dynamic import with file:// URL for Bun
          const module = require(modulePath);
          if (module) return module;
        }
      } catch (e) {
        errors.push(`Bun require ${modulePath}: ${(e as Error).message}`);
        continue;
      }
    }
  }

  throw new Error(
    `Failed to load native binding for ${platform}-${arch}.\n` +
      `Runtime: ${isBun ? "Bun" : "Node.js"}\n` +
      `Tried paths: ${possiblePaths.join(", ")}\n` +
      `Errors:\n${errors.map((e) => `  - ${e}`).join("\n")}`
  );
}

// Load and export native bindings
export const native = loadNativeBinding();
