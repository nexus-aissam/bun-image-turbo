/**
 * Native binding loader for imgkit
 *
 * Handles platform-specific binary loading for different OS/architectures.
 */

import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

// Create require function that works in both ESM and CJS contexts
// In ESM (Node.js): import.meta.url exists, use createRequire
// In CJS: import.meta.url is undefined, use native require
const nativeRequire =
  typeof import.meta?.url === "string"
    ? createRequire(import.meta.url)
    : (typeof require !== "undefined" ? require : null);

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

  for (const modulePath of possiblePaths) {
    try {
      if (existsSync(modulePath)) {
        return nativeRequire!(modulePath);
      }
    } catch {
      continue;
    }
  }

  // Try requiring the optional package directly (Bun/Node resolution)
  try {
    return nativeRequire!(optionalPackageName);
  } catch {
    // Ignore and fall through to error
  }

  throw new Error(
    `Failed to load native binding for ${platform}-${arch}. ` +
      `Tried: ${possiblePaths.join(", ")}`
  );
}

// Load and export native bindings
export const native = loadNativeBinding();
