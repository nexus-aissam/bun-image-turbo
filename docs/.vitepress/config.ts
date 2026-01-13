import { defineConfig } from "vitepress";

export default defineConfig({
  title: "bun-image-turbo",
  description:
    "High-performance image processing for Bun and Node.js. Up to 950x faster than alternatives.",
  base: "/bun-image-turbo/",

  head: [
    [
      "link",
      { rel: "icon", type: "image/svg+xml", href: "/bun-image-turbo/logo.svg" },
    ],
    ["meta", { name: "theme-color", content: "#f97316" }],
    ["meta", { name: "og:type", content: "website" }],
    ["meta", { name: "og:title", content: "bun-image-turbo" }],
    [
      "meta",
      {
        name: "og:description",
        content:
          "High-performance image processing for Bun and Node.js. Up to 950x faster than alternatives.",
      },
    ],
    ["meta", { name: "og:site_name", content: "bun-image-turbo" }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:title", content: "bun-image-turbo" }],
    [
      "meta",
      {
        name: "twitter:description",
        content: "High-performance image processing for Bun and Node.js",
      },
    ],
    [
      "meta",
      {
        name: "keywords",
        content:
          "image processing, bun, nodejs, rust, heic, webp, jpeg, resize, thumbnail, performance",
      },
    ],
  ],

  lastUpdated: true,
  cleanUrls: true,

  markdown: {
    theme: {
      light: "github-light",
      dark: "github-dark",
    },
    lineNumbers: false,
  },

  themeConfig: {
    logo: "/logo.svg",
    siteTitle: "bun-image-turbo",

    nav: [
      { text: "Guide", link: "/guide/", activeMatch: "/guide/" },
      { text: "API", link: "/api/", activeMatch: "/api/" },
      { text: "Examples", link: "/examples/", activeMatch: "/examples/" },
      {
        text: "v1.7.1",
        items: [
          { text: "Changelog", link: "/changelog" },
          {
            text: "Links",
            items: [
              {
                text: "npm",
                link: "https://www.npmjs.com/package/bun-image-turbo",
              },
              {
                text: "GitHub",
                link: "https://github.com/nexus-aissam/bun-image-turbo",
              },
            ],
          },
        ],
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Getting Started",
          collapsed: false,
          items: [
            { text: "Introduction", link: "/guide/" },
            { text: "Installation", link: "/guide/installation" },
            { text: "Quick Start", link: "/guide/quick-start" },
          ],
        },
        {
          text: "Core Concepts",
          collapsed: false,
          items: [
            { text: "Image Formats", link: "/guide/formats" },
            { text: "Resizing", link: "/guide/resizing" },
            { text: "Transformations", link: "/guide/transformations" },
            { text: "HEIC Support", link: "/guide/heic" },
          ],
        },
        {
          text: "Advanced",
          collapsed: false,
          items: [
            { text: "ML Tensor Conversion", link: "/guide/tensor" },
            { text: "Performance", link: "/guide/performance" },
            { text: "Architecture", link: "/guide/architecture" },
            { text: "Async vs Sync", link: "/guide/async-sync" },
            { text: "Error Handling", link: "/guide/error-handling" },
          ],
        },
      ],
      "/api/": [
        {
          text: "API Reference",
          collapsed: false,
          items: [
            { text: "Overview", link: "/api/" },
            { text: "metadata", link: "/api/metadata" },
            { text: "resize", link: "/api/resize" },
            { text: "crop", link: "/api/crop" },
            { text: "toJpeg", link: "/api/to-jpeg" },
            { text: "toPng", link: "/api/to-png" },
            { text: "toWebp", link: "/api/to-webp" },
            { text: "transform", link: "/api/transform" },
            { text: "blurhash", link: "/api/blurhash" },
            { text: "thumbhash", link: "/api/thumbhash" },
            { text: "toTensor", link: "/api/tensor" },
            { text: "EXIF Metadata", link: "/api/exif" },
          ],
        },
        {
          text: "Types",
          collapsed: false,
          items: [{ text: "Options", link: "/api/types" }],
        },
      ],
      "/examples/": [
        {
          text: "Examples",
          collapsed: false,
          items: [
            { text: "Overview", link: "/examples/" },
            { text: "Basic Usage", link: "/examples/basic-usage" },
            { text: "Cropping", link: "/examples/cropping" },
            { text: "HEIC Conversion", link: "/examples/heic-conversion" },
            { text: "EXIF Metadata", link: "/examples/exif-metadata" },
            { text: "ThumbHash Placeholders", link: "/examples/thumbhash" },
            { text: "ML Tensor Conversion", link: "/examples/tensor" },
            { text: "API Endpoint", link: "/examples/api-endpoint" },
            { text: "Batch Processing", link: "/examples/batch-processing" },
          ],
        },
      ],
      "/changelog": [
        {
          text: "Changelog",
          items: [{ text: "All Releases", link: "/changelog" }],
        },
      ],
    },

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/nexus-aissam/bun-image-turbo",
      },
      { icon: "npm", link: "https://www.npmjs.com/package/bun-image-turbo" },
    ],

    footer: {
      message:
        'Released under the <a href="https://github.com/nexus-aissam/bun-image-turbo/blob/main/LICENSE">MIT License</a>.',
      copyright:
        'Copyright © 2025 <a href="https://github.com/nexus-aissam">Aissam Irhir</a>',
    },

    search: {
      provider: "local",
      options: {
        detailedView: true,
      },
    },

    editLink: {
      pattern:
        "https://github.com/nexus-aissam/bun-image-turbo/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },

    outline: {
      level: [2, 3],
      label: "On this page",
    },

    docFooter: {
      prev: "Previous",
      next: "Next",
    },

    lastUpdated: {
      text: "Last updated",
      formatOptions: {
        dateStyle: "medium",
      },
    },

    carbonAds: undefined,
  },
});
