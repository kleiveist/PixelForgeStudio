# Product identity and release version

- Canonical public name: **PixelForge Prompt Studio**.
- Short label: **Prompt Studio** (PixelForge remains the visual wordmark).
- Description/tagline: **Local-first prompt studio for consistent pixel-art production.**
- German tagline: **Lokale Prompt-Produktion für konsistente Pixelart-Assets**.
- Repository: `kleiveist/PixelForgeStudio`; kept stable for existing links.
- Internal npm package: `pixelforge-studio`, `private: true`; no npm publication.
- First public product release: **1.0.0**, Git tag **v1.0.0**.

Earlier 2.x/3.x labels described internal implementation generations, not
public releases. The removed multi-studio prototype is not part of this release.
The first public Prompt-only release starts at 1.0.0; `package.json` is the
source of truth for the UI version. This is not a data-format downgrade.

The persisted identifier remains exactly `PixelForge Prompt Studio`, all
`pixelforge:v2:*` keys remain stable, and schema/export versions remain **2**.
Version and schema labels must never be substituted for each other.

## Name review (2026-09-12)

An exact-name web/project/package search found no obvious separate project
using the complete name. “PixelForge” by itself is shared by other projects,
including [pixelforge-uploader](https://www.npmjs.com/package/pixelforge-uploader)
and [pixelforge-mcp](https://www.npmjs.com/package/pixelforge-mcp).
Use the complete descriptive name; do not imply affiliation or exclusivity.
No custom domain is claimed or required. This is a practical collision check,
not trademark clearance or a claim of domain availability.

## Assets

[Logo](../public/logo.svg) and [favicon](../public/favicon.svg) use the same
original pixel-grid P as `ForgeMarkIcon`. They are repository-native SVGs
covered by the project's MIT license, with no external fonts, images, scripts,
or linked resources. Standalone SVGs provide accessible titles; decorative
React icons are hidden from assistive technology. Use the favicon at 16–64 px
and the horizontal logo at 320 px or larger. Do not stretch either asset.

Publication remains gated by the [v1.0.0 release issue](https://github.com/kleiveist/PixelForgeStudio/issues/9).
