# Public project presentation

Repository description: **Local-first prompt studio for consistent pixel-art production.**

Topics: `pixel-art`, `prompt-engineering`, `local-first`, `react`, `typescript`,
`vite`, `self-hosted`, `docker`. The default branch remains `main`. Issues and
pull requests are supported; Wiki and Discussions remain disabled. The existing
Projects feature is preserved: the session's repository-scoped credentials
do not grant permission to inspect account Projects, so their use is not assumed.
No project data or history is deleted.

The planned project-owned HTTPS deployment is GitHub Pages at
`https://kleiveist.github.io/PixelForgeStudio/`. The repository homepage is
set only after a successful deployed-site check. Publication of the site,
repository, images and release artifacts is controlled by the final release
gate, not by ordinary pushes to main.

## Visual assets

- [Original SVG logo](../public/logo.svg)
- [Social preview SVG source](../public/social-preview.svg)
- [1200×630 PNG social preview](../public/social-preview.png)
- [English dashboard screenshot](assets/dashboard-en.png)
- [German Settings screenshot](assets/settings-de.png)

The PNG is a direct browser render of the repository-native SVG, not a
third-party illustration. The source has an accessible title/description;
README images and webpage Open Graph metadata provide text alternatives.
Screenshots use a fresh browser with empty, invented data and no account,
private hostname or real workspace export. All assets follow [branding](BRANDING.md).

GitHub's repository-specific custom social image requires an upload through
**Repository Settings → General → Social preview**. The public REST and
GraphQL repository-update APIs do not expose this setting. Use the prepared
PNG there; the app website uses it automatically via Open Graph metadata.
Do not claim the GitHub-specific setting was changed based only on committing
the image. Its state can be checked via `usesCustomOpenGraphImage`.

GitHub Pages is a demo/static deployment, not a backup or account service.
Custom self-hosted deployments should change the absolute `og:image` metadata
to their own public URL (or remove it if the site is private). No such metadata
causes the app to upload browser data. Operators wanting the full supplied
HTTP security headers should use the [self-hosting configurations](SELF-HOSTING.md).
