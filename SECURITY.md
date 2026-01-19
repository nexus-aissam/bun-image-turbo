# Security Policy

## Supported Versions

We actively support the following versions of imgkit with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

**Note**: We recommend always using the latest stable version to ensure you have the most recent security patches.

## Security Considerations

### Image Processing Vulnerabilities

As an image processing library that handles untrusted input, imgkit takes security seriously. Common attack vectors in image processing include:

- **Malformed Images**: Crafted images designed to exploit parser vulnerabilities
- **Memory Exhaustion**: Extremely large images or decompression bombs
- **Buffer Overflows**: Invalid dimensions or corrupted image data
- **Path Traversal**: File operations with malicious paths
- **Metadata Exploits**: Malicious EXIF or other metadata

### Our Security Measures

1. **Input Validation**: All inputs are validated before processing
2. **Memory Limits**: Protection against memory exhaustion attacks
3. **Safe Rust**: Written in Rust with memory safety guarantees
4. **Dependency Auditing**: Regular audits of Rust and npm dependencies
5. **Fuzzing**: Continuous fuzzing to discover edge cases

## Reporting a Vulnerability

### Please Do Not

- **Do not** open a public GitHub issue for security vulnerabilities
- **Do not** disclose the vulnerability publicly until it has been addressed

### How to Report

If you discover a security vulnerability, please report it by emailing:

**Security Contact**: [INSERT_SECURITY_EMAIL@example.com]

### What to Include

Please include the following information in your report:

1. **Description**: Clear description of the vulnerability
2. **Impact**: Potential impact and severity assessment
3. **Reproduction**: Step-by-step instructions to reproduce
4. **Proof of Concept**: Code or files demonstrating the issue (if applicable)
5. **Suggested Fix**: Your recommendation for addressing it (optional)
6. **Environment**: Bun version, OS, and any other relevant details

### Example Report

```
Subject: [SECURITY] Buffer overflow in HEIC decoder

Description:
A crafted HEIC file with invalid dimensions can cause a buffer overflow
in the decoding process.

Impact:
- Potential for arbitrary code execution
- Denial of service through crashes
- Memory corruption

Reproduction:
1. Create a HEIC file with dimensions set to 0x7FFFFFFF
2. Call decodeHeic() with this file
3. Application crashes with segmentation fault

Attached: poc.heic (malicious sample)

Environment:
- imgkit v1.2.3
- Bun v1.0.20
- Ubuntu 22.04
```

## Response Process

### Timeline

We aim to respond to security reports according to the following timeline:

1. **Initial Response**: Within 24-48 hours
2. **Vulnerability Assessment**: Within 3-5 business days
3. **Fix Development**: Depends on severity and complexity
4. **Patch Release**: As soon as safely possible
5. **Public Disclosure**: After patch is released

### Severity Levels

We assess vulnerabilities using the following criteria:

- **Critical**: Remote code execution, arbitrary code execution
- **High**: Authentication bypass, privilege escalation, data corruption
- **Medium**: Denial of service, information disclosure
- **Low**: Issues with minimal security impact

### Recognition

We believe in recognizing security researchers who help us improve:

- **Security Hall of Fame**: Recognition in our SECURITY.md file
- **Credit**: Mentioned in release notes (if desired)
- **Bug Bounty**: Currently not available, but under consideration

## Disclosure Policy

### Coordinated Disclosure

We practice coordinated vulnerability disclosure:

1. Reporter submits vulnerability privately
2. We confirm receipt and begin investigation
3. We develop and test a fix
4. We release a patch
5. We publicly disclose the issue with credit to reporter (if desired)
6. Reporter may publish their findings after disclosure

### Disclosure Timeline

- **Critical vulnerabilities**: 30-day disclosure timeline
- **High severity**: 60-day disclosure timeline
- **Medium/Low severity**: 90-day disclosure timeline

We may request an extension if we need more time to develop a comprehensive fix.

## Security Updates

### Notification Channels

Stay informed about security updates:

1. **GitHub Security Advisories**: Watch our repository
2. **Release Notes**: Check CHANGELOG.md for security fixes
3. **npm**: Updates are published to npm with security notes
4. **Twitter/Blog**: Major security updates announced publicly

### Update Recommendations

- **Critical Updates**: Update immediately
- **High Severity**: Update within 7 days
- **Medium/Low**: Update during next maintenance window

## Security Best Practices

### For Users of imgkit

1. **Keep Updated**: Always use the latest stable version
2. **Validate Input**: Validate and sanitize user uploads
3. **Set Limits**: Implement size and dimension limits
4. **Isolate Processing**: Process untrusted images in isolated environments
5. **Monitor Resources**: Track memory and CPU usage
6. **Handle Errors**: Properly catch and handle all errors

### Example Secure Usage

```typescript
import { resizeImage } from 'imgkit';

async function processUserUpload(file: Buffer) {
  // Validate file size
  if (file.length > 10 * 1024 * 1024) { // 10MB limit
    throw new Error('File too large');
  }

  try {
    // Set reasonable dimension limits
    const maxDimension = 4096;
    const result = await resizeImage(file, {
      width: Math.min(requestedWidth, maxDimension),
      height: Math.min(requestedHeight, maxDimension),
    });
    
    return result;
  } catch (error) {
    // Log error securely (don't expose internal details)
    console.error('Image processing failed');
    throw new Error('Invalid image file');
  }
}
```

## Security Audits

### Dependency Audits

We regularly audit our dependencies:

```bash
# Rust dependencies
cargo audit

# npm dependencies
bun audit
```

### Code Audits

- Regular code reviews with security focus
- Static analysis with Clippy and other tools
- Manual security reviews for critical changes

## Bug Bounty Program

We are currently evaluating a bug bounty program. Stay tuned for updates.

## Security Hall of Fame

We thank the following researchers for responsibly disclosing security issues:

<!-- Add names here as researchers report issues -->

*No security issues have been reported yet.*

## Contact

For security-related questions or concerns:

- **Email**: [INSERT_SECURITY_EMAIL@example.com]
- **PGP Key**: [INSERT_PGP_KEY_LINK] (optional, for encrypted communications)

For general questions and support, please use GitHub Issues or Discussions.

## Additional Resources

- [OWASP Image Processing Security Cheat Sheet](https://cheatsheetseries.owasp.org/)
- [CWE: Image Processing Issues](https://cwe.mitre.org/)
- [Rust Security Working Group](https://www.rust-lang.org/governance/wgs/wg-security-response)

---

Thank you for helping keep imgkit and its users safe! 🔒
