---
name: Bug Report
about: Report a bug or unexpected behavior
title: '[BUG] '
labels: bug
assignees: ''
---

## Bug Description

A clear and concise description of what the bug is.

## Steps to Reproduce

1. Step one
2. Step two
3. Step three
4. See error

## Expected Behavior

A clear description of what you expected to happen.

## Actual Behavior

A clear description of what actually happened.

## Code Sample

```typescript
// Minimal code to reproduce the issue
import { resizeImage } from 'imgkit';

const result = await resizeImage(buffer, 800, 600);
// Error occurs here
```

## Error Message

```
If applicable, paste the full error message here
```

## Environment

**imgkit version:**
- Version: [e.g., 1.2.3]

**Runtime:**
- Bun version: [e.g., 1.0.20]
- Node version (if applicable): [e.g., 20.10.0]

**Operating System:**
- OS: [e.g., Ubuntu 22.04, macOS 14.0, Windows 11]
- Architecture: [e.g., x64, arm64]

**Installation Method:**
- [ ] npm/bun install
- [ ] Built from source
- [ ] Other (please specify):

## Image Details (if applicable)

- **Format**: [e.g., JPEG, PNG, WebP]
- **Dimensions**: [e.g., 4000x3000]
- **File Size**: [e.g., 2.5MB]
- **Color Space**: [e.g., RGB, CMYK]
- **Sample Image**: [Can you share a sample image? If not, please explain why]

## Additional Context

Add any other context about the problem here. For example:
- Does this happen with all images or specific ones?
- Did this work in a previous version?
- Any workarounds you've found?
- Related issues or PRs?

## Screenshots

If applicable, add screenshots to help explain your problem.

## Checklist

- [ ] I have searched existing issues to avoid duplicates
- [ ] I have provided all requested information
- [ ] I have tested with the latest version
- [ ] I can reproduce this issue consistently
